import StatCard from "@/components/StatCard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAssetPrices } from "@/hooks/useAssetPrices";
import { useExpenses } from "@/hooks/useExpenses";
import {
    calculateSpendingTrend,
    forecastMonthlySpending,
    getTopSpendingCategories,
} from "@/utils/ai-heuristics";
import {
    generateAssetRotationSuggestions,
    getQuickRecommendation,
} from "@/utils/asset-rotation";
import { getInflationTrend } from "@/utils/inflation";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function AIInsightsScreen() {
  const { expenses } = useExpenses();
  const { prices, priceHistory, syncPrices } = useAssetPrices();
  const [syncing, setSyncing] = useState(false);

  // Attempt to sync BTC and GOLD prices on mount
  useEffect(() => {
    const attemptSync = async () => {
      setSyncing(true);
      await syncPrices(["BTC", "GOLD"]);
      setSyncing(false);
    };
    attemptSync();
  }, [syncPrices]);

  // Calculate all insights
  const insights = useMemo(() => {
    if (!prices) return null;

    const inflationTrend = getInflationTrend();
    const spendingForecast = forecastMonthlySpending(expenses, true);
    const spendingTrend = calculateSpendingTrend(expenses, 3);
    const topCategories = getTopSpendingCategories(expenses, 5);

    // Extract price history for suggestions
    const btcHistory = priceHistory.BTC?.priceHistory.map((p) => p.price) || [
      prices.BTC.price,
    ];
    const goldHistory = priceHistory.GOLD?.priceHistory.map((p) => p.price) || [
      prices.GOLD.price,
    ];

    const suggestions = generateAssetRotationSuggestions(
      expenses,
      prices.BTC,
      prices.GOLD,
      { btc: btcHistory, gold: goldHistory },
    );

    const recommendation = getQuickRecommendation(
      inflationTrend.currentRate,
      prices.BTC.change,
      prices.GOLD.change,
    );

    return {
      inflationTrend,
      spendingForecast,
      spendingTrend,
      topCategories,
      suggestions,
      recommendation,
    };
  }, [expenses, prices, priceHistory]);

  if (!insights || !prices) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <ThemedView style={styles.container}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const inflationColor =
    insights.inflationTrend.currentRate > 4
      ? "#FF6B6B"
      : insights.inflationTrend.currentRate > 3
        ? "#FFA500"
        : "#4CAF50";

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container}>
        {/* Header with Refresh */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            AI Insights
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setSyncing(true);
              syncPrices().finally(() => setSyncing(false));
            }}
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            disabled={syncing}
          >
            <ThemedText style={styles.syncButtonText}>
              {syncing ? "Syncing..." : "Refresh"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Quick Recommendation */}
        <View
          style={[
            styles.card,
            { borderLeftColor: inflationColor, borderLeftWidth: 4 },
          ]}
        >
          <ThemedText type="subtitle" style={styles.cardTitle}>
            💡 Quick Recommendation
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            {insights.recommendation}
          </ThemedText>
        </View>

        {/* Inflation Dashboard */}
        <View style={styles.section}>
          <ThemedText type="subtitle">📊 Inflation Overview</ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              label="Current Inflation"
              value={`${insights.inflationTrend.currentRate}%`}
              icon="📈"
              color={inflationColor}
            />
            <StatCard
              label="Trend"
              value={insights.inflationTrend.trend.toUpperCase()}
              icon={
                insights.inflationTrend.trend === "up"
                  ? "📈"
                  : insights.inflationTrend.trend === "down"
                    ? "📉"
                    : "➡️"
              }
              color={
                insights.inflationTrend.trend === "up"
                  ? "#FF6B6B"
                  : insights.inflationTrend.trend === "down"
                    ? "#4CAF50"
                    : "#FFA500"
              }
            />
          </View>
        </View>

        {/* Asset Prices */}
        <View style={styles.section}>
          <ThemedText type="subtitle">💰 Asset Prices (Current)</ThemedText>
          <View style={styles.pricesContainer}>
            <AssetPriceCard
              symbol="BTC"
              name="Bitcoin"
              price={prices.BTC.price.toLocaleString()}
              change={prices.BTC.change}
              unit="PHP"
            />
            <AssetPriceCard
              symbol="GOLD"
              name="Gold (per gram)"
              price={prices.GOLD.price.toFixed(2)}
              change={prices.GOLD.change}
              unit="PHP"
            />
            <AssetPriceCard
              symbol="USD"
              name="US Dollar"
              price={prices.USD.price.toFixed(2)}
              change={prices.USD.change}
              unit="PHP"
            />
          </View>
          <ThemedText style={styles.dataSourceText}>
            {prices.BTC.source === "api"
              ? "✅ Live data (CoinGecko)"
              : "📦 Cached data (offline)"}
          </ThemedText>
        </View>

        {/* Spending Forecast */}
        <View style={styles.section}>
          <ThemedText type="subtitle">📅 Spending Forecast</ThemedText>
          <StatCard
            label="Next Month Est."
            value={`₱${insights.spendingForecast.predictedAmount.toLocaleString()}`}
            icon="💹"
            color={Colors.light.tint}
          />
          <ThemedText style={styles.confidenceText}>
            Confidence: {Math.round(insights.spendingForecast.confidence * 100)}
            %
          </ThemedText>
          <ThemedText style={styles.trendText}>
            Trend: {insights.spendingTrend.trend} (
            {Math.abs(insights.spendingTrend.percentChange)}%)
          </ThemedText>
        </View>

        {/* Top Spending Categories */}
        <View style={styles.section}>
          <ThemedText type="subtitle">🏆 Top Spending Categories</ThemedText>
          {insights.topCategories.map((cat, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <ThemedText style={styles.categoryName}>
                {cat.category}
              </ThemedText>
              <ThemedText style={styles.categoryAmount}>
                ₱{cat.total.toLocaleString()} ({cat.percentage}%)
              </ThemedText>
              <ThemedText
                style={[
                  styles.categoryTrend,
                  {
                    color:
                      cat.trend === "up"
                        ? "#FF6B6B"
                        : cat.trend === "down"
                          ? "#4CAF50"
                          : "#FFA500",
                  },
                ]}
              >
                {cat.trend === "up" ? "↑" : cat.trend === "down" ? "↓" : "→"}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Asset Rotation Suggestions */}
        <View style={styles.section}>
          <ThemedText type="subtitle">🔄 Portfolio Suggestions</ThemedText>
          {insights.suggestions.length > 0 ? (
            insights.suggestions.map((suggestion, idx) => (
              <RotationSuggestionCard key={idx} suggestion={suggestion} />
            ))
          ) : (
            <ThemedText style={styles.noSuggestionsText}>
              No urgent suggestions at this time. Market conditions are stable.
            </ThemedText>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText} type="default">
            💡 This is a local AI advisor. No data is sent to external servers.
            All calculations are based on your expense history and public
            inflation data.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components

interface AssetPriceCardProps {
  symbol: string;
  name: string;
  price: string;
  change: number;
  unit: string;
}

function AssetPriceCard({
  symbol,
  name,
  price,
  change,
  unit,
}: AssetPriceCardProps) {
  const changeColor =
    change > 0 ? "#4CAF50" : change < 0 ? "#FF6B6B" : "#FFA500";

  return (
    <View style={styles.priceCard}>
      <ThemedText type="defaultSemiBold">{symbol}</ThemedText>
      <ThemedText style={styles.priceName}>{name}</ThemedText>
      <ThemedText style={styles.priceValue}>{`${unit} ${price}`}</ThemedText>
      <ThemedText style={[styles.priceChange, { color: changeColor }]}>
        {change > 0 ? "+" : ""}
        {change.toFixed(2)}%
      </ThemedText>
    </View>
  );
}

interface RotationSuggestionCardProps {
  suggestion: any; // RotationSuggestion
}

function RotationSuggestionCard({ suggestion }: RotationSuggestionCardProps) {
  const bgColor =
    suggestion.type === "rebalance"
      ? "#F0FFFE"
      : suggestion.type === "opportunity"
        ? "#FFF8E1"
        : "#F3E5F5";

  return (
    <View style={[styles.suggestionCard, { backgroundColor: bgColor }]}>
      <ThemedText type="defaultSemiBold" style={styles.suggestionTitle}>
        {suggestion.title}
      </ThemedText>
      <ThemedText style={styles.suggestionDescription}>
        {suggestion.description}
      </ThemedText>

      {suggestion.suggestedAllocations && (
        <View style={styles.allocationGrid}>
          {suggestion.suggestedAllocations.map((alloc: any, idx: number) => (
            <View key={idx} style={styles.allocationItem}>
              <ThemedText style={styles.allocationSymbol}>
                {alloc.symbol}
              </ThemedText>
              <ThemedText style={styles.allocationPercent}>
                {alloc.percentage}%
              </ThemedText>
              <ThemedText style={styles.allocationReasoning} numberOfLines={2}>
                {alloc.reasoning}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <ThemedText style={styles.suggestionConfidence}>
        Confidence: {Math.round(suggestion.confidence * 100)}%
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  cardTitle: {
    marginBottom: 8,
    fontSize: 14,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  pricesContainer: {
    flexDirection: "column",
    marginTop: 8,
  },
  priceCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  priceName: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  priceChange: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  dataSourceText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 8,
    fontStyle: "italic",
  },
  confidenceText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  categoryTrend: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noSuggestionsText: {
    fontSize: 14,
    opacity: 0.6,
    padding: 12,
    textAlign: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
  },
  suggestionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  suggestionTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    opacity: 0.8,
  },
  allocationGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  allocationItem: {
    flex: 1,
    marginRight: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    padding: 8,
  },
  allocationSymbol: {
    fontSize: 11,
    fontWeight: "bold",
  },
  allocationPercent: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  allocationReasoning: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  suggestionConfidence: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: "italic",
  },
  footer: {
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.7,
  },
});
