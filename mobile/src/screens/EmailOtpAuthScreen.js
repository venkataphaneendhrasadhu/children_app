import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { api } from "../api/client";

export default function EmailOtpAuthScreen({ onAuthenticated }) {
  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [fullName, setFullName] = useState("Jayashhre");
  const [email, setEmail] = useState("jayashhre@familyplate.app");
  const [otp, setOtp] = useState("");
  const [devPreviewCode, setDevPreviewCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async () => {
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await api.requestEmailOtp(email.trim(), fullName.trim());
      if (res.devOtpPreview) {
        setDevPreviewCode(res.devOtpPreview);
        setOtp(res.devOtpPreview);
      }
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyEmailOtp(email.trim(), otp.trim(), fullName.trim());
      onAuthenticated(res.token, res.user);
    } catch (err) {
      setError(err.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.bgDeep, "#0F172A", "#131C38"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Decorative glow orbs */}
          <View style={styles.orbCoral} />
          <View style={styles.orbTeal} />

          {/* Brand Header */}
          <View style={styles.brandWrap}>
            <LinearGradient
              colors={[COLORS.coral, COLORS.amber]}
              style={styles.logoBadge}
            >
              <Ionicons name="nutrition" size={34} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.pillTag}>
              <Ionicons name="sparkles" size={12} color={COLORS.amber} />
              <Text style={styles.pillTagText}>
                ALL-AGE PROTEIN & DIABETES GUARD
              </Text>
            </View>
            <Text style={styles.title}>FamilyPlate</Text>
            <Text style={styles.subtitle}>
              Dynamic daily protein planner for infants, children, adults &
              seniors — with smart low-GI swaps for diabetes care.
            </Text>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            <View style={styles.stepHeader}>
              <Ionicons
                name={step === "email" ? "mail-unread-outline" : "shield-checkmark-outline"}
                size={22}
                color={COLORS.coral}
              />
              <Text style={styles.cardTitle}>
                {step === "email" ? "Sign in with Email OTP" : "Verify 6-Digit Email Code"}
              </Text>
            </View>

            {step === "email" ? (
              <>
                <Text style={styles.label}>YOUR NAME</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Jayashhre"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                  />
                </View>

                <Text style={styles.label}>EMAIL ID</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                  />
                </View>

                <Text style={styles.helperText}>
                  Passwordless & secure — we send a 6-digit one-time code straight to your email.
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleRequestOtp}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[COLORS.coral, "#F97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Send 6-Digit Email OTP</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sentBanner}>
                  Code sent to <Text style={{ color: COLORS.sky, fontWeight: "700" }}>{email}</Text>
                </Text>

                {devPreviewCode ? (
                  <View style={styles.devPreviewBox}>
                    <Ionicons name="flash" size={16} color={COLORS.emerald} />
                    <Text style={styles.devPreviewText}>
                      Instant Dev OTP Auto-Filled:{" "}
                      <Text style={{ fontWeight: "800", color: COLORS.white }}>
                        {devPreviewCode}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.label}>6-DIGIT OTP CODE</Text>
                <TextInput
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="• • • • • •"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.otpInput}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[COLORS.emerald, COLORS.teal]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Verify & Launch App</Text>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.rowBetween}>
                  <TouchableOpacity onPress={() => setStep("email")}>
                    <Text style={styles.linkText}>← Change Email ID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRequestOtp}>
                    <Text style={[styles.linkText, { color: COLORS.coral }]}>
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Feature Highlights Strip */}
          <View style={styles.featureGrid}>
            {[
              { icon: "people-outline", label: "Infant to Senior", color: COLORS.coral },
              { icon: "barbell-outline", label: "Dynamic Protein/kg", color: COLORS.emerald },
              { icon: "pulse-outline", label: "Sugar Spike Guard", color: COLORS.sky },
            ].map((item) => (
              <View key={item.label} style={styles.featureBadge}>
                <Ionicons name={item.icon} size={18} color={item.color} />
                <Text style={styles.featureLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 36,
  },
  orbCoral: {
    position: "absolute",
    top: 30,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255, 107, 74, 0.14)",
  },
  orbTeal: {
    position: "absolute",
    bottom: 60,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(20, 184, 166, 0.12)",
  },
  brandWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  pillTagText: {
    color: COLORS.amber,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  otpInput: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 14,
    height: 56,
    textAlign: "center",
    color: COLORS.sky,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 10,
    borderWidth: 1,
    borderColor: COLORS.sky,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
  },
  sentBanner: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  devPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.emeraldSoft,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  devPreviewText: {
    color: COLORS.emerald,
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: COLORS.rose,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },
  primaryBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  featureGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    gap: 8,
  },
  featureBadge: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 6,
  },
  featureLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
