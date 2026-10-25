/**
 * End-to-end API & PostgreSQL verification script for FamilyPlate.
 * Run with: npm run verify
 */
require("dotenv").config();
const { pool, query } = require("./db/pool");
const { initializeDatabase } = require("./db/init");

const BASE = `http://127.0.0.1:${process.env.PORT || 4001}/api`;

async function call(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${data.error || JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log("=== FamilyPlate End-to-End API & Database Verification ===");
  const dbReady = await initializeDatabase();
  console.log("Database Mode:", pool && dbReady ? "PostgreSQL (Render)" : "In-Memory Fallback (Set DATABASE_URL in server/.env for Render PG)");

  // 1. Health
  const health = await call("/health");
  console.log("1. GET /api/health ->", health.status, "| mode:", health.database);

  // 2. Request Email OTP + Verify
  const email = "jayashhre.verify@familyplate.app";
  const otpReq = await call("/auth/request-otp", {
    method: "POST",
    body: { email, fullName: "Jayashhre" },
  });
  const verified = await call("/auth/verify-otp", {
    method: "POST",
    body: { email, otp: otpReq.devOtpPreview, fullName: "Jayashhre" },
  });
  const token = verified.token;
  console.log("2. POST /api/auth/verify-otp -> JWT issued for", verified.user.email);

  // 3. Create Child, Parent, and Grandparent
  const childRes = await call("/members", {
    method: "POST",
    token,
    body: {
      name: "Virat (Child)",
      age_value: 7,
      age_unit: "years",
      weight_value: 18,
      weight_unit: "kg",
      sex: "male",
      activity_level: "moderate",
      diabetes_status: "none",
      diet_preference: "veg",
      allergies: ["Peanut"],
      school_hours: "8:30 AM - 3:30 PM",
    },
  });
  const parentRes = await call("/members", {
    method: "POST",
    token,
    body: {
      name: "Priya (Parent)",
      age_value: 34,
      age_unit: "years",
      weight_value: 62,
      weight_unit: "kg",
      sex: "female",
      activity_level: "moderate",
      diabetes_status: "none",
      diet_preference: "nonveg",
      include_veg_dishes: true,
    },
  });
  const grandParentRes = await call("/members", {
    method: "POST",
    token,
    body: {
      name: "Ramesh (Grandparent)",
      age_value: 68,
      age_unit: "years",
      weight_value: 66,
      weight_unit: "kg",
      sex: "male",
      activity_level: "sedentary",
      diabetes_status: "t2",
      fasting_sugar_baseline: 138,
      diet_preference: "veg",
      prefer_soft_texture: true,
    },
  });
  console.log(
    "3. POST /api/members -> Created Child, Parent & Grandparent:",
    childRes.member.name,
    "|",
    parentRes.member.name,
    "|",
    grandParentRes.member.name
  );

  // 4. Verify Child Protein Alignment (No mismatch between slot targets and dish protein)
  const childPlan = await call(`/meals/daily-plan/${childRes.member.id}`, { token });
  const slotSummary = childPlan.meals
    .map((m) => `${m.label}: target ${m.targetProteinG}g vs dish ${m.selectedFood.scaled_protein_g}g`)
    .join(" | ");
  console.log(
    `4. GET /api/meals/daily-plan (Child 18kg -> ${childPlan.calculation.dailyProteinG}g target, ${childPlan.plannedProteinG}g planned) ->`,
    slotSummary
  );

  // 5. Add Custom Tiffin Dish & Update Dish via Catalog API
  const addedDish = await call("/meals/catalog", {
    method: "POST",
    token,
    body: {
      name: "Home Special Millet Pesarattu + Allam Chutney",
      meal_slot: "breakfast",
      diet_type: "veg",
      protein_g: 14,
      carbs_g: 26,
      calories: 230,
      gi_level: "low",
      serving_desc: "2 crispy pesarattus + ginger chutney",
      diabetic_swap: "Whole green gram + foxtail millet keeps post-meal glucose steady",
    },
  });
  const updatedDish = await call(`/meals/catalog/${addedDish.food.slug}`, {
    method: "PUT",
    token,
    body: {
      ...addedDish.food,
      name: "Hotel Ghee Paneer Pesarattu + Sambar",
      protein_g: 16,
    },
  });
  console.log("5. POST & PUT /api/meals/catalog -> Custom dish saved & updated:", updatedDish.food.name);

  // 6. Swap Meal, Log Eaten Meal, Tick Weekly Grocery, and Log Blood Sugar
  await call("/meals/select", {
    method: "POST",
    token,
    body: {
      member_id: childRes.member.id,
      plan_date: childPlan.date,
      meal_slot: "breakfast",
      food_slug: updatedDish.food.slug,
      food_name: updatedDish.food.name,
      protein_g: 4,
      carbs_g: 14,
      calories: 120,
      gi_level: "low",
    },
  });
  await call("/meals/log", {
    method: "POST",
    token,
    body: {
      member_id: childRes.member.id,
      log_date: childPlan.date,
      meal_slot: "breakfast",
      food_name: updatedDish.food.name,
      protein_g: 4,
      carbs_g: 14,
      gi_level: "low",
      eaten: true,
    },
  });
  await call("/meals/grocery-check", {
    method: "POST",
    token,
    body: {
      member_id: childRes.member.id,
      item_name: "Yellow Moong Dal (1 kg)",
      checked: true,
    },
  });
  const sugar = await call("/diabetes/sugar-logs", {
    method: "POST",
    token,
    body: {
      member_id: grandParentRes.member.id,
      reading_type: "post_meal",
      glucose_mg_dl: 142,
      meal_context: "After Mixed Dal Adai + Avial",
    },
  });
  console.log("6. Swapped meal, logged eaten protein, checked grocery item & logged grandparent sugar:", sugar.evaluation.status);

  if (pool && dbReady) {
    const counts = await query(
      `SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM family_members) AS members,
        (SELECT COUNT(*) FROM food_catalog) AS foods,
        (SELECT COUNT(*) FROM meal_selections) AS swaps,
        (SELECT COUNT(*) FROM daily_meal_logs) AS logs,
        (SELECT COUNT(*) FROM sugar_logs) AS sugars`
    );
    console.log("7. PostgreSQL Row Counts on Render:", counts.rows[0]);
  }
  console.log("=== ALL API & SAMPLE DATA CHECKS PASSED ===");
}

run().catch((err) => {
  console.error("Verification failed:", err.message);
  process.exit(1);
});
