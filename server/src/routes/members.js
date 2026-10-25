const express = require("express");
const { pool, query } = require("../db/pool");
const { memoryStore } = require("../db/memoryStore");
const { requireAuth } = require("../middleware/auth");
const { computeNutritionProfile, AGE_GROUPS } = require("../data/nutritionEngine");
const { validateMember, sendValidation } = require("../utils/validate");

const router = express.Router();

function attachTargets(member) {
  return {
    ...member,
    nutrition: computeNutritionProfile(member),
  };
}

// GET /api/members/age-groups - reference table for all age brackets
router.get("/age-groups", (_req, res) => {
  return res.json({ ageGroups: AGE_GROUPS });
});

// POST /api/members/preview-targets - live dynamic calculation without saving
router.post("/preview-targets", (req, res) => {
  const nutrition = computeNutritionProfile(req.body || {});
  return res.json({ nutrition });
});

// GET /api/members - list all family profiles for the logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    if (pool) {
      const result = await query(
        `SELECT * FROM family_members WHERE user_id = $1 ORDER BY id ASC`,
        [req.user.id]
      );
      return res.json({ members: result.rows.map(attachTargets) });
    }
    const list = memoryStore.members.filter((m) => m.user_id === req.user.id);
    return res.json({ members: list.map(attachTargets) });
  } catch (err) {
    console.error("[MEMBERS] GET error:", err);
    return res.status(500).json({ error: "Failed to load family profiles" });
  }
});

// POST /api/members - create a new child/teen/adult/senior profile
router.post("/", requireAuth, async (req, res) => {
  try {
    const member = validateMember(req.body);

    if (pool) {
      const insert = await query(
        `INSERT INTO family_members
          (user_id, name, avatar_color, age_value, age_unit, weight_value, weight_unit, sex, activity_level,
           pregnant_or_lactating, diabetes_status, on_insulin, fasting_sugar_baseline, diet_preference, allergies,
           prefer_soft_texture, feeding_type, school_hours, include_veg_dishes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING *`,
        [
          req.user.id,
          member.name,
          member.avatar_color,
          member.age_value,
          member.age_unit,
          member.weight_value,
          member.weight_unit,
          member.sex,
          member.activity_level,
          member.pregnant_or_lactating,
          member.diabetes_status,
          member.on_insulin,
          member.fasting_sugar_baseline,
          member.diet_preference,
          member.allergies,
          member.prefer_soft_texture,
          member.feeding_type,
          member.school_hours,
          member.include_veg_dishes,
        ]
      );
      return res.status(201).json({ member: attachTargets(insert.rows[0]) });
    }

    const created = { id: Date.now(), user_id: req.user.id, ...member };
    memoryStore.members.push(created);
    return res.status(201).json({ member: attachTargets(created) });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEMBERS] POST error:", err);
    return res.status(500).json({ error: "Failed to create profile" });
  }
});

// PUT /api/members/:id - dynamically update age, weight, diabetes status, or diet
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    const member = validateMember(req.body);

    if (pool) {
      const updated = await query(
        `UPDATE family_members SET
           name = $1,
           avatar_color = $2,
           age_value = $3,
           age_unit = $4,
           weight_value = $5,
           weight_unit = $6,
           sex = $7,
           activity_level = $8,
           pregnant_or_lactating = $9,
           diabetes_status = $10,
           on_insulin = $11,
           fasting_sugar_baseline = $12,
           diet_preference = $13,
           allergies = $14,
           prefer_soft_texture = $15,
           feeding_type = $16,
           school_hours = $17,
           include_veg_dishes = $18,
           updated_at = NOW()
         WHERE id = $19 AND user_id = $20
         RETURNING *`,
        [
          member.name,
          member.avatar_color,
          member.age_value,
          member.age_unit,
          member.weight_value,
          member.weight_unit,
          member.sex,
          member.activity_level,
          member.pregnant_or_lactating,
          member.diabetes_status,
          member.on_insulin,
          member.fasting_sugar_baseline,
          member.diet_preference,
          member.allergies,
          member.prefer_soft_texture,
          member.feeding_type,
          member.school_hours,
          member.include_veg_dishes,
          memberId,
          req.user.id,
        ]
      );

      if (updated.rows.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      return res.json({ member: attachTargets(updated.rows[0]) });
    }

    const idx = memoryStore.members.findIndex(
      (m) => m.id === memberId && m.user_id === req.user.id
    );
    if (idx === -1) {
      return res.status(404).json({ error: "Member not found" });
    }
    memoryStore.members[idx] = { ...memoryStore.members[idx], ...member };
    return res.json({ member: attachTargets(memoryStore.members[idx]) });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEMBERS] PUT error:", err);
    return res.status(500).json({ error: "Failed to update member" });
  }
});

// DELETE /api/members/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    if (pool) {
      await query(`DELETE FROM family_members WHERE id = $1 AND user_id = $2`, [
        memberId,
        req.user.id,
      ]);
    } else {
      const idx = memoryStore.members.findIndex(
        (m) => m.id === memberId && m.user_id === req.user.id
      );
      if (idx !== -1) memoryStore.members.splice(idx, 1);
    }
    return res.json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete member" });
  }
});

module.exports = router;
