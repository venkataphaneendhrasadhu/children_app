import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { api } from "../api/client";

export default function DiabetesGuardScreen({ token, member }) {
  const [tab, setTab] = useState("eat"); // 'eat' | 'avoid' | 'log'
  const [guideData, setGuideData] = useState(null);
  const [sugarData, setSugarData] = useState({ logs: [], summary: {} });

  // Sugar log inputs
  const [readingType, setReadingType] = useState("post_meal");
  const [glucoseVal, setGlucoseVal] = useState("");
  const [mealContext, setMealContext] = useState("Lunch: Rajma + Brown Rice + Salad");
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    api.getDiabetesGuide().then(setGuideData).catch(() => {});
  }, []);

  useEffect(() => {
    if (token && member?.id) {
      api.getSugarLogs(token, member.id).then(setSugarData).catch(() => {});
    }
  }, [token, member?.id]);

  const handleSaveSugar = async () => {
    const num = Number(glucoseVal);
    setFormError("");
    if (!Number.isInteger(num) || num < 20 || num > 600) {
      setFormError("Enter a whole number from 20 to 600 mg/dL");
      return;
    }
    try {
      const res = await api.addSugarLog(token, {
        member_id: member.id,
        reading_type: readingType,
        glucose_mg_dl: num,
        meal_context: mealContext,
      });
      setFeedback(res.evaluation);
      setGlucoseVal("");
      const updated = await api.getSugarLogs(token, member.id);
      setSugarData(updated);
    } catch (err) {
      setFormError(err.message || "Could not save this reading");
    }
  };

  const guide = guideData?.guide;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Banner */}
      <LinearGradient
        colors={["#064E3B", "#0F172A", "#1E1B4B"]}
        style={styles.hero}
      >
        <View style={styles.badge}>
          <Ionicons name="pulse" size={14} color={COLORS.emerald} />
          <Text style={styles.badgeText}>GLYCEMIC SPIKE CONTROL PROTOCOL</Text>
        </View>
        <Text style={styles.heroTitle}>
          What to Eat & Avoid to Stop Sugar Spikes
        </Text>
        <Text style={styles.heroSub}>
          Designed so post-meal blood glucose stays steady without sharp spikes —
          using food sequencing, soluble fiber, and protein pairing.
        </Text>
      </LinearGradient>

      {/* Sub-navigation */}
      <View style={styles.tabRow}>
        {[
          { k: "eat", label: "✅ What to Take" },
          { k: "avoid", label: "🚫 Avoid / Limit" },
          { k: "log", label: "🩸 Sugar Log" },
        ].map((t) => (
          <TouchableOpacity
            key={t.k}
            onPress={() => setTab(t.k)}
            style={[styles.tabBtn, tab === t.k && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === t.k && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "eat" && guide ? (
        <>
          {/* Plate Method Card */}
          <View style={styles.plateCard}>
            <Text style={styles.sectionTitle}>
              The Anti-Spike Diabetes Plate Method
            </Text>
            <View style={styles.plateRow}>
              <View style={[styles.plateSlice, { borderColor: COLORS.emerald }]}>
                <Text style={[styles.platePct, { color: COLORS.emerald }]}>50%</Text>
                <Text style={styles.plateLabel}>
                  Non-starchy greens & cucumber salad (Eat 1st)
                </Text>
              </View>
              <View style={[styles.plateSlice, { borderColor: COLORS.coral }]}>
                <Text style={[styles.platePct, { color: COLORS.coral }]}>25%</Text>
                <Text style={styles.plateLabel}>
                  Protein: Dal, Paneer, Curd, Eggs, Fish (Eat 2nd)
                </Text>
              </View>
              <View style={[styles.plateSlice, { borderColor: COLORS.amber }]}>
                <Text style={[styles.platePct, { color: COLORS.amber }]}>25%</Text>
                <Text style={styles.plateLabel}>
                  Whole Millets: Ragi, Jowar, Bajra (Eat Last)
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.listHeader}>
            EAT FREELY — STEADY GLUCOSE & HIGH PROTEIN
          </Text>
          {guide.eatFreely.map((item) => (
            <View key={item.name} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.emerald} />
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.giTagGreen}>
                  <Text style={styles.giTagGreenText}>{item.gi}</Text>
                </View>
              </View>
              <Text style={styles.itemWhy}>{item.why}</Text>
            </View>
          ))}

          <Text style={styles.listHeader}>4 GOLDEN RULES TO FLATTEN SPIKES</Text>
          {guide.spikePreventionRules.map((rule) => (
            <View key={rule.step} style={styles.ruleCard}>
              <Text style={styles.ruleStep}>{rule.step}</Text>
              <Text style={styles.ruleDetail}>{rule.detail}</Text>
            </View>
          ))}
        </>
      ) : null}

      {tab === "avoid" && guide ? (
        <>
          <Text style={[styles.listHeader, { color: COLORS.rose }]}>
            STRICTLY AVOID — CAUSES RAPID SUGAR SPIKES
          </Text>
          {guide.avoidStrictly.map((item) => (
            <View
              key={item.name}
              style={[styles.itemCard, { borderColor: "rgba(244,63,94,0.3)" }]}
            >
              <View style={styles.itemHeader}>
                <Ionicons name="close-circle" size={18} color={COLORS.rose} />
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.spikeRiskText}>Spike Risk: {item.spikeRisk}</Text>
              <Text style={styles.itemWhy}>{item.why}</Text>
            </View>
          ))}

          <Text style={[styles.listHeader, { color: COLORS.amber }]}>
            LIMIT PORTION & ALWAYS PAIR WITH PROTEIN
          </Text>
          {guide.limitPortion.map((item) => (
            <View key={item.name} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Ionicons name="warning" size={18} color={COLORS.amber} />
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={[styles.giTagGreen, { backgroundColor: COLORS.amberSoft }]}>
                  <Text style={[styles.giTagGreenText, { color: COLORS.amber }]}>
                    {item.gi}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemWhy}>{item.why}</Text>
            </View>
          ))}
        </>
      ) : null}

      {tab === "log" ? (
        <>
          {/* Summary KPI Row */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>
                {sugarData.summary?.avgFasting ?? "—"} mg/dL
              </Text>
              <Text style={styles.kpiLabel}>Fasting Avg (Goal &lt;110)</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: COLORS.amber }]}>
                {sugarData.summary?.avgPostMeal ?? "—"} mg/dL
              </Text>
              <Text style={styles.kpiLabel}>2h Post-Meal Avg (Goal &lt;140)</Text>
            </View>
          </View>

          {/* Add New Glucose Reading */}
          <View style={styles.logCard}>
            <Text style={styles.sectionTitle}>
              Log Blood Sugar for {member?.name}
            </Text>
            <View style={styles.segRow}>
              {[
                { k: "fasting", label: "Fasting" },
                { k: "pre_meal", label: "Pre-Meal" },
                { k: "post_meal", label: "2h Post-Meal" },
                { k: "bedtime", label: "Bedtime" },
              ].map((rt) => (
                <TouchableOpacity
                  key={rt.k}
                  onPress={() => setReadingType(rt.k)}
                  style={[
                    styles.segBtn,
                    readingType === rt.k && styles.segBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segText,
                      readingType === rt.k && { color: COLORS.white },
                    ]}
                  >
                    {rt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>GLUCOSE READING (mg/dL)</Text>
            <TextInput
              value={glucoseVal}
              onChangeText={setGlucoseVal}
              keyboardType="number-pad"
              placeholder="e.g. 136"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>WHAT MEAL WAS EATEN?</Text>
            <TextInput
              value={mealContext}
              onChangeText={setMealContext}
              placeholder="e.g. Lunch: Palak Paneer + 2 Jowar Rotis"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            {feedback ? (
              <View
                style={[
                  styles.feedbackBox,
                  feedback.status !== "in_range" && {
                    backgroundColor: COLORS.roseSoft,
                  },
                ]}
              >
                <Text style={styles.feedbackText}>{feedback.advice}</Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={handleSaveSugar} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Reading & Analyze Spike</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.listHeader}>RECENT GLUCOSE READINGS</Text>
          {(sugarData.logs || []).map((log) => {
            const high =
              (log.reading_type === "fasting" && log.glucose_mg_dl > 120) ||
              (log.reading_type !== "fasting" && log.glucose_mg_dl > 155);
            return (
              <View key={log.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text
                    style={[
                      styles.glucoseBig,
                      { color: high ? COLORS.rose : COLORS.emerald },
                    ]}
                  >
                    {log.glucose_mg_dl} mg/dL
                  </Text>
                  <Text style={styles.itemName}>
                    {log.reading_type.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
                {log.meal_context ? (
                  <Text style={styles.itemWhy}>Meal: {log.meal_context}</Text>
                ) : null}
              </View>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  content: { padding: 16, paddingBottom: 36 },
  hero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 8,
  },
  badgeText: { color: COLORS.emerald, fontSize: 10, fontWeight: "800" },
  heroTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  heroSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tabBtnActive: { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald },
  tabText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: COLORS.white },
  plateCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  plateRow: { flexDirection: "row", gap: 8 },
  plateSlice: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  platePct: { fontSize: 18, fontWeight: "900" },
  plateLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 },
  listHeader: {
    color: COLORS.emerald,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: 6,
  },
  itemCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemName: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontWeight: "800" },
  giTagGreen: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  giTagGreenText: { color: COLORS.emerald, fontSize: 10, fontWeight: "800" },
  spikeRiskText: { color: COLORS.rose, fontSize: 11, fontWeight: "700", marginTop: 4 },
  itemWhy: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 },
  ruleCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
  },
  ruleStep: { color: COLORS.amber, fontSize: 13, fontWeight: "800" },
  ruleDetail: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  kpiVal: { color: COLORS.emerald, fontSize: 22, fontWeight: "900" },
  kpiLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  logCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  segRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bgElevated,
    alignItems: "center",
  },
  segBtnActive: { backgroundColor: COLORS.coral },
  segText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700" },
  inputLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800", marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  feedbackBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.emeraldSoft,
  },
  feedbackText: { color: COLORS.textPrimary, fontSize: 12, lineHeight: 17 },
  saveBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  glucoseBig: { fontSize: 18, fontWeight: "900" },
  formError: { color: COLORS.rose, fontSize: 12, fontWeight: "700", marginTop: 10 },
});
