const express = require("express");
const { pool, query } = require("../db/pool");
const { memoryStore } = require("../db/memoryStore");
const { requireAuth } = require("../middleware/auth");
const {
  FOOD_CATALOG,
  buildDailyPlanForMember,
} = require("../data/nutritionEngine");
const {
  indiaToday,
  weekStartMonday,
  validateMealWrite,
  validateGrocery,
  validateCustomFood,
  sendValidation,
} = require("../utils/validate");

const router = express.Router();

async function getAllFoods() {
  if (pool) {
    const dbFoods = await query(`SELECT * FROM food_catalog ORDER BY id DESC`);
    if (dbFoods.rows.length > 0) {
      const bySlug = new Map();
      for (const f of FOOD_CATALOG) bySlug.set(f.slug, f);
      for (const row of dbFoods.rows) bySlug.set(row.slug, row);
      return Array.from(bySlug.values());
    }
  }
  const bySlug = new Map();
  for (const f of FOOD_CATALOG) bySlug.set(f.slug, f);
  for (const custom of memoryStore.customFoods) bySlug.set(custom.slug, custom);
  return Array.from(bySlug.values());
}

async function getMemberById(memberId, userId) {
  if (pool) {
    const res = await query(
      `SELECT * FROM family_members WHERE id = $1 AND user_id = $2`,
      [memberId, userId]
    );
    return res.rows[0] || null;
  }
  return (
    memoryStore.members.find(
      (m) => m.id === Number(memberId) && m.user_id === userId
    ) || null
  );
}

function applySavedSelections(plan, selections) {
  for (const meal of plan.meals) {
    const saved = selections.find((s) => s.meal_slot === meal.slot);
    if (!saved) continue;
    const match = (meal.alternatives || []).find(
      (alt) => alt.slug === saved.food_slug || alt.name === saved.food_name
    );
    if (match) meal.selectedFood = match;
  }
  plan.plannedProteinG = plan.meals.reduce(
    (sum, meal) => sum + (meal.selectedFood ? Number(meal.selectedFood.scaled_protein_g) : 0),
    0
  );
}

// GET /api/meals/daily-plan/:memberId?dayOffset=0
router.get("/daily-plan/:memberId", requireAuth, async (req, res) => {
  try {
    const memberId = Number(req.params.memberId);
    const dayOffset = Number(req.query.dayOffset) || 0;
    const dateStr = indiaToday(dayOffset);

    const member = await getMemberById(memberId, req.user.id);
    if (!member) {
      return res.status(404).json({ error: "Family member not found" });
    }

    const foods = await getAllFoods();
    const plan = buildDailyPlanForMember(member, foods, dayOffset);

    let selections = [];
    if (pool) {
      const saved = await query(
        `SELECT * FROM meal_selections WHERE member_id = $1 AND plan_date = $2`,
        [memberId, dateStr]
      );
      selections = saved.rows;
    } else {
      selections = memoryStore.mealSelections.filter(
        (s) => s.member_id === memberId && s.plan_date === dateStr
      );
    }
    applySavedSelections(plan, selections);

    // Fetch logged meals for today
    let logs = [];
    if (pool) {
      const logRes = await query(
        `SELECT * FROM daily_meal_logs WHERE member_id = $1 AND log_date = $2`,
        [memberId, dateStr]
      );
      logs = logRes.rows;
    } else {
      logs = memoryStore.mealLogs.filter(
        (l) => l.member_id === memberId && l.log_date === dateStr
      );
    }

    const eatenProteinG = logs
      .filter((l) => l.eaten)
      .reduce((acc, l) => acc + Number(l.protein_g || 0), 0);

    return res.json({
      member,
      date: dateStr,
      ...plan,
      selections,
      logs,
      eatenProteinG: Math.round(eatenProteinG),
    });
  } catch (err) {
    console.error("[MEALS] daily-plan error:", err);
    return res.status(500).json({ error: "Failed to build daily meal plan" });
  }
});

// GET /api/meals/weekly-plan/:memberId
router.get("/weekly-plan/:memberId", requireAuth, async (req, res) => {
  try {
    const memberId = Number(req.params.memberId);
    const member = await getMemberById(memberId, req.user.id);
    if (!member) {
      return res.status(404).json({ error: "Family member not found" });
    }

    const allFoods = await getAllFoods();
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const week = days.map((dayName, idx) => {
      const daily = buildDailyPlanForMember(member, allFoods, idx);
      return {
        day: dayName,
        targetProteinG: daily.calculation.dailyProteinG,
        plannedProteinG: daily.plannedProteinG,
        meals: daily.meals.map((m) => ({
          slot: m.slot,
          label: m.label,
          foodName: m.selectedFood?.name,
          proteinG: m.selectedFood?.scaled_protein_g,
          giLevel: m.selectedFood?.gi_level,
          diabeticSwap: m.selectedFood?.diabetic_swap,
        })),
      };
    });

    const isDiabetic =
      member.diabetes_status && member.diabetes_status !== "none";
    const groceryCategories = [
      {
        category: "Dals, Pulses & Soy",
        items: ["Yellow Moong Dal (1 kg)", "Rajma (500 g)", "Kala Chana (500 g)", "Soya Chunks (200 g)"],
      },
      {
        category: "Dairy & Protein Originals",
        items: [
          "Fresh Paneer (600 g)",
          "Hung Curd / Greek Yogurt (1 kg)",
          "Toned Milk (5 L)",
          ...(member.diet_preference !== "veg" ? ["Farm Eggs (18 pcs)"] : []),
          ...(member.diet_preference === "nonveg"
            ? ["Chicken Breast (600 g)", "Fresh Fish Fillet (500 g)"]
            : []),
        ],
      },
      {
        category: isDiabetic ? "Low-GI Millets & Whole Grains" : "Grains & Flours",
        items: isDiabetic
          ? ["Ragi Flour (1 kg)", "Jowar / Bajra Atta (1 kg)", "Chana Besan (500 g)", "Red/Brown Rice (1 kg)"]
          : ["Whole Wheat Chakki Atta (2 kg)", "Ragi Flour (500 g)", "Chana Besan (500 g)", "Basmati Rice (1 kg)"],
      },
      {
        category: "Fiber-Rich Greens & Low-GI Fruits",
        items: isDiabetic
          ? ["Palak & Methi Leaves", "Cucumber, Tomato, Broccoli, Bhindi", "Guava, Jamun, Green Apple, Papaya"]
          : ["Spinach (Palak), Carrots, Peas, Beans", "Apples, Guava, Bananas, Pomegranate"],
      },
    ];

    const start = weekStartMonday(indiaToday(0));
    let checks = [];
    if (pool) {
      const saved = await query(
        `SELECT item_name, checked FROM grocery_checks
         WHERE user_id = $1 AND member_id = $2 AND week_start = $3`,
        [req.user.id, memberId, start]
      );
      checks = saved.rows;
    } else {
      checks = memoryStore.groceryChecks.filter(
        (c) =>
          c.user_id === req.user.id &&
          c.member_id === memberId &&
          c.week_start === start
      );
    }

    return res.json({
      member,
      weekStart: start,
      week,
      groceryCategories,
      checks,
    });
  } catch (err) {
    console.error("[MEALS] weekly-plan error:", err);
    return res.status(500).json({ error: "Failed to build weekly plan" });
  }
});

// POST /api/meals/log - toggle a meal as eaten / uneaten
router.post("/log", requireAuth, async (req, res) => {
  try {
    const entry = validateMealWrite(req.body);
    const member = await getMemberById(entry.member_id, req.user.id);
    if (!member) return res.status(404).json({ error: "Family member not found" });

    if (pool) {
      const upserted = await query(
        `INSERT INTO daily_meal_logs (member_id, log_date, meal_slot, food_name, protein_g, carbs_g, gi_level, eaten)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (member_id, log_date, meal_slot)
         DO UPDATE SET
           food_name = EXCLUDED.food_name,
           protein_g = EXCLUDED.protein_g,
           carbs_g = EXCLUDED.carbs_g,
           gi_level = EXCLUDED.gi_level,
           eaten = EXCLUDED.eaten
         RETURNING *`,
        [
          entry.member_id,
          entry.log_date,
          entry.meal_slot,
          entry.food_name,
          entry.protein_g,
          entry.carbs_g,
          entry.gi_level,
          entry.eaten,
        ]
      );
      return res.json({ log: upserted.rows[0] });
    }

    const existingIdx = memoryStore.mealLogs.findIndex(
      (l) =>
        l.member_id === entry.member_id &&
        l.log_date === entry.log_date &&
        l.meal_slot === entry.meal_slot
    );

    const record = {
      id: Date.now(),
      member_id: entry.member_id,
      log_date: entry.log_date,
      meal_slot: entry.meal_slot,
      food_name: entry.food_name,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      gi_level: entry.gi_level,
      eaten: entry.eaten,
    };

    if (existingIdx >= 0) {
      memoryStore.mealLogs[existingIdx] = record;
    } else {
      memoryStore.mealLogs.push(record);
    }

    return res.json({ log: record });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEALS] log error:", err);
    return res.status(500).json({ error: "Failed to log meal" });
  }
});

// POST /api/meals/select - save the swapped dish for this member and date
router.post("/select", requireAuth, async (req, res) => {
  try {
    const entry = validateMealWrite({ ...req.body, eaten: false, plan_date: req.body.plan_date });
    const member = await getMemberById(entry.member_id, req.user.id);
    if (!member) return res.status(404).json({ error: "Family member not found" });

    if (pool) {
      const saved = await query(
        `INSERT INTO meal_selections
          (member_id, plan_date, meal_slot, food_slug, food_name, protein_g, carbs_g, calories, gi_level, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (member_id, plan_date, meal_slot)
         DO UPDATE SET
           food_slug = EXCLUDED.food_slug,
           food_name = EXCLUDED.food_name,
           protein_g = EXCLUDED.protein_g,
           carbs_g = EXCLUDED.carbs_g,
           calories = EXCLUDED.calories,
           gi_level = EXCLUDED.gi_level,
           updated_at = NOW()
         RETURNING *`,
        [
          entry.member_id,
          entry.log_date,
          entry.meal_slot,
          entry.food_slug,
          entry.food_name,
          entry.protein_g,
          entry.carbs_g,
          entry.calories,
          entry.gi_level,
        ]
      );
      return res.json({ selection: saved.rows[0] });
    }

    const idx = memoryStore.mealSelections.findIndex(
      (s) =>
        s.member_id === entry.member_id &&
        s.plan_date === entry.log_date &&
        s.meal_slot === entry.meal_slot
    );
    const selection = {
      id: Date.now(),
      member_id: entry.member_id,
      plan_date: entry.log_date,
      meal_slot: entry.meal_slot,
      food_slug: entry.food_slug,
      food_name: entry.food_name,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      calories: entry.calories,
      gi_level: entry.gi_level,
    };
    if (idx >= 0) memoryStore.mealSelections[idx] = selection;
    else memoryStore.mealSelections.push(selection);
    return res.json({ selection });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEALS] select error:", err);
    return res.status(500).json({ error: "Failed to save meal swap" });
  }
});

// POST /api/meals/grocery-check - persist a grocery tick for the week
router.post("/grocery-check", requireAuth, async (req, res) => {
  try {
    const entry = validateGrocery(req.body);
    const member = await getMemberById(entry.member_id, req.user.id);
    if (!member) return res.status(404).json({ error: "Family member not found" });

    if (pool) {
      const saved = await query(
        `INSERT INTO grocery_checks (user_id, member_id, week_start, item_name, checked, updated_at)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (user_id, member_id, week_start, item_name)
         DO UPDATE SET checked = EXCLUDED.checked, updated_at = NOW()
         RETURNING *`,
        [req.user.id, entry.member_id, entry.week_start, entry.item_name, entry.checked]
      );
      return res.json({ check: saved.rows[0] });
    }

    const idx = memoryStore.groceryChecks.findIndex(
      (c) =>
        c.user_id === req.user.id &&
        c.member_id === entry.member_id &&
        c.week_start === entry.week_start &&
        c.item_name === entry.item_name
    );
    const check = {
      id: Date.now(),
      user_id: req.user.id,
      ...entry,
    };
    if (idx >= 0) memoryStore.groceryChecks[idx] = check;
    else memoryStore.groceryChecks.push(check);
    return res.json({ check });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEALS] grocery-check error:", err);
    return res.status(500).json({ error: "Failed to save grocery item" });
  }
});

// GET /api/meals/catalog - list all dishes (optionally filtered by slot/diet)
router.get("/catalog", requireAuth, async (req, res) => {
  try {
    let foods = await getAllFoods();
    if (req.query.slot) {
      foods = foods.filter((f) => f.meal_slot === req.query.slot);
    }
    if (req.query.diet) {
      foods = foods.filter((f) => f.diet_type === req.query.diet);
    }
    return res.json({ count: foods.length, foods });
  } catch (err) {
    console.error("[MEALS] catalog list error:", err);
    return res.status(500).json({ error: "Failed to load food catalog" });
  }
});

// POST /api/meals/catalog - add a custom dish (tiffin, curry, snack, dinner)
router.post("/catalog", requireAuth, async (req, res) => {
  try {
    const item = validateCustomFood(req.body);
    if (pool) {
      const inserted = await query(
        `INSERT INTO food_catalog
          (slug, name, meal_slot, diet_type, protein_g, carbs_g, fiber_g, calories, gi_level, diabetic_swap, serving_desc, prep_mins, recipe_tip, soft_texture_friendly)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          meal_slot = EXCLUDED.meal_slot,
          diet_type = EXCLUDED.diet_type,
          protein_g = EXCLUDED.protein_g,
          carbs_g = EXCLUDED.carbs_g,
          fiber_g = EXCLUDED.fiber_g,
          calories = EXCLUDED.calories,
          gi_level = EXCLUDED.gi_level,
          diabetic_swap = EXCLUDED.diabetic_swap,
          serving_desc = EXCLUDED.serving_desc,
          prep_mins = EXCLUDED.prep_mins,
          recipe_tip = EXCLUDED.recipe_tip,
          soft_texture_friendly = EXCLUDED.soft_texture_friendly
         RETURNING *`,
        [
          item.slug,
          item.name,
          item.meal_slot,
          item.diet_type,
          item.protein_g,
          item.carbs_g,
          item.fiber_g,
          item.calories,
          item.gi_level,
          item.diabetic_swap,
          item.serving_desc,
          item.prep_mins,
          item.recipe_tip,
          item.soft_texture_friendly,
        ]
      );
      return res.status(201).json({ food: inserted.rows[0] });
    }

    memoryStore.customFoods.unshift(item);
    return res.status(201).json({ food: item });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEALS] catalog create error:", err);
    return res.status(500).json({ error: "Failed to create dish" });
  }
});

// PUT /api/meals/catalog/:slug - update any existing or custom dish
router.put("/catalog/:slug", requireAuth, async (req, res) => {
  try {
    const slug = String(req.params.slug || "").trim();
    const item = validateCustomFood(req.body, { existingSlug: slug });

    if (pool) {
      const updated = await query(
        `INSERT INTO food_catalog
          (slug, name, meal_slot, diet_type, protein_g, carbs_g, fiber_g, calories, gi_level, diabetic_swap, serving_desc, prep_mins, recipe_tip, soft_texture_friendly)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          meal_slot = EXCLUDED.meal_slot,
          diet_type = EXCLUDED.diet_type,
          protein_g = EXCLUDED.protein_g,
          carbs_g = EXCLUDED.carbs_g,
          fiber_g = EXCLUDED.fiber_g,
          calories = EXCLUDED.calories,
          gi_level = EXCLUDED.gi_level,
          diabetic_swap = EXCLUDED.diabetic_swap,
          serving_desc = EXCLUDED.serving_desc,
          prep_mins = EXCLUDED.prep_mins,
          recipe_tip = EXCLUDED.recipe_tip,
          soft_texture_friendly = EXCLUDED.soft_texture_friendly
         RETURNING *`,
        [
          item.slug,
          item.name,
          item.meal_slot,
          item.diet_type,
          item.protein_g,
          item.carbs_g,
          item.fiber_g,
          item.calories,
          item.gi_level,
          item.diabetic_swap,
          item.serving_desc,
          item.prep_mins,
          item.recipe_tip,
          item.soft_texture_friendly,
        ]
      );
      return res.json({ food: updated.rows[0] });
    }

    const existingIdx = memoryStore.customFoods.findIndex((f) => f.slug === slug);
    if (existingIdx >= 0) memoryStore.customFoods[existingIdx] = item;
    else memoryStore.customFoods.unshift(item);

    const catIdx = FOOD_CATALOG.findIndex((f) => f.slug === slug);
    if (catIdx >= 0) FOOD_CATALOG[catIdx] = item;

    return res.json({ food: item });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[MEALS] catalog update error:", err);
    return res.status(500).json({ error: "Failed to update dish" });
  }
});

module.exports = router;
