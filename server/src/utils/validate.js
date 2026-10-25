class ValidationError extends Error {
  constructor(error, fields = {}) {
    super(error);
    this.status = 400;
    this.fields = fields;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEAL_SLOTS = ["breakfast", "lunch", "snack", "dinner"];
const AGE_UNITS = ["years", "months"];
const WEIGHT_UNITS = ["kg", "lb"];
const SEXES = ["female", "male"];
const ACTIVITIES = ["sedentary", "moderate", "active"];
const DIABETES = ["none", "pre", "t1", "t2", "gest"];
const DIETS = ["veg", "egg", "nonveg"];
const FEEDING = ["breast", "formula", "mixed"];
const READING_TYPES = ["fasting", "pre_meal", "post_meal", "bedtime"];
const GI = ["low", "medium", "high"];

function fail(fields) {
  const first = Object.values(fields)[0] || "Please check the form";
  throw new ValidationError(first, fields);
}

function asBool(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function indiaToday(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Number(offsetDays || 0)));
  return dt.toISOString().slice(0, 10);
}

function weekStartMonday(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = dt.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function validateEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value) fail({ email: "Email is required" });
  if (value.length > 255 || !EMAIL_RE.test(value)) {
    fail({ email: "Enter a valid email address" });
  }
  return value;
}

function validateFullName(fullName, { required = false } = {}) {
  const value = String(fullName || "").trim();
  if (!value && !required) return "";
  if (value.length < 2 || value.length > 80) {
    fail({ fullName: "Name must be 2 to 80 characters" });
  }
  if (!/^[\p{L}\s.'-]+$/u.test(value)) {
    fail({ fullName: "Name can only contain letters, spaces, and '.-" });
  }
  return value;
}

function validateOtp(otp) {
  const value = String(otp || "").trim();
  if (!/^\d{6}$/.test(value)) fail({ otp: "Enter the 6-digit email code" });
  return value;
}

function validateDate(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (!DATE_RE.test(raw)) fail({ date: "Date must be YYYY-MM-DD" });
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) fail({ date: "Date is not a real calendar day" });
  return raw;
}

function validateMember(body) {
  const fields = {};
  const name = String(body.name || "").trim();
  if (name.length < 2 || name.length > 80) fields.name = "Name must be 2 to 80 characters";

  const ageUnit = AGE_UNITS.includes(body.age_unit) ? body.age_unit : null;
  if (!ageUnit) fields.age_unit = "Age unit must be years or months";
  const ageValue = Number(body.age_value);
  if (!Number.isFinite(ageValue) || ageValue <= 0) {
    fields.age_value = "Enter a valid age";
  } else if (ageUnit === "months" && (ageValue < 1 || ageValue > 36)) {
    fields.age_value = "Age in months must be between 1 and 36";
  } else if (ageUnit === "years" && (ageValue < 1 || ageValue > 120)) {
    fields.age_value = "Age in years must be between 1 and 120";
  }

  const weightUnit = WEIGHT_UNITS.includes(body.weight_unit) ? body.weight_unit : null;
  if (!weightUnit) fields.weight_unit = "Weight unit must be kg or lb";
  const weightValue = Number(body.weight_value);
  if (!Number.isFinite(weightValue) || weightValue <= 0) {
    fields.weight_value = "Enter a valid weight";
  } else if (weightUnit === "kg" && (weightValue < 2 || weightValue > 250)) {
    fields.weight_value = "Weight in kg must be between 2 and 250";
  } else if (weightUnit === "lb" && (weightValue < 4 || weightValue > 550)) {
    fields.weight_value = "Weight in lb must be between 4 and 550";
  }

  const sex = SEXES.includes(body.sex) ? body.sex : null;
  if (!sex) fields.sex = "Select female or male";

  const activity = ACTIVITIES.includes(body.activity_level) ? body.activity_level : "moderate";
  const diet = DIETS.includes(body.diet_preference) ? body.diet_preference : null;
  if (!diet) fields.diet_preference = "Select veg, egg, or nonveg";

  const diabetes = DIABETES.includes(body.diabetes_status) ? body.diabetes_status : null;
  if (!diabetes) fields.diabetes_status = "Select a diabetes status";

  const ageYears = ageUnit === "months" ? ageValue / 12 : ageValue;
  const canBePregnant = sex === "female" && ageYears >= 13 && ageYears <= 50;
  if (body.pregnant_or_lactating && !canBePregnant) {
    fields.pregnant_or_lactating = "Pregnancy applies to women aged 13 to 50";
  }
  if (diabetes === "gest" && !canBePregnant) {
    fields.diabetes_status = "Gestational diabetes applies to women aged 13 to 50";
  }

  let fasting = null;
  if (body.fasting_sugar_baseline !== undefined && body.fasting_sugar_baseline !== null && body.fasting_sugar_baseline !== "") {
    fasting = Number(body.fasting_sugar_baseline);
    if (!Number.isInteger(fasting) || fasting < 40 || fasting > 400) {
      fields.fasting_sugar_baseline = "Fasting sugar must be a whole number from 40 to 400 mg/dL";
    }
  }

  let allergies = [];
  if (Array.isArray(body.allergies)) {
    allergies = body.allergies;
  } else if (typeof body.allergies === "string") {
    allergies = body.allergies.split(",");
  }
  allergies = [...new Set(allergies.map((a) => String(a || "").trim()).filter(Boolean))];
  if (allergies.length > 12) fields.allergies = "Add at most 12 allergies";
  if (allergies.some((a) => a.length > 40)) fields.allergies = "Each allergy must be 40 characters or fewer";

  const feeding = ageYears < 1 && body.feeding_type ? String(body.feeding_type) : null;
  if (feeding && !FEEDING.includes(feeding)) fields.feeding_type = "Feeding must be breast, formula, or mixed";

  const schoolHours = String(body.school_hours || "").trim();
  if (schoolHours.length > 40) fields.school_hours = "School hours must be 40 characters or fewer";

  const color = String(body.avatar_color || "#FF6B4A");
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) fields.avatar_color = "Avatar color must be a hex code";

  if (Object.keys(fields).length) fail(fields);

  return {
    name,
    avatar_color: color,
    age_value: ageValue,
    age_unit: ageUnit,
    weight_value: weightValue,
    weight_unit: weightUnit,
    sex,
    activity_level: activity,
    pregnant_or_lactating: canBePregnant && asBool(body.pregnant_or_lactating),
    diabetes_status: diabetes,
    on_insulin: diabetes !== "none" && (diabetes === "t1" || asBool(body.on_insulin)),
    fasting_sugar_baseline: diabetes === "none" ? null : fasting,
    diet_preference: diet,
    allergies,
    prefer_soft_texture: asBool(body.prefer_soft_texture),
    feeding_type: ageYears < 1 ? feeding || "mixed" : null,
    school_hours: ageYears >= 4 && ageYears < 13 ? schoolHours || null : null,
    include_veg_dishes: diet === "nonveg" ? body.include_veg_dishes !== false : false,
  };
}

function validateMealWrite(body) {
  const fields = {};
  const memberId = Number(body.member_id);
  if (!Number.isInteger(memberId) || memberId <= 0) fields.member_id = "Choose a family member";
  const mealSlot = String(body.meal_slot || "");
  if (!MEAL_SLOTS.includes(mealSlot)) fields.meal_slot = "Meal must be breakfast, lunch, snack, or dinner";
  const foodName = String(body.food_name || "").trim();
  if (foodName.length < 2 || foodName.length > 180) fields.food_name = "Food name is required";
  const protein = Number(body.protein_g);
  const carbs = Number(body.carbs_g ?? 0);
  const calories = Number(body.calories ?? 0);
  if (!Number.isFinite(protein) || protein < 0 || protein > 200) fields.protein_g = "Protein must be 0 to 200 g";
  if (!Number.isFinite(carbs) || carbs < 0 || carbs > 400) fields.carbs_g = "Carbs must be 0 to 400 g";
  if (!Number.isFinite(calories) || calories < 0 || calories > 2000) fields.calories = "Calories must be 0 to 2000";
  const gi = GI.includes(body.gi_level) ? body.gi_level : "low";
  const foodSlug = body.food_slug ? String(body.food_slug).slice(0, 80) : null;
  if (Object.keys(fields).length) fail(fields);
  return {
    member_id: memberId,
    log_date: validateDate(body.log_date || body.plan_date, indiaToday(0)),
    meal_slot: mealSlot,
    food_slug: foodSlug,
    food_name: foodName,
    protein_g: protein,
    carbs_g: carbs,
    calories: Math.round(calories),
    gi_level: gi,
    eaten: asBool(body.eaten),
  };
}

function validateSugar(body) {
  const fields = {};
  const memberId = Number(body.member_id);
  if (!Number.isInteger(memberId) || memberId <= 0) fields.member_id = "Choose a family member";
  const readingType = String(body.reading_type || "");
  if (!READING_TYPES.includes(readingType)) {
    fields.reading_type = "Reading type must be fasting, pre-meal, post-meal, or bedtime";
  }
  const glucose = Number(body.glucose_mg_dl);
  if (!Number.isInteger(glucose) || glucose < 20 || glucose > 600) {
    fields.glucose_mg_dl = "Glucose must be a whole number from 20 to 600 mg/dL";
  }
  const mealContext = String(body.meal_context || "").trim();
  if (mealContext.length > 180) fields.meal_context = "Meal note must be 180 characters or fewer";
  let insulin = null;
  if (body.insulin_units !== undefined && body.insulin_units !== null && body.insulin_units !== "") {
    insulin = Number(body.insulin_units);
    if (!Number.isFinite(insulin) || insulin < 0 || insulin > 100) {
      fields.insulin_units = "Insulin must be between 0 and 100 units";
    }
  }
  const notes = String(body.notes || "").trim();
  if (notes.length > 300) fields.notes = "Notes must be 300 characters or fewer";
  if (Object.keys(fields).length) fail(fields);
  return {
    member_id: memberId,
    reading_type: readingType,
    glucose_mg_dl: glucose,
    meal_context: mealContext,
    insulin_units: insulin,
    notes,
  };
}

function validateGrocery(body) {
  const fields = {};
  const memberId = Number(body.member_id);
  if (!Number.isInteger(memberId) || memberId <= 0) fields.member_id = "Choose a family member";
  const item = String(body.item_name || "").trim();
  if (item.length < 2 || item.length > 180) fields.item_name = "Grocery item name is required";
  if (Object.keys(fields).length) fail(fields);
  return {
    member_id: memberId,
    item_name: item,
    checked: asBool(body.checked),
    week_start: validateDate(body.week_start, weekStartMonday(indiaToday(0))),
  };
}

function validateCustomFood(body, { existingSlug } = {}) {
  const fields = {};
  const name = String(body.name || "").trim();
  if (name.length < 2 || name.length > 160) fields.name = "Dish name must be 2 to 160 characters";

  const mealSlot = String(body.meal_slot || "");
  if (!MEAL_SLOTS.includes(mealSlot)) fields.meal_slot = "Slot must be breakfast, lunch, snack, or dinner";

  const dietType = String(body.diet_type || "");
  if (!DIETS.includes(dietType)) fields.diet_type = "Diet must be veg, egg, or nonveg";

  const proteinG = Number(body.protein_g);
  if (!Number.isFinite(proteinG) || proteinG < 1 || proteinG > 120) {
    fields.protein_g = "Protein must be between 1 and 120 g";
  }

  const carbsG = Number(body.carbs_g ?? 20);
  if (!Number.isFinite(carbsG) || carbsG < 0 || carbsG > 250) {
    fields.carbs_g = "Carbs must be between 0 and 250 g";
  }

  const fiberG = Number(body.fiber_g ?? 3);
  if (!Number.isFinite(fiberG) || fiberG < 0 || fiberG > 60) {
    fields.fiber_g = "Fiber must be between 0 and 60 g";
  }

  const calories = Number(body.calories ?? Math.round(proteinG * 4 + carbsG * 4 + 60));
  if (!Number.isFinite(calories) || calories < 20 || calories > 2000) {
    fields.calories = "Calories must be between 20 and 2000 kcal";
  }

  const giLevel = GI.includes(body.gi_level) ? body.gi_level : "low";
  const servingDesc = String(body.serving_desc || "1 home/hotel serving").trim().slice(0, 100);
  const diabeticSwap = String(body.diabetic_swap || "Pair with curd, dal, or salad to keep sugar steady").trim().slice(0, 180);
  const recipeTip = String(body.recipe_tip || "Home or hotel recipe").trim().slice(0, 280);
  const prepMins = Math.min(180, Math.max(1, Number(body.prep_mins) || 15));

  if (Object.keys(fields).length) fail(fields);

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const slug = existingSlug || `${baseSlug || "custom-dish"}-${Date.now().toString(36).slice(-4)}`;

  return {
    slug,
    name,
    meal_slot: mealSlot,
    diet_type: dietType,
    protein_g: Number(proteinG.toFixed(1)),
    carbs_g: Number(carbsG.toFixed(1)),
    fiber_g: Number(fiberG.toFixed(1)),
    calories: Math.round(calories),
    gi_level: giLevel,
    diabetic_swap: diabeticSwap,
    serving_desc: servingDesc || "1 home/hotel serving",
    prep_mins: Math.round(prepMins),
    recipe_tip: recipeTip,
    soft_texture_friendly: body.soft_texture_friendly !== false,
  };
}

function sendValidation(res, err) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, fields: err.fields });
  }
  return null;
}

module.exports = {
  ValidationError,
  MEAL_SLOTS,
  indiaToday,
  weekStartMonday,
  validateEmail,
  validateFullName,
  validateOtp,
  validateDate,
  validateMember,
  validateMealWrite,
  validateSugar,
  validateGrocery,
  validateCustomFood,
  sendValidation,
};
