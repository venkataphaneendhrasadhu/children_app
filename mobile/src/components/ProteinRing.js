import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { COLORS } from "../theme/colors";

export default function ProteinRing({
  eaten = 0,
  target = 40,
  size = 128,
  strokeWidth = 12,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, target > 0 ? eaten / target : 0);
  const strokeDashoffset = circumference * (1 - ratio);
  const pct = Math.round(ratio * 100);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.coral} />
            <Stop offset="55%" stopColor={COLORS.amber} />
            <Stop offset="100%" stopColor={COLORS.emerald} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148, 163, 184, 0.16)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={styles.valueText}>{eaten}g</Text>
        <Text style={styles.subText}>of {target}g</Text>
        <View style={styles.pctBadge}>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  pctBadge: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: COLORS.emeraldSoft,
  },
  pctText: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: "700",
  },
});
