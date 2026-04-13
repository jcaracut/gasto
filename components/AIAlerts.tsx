import { useAssetPrices } from "@/hooks/useAssetPrices";
import { useExpenses } from "@/hooks/useExpenses";
import { getQuickRecommendation } from "@/utils/asset-rotation";
import { getInflationTrend } from "@/utils/inflation";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Animated,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface FloatingAlertProps {
  visible?: boolean;
  onDismiss?: () => void;
}

export function FloatingAssetAlert({
  visible = true,
  onDismiss,
}: FloatingAlertProps) {
  const router = useRouter();
  const { expenses, currentSpaceId } = useExpenses();
  const { prices } = useAssetPrices();
  const [showAlert, setShowAlert] = useState(visible);
  const [alertData, setAlertData] = useState<{
    message: string;
    severity: string;
  } | null>(null);
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  // Calculate current alert
  useEffect(() => {
    if (!prices || expenses.length === 0) return;

    const spaceExpenses = expenses.filter((e) => e.spaceId === currentSpaceId);
    if (spaceExpenses.length === 0) return;

    const inflationTrend = getInflationTrend();
    const recommendation = getQuickRecommendation(
      inflationTrend.currentRate,
      prices.BTC.change,
      prices.GOLD.change,
    );

    const severity = recommendation.includes("Critical")
      ? "critical"
      : recommendation.includes("Caution")
        ? "warning"
        : recommendation.includes("Opportunity")
          ? "opportunity"
          : "info";

    setAlertData({
      message: recommendation,
      severity,
    });
  }, [expenses, currentSpaceId, prices]);

  // Animate in/out
  useEffect(() => {
    if (showAlert && alertData) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 150,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showAlert, alertData, slideAnim]);

  const handleDismiss = () => {
    setShowAlert(false);
    onDismiss?.();
  };

  if (!showAlert || !alertData) {
    return null;
  }

  const bgColor =
    alertData.severity === "critical"
      ? "#FF6B6B"
      : alertData.severity === "warning"
        ? "#FFA500"
        : alertData.severity === "opportunity"
          ? "#4CAF50"
          : "#667eea";

  return (
    <SafeAreaView style={styles.safeAreaContainer} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/(tabs)/ai-insights")}
          style={[styles.alertBox, { backgroundColor: bgColor }]}
        >
          <View style={styles.alertContent}>
            <Text style={styles.alertMessage}>{alertData.message}</Text>
            <Text style={styles.alertCTA}>Tap for details →</Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

/**
 * Floating badge component to show quick AI insights
 * Can be placed in modal or app root layout
 */
export function AIInsightsBadge() {
  const { expenses, currentSpaceId } = useExpenses();
  const { prices } = useAssetPrices();
  const router = useRouter();
  const [badgeInfo, setBadgeInfo] = useState<{
    label: string;
    value: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    if (!prices || expenses.length === 0) return;

    const spaceExpenses = expenses.filter((e) => e.spaceId === currentSpaceId);
    if (spaceExpenses.length === 0) return;

    const inflationTrend = getInflationTrend();

    // Determine which metric to highlight
    if (prices.BTC.change > 5) {
      setBadgeInfo({
        label: "Bitcoin",
        value: `+${prices.BTC.change.toFixed(1)}%`,
        color: "#4CAF50",
      });
    } else if (inflationTrend.currentRate > 4) {
      setBadgeInfo({
        label: "Inflation",
        value: `${inflationTrend.currentRate}%`,
        color: "#FF6B6B",
      });
    } else if (prices.BTC.change < -5) {
      setBadgeInfo({
        label: "Bitcoin",
        value: `${prices.BTC.change.toFixed(1)}%`,
        color: "#FFA500",
      });
    } else {
      setBadgeInfo({
        label: "Status",
        value: "Stable",
        color: "#667eea",
      });
    }
  }, [expenses, currentSpaceId, prices]);

  if (!badgeInfo) return null;

  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: badgeInfo.color }]}
      onPress={() => router.push("/(tabs)/ai-insights")}
    >
      <Text style={styles.badgeValue}>{badgeInfo.value}</Text>
      <Text style={styles.badgeLabel}>{badgeInfo.label}</Text>
    </TouchableOpacity>
  );
}

/**
 * Anomaly indicator badge (shows when unusual spending detected)
 */
export function AnomalyIndicator() {
  const { expenses, currentSpaceId } = useExpenses();
  const [hasAnomaly, setHasAnomaly] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (expenses.length === 0) return;

    const spaceExpenses = expenses.filter((e) => e.spaceId === currentSpaceId);
    if (spaceExpenses.length < 3) {
      setHasAnomaly(false);
      return;
    }

    // Simple anomaly check: if recent expense is > 2x average
    const recentAmount = spaceExpenses[spaceExpenses.length - 1]?.amount || 0;
    const average =
      spaceExpenses.reduce((sum, e) => sum + e.amount, 0) /
      spaceExpenses.length;

    setHasAnomaly(recentAmount > average * 2);
  }, [expenses, currentSpaceId]);

  if (!hasAnomaly) return null;

  return (
    <TouchableOpacity
      style={styles.anomalyBadge}
      onPress={() => router.push("/(tabs)/ai-insights")}
    >
      <Text style={styles.anomalyText}>⚠️ Unusual spending</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 1000,
  },
  alertBox: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  alertContent: {
    flex: 1,
    marginRight: 8,
  },
  alertMessage: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 4,
  },
  alertCTA: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontStyle: "italic",
  },
  dismissButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dismissText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  badgeValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  badgeLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 9,
    marginTop: 2,
  },
  anomalyBadge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  anomalyText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
