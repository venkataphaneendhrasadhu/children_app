const fs = require("fs");
const path = require("path");
const { pool, query } = require("./pool");
const { FOOD_CATALOG } = require("../data/nutritionEngine");

async function initializeDatabase() {
  if (!pool) {
    console.warn(
      "[DB] DATABASE_URL not set yet — running in instant fallback memory mode until Render URL is added to server/.env"
    );
    return false;
  }

  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await query(sql);

    // Seed food_catalog idempotently
    for (const item of FOOD_CATALOG) {
      await query(
        `INSERT INTO food_catalog
          (slug, name, meal_slot, diet_type, protein_g, carbs_g, fiber_g, calories, gi_level, diabetic_swap, serving_desc, prep_mins, recipe_tip, soft_texture_friendly)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          protein_g = EXCLUDED.protein_g,
          carbs_g = EXCLUDED.carbs_g,
          diabetic_swap = EXCLUDED.diabetic_swap`,
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
    }

    console.log("[DB] Render PostgreSQL schema & food catalog initialized.");
    return true;
  } catch (err) {
    console.error("[DB] Failed to initialize PostgreSQL:", err.message);
    return false;
  }
}

if (require.main === module) {
  initializeDatabase().then(() => process.exit(0));
}

module.exports = { initializeDatabase };
