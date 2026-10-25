import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import ProteinRing from "../components/ProteinRing";

export default function TodayPlanScreen({
  member,
  dailyPlan,
  dayOffset,
  onChangeDayOffset,
  onToggleEaten,
  onSwapMeal,
  onSaveDish,
  onOpenProfileEditor,
  onOpenDiabetesTab,
}) {
  const [swapSlot, setSwapSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dishModal, setDishModal] = useState(null); // { mode: 'add' | 'edit', slug?, slot, ...fields }
  const [dishSaving, setDishSaving] = useState(false);
  const [dishError, setDishError] = useState("");

  const openAddDish = (slotKey) => {
    setDishError("");
    setDishModal({
      mode: "add",
      slug: null,
      meal_slot: slotKey || "breakfast",
      name: "",
      diet_type: member?.diet_preference || "veg",
      protein_g: "12",
      carbs_g: "28",
      calories: "240",
      gi_level: "low",
      serving_desc: "1 home or hotel serving",
      diabetic_swap: "Pair with sambar, curd, or salad to prevent sugar spikes",
      recipe_tip: "Fresh home or hotel style preparation",
    });
  };

  const openEditDish = (food, slotKey) => {
    setDishError("");
    setDishModal({
      mode: "edit",
      slug: food.slug,
      meal_slot: food.meal_slot || slotKey || "breakfast",
      name: food.name || "",
      diet_type: food.diet_type || member?.diet_preference || "veg",
      protein_g: String(food.protein_g ?? food.scaled_protein_g ?? 12),
      carbs_g: String(food.carbs_g ?? food.scaled_carbs_g ?? 28),
      calories: String(food.calories ?? food.scaled_calories ?? 240),
      gi_level: food.gi_level || "low",
      serving_desc: food.serving_desc || "1 home or hotel serving",
      diabetic_swap: food.diabetic_swap || "",
      recipe_tip: food.recipe_tip || "",
    });
  };

  const submitDishModal = async () => {
    if (!dishModal || !onSaveDish) return;
    if (!dishModal.name || dishModal.name.trim().length < 2) {
      setDishError("Enter a dish name (at least 2 characters)");
      return;
    }
    setDishSaving(true);
    setDishError("");
    try {
      await onSaveDish(
        {
          name: dishModal.name.trim(),
          meal_slot: dishModal.meal_slot,
          diet_type: dishModal.diet_type,
          protein_g: Number(dishModal.protein_g) || 10,
          carbs_g: Number(dishModal.carbs_g) || 24,
          calories: Number(dishModal.calories) || 220,
          gi_level: dishModal.gi_level,
          serving_desc: dishModal.serving_desc,
          diabetic_swap: dishModal.diabetic_swap,
          recipe_tip: dishModal.recipe_tip,
        },
        dishModal.mode === "edit" ? dishModal.slug : null
      );
      setDishModal(null);
      setSwapSlot(null);
    } catch (err) {
      setDishError(err.message || "Could not save dish");
    } finally {
      setDishSaving(false);
    }
  };

  if (!member || !dailyPlan) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Loading dynamic meal plan...</Text>
      </View>
    );
  }

  const calc = dailyPlan.calculation;
  const meals = dailyPlan.meals || [];
  const logs = dailyPlan.logs || [];

  const isEaten = (slotKey, foodName) =>
    logs.some((l) => l.meal_slot === slotKey && l.food_name === foodName && l.eaten);

  const eatenTotal =
    dailyPlan.eatenProteinG ||
    meals.reduce((acc, m) => {
      if (m.selectedFood && isEaten(m.slot, m.selectedFood.name)) {
        return acc + Number(m.selectedFood.scaled_protein_g || 0);
      }
      return acc;
    }, 0);

  const giBadgeStyle = (gi) => {
    if (gi === "low") return { bg: COLORS.emeraldSoft, text: COLORS.emerald, label: "LOW GI" };
    if (gi === "medium") return { bg: COLORS.amberSoft, text: COLORS.amber, label: "MED GI" };
    return { bg: COLORS.roseSoft, text: COLORS.rose, label: "HIGH GI" };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Banner with Protein Ring + Active Member */}
      <LinearGradient
        colors={["#172554", "#0F172A", "#1E1B4B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.agePill}>
              <View
                style={[
                  styles.ageDot,
                  { backgroundColor: calc.ageGroup?.badgeColor || COLORS.coral },
                ]}
              />
              <Text style={styles.agePillText}>
                {calc.ageGroup?.name?.toUpperCase()} ({calc.ageGroup?.range})
              </Text>
            </View>
            <Text style={styles.heroTitle}>{member.name}’s Daily Protein</Text>
            <Text style={styles.heroFormula}>
              {calc.weightKg} kg × {calc.factorUsed} g/kg
              {calc.pregnancyExtraG ? ` + ${calc.pregnancyExtraG}g` : ""} ={" "}
              <Text style={{ color: COLORS.amber, fontWeight: "800" }}>
                {calc.dailyProteinG}g target
              </Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.editChip} onPress={onOpenProfileEditor}>
            <Ionicons name="options-outline" size={16} color={COLORS.sky} />
            <Text style={styles.editChipText}>Edit Age/Wt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroBodyRow}>
          <ProteinRing eaten={eatenTotal} target={calc.dailyProteinG} />

          <View style={styles.splitCol}>
            {calc.mealTargets?.map((mt) => (
              <View key={mt.key} style={styles.splitItem}>
                <Text style={styles.splitLabel}>{mt.label}</Text>
                <View style={styles.splitBarTrack}>
                  <View
                    style={[
                      styles.splitBarFill,
                      { width: `${Math.round(mt.share * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.splitVal}>{mt.targetProteinG}g</Text>
              </View>
            ))}
          </View>
        </View>

        {calc.isDiabetic ? (
          <TouchableOpacity
            style={styles.diabetesBanner}
            onPress={onOpenDiabetesTab}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={18} color={COLORS.emerald} />
            <Text style={styles.diabetesBannerText}>
              Diabetes Spike Guard Active ({calc.diabetesStatus.toUpperCase()}) • Max{" "}
              {calc.carbBudgetPerMealG}g carbs/meal • Low-GI swaps shown below
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.emerald} />
          </TouchableOpacity>
        ) : null}
      </LinearGradient>

      {/* Day Switcher */}
      <View style={styles.dayRow}>
        {["Today", "Tomorrow", "Day 3", "Day 4", "Day 5"].map((label, idx) => {
          const active = dayOffset === idx;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => onChangeDayOffset(idx)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {calc.underSixMonths ? (
        <View style={styles.infantNotice}>
          <Ionicons name="heart-circle" size={28} color={COLORS.coral} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infantTitle}>Infant Under 6 Months</Text>
            <Text style={styles.infantDesc}>
              WHO & ICMR recommend exclusive breast milk or infant formula until 6
              months. Solid high-protein meals unlock automatically at 6 months.
            </Text>
          </View>
        </View>
      ) : (
        meals.map((meal) => {
          const food = meal.selectedFood;
          if (!food) return null;
          const gi = giBadgeStyle(food.gi_level);
          const done = isEaten(meal.slot, food.name);

          return (
            <View key={meal.slot} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTimeTag}>
                  <Ionicons name="time-outline" size={14} color={COLORS.coral} />
                  <Text style={styles.mealSlotTitle}>{meal.label}</Text>
                  <Text style={styles.mealTimeText}>• {meal.time}</Text>
                </View>

                <View style={[styles.giPill, { backgroundColor: gi.bg }]}>
                  <Text style={[styles.giPillText, { color: gi.text }]}>{gi.label}</Text>
                </View>
              </View>

              <Text style={styles.foodTitle}>{food.name}</Text>
              <Text style={styles.servingSub}>
                Portion scaled ({food.portion_multiplier}× adult): {food.serving_desc}
              </Text>

              {/* Macro Row */}
              <View style={styles.macroRow}>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroVal}>{food.scaled_protein_g}g</Text>
                  <Text style={styles.macroKey}>Protein</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={[styles.macroVal, { color: COLORS.sky }]}>
                    {food.scaled_carbs_g}g
                  </Text>
                  <Text style={styles.macroKey}>Carbs</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={[styles.macroVal, { color: COLORS.amber }]}>
                    {food.scaled_calories}
                  </Text>
                  <Text style={styles.macroKey}>kcal</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={[styles.macroVal, { color: COLORS.emerald }]}>
                    {food.prep_mins}m
                  </Text>
                  <Text style={styles.macroKey}>Prep</Text>
                </View>
              </View>

              {/* Diabetic Low-GI Swap Callout */}
              {calc.isDiabetic && food.diabetic_swap ? (
                <View style={styles.swapCallout}>
                  <Ionicons name="leaf" size={15} color={COLORS.emerald} />
                  <Text style={styles.swapCalloutText}>
                    <Text style={{ fontWeight: "800", color: COLORS.emerald }}>
                      Anti-Spike Tip:{" "}
                    </Text>
                    {food.diabetic_swap}
                  </Text>
                </View>
              ) : null}

              {food.recipe_tip ? (
                <Text style={styles.recipeTip}>💡 {food.recipe_tip}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.swapBtn}
                  onPress={() => {
                    setSearchQuery("");
                    setSwapSlot(meal);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={16} color={COLORS.sky} />
                  <Text style={styles.swapBtnText}>
                    Swap ({meal.alternatives?.length || 1})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customBtn}
                  onPress={() => openEditDish(food, meal.slot)}
                >
                  <Ionicons name="create-outline" size={15} color={COLORS.amber} />
                  <Text style={styles.customBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customBtn}
                  onPress={() => openAddDish(meal.slot)}
                >
                  <Ionicons name="add-circle-outline" size={15} color={COLORS.coral} />
                  <Text style={[styles.customBtnText, { color: COLORS.coral }]}>+ Dish</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.eatenBtn, done && styles.eatenBtnDone]}
                  onPress={() => onToggleEaten(meal.slot, food, !done)}
                >
                  <Ionicons
                    name={done ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={done ? COLORS.white : COLORS.emerald}
                  />
                  <Text style={[styles.eatenBtnText, done && { color: COLORS.white }]}>
                    {done ? "Logged" : "Eaten"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Swap Dish Modal */}
      <Modal
        visible={Boolean(swapSlot)}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapSlot(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Swap {swapSlot?.label} (Target ~{swapSlot?.targetProteinG}g protein)
                </Text>
                <Text style={styles.modalSubCount}>
                  {swapSlot?.alternatives?.length || 0} hotel & home dishes available
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addInModalBtn}
                onPress={() => openAddDish(swapSlot?.slot)}
              >
                <Ionicons name="add" size={15} color={COLORS.white} />
                <Text style={styles.addInModalBtnText}>Add Dish</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSwapSlot(null)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search idli, dosa, pesarattu, puttu, paratha, curry, fruit..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchBox}
            />

            <ScrollView style={{ maxHeight: 420 }}>
              {swapSlot?.alternatives
                ?.filter((alt) =>
                  !searchQuery.trim()
                    ? true
                    : alt.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
                )
                .map((alt) => {
                  const gi = giBadgeStyle(alt.gi_level);
                  return (
                    <View key={alt.slug} style={styles.altRow}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => {
                          onSwapMeal(swapSlot.slot, alt);
                          setSwapSlot(null);
                        }}
                      >
                        <Text style={styles.altName}>{alt.name}</Text>
                        <Text style={styles.altSub}>
                          {alt.serving_desc} • {alt.scaled_carbs_g}g carbs
                        </Text>
                        {calc.isDiabetic && alt.diabetic_swap ? (
                          <Text style={styles.altSwapNote}>✓ {alt.diabetic_swap}</Text>
                        ) : null}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.altEditIcon}
                        onPress={() => openEditDish(alt, swapSlot.slot)}
                      >
                        <Ionicons name="pencil" size={14} color={COLORS.amber} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ alignItems: "flex-end", gap: 4 }}
                        onPress={() => {
                          onSwapMeal(swapSlot.slot, alt);
                          setSwapSlot(null);
                        }}
                      >
                        <Text style={styles.altProtein}>{alt.scaled_protein_g}g</Text>
                        <View style={[styles.giPill, { backgroundColor: gi.bg }]}>
                          <Text style={[styles.giPillText, { color: gi.text }]}>
                            {gi.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Custom Dish Modal */}
      <Modal
        visible={Boolean(dishModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setDishModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {dishModal?.mode === "edit" ? "Update Dish" : "Add Custom Dish / Tiffin"}
              </Text>
              <TouchableOpacity onPress={() => setDishModal(null)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              <Text style={styles.inputLabel}>Dish / Tiffin / Curry Name *</Text>
              <TextInput
                value={dishModal?.name || ""}
                onChangeText={(v) => setDishModal((p) => ({ ...p, name: v }))}
                placeholder="e.g. Ghee Podi Thatte Idli + Sambar"
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchBox}
              />

              <Text style={styles.inputLabel}>Meal Slot</Text>
              <View style={styles.pillChoiceRow}>
                {["breakfast", "lunch", "snack", "dinner"].map((slotKey) => {
                  const active = dishModal?.meal_slot === slotKey;
                  return (
                    <TouchableOpacity
                      key={slotKey}
                      onPress={() => setDishModal((p) => ({ ...p, meal_slot: slotKey }))}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceChipText, active && { color: COLORS.white }]}>
                        {slotKey.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Diet Type & Glycemic Index</Text>
              <View style={styles.pillChoiceRow}>
                {["veg", "egg", "nonveg"].map((dKey) => {
                  const active = dishModal?.diet_type === dKey;
                  return (
                    <TouchableOpacity
                      key={dKey}
                      onPress={() => setDishModal((p) => ({ ...p, diet_type: dKey }))}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceChipText, active && { color: COLORS.white }]}>
                        {dKey.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {["low", "medium", "high"].map((gKey) => {
                  const active = dishModal?.gi_level === gKey;
                  return (
                    <TouchableOpacity
                      key={gKey}
                      onPress={() => setDishModal((p) => ({ ...p, gi_level: gKey }))}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                    >
                      <Text style={[styles.choiceChipText, active && { color: COLORS.white }]}>
                        {gKey.toUpperCase()} GI
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Adult Protein (g)</Text>
                  <TextInput
                    value={dishModal?.protein_g || ""}
                    onChangeText={(v) => setDishModal((p) => ({ ...p, protein_g: v }))}
                    keyboardType="numeric"
                    style={styles.searchBox}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    value={dishModal?.carbs_g || ""}
                    onChangeText={(v) => setDishModal((p) => ({ ...p, carbs_g: v }))}
                    keyboardType="numeric"
                    style={styles.searchBox}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Calories</Text>
                  <TextInput
                    value={dishModal?.calories || ""}
                    onChangeText={(v) => setDishModal((p) => ({ ...p, calories: v }))}
                    keyboardType="numeric"
                    style={styles.searchBox}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Serving Description</Text>
              <TextInput
                value={dishModal?.serving_desc || ""}
                onChangeText={(v) => setDishModal((p) => ({ ...p, serving_desc: v }))}
                placeholder="e.g. 2 dosas + 1 bowl sambar"
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchBox}
              />

              <Text style={styles.inputLabel}>Diabetic Anti-Spike Tip</Text>
              <TextInput
                value={dishModal?.diabetic_swap || ""}
                onChangeText={(v) => setDishModal((p) => ({ ...p, diabetic_swap: v }))}
                placeholder="e.g. Eat sambar/curd first to blunt glucose peak"
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchBox}
              />

              {dishError ? <Text style={styles.errorText}>{dishError}</Text> : null}

              <TouchableOpacity
                style={styles.saveDishPrimaryBtn}
                onPress={submitDishModal}
                disabled={dishSaving}
              >
                <Ionicons name="checkmark-done-circle" size={18} color={COLORS.white} />
                <Text style={styles.saveDishPrimaryText}>
                  {dishSaving
                    ? "Saving to Catalog..."
                    : dishModal?.mode === "edit"
                      ? "Update Dish & Use Today"
                      : "Save Dish & Use Today"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  content: { padding: 16, paddingBottom: 36 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  agePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 6,
  },
  ageDot: { width: 8, height: 8, borderRadius: 4 },
  agePillText: { color: COLORS.textPrimary, fontSize: 10, fontWeight: "800" },
  heroTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  heroFormula: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.skySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editChipText: { color: COLORS.sky, fontSize: 11, fontWeight: "700" },
  heroBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  splitCol: { flex: 1, gap: 8 },
  splitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  splitLabel: { color: COLORS.textSecondary, fontSize: 11, width: 76 },
  splitBarTrack: {
    flex: 1,
    height: 7,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 99,
    overflow: "hidden",
  },
  splitBarFill: {
    height: "100%",
    backgroundColor: COLORS.coral,
    borderRadius: 99,
  },
  splitVal: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    width: 30,
    textAlign: "right",
  },
  diabetesBanner: {
    marginTop: 14,
    backgroundColor: COLORS.emeraldSoft,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  diabetesBannerText: {
    flex: 1,
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  dayRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  dayChipActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  dayChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700" },
  dayChipTextActive: { color: COLORS.white },
  infantNotice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.bgSurface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.coral,
  },
  infantTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800" },
  infantDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 19 },
  mealCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealTimeTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  mealSlotTitle: { color: COLORS.coral, fontSize: 13, fontWeight: "800" },
  mealTimeText: { color: COLORS.textMuted, fontSize: 12 },
  giPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  giPillText: { fontSize: 10, fontWeight: "800" },
  foodTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: "800" },
  servingSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  macroRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  macroBadge: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  macroVal: { color: COLORS.coral, fontSize: 15, fontWeight: "800" },
  macroKey: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
  swapCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: COLORS.emeraldSoft,
    padding: 10,
    borderRadius: 12,
  },
  swapCalloutText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  recipeTip: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  swapBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.sky,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  swapBtnText: { color: COLORS.sky, fontSize: 12, fontWeight: "700" },
  eatenBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.emeraldSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  eatenBtnDone: { backgroundColor: COLORS.emerald },
  eatenBtnText: { color: COLORS.emerald, fontSize: 12, fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 11, 22, 0.8)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800" },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: 12,
  },
  altName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  altSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  altSwapNote: { color: COLORS.emerald, fontSize: 11, marginTop: 3 },
  altProtein: { color: COLORS.coral, fontSize: 16, fontWeight: "800" },
  customBtn: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgElevated,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  customBtnText: { color: COLORS.amber, fontSize: 11, fontWeight: "700" },
  modalSubCount: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  addInModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.coral,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  addInModalBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  searchBox: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.textPrimary,
    fontSize: 13,
    marginBottom: 10,
  },
  altEditIcon: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bgElevated,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 5,
  },
  pillChoiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  choiceChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgElevated,
  },
  choiceChipActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  choiceChipText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  errorText: {
    color: COLORS.rose,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  saveDishPrimaryBtn: {
    backgroundColor: COLORS.emerald,
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  saveDishPrimaryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
