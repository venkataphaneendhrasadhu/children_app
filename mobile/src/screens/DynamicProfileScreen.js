import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, AVATAR_PALETTE } from "../theme/colors";
import { api } from "../api/client";

export default function DynamicProfileScreen({
  members,
  activeMember,
  onSelectMember,
  onSaveMember,
  onCreateMember,
  requiredSetup = false,
}) {
  const [editingNew, setEditingNew] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_PALETTE[0]);
  const [ageValue, setAgeValue] = useState("6");
  const [ageUnit, setAgeUnit] = useState("years"); // 'months' | 'years'
  const [weightValue, setWeightValue] = useState("20");
  const [weightUnit, setWeightUnit] = useState("kg"); // 'kg' | 'lb'
  const [sex, setSex] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [pregnant, setPregnant] = useState(false);
  const [diabetesStatus, setDiabetesStatus] = useState("none");
  const [onInsulin, setOnInsulin] = useState(false);
  const [dietPreference, setDietPreference] = useState(requiredSetup ? "" : "veg");
  const [includeVeg, setIncludeVeg] = useState(true);
  const [allergies, setAllergies] = useState("");
  const [fastingSugar, setFastingSugar] = useState("");
  const [softTexture, setSoftTexture] = useState(false);
  const [feedingType, setFeedingType] = useState("mixed");
  const [schoolHours, setSchoolHours] = useState("");
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync form with activeMember when switching
  useEffect(() => {
    if (activeMember && !editingNew) {
      setName(activeMember.name || "");
      setAvatarColor(activeMember.avatar_color || AVATAR_PALETTE[0]);
      setAgeValue(String(activeMember.age_value ?? "6"));
      setAgeUnit(activeMember.age_unit || "years");
      setWeightValue(String(activeMember.weight_value ?? "20"));
      setWeightUnit(activeMember.weight_unit || "kg");
      setSex(activeMember.sex || "male");
      setActivityLevel(activeMember.activity_level || "moderate");
      setPregnant(Boolean(activeMember.pregnant_or_lactating));
      setDiabetesStatus(activeMember.diabetes_status || "none");
      setOnInsulin(Boolean(activeMember.on_insulin));
      setDietPreference(activeMember.diet_preference || "veg");
      setIncludeVeg(activeMember.include_veg_dishes !== false);
      setAllergies((activeMember.allergies || []).join(", "));
      setFastingSugar(
        activeMember.fasting_sugar_baseline ? String(activeMember.fasting_sugar_baseline) : ""
      );
      setSoftTexture(Boolean(activeMember.prefer_soft_texture));
      setFeedingType(activeMember.feeding_type || "mixed");
      setSchoolHours(activeMember.school_hours || "");
    }
  }, [activeMember, editingNew]);

  useEffect(() => {
    if (!requiredSetup) return;
    setEditingNew(true);
    setName("");
    setAgeValue("");
    setWeightValue("");
    setDietPreference("");
  }, [requiredSetup]);

  // Live dynamic calculation preview whenever age, weight, activity, or condition changes
  useEffect(() => {
    let cancelled = false;
    api
      .previewTargets({
        age_value: Number(ageValue) || 0,
        age_unit: ageUnit,
        weight_value: Number(weightValue) || 0,
        weight_unit: weightUnit,
        sex,
        activity_level: activityLevel,
        pregnant_or_lactating: pregnant,
        diabetes_status: diabetesStatus,
      })
      .then((res) => {
        if (!cancelled) setPreview(res.nutrition);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ageValue, ageUnit, weightValue, weightUnit, sex, activityLevel, pregnant, diabetesStatus]);

  const startNewProfile = (role) => {
    setEditingNew(true);
    setFormError("");
    setName("");
    setAgeValue("");
    setWeightValue("");
    setAgeUnit("years");
    setWeightUnit("kg");
    setDiabetesStatus("none");
    setDietPreference("");
    setActivityLevel(role === "grandparent" ? "sedentary" : "moderate");
    setSoftTexture(role === "grandparent");
  };

  const handleSave = async () => {
    setFormError("");
    if (name.trim().length < 2) {
      setFormError("Name is required");
      return;
    }
    if (!ageValue || Number(ageValue) <= 0) {
      setFormError("Age is required");
      return;
    }
    if (!weightValue || Number(weightValue) <= 0) {
      setFormError("Weight is required");
      return;
    }
    if (!sex) {
      setFormError("Gender is required");
      return;
    }
    if (!dietPreference) {
      setFormError("Choose vegetarian, eggetarian, or non-vegetarian");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      avatar_color: avatarColor,
      age_value: Number(ageValue),
      age_unit: ageUnit,
      weight_value: Number(weightValue),
      weight_unit: weightUnit,
      sex,
      activity_level: activityLevel,
      pregnant_or_lactating: pregnant,
      diabetes_status: diabetesStatus,
      on_insulin: onInsulin,
      fasting_sugar_baseline: fastingSugar,
      diet_preference: dietPreference,
      include_veg_dishes: dietPreference === "nonveg" ? includeVeg : false,
      allergies,
      prefer_soft_texture: softTexture,
      feeding_type:
        (ageUnit === "months" ? Number(ageValue) / 12 : Number(ageValue)) < 1
          ? feedingType
          : null,
      school_hours: schoolHours,
    };

    try {
      if (editingNew) {
        await onCreateMember(payload);
        setEditingNew(false);
      } else if (activeMember) {
        await onSaveMember(activeMember.id, payload);
      }
    } catch (err) {
      setFormError(err.message || "Could not save this profile");
    } finally {
      setSaving(false);
    }
  };

  const ageYears =
    ageUnit === "months" ? (Number(ageValue) || 0) / 12 : Number(ageValue) || 0;
  const showActivity = ageYears >= 13;
  const showPregnancy = sex === "female" && ageYears >= 15 && ageYears <= 50;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {requiredSetup ? (
        <View style={styles.requiredBanner}>
          <Text style={styles.requiredTitle}>Add a family member</Text>
          <Text style={styles.requiredText}>
            Name, age, weight, gender, and diet are required. Vegetarian plans use only vegetarian food. Non-vegetarian plans can mix both.
          </Text>
        </View>
      ) : null}
      {requiredSetup ? null : (
      <>
      <Text style={styles.sectionHeader}>FAMILY PROFILES (TAP TO SWITCH)</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
      >
        {members.map((m) => {
          const selected = !editingNew && activeMember?.id === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => {
                setEditingNew(false);
                onSelectMember(m);
              }}
              style={[
                styles.memberChip,
                selected && { borderColor: m.avatar_color || COLORS.coral, backgroundColor: COLORS.bgElevated },
              ]}
            >
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: m.avatar_color || COLORS.coral },
                ]}
              >
                <Text style={styles.avatarInitial}>
                  {(m.name || "U")[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.memberChipName}>{m.name}</Text>
                <Text style={styles.memberChipMeta}>
                  {m.age_value} {m.age_unit} • {m.weight_value} {m.weight_unit}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>

      <Text style={styles.sectionHeader}>ADD A CHILD, PARENT, OR GRANDPARENT</Text>
      <View style={styles.presetRow}>
        {[
          { id: "child", label: "Add child" },
          { id: "parent", label: "Add parent" },
          { id: "grandparent", label: "Add grandparent" },
        ].map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.presetBtn}
            onPress={() => startNewProfile(p.id)}
          >
            <Text style={styles.presetBtnText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.dietHint}>
        Each person keeps their own age, weight, and diet. A vegetarian member only sees vegetarian tiffins, vegetable curries, and fruit snacks.
      </Text>
      </>
      )}

      {/* Live Dynamic Calculation Card */}
      {preview && ageValue && weightValue ? (
        <LinearGradient
          colors={["#1E293B", "#0F172A"]}
          style={styles.livePreviewCard}
        >
          <View style={styles.liveTopRow}>
            <View>
              <Text style={styles.liveBadge}>
                DETECTED STAGE: {preview.ageGroup?.name?.toUpperCase()} (
                {preview.ageGroup?.range})
              </Text>
              <Text style={styles.liveProteinValue}>
                {preview.dailyProteinG} g protein / day
              </Text>
              <Text style={styles.liveSubFormula}>
                {preview.weightKg} kg × {preview.factorUsed} g/kg • Portion scale{" "}
                {preview.ageGroup?.portion}× adult
              </Text>
            </View>
            <Ionicons name="analytics" size={32} color={COLORS.coral} />
          </View>
          <Text style={styles.liveNote}>{preview.ageGroup?.note}</Text>
        </LinearGradient>
      ) : null}

      {/* Dynamic Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingNew ? "Create New Family Profile" : `Edit ${activeMember?.name || "Profile"}`}
        </Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />

        {/* Dynamic Age + Unit */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>DYNAMIC AGE</Text>
            <TextInput
              value={ageValue}
              onChangeText={setAgeValue}
              keyboardType="decimal-pad"
              placeholder="e.g. 6"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>AGE UNIT</Text>
            <View style={styles.segRow}>
              {["years", "months"].map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setAgeUnit(u)}
                  style={[styles.segBtn, ageUnit === u && styles.segBtnActive]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      ageUnit === u && styles.segBtnTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Dynamic Weight + Unit */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>DYNAMIC WEIGHT</Text>
            <TextInput
              value={weightValue}
              onChangeText={setWeightValue}
              keyboardType="decimal-pad"
              placeholder="e.g. 20"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>WEIGHT UNIT</Text>
            <View style={styles.segRow}>
              {["kg", "lb"].map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setWeightUnit(u)}
                  style={[styles.segBtn, weightUnit === u && styles.segBtnActive]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      weightUnit === u && styles.segBtnTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.label}>GENDER</Text>
        <View style={styles.segRow}>
          {["male", "female"].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setSex(g)}
              style={[styles.segBtn, sex === g && styles.segBtnActive]}
            >
              <Text style={[styles.segBtnText, sex === g && styles.segBtnTextActive]}>
                {g.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showActivity ? (
          <>
            <Text style={styles.label}>ACTIVITY LEVEL (TEEN / ADULT / SENIOR)</Text>
            <View style={styles.segRow}>
              {["sedentary", "moderate", "active"].map((act) => (
                <TouchableOpacity
                  key={act}
                  onPress={() => setActivityLevel(act)}
                  style={[
                    styles.segBtn,
                    activityLevel === act && styles.segBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      activityLevel === act && styles.segBtnTextActive,
                    ]}
                  >
                    {act}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {showPregnancy ? (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pregnant or Lactating (+15g protein)</Text>
            <Switch value={pregnant} onValueChange={setPregnant} />
          </View>
        ) : null}

        <Text style={styles.label}>DIET PREFERENCE</Text>
        <View style={styles.segRow}>
          {[
            { k: "veg", label: "Pure Veg" },
            { k: "egg", label: "Eggetarian" },
            { k: "nonveg", label: "Non-Veg" },
          ].map((d) => (
            <TouchableOpacity
              key={d.k}
              onPress={() => setDietPreference(d.k)}
              style={[
                styles.segBtn,
                dietPreference === d.k && styles.segBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.segBtnText,
                  dietPreference === d.k && styles.segBtnTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.dietHint}>
          {dietPreference === "veg"
            ? "Only vegetarian dishes will be planned and shown in Swap."
            : dietPreference === "egg"
              ? "Vegetarian dishes plus eggs. No meat or fish."
              : dietPreference === "nonveg"
                ? "Meat and fish dishes. You can also keep vegetarian dishes in the same plan."
                : "Choose one. This decides every breakfast, lunch, snack, and dinner."}
        </Text>
        {dietPreference === "nonveg" ? (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Also include vegetarian dishes</Text>
            <Switch value={includeVeg} onValueChange={setIncludeVeg} />
          </View>
        ) : null}

        <Text style={styles.label}>SUGAR / DIABETES CONDITION</Text>
        <View style={styles.diabetesGrid}>
          {[
            { k: "none", label: "No Diabetes" },
            { k: "pre", label: "Prediabetes" },
            { k: "t2", label: "Type 2 Diabetes" },
            { k: "t1", label: "Type 1 (Child/Adult)" },
          ].map((c) => {
            const active = diabetesStatus === c.k;
            return (
              <TouchableOpacity
                key={c.k}
                onPress={() => setDiabetesStatus(c.k)}
                style={[
                  styles.conditionChip,
                  active && {
                    backgroundColor: COLORS.emeraldSoft,
                    borderColor: COLORS.emerald,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.conditionChipText,
                    active && { color: COLORS.emerald, fontWeight: "800" },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {diabetesStatus !== "none" ? (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Taking Insulin Injections / Pump</Text>
              <Switch value={onInsulin} onValueChange={setOnInsulin} />
            </View>
            <Text style={styles.label}>LAST FASTING SUGAR (mg/dL, OPTIONAL)</Text>
            <TextInput
              value={fastingSugar}
              onChangeText={setFastingSugar}
              keyboardType="number-pad"
              placeholder="e.g. 110"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </>
        ) : null}

        {ageValue && ageYears < 1 ? (
          <>
            <Text style={styles.label}>INFANT FEEDING</Text>
            <View style={styles.segRow}>
              {["breast", "formula", "mixed"].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFeedingType(f)}
                  style={[styles.segBtn, feedingType === f && styles.segBtnActive]}
                >
                  <Text style={[styles.segBtnText, feedingType === f && styles.segBtnTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {ageValue && ageYears >= 4 && ageYears < 13 ? (
          <>
            <Text style={styles.label}>SCHOOL HOURS (FOR LUNCHBOX)</Text>
            <TextInput
              value={schoolHours}
              onChangeText={setSchoolHours}
              placeholder="8:30 - 15:00"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />
          </>
        ) : null}

        {ageValue && (ageYears < 3 || ageYears >= 60) ? (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Prefer soft or mashed textures</Text>
            <Switch value={softTexture} onValueChange={setSoftTexture} />
          </View>
        ) : null}

        <Text style={styles.label}>ALLERGIES (COMMA SEPARATED)</Text>
        <TextInput
          value={allergies}
          onChangeText={setAllergies}
          placeholder="Peanut, milk"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={[COLORS.coral, "#F97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
            <Text style={styles.saveBtnText}>
              {saving
                ? "Updating Plan..."
                : editingNew
                  ? "Create Profile & Generate Meal Plan"
                  : "Save Dynamic Targets & Update Meals"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderSubtle,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  memberChipName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  memberChipMeta: { color: COLORS.textMuted, fontSize: 11 },
  addChip: { borderStyle: "dashed", borderColor: COLORS.emerald },
  addChipText: { color: COLORS.emerald, fontSize: 13, fontWeight: "800" },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  presetBtnText: { color: COLORS.sky, fontSize: 11, fontWeight: "700" },
  livePreviewCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  liveTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveBadge: { color: COLORS.amber, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  liveProteinValue: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  liveSubFormula: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  liveNote: { color: COLORS.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 17 },
  formCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  formTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 8 },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  segRow: {
    flexDirection: "row",
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnActive: { backgroundColor: COLORS.coral },
  segBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700" },
  segBtnTextActive: { color: COLORS.white },
  diabetesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  conditionChip: {
    width: "48%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
  },
  conditionChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  switchLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "600" },
  saveBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  formError: { color: COLORS.rose, fontSize: 13, fontWeight: "700", marginTop: 12 },
  requiredBanner: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.coral,
  },
  requiredTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800" },
  requiredText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 18 },
  dietHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 17 },
});
