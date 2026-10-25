import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "./src/theme/colors";
import { api } from "./src/api/client";
import EmailOtpAuthScreen from "./src/screens/EmailOtpAuthScreen";
import TodayPlanScreen from "./src/screens/TodayPlanScreen";
import DynamicProfileScreen from "./src/screens/DynamicProfileScreen";
import DiabetesGuardScreen from "./src/screens/DiabetesGuardScreen";
import WeeklyGroceryScreen from "./src/screens/WeeklyGroceryScreen";

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("today"); // 'today' | 'week' | 'diabetes' | 'profiles'
  const [members, setMembers] = useState([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [activeMember, setActiveMember] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [dayOffset, setDayOffset] = useState(0);

  const loadMembers = useCallback(async (authToken) => {
    try {
      const res = await api.getMembers(authToken);
      const list = res.members || [];
      setMembers(list);
      if (list.length === 0) {
        setActiveMember(null);
        setActiveTab("profiles");
      } else {
        setActiveMember((prev) => list.find((m) => m.id === prev?.id) || list[0]);
      }
    } catch (err) {
      if (err.status === 401) {
        setToken(null);
        setUser(null);
        AsyncStorage.removeItem("familyplate_session").catch(() => {});
      }
    } finally {
      setMembersLoaded(true);
    }
  }, []);

  const loadDailyPlan = useCallback(
    async (authToken, memberId, offset = 0) => {
      if (!authToken || !memberId) return;
      try {
        const res = await api.getDailyPlan(authToken, memberId, offset);
        setDailyPlan(res);
      } catch (err) {
        console.warn("Failed to load daily plan:", err.message);
      }
    },
    []
  );

  useEffect(() => {
    AsyncStorage.getItem("familyplate_session")
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved?.token) {
          setToken(saved.token);
          setUser(saved.user || null);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (token) {
      loadMembers(token);
    }
  }, [token, loadMembers]);

  useEffect(() => {
    if (token && activeMember?.id) {
      loadDailyPlan(token, activeMember.id, dayOffset);
    }
  }, [token, activeMember?.id, dayOffset, loadDailyPlan]);

  const handleToggleEaten = async (slotKey, food, eaten) => {
    await api.toggleMealLog(token, {
      member_id: activeMember.id,
      log_date: dailyPlan?.date,
      meal_slot: slotKey,
      food_slug: food.slug,
      food_name: food.name,
      protein_g: food.scaled_protein_g,
      carbs_g: food.scaled_carbs_g,
      calories: food.scaled_calories,
      gi_level: food.gi_level,
      eaten,
    });
    loadDailyPlan(token, activeMember.id, dayOffset);
  };

  const handleSwapMeal = async (slotKey, altFood) => {
    await api.saveMealSelection(token, {
      member_id: activeMember.id,
      plan_date: dailyPlan?.date,
      meal_slot: slotKey,
      food_slug: altFood.slug,
      food_name: altFood.name,
      protein_g: altFood.scaled_protein_g,
      carbs_g: altFood.scaled_carbs_g,
      calories: altFood.scaled_calories,
      gi_level: altFood.gi_level,
    });
    loadDailyPlan(token, activeMember.id, dayOffset);
  };

  const handleSaveDish = async (dishPayload, existingSlug) => {
    const res = existingSlug
      ? await api.updateCustomDish(token, existingSlug, dishPayload)
      : await api.createCustomDish(token, dishPayload);

    if (res.food && activeMember?.id) {
      await api.saveMealSelection(token, {
        member_id: activeMember.id,
        plan_date: dailyPlan?.date,
        meal_slot: res.food.meal_slot,
        food_slug: res.food.slug,
        food_name: res.food.name,
        protein_g: res.food.protein_g,
        carbs_g: res.food.carbs_g,
        calories: res.food.calories,
        gi_level: res.food.gi_level,
      });
      await loadDailyPlan(token, activeMember.id, dayOffset);
    }
    return res.food;
  };

  const handleSaveMember = async (id, payload) => {
    const res = await api.updateMember(token, id, payload);
    await loadMembers(token);
    setActiveMember(res.member);
    setActiveTab("today");
  };

  const handleCreateMember = async (payload) => {
    const res = await api.createMember(token, payload);
    await loadMembers(token);
    setActiveMember(res.member);
    setActiveTab("today");
  };

  if (!token) {
    return (
      <View style={styles.stage}>
        <View style={styles.phone}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDeep} />
        <EmailOtpAuthScreen
          onAuthenticated={(newToken, newUser) => {
            setToken(newToken);
            setUser(newUser);
            AsyncStorage.setItem(
              "familyplate_session",
              JSON.stringify({ token: newToken, user: newUser })
            ).catch(() => {});
          }}
        />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stage}>
    <SafeAreaView style={[styles.safeArea, styles.phone]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDeep} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <View>
            <Text style={styles.appTitle}>FamilyPlate</Text>
            <Text style={styles.appUser}>{user?.email}</Text>
          </View>
        </View>

        {/* Active Family Member Pill */}
        {activeMember ? (
          <TouchableOpacity
            style={styles.memberSwitchBtn}
            onPress={() => setActiveTab("profiles")}
          >
            <View
              style={[
                styles.miniAvatar,
                { backgroundColor: activeMember.avatar_color || COLORS.coral },
              ]}
            >
              <Text style={styles.miniAvatarText}>
                {activeMember.name[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.activeMemberName}>{activeMember.name}</Text>
              <Text style={styles.activeMemberSub}>
                {activeMember.age_value} {activeMember.age_unit} •{" "}
                {activeMember.weight_value} {activeMember.weight_unit}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {membersLoaded && members.length === 0 ? (
          <DynamicProfileScreen
            members={members}
            activeMember={null}
            requiredSetup
            onSelectMember={(m) => setActiveMember(m)}
            onSaveMember={handleSaveMember}
            onCreateMember={handleCreateMember}
          />
        ) : null}
        {members.length > 0 && activeTab === "today" ? (
          <TodayPlanScreen
            member={activeMember}
            dailyPlan={dailyPlan}
            dayOffset={dayOffset}
            onChangeDayOffset={setDayOffset}
            onToggleEaten={handleToggleEaten}
            onSwapMeal={handleSwapMeal}
            onSaveDish={handleSaveDish}
            onOpenProfileEditor={() => setActiveTab("profiles")}
            onOpenDiabetesTab={() => setActiveTab("diabetes")}
          />
        ) : null}

        {members.length > 0 && activeTab === "week" ? (
          <WeeklyGroceryScreen token={token} member={activeMember} />
        ) : null}

        {members.length > 0 && activeTab === "diabetes" ? (
          <DiabetesGuardScreen token={token} member={activeMember} />
        ) : null}

        {members.length > 0 && activeTab === "profiles" ? (
          <DynamicProfileScreen
            members={members}
            activeMember={activeMember}
            onSelectMember={(m) => setActiveMember(m)}
            onSaveMember={handleSaveMember}
            onCreateMember={handleCreateMember}
          />
        ) : null}
      </View>

      {members.length === 0 ? null : (
      <View style={styles.bottomNav}>
        {[
          { key: "today", label: "Today Plan", icon: "restaurant" },
          { key: "week", label: "Week & Shop", icon: "calendar" },
          { key: "diabetes", label: "Sugar Guard", icon: "pulse" },
          { key: "profiles", label: "Age & Weight", icon: "people" },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={styles.navItem}
            >
              <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                <Ionicons
                  name={tab.icon}
                  size={19}
                  color={active ? COLORS.coral : COLORS.textMuted}
                />
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      )}
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: "#050814",
    alignItems: "center",
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.bgDeep,
  },
  safeArea: { flex: 1, backgroundColor: COLORS.bgDeep },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandDot: {
    width: 12,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.coral,
  },
  appTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: "900" },
  appUser: { color: COLORS.textMuted, fontSize: 11 },
  memberSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  activeMemberName: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "800" },
  activeMemberSub: { color: COLORS.amber, fontSize: 10, fontWeight: "600" },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: { flex: 1, alignItems: "center", gap: 3 },
  navIconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 99,
  },
  navIconWrapActive: { backgroundColor: COLORS.coralSoft },
  navLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  navLabelActive: { color: COLORS.coral },
});
