/**
 * Dynamic Nutrition & Diabetes Calculation Engine
 * Adapts to any age (Infant 6m -> Senior 60+) and weight (kg/lb),
 * activity level, pregnancy/lactation, diet preference, and diabetes status.
 */

const AGE_GROUPS = [
  {
    id: "infant",
    name: "Infant",
    range: "6–12 months",
    minYears: 0.5,
    factor: 1.5,
    portion: 0.28,
    badgeColor: "#EC4899",
    note: "Complementary soft/mashed foods alongside breast milk or formula. No added salt or refined sugar.",
  },
  {
    id: "toddler",
    name: "Toddler",
    range: "1–3 years",
    minYears: 1,
    factor: 1.05,
    portion: 0.42,
    badgeColor: "#F59E0B",
    note: "Small frequent protein-dense meals, soft finger foods, full-cream dairy/curd.",
  },
  {
    id: "child",
    name: "Child",
    range: "4–9 years",
    minYears: 4,
    factor: 0.95,
    portion: 0.62,
    badgeColor: "#10B981",
    note: "School lunchbox-friendly protein; steady energy without packaged sugary snacks.",
  },
  {
    id: "preteen",
    name: "Pre-teen",
    range: "10–12 years",
    minYears: 10,
    factor: 0.95,
    portion: 0.8,
    badgeColor: "#06B6D4",
    note: "Rapid growth window — pair high protein with iron, calcium, and vitamin D.",
  },
  {
    id: "teen",
    name: "Teen",
    range: "13–18 years",
    minYears: 13,
    factor: 0.92,
    portion: 1.0,
    badgeColor: "#6366F1",
    note: "Peak bone & muscle growth; active sports teens receive +0.2 to +0.37 g/kg.",
  },
  {
    id: "adult",
    name: "Adult",
    range: "19–59 years",
    minYears: 19,
    factor: 0.85,
    portion: 1.0,
    badgeColor: "#FF6B4A",
    note: "Scaled by activity level (0.85 g/kg sedentary up to 1.22 g/kg active) for metabolic health.",
  },
  {
    id: "senior",
    name: "Senior",
    range: "60+ years",
    minYears: 60,
    factor: 1.05,
    portion: 0.88,
    badgeColor: "#8B5CF6",
    note: "Higher per-kg protein prevents age-related muscle loss (sarcopenia); easy-to-digest foods.",
  },
];

const MEAL_SPLITS = [
  { key: "breakfast", label: "Breakfast", time: "08:00 AM", share: 0.25, icon: "sunny-outline" },
  { key: "lunch", label: "Lunch", time: "01:00 PM", share: 0.30, icon: "restaurant-outline" },
  { key: "snack", label: "Evening Snack", time: "04:30 PM", share: 0.15, icon: "cafe-outline" },
  { key: "dinner", label: "Dinner", time: "08:00 PM", share: 0.30, icon: "moon-outline" },
];

const FOOD_CATALOG = [
  // VEG - BREAKFAST
  {
    slug: "moong-dal-chilla",
    name: "Moong Dal Chilla (2 pcs) + Mint Curd",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 14,
    carbs_g: 24,
    fiber_g: 5.2,
    calories: 240,
    gi_level: "low",
    diabetic_swap: "Stuff with grated paneer (30g) for slower glucose release",
    serving_desc: "2 medium chillas + 1/2 cup curd",
    prep_mins: 15,
    recipe_tip: "Soak yellow moong dal 2 hrs, grind with ginger, cumin & spinach.",
    soft_texture_friendly: true,
  },
  {
    slug: "paneer-besan-toast",
    name: "Besan Paneer Toast & Warm Milk",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 16,
    carbs_g: 26,
    fiber_g: 4.0,
    calories: 285,
    gi_level: "medium",
    diabetic_swap: "Use multigrain/seed bread + unsweetened almond/turmeric milk",
    serving_desc: "2 slices + 200 ml milk",
    prep_mins: 12,
    recipe_tip: "Coat multigrain toast in spiced besan batter topped with crumbled paneer.",
    soft_texture_friendly: true,
  },
  {
    slug: "ragi-idli-sambar",
    name: "Ragi Idli (3 pcs) + Dal Sambar",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 12,
    carbs_g: 32,
    fiber_g: 6.0,
    calories: 250,
    gi_level: "low",
    diabetic_swap: "Take extra drumstick sambar bowl, limit chutney",
    serving_desc: "3 steamed idlis + 1 bowl thick sambar",
    prep_mins: 20,
    recipe_tip: "Fermented finger-millet & urad batter gives calcium + complete protein.",
    soft_texture_friendly: true,
  },

  // EGG / NON-VEG - BREAKFAST
  {
    slug: "masala-omelette-toast",
    name: "2-Egg Spinach Omelette + Multigrain Toast",
    meal_slot: "breakfast",
    diet_type: "egg",
    protein_g: 18,
    carbs_g: 20,
    fiber_g: 3.5,
    calories: 270,
    gi_level: "low",
    diabetic_swap: "1 slice sprouted grain toast + sautéed mushrooms",
    serving_desc: "2 eggs + 1-2 toast slices",
    prep_mins: 10,
    recipe_tip: "Whisk eggs with chopped palak, bell peppers, and black pepper.",
    soft_texture_friendly: true,
  },
  {
    slug: "egg-bhurji-roti",
    name: "Parsi Akuri (Spiced Egg Bhurji) + Jowar Roti",
    meal_slot: "breakfast",
    diet_type: "egg",
    protein_g: 17,
    carbs_g: 22,
    fiber_g: 4.2,
    calories: 265,
    gi_level: "low",
    diabetic_swap: "Pair with 1 jowar roti + cucumber slices",
    serving_desc: "2 eggs + 1 roti",
    prep_mins: 12,
    recipe_tip: "Cook softly on low flame with coriander, tomato, and turmeric.",
    soft_texture_friendly: true,
  },

  // VEG - LUNCH
  {
    slug: "rajma-brown-rice-curd",
    name: "Homestyle Rajma + Rice + Cucumber Raita",
    meal_slot: "lunch",
    diet_type: "veg",
    protein_g: 18,
    carbs_g: 46,
    fiber_g: 9.0,
    calories: 380,
    gi_level: "high",
    diabetic_swap: "Swap white rice -> 1/2 cup brown rice or 2 bajra/jowar rotis; eat salad first",
    serving_desc: "1 cup thick rajma + 1 cup rice + raita",
    prep_mins: 30,
    recipe_tip: "Kidney beans + grain form all 9 essential amino acids for child growth.",
    soft_texture_friendly: true,
  },
  {
    slug: "palak-paneer-roti-dal",
    name: "Palak Paneer (100g) + Yellow Dal + 2 Phulkas",
    meal_slot: "lunch",
    diet_type: "veg",
    protein_g: 24,
    carbs_g: 34,
    fiber_g: 7.5,
    calories: 410,
    gi_level: "low",
    diabetic_swap: "Use multigrain atta with 30% chana besan mixed in",
    serving_desc: "100g paneer + 1/2 cup dal + 2 phulkas",
    prep_mins: 25,
    recipe_tip: "Blanch spinach briefly to keep iron bioavailable; add lemon squeeze.",
    soft_texture_friendly: true,
  },
  {
    slug: "soya-pulao-curd",
    name: "High-Protein Soya Chunk Vegetable Pulao + Curd",
    meal_slot: "lunch",
    diet_type: "veg",
    protein_g: 25,
    carbs_g: 40,
    fiber_g: 6.8,
    calories: 375,
    gi_level: "medium",
    diabetic_swap: "Cook with broken wheat (daliya) or quinoa instead of white basmati",
    serving_desc: "1.5 cups soya pulao + 1 cup curd",
    prep_mins: 25,
    recipe_tip: "Boil & squeeze soya chunks well before simmering in vegetable stock.",
    soft_texture_friendly: false,
  },

  // NON-VEG / EGG - LUNCH
  {
    slug: "chicken-curry-millet-roti",
    name: "Home Chicken Curry (120g) + Dal + 2 Phulkas",
    meal_slot: "lunch",
    diet_type: "nonveg",
    protein_g: 32,
    carbs_g: 32,
    fiber_g: 5.5,
    calories: 420,
    gi_level: "low",
    diabetic_swap: "Pair with jowar/multigrain phulka & green kachumber salad first",
    serving_desc: "120g chicken breast/thigh + 2 rotis",
    prep_mins: 30,
    recipe_tip: "Use yogurt-tomato gravy instead of heavy cream or cashews.",
    soft_texture_friendly: false,
  },
  {
    slug: "egg-curry-dal-rice",
    name: "2-Egg Masala Curry + Moong Dal + Steamed Rice",
    meal_slot: "lunch",
    diet_type: "egg",
    protein_g: 21,
    carbs_g: 42,
    fiber_g: 5.0,
    calories: 390,
    gi_level: "high",
    diabetic_swap: "Replace white rice with red matta rice or 2 multigrain rotis",
    serving_desc: "2 eggs + 1/2 cup dal + rice",
    prep_mins: 25,
    recipe_tip: "Simmer boiled eggs in onion-tomato-fenugreek gravy.",
    soft_texture_friendly: true,
  },

  // SNACKS
  {
    slug: "roasted-chana-sprouts-chaat",
    name: "Kala Chana & Moong Sprouts Chaat",
    meal_slot: "snack",
    diet_type: "veg",
    protein_g: 10,
    carbs_g: 18,
    fiber_g: 5.5,
    calories: 155,
    gi_level: "low",
    diabetic_swap: "Zero-spike snack! Skip sweet tamarind chutney; use lemon & chaat masala",
    serving_desc: "1 bowl (80g steamed sprouts + roasted chana)",
    prep_mins: 8,
    recipe_tip: "Steam sprouts 3 mins for easy digestion in kids and seniors.",
    soft_texture_friendly: false,
  },
  {
    slug: "greek-curd-nut-bowl",
    name: "Hung Curd Berry & Walnut Protein Bowl",
    meal_slot: "snack",
    diet_type: "veg",
    protein_g: 11,
    carbs_g: 12,
    fiber_g: 2.8,
    calories: 165,
    gi_level: "low",
    diabetic_swap: "Top with guava/apple cubes & pumpkin seeds (no honey)",
    serving_desc: "1 cup hung curd + 15g nuts/seeds",
    prep_mins: 5,
    recipe_tip: "Great calcium + omega-3 booster for growing brains.",
    soft_texture_friendly: true,
  },
  {
    slug: "boiled-egg-peanut-chaat",
    name: "Spiced Boiled Egg + Roasted Peanut Bowl",
    meal_slot: "snack",
    diet_type: "egg",
    protein_g: 13,
    carbs_g: 6,
    fiber_g: 2.2,
    calories: 180,
    gi_level: "low",
    diabetic_swap: "Ideal ultra-low-GI evening snack that prevents dinner sugar spikes",
    serving_desc: "1 boiled egg + 25g peanuts",
    prep_mins: 7,
    recipe_tip: "Toss with chopped onion, coriander, and a pinch of black salt.",
    soft_texture_friendly: false,
  },

  // DINNER
  {
    slug: "paneer-bhurji-multigrain-roti",
    name: "Paneer Bhurji (100g) + Mixed Veg + 2 Phulkas",
    meal_slot: "dinner",
    diet_type: "veg",
    protein_g: 22,
    carbs_g: 28,
    fiber_g: 6.2,
    calories: 360,
    gi_level: "low",
    diabetic_swap: "Use 1 multigrain roti + extra stir-fried beans & broccoli",
    serving_desc: "100g fresh paneer bhurji + 2 rotis",
    prep_mins: 20,
    recipe_tip: "Homemade chenna/paneer stays soft for toddlers and seniors.",
    soft_texture_friendly: true,
  },
  {
    slug: "dal-khichdi-curd",
    name: "Double-Dal Vegetable Khichdi + Tadka Curd",
    meal_slot: "dinner",
    diet_type: "veg",
    protein_g: 16,
    carbs_g: 36,
    fiber_g: 6.0,
    calories: 320,
    gi_level: "medium",
    diabetic_swap: "Cook with 2 parts moong+toor dal to 1 part millets/daliya (no white rice)",
    serving_desc: "1.5 cups khichdi + 1/2 cup curd",
    prep_mins: 20,
    recipe_tip: "Comforting, gentle on digestion, and complete in amino acids.",
    soft_texture_friendly: true,
  },
  {
    slug: "grilled-fish-dal-roti",
    name: "Tawa Grilled Fish (130g) + Spinach Dal + Phulka",
    meal_slot: "dinner",
    diet_type: "nonveg",
    protein_g: 30,
    carbs_g: 24,
    fiber_g: 5.0,
    calories: 350,
    gi_level: "low",
    diabetic_swap: "Low-carb, high-omega-3 dinner that keeps fasting glucose steady",
    serving_desc: "130g fillet + 1/2 cup palak dal + 1 phulka",
    prep_mins: 20,
    recipe_tip: "Marinate fish in turmeric, garlic, lemon & mustard oil.",
    soft_texture_friendly: true,
  },
  {
    slug: "tofu-chana-stirfry",
    name: "Smoky Tofu & Chickpea Stir-Fry + Jowar Bhakri",
    meal_slot: "dinner",
    diet_type: "veg",
    protein_g: 20,
    carbs_g: 30,
    fiber_g: 7.4,
    calories: 335,
    gi_level: "low",
    diabetic_swap: "High fiber slows gastric emptying — walk 12 mins after dinner",
    serving_desc: "1 bowl stir-fry + 1 bhakri",
    prep_mins: 18,
    recipe_tip: "Toss firm tofu cubes with boiled chickpeas, capsicum & sesame seeds.",
    soft_texture_friendly: false,
  },
  {
    slug: "veg-oats-cheela",
    name: "Vegetable Oats Cheela + Mint Curd",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 13,
    carbs_g: 28,
    fiber_g: 5.4,
    calories: 260,
    gi_level: "low",
    diabetic_swap: "Skip banana on the side; add extra curd",
    serving_desc: "2 cheelas + 1/2 cup curd",
    prep_mins: 15,
    recipe_tip: "Blend oats, grated carrot, spinach, and a little curd.",
    soft_texture_friendly: true,
  },
  {
    slug: "sprouts-poha",
    name: "Sprouts Poha with Peanuts",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 12,
    carbs_g: 36,
    fiber_g: 5.0,
    calories: 280,
    gi_level: "medium",
    diabetic_swap: "Use less poha, double the moong sprouts, and add curd",
    serving_desc: "1 bowl poha + sprouts",
    prep_mins: 15,
    recipe_tip: "Steam sprouts first so children can chew them easily.",
    soft_texture_friendly: false,
  },
  {
    slug: "dalia-porridge",
    name: "Vegetable Dalia Porridge + Milk",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 11,
    carbs_g: 34,
    fiber_g: 6.2,
    calories: 270,
    gi_level: "low",
    diabetic_swap: "Cook in water, then stir in unsweetened curd",
    serving_desc: "1 bowl daliya + 150 ml milk",
    prep_mins: 18,
    recipe_tip: "Soft broken wheat is gentle for toddlers and seniors.",
    soft_texture_friendly: true,
  },
  {
    slug: "methi-thepla-curd",
    name: "Methi Thepla + Hung Curd",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 14,
    carbs_g: 30,
    fiber_g: 5.1,
    calories: 290,
    gi_level: "medium",
    diabetic_swap: "Make the dough with extra besan and skip jaggery",
    serving_desc: "2 theplas + 1 cup curd",
    prep_mins: 20,
    recipe_tip: "Knead fenugreek leaves into atta with ginger and ajwain.",
    soft_texture_friendly: false,
  },
  {
    slug: "paneer-paratha-curd",
    name: "Paneer Stuffed Paratha + Curd",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 16,
    carbs_g: 32,
    fiber_g: 4.2,
    calories: 340,
    gi_level: "medium",
    diabetic_swap: "Use 1 multigrain paratha and a large bowl of curd",
    serving_desc: "1 paratha + 1 cup curd",
    prep_mins: 20,
    recipe_tip: "Stuff with grated paneer, coriander, and a little chilli.",
    soft_texture_friendly: false,
  },
  {
    slug: "ragi-dosa-sambar",
    name: "Ragi Dosa + Drumstick Sambar",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 11,
    carbs_g: 33,
    fiber_g: 5.8,
    calories: 255,
    gi_level: "low",
    diabetic_swap: "Take extra sambar and a small dosa",
    serving_desc: "2 dosas + 1 bowl sambar",
    prep_mins: 20,
    recipe_tip: "Thin finger-millet batter crisps without extra oil.",
    soft_texture_friendly: true,
  },
  {
    slug: "chana-chaat-breakfast",
    name: "Boiled Chana Chaat + Buttermilk",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 15,
    carbs_g: 26,
    fiber_g: 7.0,
    calories: 240,
    gi_level: "low",
    diabetic_swap: "No sweet chutney; lemon and chaat masala only",
    serving_desc: "1 bowl chana + 1 glass chaas",
    prep_mins: 10,
    recipe_tip: "A no-cook breakfast if chana was soaked overnight.",
    soft_texture_friendly: false,
  },
  {
    slug: "soya-upma",
    name: "Soya Granule Vegetable Upma",
    meal_slot: "breakfast",
    diet_type: "veg",
    protein_g: 18,
    carbs_g: 30,
    fiber_g: 5.5,
    calories: 290,
    gi_level: "medium",
    diabetic_swap: "Replace half the rava with oats or daliya",
    serving_desc: "1 bowl soya upma",
    prep_mins: 15,
    recipe_tip: "Squeeze boiled soya granules dry before adding to the rava.",
    soft_texture_friendly: true,
  },
  {
    slug: "boiled-eggs-oats",
    name: "2 Boiled Eggs + Vegetable Oats",
    meal_slot: "breakfast",
    diet_type: "egg",
    protein_g: 18,
    carbs_g: 24,
    fiber_g: 4.4,
    calories: 280,
    gi_level: "low",
    diabetic_swap: "Cook oats in water and season with pepper, not sugar",
    serving_desc: "2 eggs + 1 bowl oats",
    prep_mins: 12,
    recipe_tip: "Boil eggs until just set so they stay soft for children.",
    soft_texture_friendly: true,
  },
  {
    slug: "egg-dosa",
    name: "Egg Dosa + Coconut Chutney",
    meal_slot: "breakfast",
    diet_type: "egg",
    protein_g: 16,
    carbs_g: 28,
    fiber_g: 3.2,
    calories: 300,
    gi_level: "medium",
    diabetic_swap: "Use ragi or oats dosa batter and a small chutney",
    serving_desc: "2 egg dosas",
    prep_mins: 15,
    recipe_tip: "Crack the egg onto a thin dosa and cover until set.",
    soft_texture_friendly: true,
  },
  {
    slug: "paneer-omelette",
    name: "Paneer Spinach Omelette + Fruit",
    meal_slot: "breakfast",
    diet_type: "egg",
    protein_g: 20,
    carbs_g: 12,
    fiber_g: 2.8,
    calories: 260,
    gi_level: "low",
    diabetic_swap: "Serve with guava or apple, not juice",
    serving_desc: "2-egg omelette with 40g paneer",
    prep_mins: 10,
    recipe_tip: "Fold grated paneer and palak into the eggs.",
    soft_texture_friendly: true,
  },
  {
    slug: "egg-besan-chilla",
    name: "Egg Besan Chilla + Curd",
    meal_slot: "breakfast",
    diet_type: "egg",
    protein_g: 17,
    carbs_g: 22,
    fiber_g: 4.0,
    calories: 275,
    gi_level: "low",
    diabetic_swap: "A low-GI breakfast; keep the curd unsweetened",
    serving_desc: "2 chillas + 1/2 cup curd",
    prep_mins: 12,
    recipe_tip: "Whisk one egg into spiced besan batter.",
    soft_texture_friendly: true,
  },
  {
    slug: "chicken-keema-paratha",
    name: "Chicken Keema Paratha + Curd",
    meal_slot: "breakfast",
    diet_type: "nonveg",
    protein_g: 24,
    carbs_g: 28,
    fiber_g: 3.6,
    calories: 360,
    gi_level: "medium",
    diabetic_swap: "One multigrain paratha and a large bowl of curd",
    serving_desc: "1 paratha + 1 cup curd",
    prep_mins: 25,
    recipe_tip: "Cook minced chicken dry with onion, ginger, and turmeric.",
    soft_texture_friendly: false,
  },
  {
    slug: "grilled-chicken-sandwich",
    name: "Grilled Chicken Multigrain Sandwich",
    meal_slot: "breakfast",
    diet_type: "nonveg",
    protein_g: 26,
    carbs_g: 24,
    fiber_g: 4.1,
    calories: 320,
    gi_level: "medium",
    diabetic_swap: "Open sandwich on 1 slice with extra cucumber",
    serving_desc: "1 sandwich with 80g chicken",
    prep_mins: 15,
    recipe_tip: "Use hung curd and pepper instead of mayonnaise.",
    soft_texture_friendly: false,
  },
  {
    slug: "fish-oats-tikki",
    name: "Fish Oats Tikki + Mint Curd",
    meal_slot: "breakfast",
    diet_type: "nonveg",
    protein_g: 22,
    carbs_g: 18,
    fiber_g: 3.4,
    calories: 280,
    gi_level: "low",
    diabetic_swap: "Pan-sear with very little oil",
    serving_desc: "2 tikkis + 1/2 cup curd",
    prep_mins: 18,
    recipe_tip: "Mix flaked fish with oats, ginger, and coriander.",
    soft_texture_friendly: true,
  },
  {
    slug: "egg-chicken-scramble",
    name: "Egg and Chicken Scramble + 1 Phulka",
    meal_slot: "breakfast",
    diet_type: "nonveg",
    protein_g: 28,
    carbs_g: 18,
    fiber_g: 2.5,
    calories: 310,
    gi_level: "low",
    diabetic_swap: "Skip the phulka if the morning reading is high",
    serving_desc: "1 egg + 60g chicken + 1 phulka",
    prep_mins: 12,
    recipe_tip: "Shred leftover chicken into a soft egg scramble.",
    soft_texture_friendly: true,
  },
];

function dish(item) {
  return {
    fiber_g: 3,
    calories: 220,
    gi_level: "low",
    diabetic_swap: "Keep the portion modest and add curd or dal on the side",
    prep_mins: 20,
    recipe_tip: "Home or hotel style. Adjust salt for children and seniors.",
    soft_texture_friendly: true,
    ...item,
  };
}

const TIFFINS = [
  ["idli-sambar-tiffin", "Idli (3) + Sambar + Coconut Chutney", "medium", "2 idlis if sugar is high; extra sambar"],
  ["ghee-podi-idli", "Ghee Podi Idli + Sambar", "medium", "Use 1 tsp gingelly oil instead of heavy ghee; extra sambar"],
  ["mini-sambar-idli", "Mini Sambar Idli (14 pcs)", "medium", "Soaked in protein-rich toor dal sambar"],
  ["button-idli-tiffin", "Button Idli + Mulligatawny Sambar", "medium", "Plenty of dal sambar, moderate idlis"],
  ["kanchipuram-idli", "Kanchipuram Spiced Idli + Chutney", "medium", "Pepper-cumin steamed idli; pair with sambar"],
  ["ragi-idli-tiffin", "Ragi Idli + Peanut Chutney", "low", "Finger-millet steamed idli keeps glucose steady"],
  ["oats-idli-tiffin", "Oats Carrot Idli + Mint Chutney", "low", "High beta-glucan soluble fiber"],
  ["millet-idli-tiffin", "Foxtail Millet Idli + Sambar", "low", "Low-GI millet batter"],
  ["medu-vada-sambar", "Medu Vada (2) + Sambar", "medium", "1 vada only; fill up on sambar"],
  ["sambar-vada-tiffin", "Sambar Vada (Dunked in Dal Sambar)", "medium", "1 vada soaked in thick sambar"],
  ["curd-vada-dahi", "Thayir Vada / Dahi Vada", "low", "Probiotic curd slows digestion; 1 vada"],
  ["masala-dosa-tiffin", "Hotel Masala Dosa + Sambar + 2 Chutneys", "medium", "Ask for less potato bhaji, extra sambar"],
  ["plain-dosa-tiffin", "Plain Crispy Dosa + Sambar & Chutney", "medium", "Pair with double bowl sambar"],
  ["kal-dosa-tiffin", "Home Style Kal Dosa (2) + Vadacurry", "medium", "Soft thick tawa dosa + steamed chana dal vadacurry"],
  ["set-dosa-tiffin", "Set Dosa (3) + Vegetable Saagu", "medium", "2 sponge dosas and more vegetable saagu"],
  ["rava-dosa-tiffin", "Crispy Onion Rava Dosa + Coconut Chutney", "medium", "Make with extra curd and roasted chana dal"],
  ["onion-dosa-tiffin", "Chopped Onion Dosa + Tomato Chutney", "medium", "Add a side of boiled sprouts or sambar"],
  ["podi-dosa-tiffin", "Madurai Idli-Podi Dosa + Sambar", "medium", "Flax & urad dal podi adds extra protein"],
  ["mysore-masala-dosa", "Mysore Masala Dosa + Red Garlic Chutney", "medium", "Half potato masala, extra lentil sambar"],
  ["ghee-roast-dosa", "Hotel Ghee Paper Roast Dosa + Sambar", "high", "Skip extra ghee; pair with thick dal sambar first"],
  ["benne-masala-dosa", "Davangere Benne Dosa + Chutney", "high", "Small portion; walk 10 mins after breakfast"],
  ["kara-dosa-tiffin", "Rayalaseema Kara Dosa + Peanut Chutney", "medium", "Spiced onion-garlic spread with protein-rich groundnut"],
  ["neer-dosa-tiffin", "Mangalore Neer Dosa + Coconut Veg Kurma", "medium", "Thin lace rice crepe; take extra vegetable kurma"],
  ["wheat-dosa-tiffin", "Instant Godhuma (Wheat) Dosa + Tomato Chutney", "medium", "Add 2 tbsp besan to wheat batter"],
  ["jowar-dosa-tiffin", "Jowar (Jonna) Crispy Dosa + Peanut Chutney", "low", "Sorghum millet keeps post-meal sugar flat"],
  ["bajra-dosa-tiffin", "Bajra (Kambu) Dosa + Garlic Chutney", "low", "Pearl millet iron + fiber rich tiffin"],
  ["multigrain-adai-dosa", "5-Lentil Protein Adai Dosa + Jaggery/Avial", "low", "Toor, chana, urad, moong + masoor dal batter"],
  ["onion-uttapam", "Onion & Coriander Uttapam + Sambar", "medium", "Thick vegetable topping lowers glycemic load"],
  ["mixed-veg-uttapam", "Carrot-Beans-Tomato Pancharatna Uttapam", "low", "Loaded with grated vegetables and sambar"],
  ["paneer-uttapam", "Grated Paneer Masala Uttapam + Mint Chutney", "low", "High protein cottage cheese topping"],
  ["pesarattu-ginger", "Andhra Green Moong Pesarattu + Allam Chutney", "low", "Whole green gram dosa — top diabetic & child choice"],
  ["mla-pesarattu-upma", "MLA Pesarattu (Stuffed with Upma) + Chutney", "medium", "Ask for light upma filling inside moong crepe"],
  ["ven-pongal-sambar", "Ghee Ven Pongal + Tiffin Sambar + Chutney", "medium", "Use 1:1 moong dal to rice or millet pongal"],
  ["millet-pongal-tiffin", "Thinai (Foxtail Millet) Khara Pongal + Sambar", "low", "Millet + moong dal pepper-cumin pongal"],
  ["rava-pongal-tiffin", "Rava Pongal + Coconut Chutney", "medium", "Add extra moong dal and cashew-pepper tadka"],
  ["rava-idli-tiffin", "MTR Style Rava Idli + Potato Saagu", "medium", "Curd-based steamed semolina cake with peas & carrot"],
  ["appam-veg-stew", "Lace Hoppers Appam (2) + Coconut Veg Stew", "medium", "1–2 appams with a large bowl of carrot-beans stew"],
  ["puttu-kadala", "Kerala Steamed Puttu + Black Chana Kadala Curry", "low", "Black chickpea gravy provides high fiber & protein"],
  ["ragi-puttu-cherupayar", "Ragi Puttu + Green Gram (Cherupayar) Curry", "low", "Finger millet + whole moong protein combo"],
  ["idiyappam-kurma", "String Hoppers Idiyappam (3) + Veg Kurma", "medium", "Take extra vegetable kurma and coconut milk"],
  ["thatte-idli", "Bidadi Thatte Idli + Chutney Podi & Sambar", "medium", "1 fluffy plate idli + full bowl sambar"],
  ["adai-avial", "Mixed Dal Adai + Kerala Vegetable Avial", "low", "Lentil pancake with curd-coconut mixed vegetables"],
  ["rava-upma-chutney", "Home Style Roasted Rava Upma + Chutney", "medium", "Load with peas, carrot, beans, and roasted peanuts"],
  ["semiya-upma-tiffin", "Roasted Vermicelli Semiya Vegetable Upma", "medium", "Add boiled green peas, carrots, and peanuts"],
  ["bansi-rava-upma", "Godhuma Rava (Cracked Wheat) Upma + Curd", "low", "Broken wheat digests slowly over 3 hours"],
  ["aval-upma-poha", "Red Aval (Flattened Rice) Poha Upma + Peanuts", "low", "Red poha retains bran fiber and iron"],
  ["tomato-bath-tiffin", "Karnataka Tomato Bath + Coconut Chutney", "medium", "Spiced tomato-pea rava bath"],
  ["kharabath-chow-bath", "Hotel Chow-Chow Bath (Khara Bath + Kesari)", "high", "Diabetics: eat only the vegetable khara bath, skip kesari"],
  ["bisi-bele-bath-tiffin", "Morning Bisi Bele Bath + Raitha", "medium", "Dal-vegetable rich; make with brown rice or millets"],
  ["ponganalu-paniyaram", "Kuzhi Paniyaram / Gunta Ponganalu (6 pcs) + Chutney", "medium", "Fermented batter dumplings with onion, carrot & dal"],
  ["sweet-corn-paniyaram", "Vegetable & Paneer Paniyaram + Tomato Chutney", "low", "Fold grated paneer & spinach into paniyaram batter"],
  ["aloo-paratha-tiffin", "Punjabi Aloo Paratha + Thick Curd", "high", "1 multigrain paratha; curd slows potato starch"],
  ["gobi-paratha-tiffin", "Spiced Cauliflower Gobi Paratha + Curd", "medium", "Low-carb cruciferous filling with probiotic curd"],
  ["mooli-paratha-tiffin", "Grated Radish Mooli Paratha + Boondi Raita", "medium", "Radish + ajwain aids digestion"],
  ["palak-paneer-paratha", "Palak Paneer Paratha + Curd", "low", "Iron-rich spinach dough stuffed with paneer"],
  ["sattu-paratha-tiffin", "Roasted Chana Sattu Paratha + Curd", "low", "Roasted Bengal gram flour gives top plant protein"],
  ["poori-masala-tiffin", "Hotel Poori (2) + Potato Onion Masala", "high", "1 whole-wheat poori + chickpea or sagu gravy"],
  ["poori-chana-tiffin", "Poori (2) + White Chana Masala", "medium", "Eat the protein-rich chana first"],
  ["chole-bhature-tiffin", "Punjabi Chole Bhature", "high", "Eat full bowl of chole + salad; limit bhatura"],
  ["bedmi-poori-aloo", "Urad Dal Stuffed Bedmi Poori + Aloo Sabzi", "medium", "Spiced urad dal stuffing adds lentil protein"],
  ["pav-bhaji-tiffin", "Mumbai Butter Pav Bhaji", "high", "Thick mixed-veg bhaji with 1 whole-wheat pav"],
  ["misal-pav-tiffin", "Kolhapuri Sprouted Matki Misal Pav", "medium", "High-protein moth bean sprouts; use 1 pav"],
  ["usal-poha-tiffin", "Nagpuri Tarri Poha with Chana Usal", "medium", "Black chana gravy lowers the GI of poha"],
  ["kanda-batata-poha", "Maharashtrian Kanda Poha + Peanuts & Lemon", "medium", "Top with roasted peanuts, coriander, and sev"],
  ["indori-poha-jalebi", "Indori Steamed Poha with Sprouts", "medium", "Skip jalebi; add steamed moong sprouts"],
  ["khaman-dhokla", "Gujarati Steamed Khaman Dhokla + Green Chutney", "low", "Fermented chana besan sponge — great for kids & seniors"],
  ["white-khatta-dhokla", "Surti Khatta Rice-Urad Dhokla", "low", "Steamed fermented rice and urad dal cake"],
  ["khandvi-tiffin", "Steamed Gram-Flour Khandvi Rolls", "low", "Soft besan & buttermilk rolls — toddler & grandparent friendly"],
  ["handvo-tiffin", "Baked Bottle-Gourd & Mixed Dal Handvo", "low", "Crispy sesame crust over lentil-vegetable cake"],
  ["sabudana-khichdi-tiffin", "Sabudana Khichdi with Crushed Peanuts + Curd", "high", "Small bowl; sago pearls spike glucose quickly"],
  ["sabudana-vada-tiffin", "Sabudana Peanut Vada + Curd", "high", "Air-fry or shallow pan-roast in appe pan"],
  ["veg-grill-sandwich", "Bombay Vegetable Chutney Grill Sandwich", "medium", "Use multigrain bread + cucumber, tomato, beet"],
  ["paneer-sandwich-tiffin", "Paneer Bhurji Capsicum Toast Sandwich", "low", "High protein crumbled paneer filling"],
  ["corn-spinach-sandwich", "Spinach & Sweet Corn Curd Sandwich", "low", "Hung curd dressing instead of cheese spread"],
  ["mysore-bonda", "Hotel Mysore Bajji / Bonda (3) + Chutney", "high", "Deep-fried maida/urad snack; swap with idli on diabetic days"],
  ["mangalore-buns", "Mangalore Banana Poori Buns + Kurma", "high", "Sweet fermented banana bread — occasional child treat"],
  ["punugulu-chutney", "Andhra Crispy Idli-Batter Punugulu + Peanut Chutney", "medium", "Pair with protein-rich groundnut chutney"],
  ["medu-pakoda-uggani", "Rayalaseema Uggani (Puffed Rice) + Mirchi Bajji", "medium", "Add roasted chana dal powder (pappula podi) generously"],
  ["akki-roti-tiffin", "Karnataka Dill & Onion Akki Roti + Chutney", "medium", "Add grated carrot, dill leaves & groundnut chutney"],
  ["ragi-roti-tiffin", "Drumstick Leaf Ragi Roti + Groundnut Chutney", "low", "Calcium & iron powerhouse tiffin"],
  ["jolada-roti-enne-gai", "North Karnataka Jolada (Jowar) Roti + Yennegai", "low", "Gluten-free sorghum flatbread with stuffed brinjal"],
  ["thalipeeth-curd", "Maharashtrian Multigrain Bhajani Thalipeeth + Curd", "low", "Roasted jowar, bajra, chana, wheat & urad flour"],
  ["bread-omelette-style-besan", "Veg Besan Bread Toast + Mint Chutney", "low", "Multigrain bread dipped in spiced gram-flour batter"],
  ["bread-upma-tiffin", "South Indian Masala Bread Upma", "high", "Use brown bread + extra peas and peanuts"],
  ["idiyappam-coconut-milk", "Idiyappam + Sweetened Cardamom Coconut Milk", "medium", "Child favourite; diabetics use unsweetened veg stew"],
  ["Aval-milk-nuts", "Malabar Avil Milk (Red Poha, Milk, Banana & Nuts)", "medium", "Quick no-cook morning energy bowl for school kids"],
];

const VEG_CURRIES = [
  ["beans-poriyal", "French Beans Poriyal", "low"],
  ["carrot-beans-curry", "Carrot Beans Curry", "low"],
  ["cabbage-poriyal", "Cabbage Poriyal", "low"],
  ["gobi-masala", "Cauliflower Gobi Masala", "low"],
  ["aloo-gobi", "Aloo Gobi", "medium"],
  ["bhindi-masala", "Bhindi Masala", "low"],
  ["baingan-bharta", "Baingan Bharta", "low"],
  ["karela-sabzi", "Karela Sabzi", "low"],
  ["lauki-chana-dal", "Lauki Chana Dal", "low"],
  ["turai-sabzi", "Ridge Gourd Turai Sabzi", "low"],
  ["snake-gourd-curry", "Snake Gourd Curry", "low"],
  ["bottle-gourd-curry", "Bottle Gourd Curry", "low"],
  ["drumstick-sambar-curry", "Drumstick Curry", "low"],
  ["pumpkin-kootu", "Pumpkin Kootu", "low"],
  ["raw-banana-poriyal", "Raw Banana Poriyal", "medium"],
  ["capsicum-masala", "Capsicum Masala", "low"],
  ["methi-aloo", "Methi Aloo", "medium"],
  ["palak-dal-curry", "Palak Dal", "low"],
  ["matar-paneer-curry", "Matar Paneer", "low"],
  ["tindora-fry", "Ivy Gourd Tindora Fry", "low"],
  ["cluster-beans-curry", "Cluster Beans Curry", "low"],
  ["chow-chow-kootu", "Chow Chow Kootu", "low"],
  ["knol-khol-sabzi", "Knol Khol Sabzi", "low"],
  ["radish-sambar-curry", "Radish Curry", "low"],
  ["arbi-masala", "Arbi Masala", "medium"],
  ["yam-curry", "Yam Curry", "medium"],
  ["beetroot-poriyal", "Beetroot Poriyal", "medium"],
  ["mixed-veg-kurma", "Mixed Vegetable Kurma", "low"],
  ["avial-curry", "Avial", "low"],
  ["mushroom-masala", "Mushroom Masala", "low"],
  ["peas-carrot-curry", "Peas and Carrot Curry", "low"],
  ["tomato-pappu", "Tomato Pappu", "low"],
];

const FRUIT_SNACKS = [
  ["apple-almonds", "Apple slices + almonds", "low", "Whole apple, not juice"],
  ["guava-snack", "Guava", "low", "One of the best fruit snacks for steady sugar"],
  ["papaya-snack", "Papaya cubes", "low", "A small bowl is enough"],
  ["pear-snack", "Pear", "low", "Eat with the skin"],
  ["orange-snack", "Orange", "low", "Whole orange, not juice"],
  ["mosambi-snack", "Mosambi", "low", "Whole fruit, not sweet lime juice"],
  ["pomegranate-snack", "Pomegranate", "low", "A small bowl of arils"],
  ["jamun-snack", "Jamun", "low", "Helpful fruit when blood sugar runs high"],
  ["amla-snack", "Amla", "low", "One or two gooseberries"],
  ["berries-snack", "Mixed berries", "low", "A small handful"],
  ["kiwi-snack", "Kiwi", "low", "One fruit"],
  ["banana-peanut", "Banana + peanuts", "medium", "A small banana with peanuts, not ripe-and-alone"],
  ["mango-snack", "Mango slices", "medium", "3 or 4 slices, after a protein snack"],
  ["grapes-snack", "Grapes", "medium", "A small bunch only"],
  ["chikoo-snack", "Chikoo", "medium", "Half a fruit"],
  ["pineapple-snack", "Pineapple", "medium", "A few chunks, not juice"],
  ["watermelon-snack", "Watermelon", "high", "A few chunks; it spikes faster than guava or apple"],
  ["custard-apple-snack", "Custard apple", "medium", "A few pods, not the whole fruit"],
  ["muskmelon-snack", "Muskmelon", "medium", "A small bowl"],
  ["peach-snack", "Peach", "low", "One fruit"],
];

TIFFINS.forEach(([slug, name, gi, swap]) => {
  FOOD_CATALOG.push(
    dish({
      slug,
      name,
      meal_slot: "breakfast",
      diet_type: "veg",
      protein_g: 8,
      carbs_g: gi === "high" ? 48 : gi === "medium" ? 36 : 28,
      gi_level: gi,
      diabetic_swap: swap,
      serving_desc: "1 hotel or home serving",
      prep_mins: 20,
    })
  );
});

VEG_CURRIES.forEach(([slug, name, gi]) => {
  ["lunch", "dinner"].forEach((meal_slot) => {
    FOOD_CATALOG.push(
      dish({
        slug: `${slug}-${meal_slot}`,
        name: `${name} + Phulka`,
        meal_slot,
        diet_type: "veg",
        protein_g: 8,
        carbs_g: 28,
        fiber_g: 5,
        gi_level: gi,
        diabetic_swap: gi === "low" ? "Vegetable curry is a steady choice; eat it before rice" : "Small portion of the starchy vegetable; add a bowl of dal",
        serving_desc: "1 bowl curry + 2 phulkas",
        prep_mins: 25,
        recipe_tip: "Cook the vegetable with onion, tomato, turmeric, and a little oil.",
      })
    );
  });
});

FRUIT_SNACKS.forEach(([slug, name, gi, swap]) => {
  FOOD_CATALOG.push(
    dish({
      slug,
      name,
      meal_slot: "snack",
      diet_type: "veg",
      protein_g: 2,
      carbs_g: gi === "high" ? 22 : 14,
      fiber_g: 3,
      calories: 90,
      gi_level: gi,
      diabetic_swap: swap,
      serving_desc: "1 fruit serving",
      prep_mins: 2,
      recipe_tip: "Eat the whole fruit. Do not juice it.",
    })
  );
});

const DIABETES_EDUCATION = {
  eatFreely: [
    {
      name: "Dals, Rajma, Chana & Sprouts",
      why: "High soluble fiber + plant protein traps glucose and prevents sudden bloodstream spikes.",
      gi: "Low GI (28–38)",
    },
    {
      name: "Paneer, Hung Curd, Eggs, Fish & Chicken",
      why: "Near-zero glycemic index; eating protein first slows carbohydrate absorption by up to 35%.",
      gi: "Ultra-Low GI (<15)",
    },
    {
      name: "Non-Starchy Greens (Palak, Methi, Bhindi, Karela, Broccoli)",
      why: "Fenugreek (methi) and bitter gourd improve insulin sensitivity; fill half your plate.",
      gi: "Low GI (<20)",
    },
    {
      name: "Whole Millets (Ragi, Jowar, Bajra) & Steel-Cut Oats",
      why: "Complex resistant starches digest slowly over 3–4 hours instead of 45 minutes.",
      gi: "Low–Med GI (45–54)",
    },
    {
      name: "Nuts & Seeds (Walnuts, Almonds, Chia, Flax, Roasted Chana)",
      why: "Healthy fats + magnesium blunt post-meal glucose peaks.",
      gi: "Low GI (<25)",
    },
    {
      name: "Low-GI Whole Fruits (Guava, Jamun, Apple, Pear, Papaya, Berries)",
      why: "Eat whole with skin (never juiced) and pair with 5–6 almonds.",
      gi: "Low GI (32–42)",
    },
  ],
  limitPortion: [
    {
      name: "White Rice, Poha, Upma & Idli (Refined Rice)",
      why: "Fast-digesting starch. Limit to 1/2 cup cooked and always pair with double dal/curd + salad first.",
      gi: "High GI (70–78)",
    },
    {
      name: "Whole-Wheat Roti / Phulka",
      why: "Better than maida, but still raises glucose if eaten in large counts. Mix 25% chana besan into atta.",
      gi: "Medium GI (62)",
    },
    {
      name: "Starchy Vegetables (Potato, Sweet Potato, Beetroot, Corn)",
      why: "Count as your carb portion for the meal — do not combine potato sabzi with rice + roti.",
      gi: "Med–High GI (60–75)",
    },
    {
      name: "Sweet Tropical Fruits (Mango, Ripe Banana, Chikoo, Grapes)",
      why: "High fructose + glucose load. Maximum 3–4 slices midday after a protein snack.",
      gi: "Medium GI (55–65)",
    },
  ],
  avoidStrictly: [
    {
      name: "Fruit Juices, Sugary Sodas, Sweetened Lassi & Packaged Drinks",
      why: "Zero fiber — liquid sugar hits the liver in 10 minutes, causing the sharpest possible spike.",
      spikeRisk: "Extreme (+80–120 mg/dL)",
    },
    {
      name: "Maida Items (White Bread, Naan, Bhatura, Biscuits, Bakery rusk)",
      why: "Stripped of bran and germ; spikes blood sugar almost as fast as pure glucose.",
      spikeRisk: "Very High (+60–90 mg/dL)",
    },
    {
      name: "Deep-Fried Snacks (Samosa, Kachori, Chips, Namkeen Bhujia)",
      why: "Refined carb + trans/oxidized oil causes prolonged insulin resistance for 6+ hours.",
      spikeRisk: "High & Prolonged",
    },
    {
      name: "Jaggery (Gud), Honey & Brown Sugar in Tea/Milk",
      why: "Myth-buster: jaggery and honey have the same glycemic impact on blood sugar as white sugar.",
      spikeRisk: "Very High",
    },
    {
      name: "Skipping Breakfast or Long Gaps (>5 hrs)",
      why: "Triggers liver glycogen dump (dawn/rebound effect) and causes a massive lunch spike.",
      spikeRisk: "Rebound Spike",
    },
  ],
  spikePreventionRules: [
    {
      step: "1. Food Sequencing (The 30% Rule)",
      detail: "Eat fibre/salad first -> protein (dal/paneer/egg/fish) second -> carbs (roti/rice) last. Clinical studies show this lowers post-meal glucose peaks by 28–35%.",
    },
    {
      step: "2. The 10-Minute Post-Meal Walk",
      detail: "Walking gently for 10–15 minutes within 30 minutes after lunch and dinner lets leg muscles absorb glucose without needing extra insulin.",
    },
    {
      step: "3. Never Eat 'Naked Carbs'",
      detail: "Never eat fruit, toast, or poha alone. Always pair with protein/fat (curd, paneer, egg, nuts, or chana).",
    },
    {
      step: "4. Pediatric Type 1 Safety",
      detail: "For children with Type 1 diabetes: never starve or restrict growth calories. Match consistent carb grams with the endocrinologist's insulin-to-carb ratio, and always carry 15g fast glucose for lows (<70 mg/dL).",
    },
  ],
};

function resolveAgeGroup(ageYears) {
  let matched = AGE_GROUPS[0];
  for (const g of AGE_GROUPS) {
    if (ageYears >= g.minYears) matched = g;
  }
  return matched;
}

function computeNutritionProfile(member) {
  const ageVal = Number(member.age_value) || 0;
  const ageYears = member.age_unit === "months" ? ageVal / 12 : ageVal;
  const weightVal = Number(member.weight_value) || 0;
  const weightKg = member.weight_unit === "lb" ? weightVal * 0.453592 : weightVal;

  const group = resolveAgeGroup(ageYears);
  let factor = group.factor;

  if (group.id === "teen" || group.id === "adult" || group.id === "senior") {
    if (member.activity_level === "moderate") factor += 0.17;
    if (member.activity_level === "active") factor += 0.35;
  }

  let pregnancyExtra = 0;
  if (member.pregnant_or_lactating && member.sex === "female" && ageYears >= 13) {
    pregnancyExtra = 15;
  }

  const dailyProteinG = Math.max(10, Math.round(weightKg * factor + pregnancyExtra));
  const isDiabetic = member.diabetes_status && member.diabetes_status !== "none";
  const carbBudgetPerMealG = isDiabetic
    ? group.id === "adult" || group.id === "senior"
      ? 45
      : group.id === "teen"
        ? 55
        : 35
    : null;

  const mealTargets = MEAL_SPLITS.map((m) => ({
    ...m,
    targetProteinG: Math.round(dailyProteinG * m.share),
  }));

  return {
    ageYears: Number(ageYears.toFixed(2)),
    weightKg: Number(weightKg.toFixed(1)),
    ageGroup: group,
    factorUsed: Number(factor.toFixed(2)),
    pregnancyExtraG: pregnancyExtra,
    dailyProteinG,
    isDiabetic,
    diabetesStatus: member.diabetes_status || "none",
    carbBudgetPerMealG,
    underSixMonths: ageYears < 0.5,
    mealTargets,
  };
}

function dietTypesForMember(member) {
  const diet = member.diet_preference || "veg";
  if (diet === "veg") return ["veg"];
  if (diet === "egg") return ["veg", "egg"];
  const mixVeg = member.include_veg_dishes !== false;
  return mixVeg ? ["veg", "egg", "nonveg"] : ["nonveg"];
}

function scaleDishForSlot(food, slotTargetProteinG, calc) {
  if (!food) return null;
  const baseProtein = Math.max(1, Number(food.protein_g) || 8);
  const baseCarbs = Number(food.carbs_g) || 20;
  const baseCalories = Number(food.calories) || 200;

  // Scale portion so the dish matches this member's slot protein target
  // (e.g., Virat's 4g breakfast target instead of an adult 17g portion).
  const ratio = Math.min(1.6, Math.max(0.22, slotTargetProteinG / baseProtein));
  const portionMultiplier = Number(ratio.toFixed(2));
  const scaledProtein = Math.max(1, Math.round(slotTargetProteinG));
  const scaledCarbs = Math.max(2, Math.round(baseCarbs * ratio));
  const scaledCalories = Math.max(35, Math.round(baseCalories * ratio));

  return {
    ...food,
    scaled_protein_g: scaledProtein,
    scaled_carbs_g: scaledCarbs,
    scaled_calories: scaledCalories,
    portion_multiplier: portionMultiplier,
    needs_diabetic_swap: Boolean(calc.isDiabetic && food.gi_level !== "low"),
  };
}

function buildDailyPlanForMember(member, allFoods = FOOD_CATALOG, dayOffset = 0) {
  const calc = computeNutritionProfile(member);
  const allowedTypes = dietTypesForMember(member);

  const meals = MEAL_SPLITS.map((slot) => {
    const slotTargetProteinG = Math.max(1, Math.round(calc.dailyProteinG * slot.share));
    const candidates = allFoods.filter(
      (f) => f.meal_slot === slot.key && allowedTypes.includes(f.diet_type)
    );

    // Prefer low-GI first when diabetic, otherwise dishes closest to natural portion
    const sorted = [...candidates].sort((a, b) => {
      if (calc.isDiabetic) {
        const rank = { low: 0, medium: 1, high: 2 };
        if (rank[a.gi_level] !== rank[b.gi_level]) {
          return rank[a.gi_level] - rank[b.gi_level];
        }
      }
      return b.protein_g - a.protein_g;
    });

    const chosen = sorted[dayOffset % Math.max(1, sorted.length)] || candidates[0];

    return {
      slot: slot.key,
      label: slot.label,
      time: slot.time,
      targetProteinG: slotTargetProteinG,
      selectedFood: scaleDishForSlot(chosen, slotTargetProteinG, calc),
      alternatives: sorted.map((alt) =>
        scaleDishForSlot(alt, slotTargetProteinG, calc)
      ),
    };
  });

  const plannedProteinG = meals.reduce(
    (sum, m) => sum + (m.selectedFood ? m.selectedFood.scaled_protein_g : 0),
    0
  );

  return {
    calculation: calc,
    plannedProteinG,
    meals,
  };
}

module.exports = {
  AGE_GROUPS,
  MEAL_SPLITS,
  FOOD_CATALOG,
  DIABETES_EDUCATION,
  resolveAgeGroup,
  computeNutritionProfile,
  dietTypesForMember,
  buildDailyPlanForMember,
};
