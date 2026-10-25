-- PostgreSQL 18 Schema for FamilyPlate (Render DB: nutrition-children)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS email_otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps (email, consumed);

CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  avatar_color VARCHAR(32) DEFAULT '#FF6B4A',
  age_value NUMERIC(5,2) NOT NULL,
  age_unit VARCHAR(12) NOT NULL DEFAULT 'years', -- 'months' | 'years'
  weight_value NUMERIC(6,2) NOT NULL,
  weight_unit VARCHAR(8) NOT NULL DEFAULT 'kg',  -- 'kg' | 'lb'
  sex VARCHAR(16) NOT NULL DEFAULT 'male',       -- 'female' | 'male'
  activity_level VARCHAR(16) NOT NULL DEFAULT 'moderate', -- 'sedentary' | 'moderate' | 'active'
  pregnant_or_lactating BOOLEAN DEFAULT FALSE,
  diabetes_status VARCHAR(16) NOT NULL DEFAULT 'none',    -- 'none' | 'pre' | 't1' | 't2' | 'gest'
  on_insulin BOOLEAN DEFAULT FALSE,
  fasting_sugar_baseline INTEGER,
  diet_preference VARCHAR(16) NOT NULL DEFAULT 'veg',     -- 'veg' | 'egg' | 'nonveg'
  allergies TEXT[] DEFAULT '{}',
  prefer_soft_texture BOOLEAN DEFAULT FALSE,
  feeding_type VARCHAR(16),
  school_hours VARCHAR(40),
  include_veg_dishes BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members (user_id);

CREATE TABLE IF NOT EXISTS food_catalog (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  meal_slot VARCHAR(20) NOT NULL,      -- 'breakfast' | 'lunch' | 'snack' | 'dinner'
  diet_type VARCHAR(16) NOT NULL,      -- 'veg' | 'egg' | 'nonveg'
  protein_g NUMERIC(5,1) NOT NULL,
  carbs_g NUMERIC(5,1) NOT NULL,
  fiber_g NUMERIC(5,1) DEFAULT 2.0,
  calories INTEGER NOT NULL,
  gi_level VARCHAR(12) NOT NULL,       -- 'low' | 'medium' | 'high'
  diabetic_swap VARCHAR(180),
  serving_desc VARCHAR(100) NOT NULL,
  prep_mins INTEGER DEFAULT 15,
  recipe_tip TEXT,
  soft_texture_friendly BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS daily_meal_logs (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_slot VARCHAR(20) NOT NULL,      -- 'breakfast' | 'lunch' | 'snack' | 'dinner'
  food_name VARCHAR(180) NOT NULL,
  protein_g NUMERIC(5,1) NOT NULL,
  carbs_g NUMERIC(5,1) DEFAULT 0,
  gi_level VARCHAR(12) DEFAULT 'low',
  eaten BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, log_date, meal_slot)
);

CREATE INDEX IF NOT EXISTS idx_daily_meal_logs_member_date ON daily_meal_logs (member_id, log_date);

CREATE TABLE IF NOT EXISTS sugar_logs (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  reading_type VARCHAR(20) NOT NULL,   -- 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime'
  glucose_mg_dl INTEGER NOT NULL,
  meal_context VARCHAR(180),
  insulin_units NUMERIC(4,1),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sugar_logs_member ON sugar_logs (member_id, recorded_at DESC);

-- Chosen dish for a meal slot (swap). One saved choice per member, date, and slot.
CREATE TABLE IF NOT EXISTS meal_selections (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_slot VARCHAR(20) NOT NULL,
  food_slug VARCHAR(80),
  food_name VARCHAR(180) NOT NULL,
  protein_g NUMERIC(5,1) NOT NULL,
  carbs_g NUMERIC(5,1) DEFAULT 0,
  calories INTEGER DEFAULT 0,
  gi_level VARCHAR(12) DEFAULT 'low',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, plan_date, meal_slot)
);

CREATE INDEX IF NOT EXISTS idx_meal_selections_member_date ON meal_selections (member_id, plan_date);

-- Grocery ticks for the week, per family member.
CREATE TABLE IF NOT EXISTS grocery_checks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  item_name VARCHAR(180) NOT NULL,
  checked BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, member_id, week_start, item_name)
);

-- Safe upgrades when an older schema is already on Render.
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS feeding_type VARCHAR(16);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS school_hours VARCHAR(40);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS include_veg_dishes BOOLEAN DEFAULT TRUE;
ALTER TABLE daily_meal_logs DROP CONSTRAINT IF EXISTS daily_meal_logs_member_id_log_date_meal_slot_food_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_meal_slot ON daily_meal_logs (member_id, log_date, meal_slot);
