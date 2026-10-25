import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { api } from "../api/client";

export default function WeeklyGroceryScreen({ token, member }) {
  const [view, setView] = useState("week"); // 'week' | 'grocery'
  const [data, setData] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (token && member?.id) {
      api.getWeeklyPlan(token, member.id).then(setData).catch(() => {});
    }
  }, [token, member?.id]);

  useEffect(() => {
    const next = {};
    (data?.checks || []).forEach((item) => {
      next[item.item_name] = Boolean(item.checked);
    });
    setCheckedItems(next);
  }, [data]);

  const toggleItem = async (item) => {
    const next = !checkedItems[item];
    setCheckedItems((prev) => ({ ...prev, [item]: next }));
    try {
      await api.saveGroceryCheck(token, {
        member_id: member.id,
        week_start: data?.weekStart,
        item_name: item,
        checked: next,
      });
    } catch {
      setCheckedItems((prev) => ({ ...prev, [item]: !next }));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.segRow}>
        {[
          { k: "week", label: "📅 7-Day Protein Menu" },
          { k: "grocery", label: "🛒 Smart Grocery List" },
        ].map((t) => (
          <TouchableOpacity
            key={t.k}
            onPress={() => setView(t.k)}
            style={[styles.segBtn, view === t.k && styles.segBtnActive]}
          >
            <Text style={[styles.segText, view === t.k && { color: COLORS.white }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === "week" ? (
        (data?.week || []).map((dayObj) => (
          <View key={dayObj.day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{dayObj.day}</Text>
              <Text style={styles.dayTarget}>
                {dayObj.plannedProteinG}g / {dayObj.targetProteinG}g protein
              </Text>
            </View>
            {dayObj.meals.map((m) => (
              <View key={m.slot} style={styles.mealRow}>
                <Text style={styles.slotName}>{m.label}</Text>
                <Text style={styles.foodName} numberOfLines={1}>
                  {m.foodName}
                </Text>
                <Text style={styles.protVal}>{m.proteinG}g</Text>
              </View>
            ))}
          </View>
        ))
      ) : (
        (data?.groceryCategories || []).map((cat) => (
          <View key={cat.category} style={styles.dayCard}>
            <Text style={styles.catTitle}>{cat.category}</Text>
            {cat.items.map((item) => {
              const done = Boolean(checkedItems[item]);
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleItem(item)}
                  style={styles.groceryRow}
                >
                  <Ionicons
                    name={done ? "checkbox" : "square-outline"}
                    size={20}
                    color={done ? COLORS.emerald : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.groceryText,
                      done && {
                        textDecorationLine: "line-through",
                        color: COLORS.textMuted,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  content: { padding: 16, paddingBottom: 36 },
  segRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  segBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  segBtnActive: { backgroundColor: COLORS.coral, borderColor: COLORS.coral },
  segText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "800" },
  dayCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  dayName: { color: COLORS.amber, fontSize: 15, fontWeight: "900" },
  dayTarget: { color: COLORS.emerald, fontSize: 12, fontWeight: "700" },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    gap: 8,
  },
  slotName: { color: COLORS.textMuted, fontSize: 11, width: 78 },
  foodName: { flex: 1, color: COLORS.textPrimary, fontSize: 13, fontWeight: "600" },
  protVal: { color: COLORS.coral, fontSize: 12, fontWeight: "800" },
  catTitle: { color: COLORS.sky, fontSize: 14, fontWeight: "800", marginBottom: 8 },
  groceryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  groceryText: { color: COLORS.textPrimary, fontSize: 14 },
});
