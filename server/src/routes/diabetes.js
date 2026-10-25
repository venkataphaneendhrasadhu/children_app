const express = require("express");
const { pool, query } = require("../db/pool");
const { memoryStore } = require("../db/memoryStore");
const { requireAuth } = require("../middleware/auth");
const { DIABETES_EDUCATION } = require("../data/nutritionEngine");
const { validateSugar, sendValidation } = require("../utils/validate");

const router = express.Router();

// GET /api/diabetes/guide - Eat Freely / Limit / Avoid + Spike Prevention Protocol
router.get("/guide", (_req, res) => {
  return res.json({
    guide: DIABETES_EDUCATION,
    plateMethod: {
      vegetables: "50% Non-starchy greens & salad (eat first)",
      protein: "25% Protein: Dal, Paneer, Curd, Eggs, Fish or Chicken (eat second)",
      complexCarbs: "25% Whole Millets (Ragi/Jowar/Bajra) or Brown Rice (eat last)",
    },
  });
});

// GET /api/diabetes/sugar-logs/:memberId
router.get("/sugar-logs/:memberId", requireAuth, async (req, res) => {
  try {
    const memberId = Number(req.params.memberId);
    if (pool) {
      const owned = await query(
        `SELECT id FROM family_members WHERE id = $1 AND user_id = $2`,
        [memberId, req.user.id]
      );
      if (owned.rows.length === 0) {
        return res.status(404).json({ error: "Family member not found" });
      }
    } else if (
      !memoryStore.members.some((m) => m.id === memberId && m.user_id === req.user.id)
    ) {
      return res.status(404).json({ error: "Family member not found" });
    }

    let logs = [];

    if (pool) {
      const result = await query(
        `SELECT * FROM sugar_logs WHERE member_id = $1 ORDER BY recorded_at DESC LIMIT 30`,
        [memberId]
      );
      logs = result.rows;
    } else {
      logs = memoryStore.sugarLogs
        .filter((l) => l.member_id === memberId)
        .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
    }

    const fastingList = logs.filter((l) => l.reading_type === "fasting");
    const postMealList = logs.filter((l) => l.reading_type === "post_meal");

    const avgFasting = fastingList.length
      ? Math.round(
          fastingList.reduce((s, r) => s + Number(r.glucose_mg_dl), 0) / fastingList.length
        )
      : null;

    const avgPostMeal = postMealList.length
      ? Math.round(
          postMealList.reduce((s, r) => s + Number(r.glucose_mg_dl), 0) / postMealList.length
        )
      : null;

    return res.json({
      logs,
      summary: {
        avgFasting,
        avgPostMeal,
        totalReadings: logs.length,
        targetFastingMax: 110,
        targetPostMealMax: 140,
      },
    });
  } catch (err) {
    console.error("[DIABETES] GET sugar-logs error:", err);
    return res.status(500).json({ error: "Failed to load sugar readings" });
  }
});

// POST /api/diabetes/sugar-logs - save a new glucose reading + evaluate spike feedback
router.post("/sugar-logs", requireAuth, async (req, res) => {
  try {
    const entry = validateSugar(req.body);
    const val = entry.glucose_mg_dl;

    if (pool) {
      const owned = await query(
        `SELECT id FROM family_members WHERE id = $1 AND user_id = $2`,
        [entry.member_id, req.user.id]
      );
      if (owned.rows.length === 0) {
        return res.status(404).json({ error: "Family member not found" });
      }
    } else if (
      !memoryStore.members.some(
        (m) => m.id === entry.member_id && m.user_id === req.user.id
      )
    ) {
      return res.status(404).json({ error: "Family member not found" });
    }

    let created = null;
    if (pool) {
      const ins = await query(
        `INSERT INTO sugar_logs (member_id, reading_type, glucose_mg_dl, meal_context, insulin_units, notes)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [
          entry.member_id,
          entry.reading_type,
          val,
          entry.meal_context,
          entry.insulin_units,
          entry.notes,
        ]
      );
      created = ins.rows[0];
    } else {
      created = {
        id: Date.now(),
        member_id: entry.member_id,
        reading_type: entry.reading_type,
        glucose_mg_dl: val,
        meal_context: entry.meal_context,
        insulin_units: entry.insulin_units,
        notes: entry.notes,
        recorded_at: new Date().toISOString(),
      };
      memoryStore.sugarLogs.unshift(created);
    }

    let status = "in_range";
    let advice =
      "Great job! Blood glucose is within the healthy target window. Keep pairing protein + fiber with meals.";

    if (val < 70) {
      status = "low_hypo";
      advice =
        "Low blood sugar (<70 mg/dL)! Take 15g fast-acting glucose immediately and re-check in 15 minutes.";
    } else if (entry.reading_type === "fasting" && val > 125) {
      status = "spike_warning";
      advice =
        "Elevated fasting reading. Avoid late-night refined carbs; have a high-protein, low-GI dinner (paneer/tofu/dal/fish) at least 2.5 hrs before sleep.";
    } else if (entry.reading_type !== "fasting" && val > 160) {
      status = "spike_warning";
      advice =
        "Post-meal spike detected (>160 mg/dL). Next time, eat cucumber/greens and dal/protein first before rice/roti, and take a 12-minute walk.";
    }

    return res.status(201).json({
      log: created,
      evaluation: { status, advice },
    });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[DIABETES] POST sugar-logs error:", err);
    return res.status(500).json({ error: "Failed to save reading" });
  }
});

module.exports = router;
