import {
    AssetAllocation,
    AssetPrice,
    Expense,
    RotationSuggestion,
} from "@/types/expense";
import { forecastMonthlySpending } from "@/utils/ai-heuristics";
import { getInflationTrend } from "@/utils/inflation";

/**
 * Asset Rotation & Portfolio Suggestions Engine
 * Generates recommendations based on inflation, spending patterns, and asset prices
 */

/**
 * Generate portfolio allocation suggestions
 * Returns recommended split: [% Peso, % Gold, % Bitcoin]
 */
function generatePortfolioAllocation(
  inflationRate: number,
  btcTrend: number,
  goldTrend: number,
): { peso: number; gold: number; btc: number; reasoning: string } {
  // Base allocation (conservative): 70% Peso, 20% Gold, 10% Bitcoin
  let peso = 70;
  let gold = 20;
  let btc = 10;

  const inflationTrend = getInflationTrend();

  // If inflation is rising sharply, increase hedge assets
  if (inflationRate > 4 && inflationTrend.trend === "up") {
    peso -= 10;
    gold += 7;
    btc += 3;
  }

  // If Bitcoin is trending up, slightly increase allocation
  if (btcTrend > 5) {
    btc = Math.min(20, btc + 5);
    peso -= 5;
  }

  // If Gold is trending up, increase allocation
  if (goldTrend > 3) {
    gold = Math.min(35, gold + 5);
    peso -= 5;
  }

  // If Bitcoin is crashing, reduce exposure
  if (btcTrend < -10) {
    btc = Math.max(5, btc - 5);
    peso += 5;
  }

  // Ensure percentages sum to 100
  const total = peso + gold + btc;
  peso = Math.round((peso / total) * 100);
  gold = Math.round((gold / total) * 100);
  btc = 100 - peso - gold;

  let reasoning = "Standard allocation";
  if (inflationRate > 4) {
    reasoning = `Inflation at ${inflationRate}% - increased hedge assets (Gold/BTC)`;
  }
  if (btcTrend > 5) {
    reasoning += ` | Bitcoin rallying (+${btcTrend}%)`;
  }
  if (goldTrend > 3) {
    reasoning += ` | Gold strengthening (+${goldTrend}%)`;
  }

  return { peso, gold, btc, reasoning };
}

/**
 * Calculate suggested amounts for each asset based on monthly spending
 */
function allocateUnitsBySpending(
  monthlySpending: number,
  allocation: { peso: number; gold: number; btc: number },
  btcPrice: AssetPrice,
  goldPrice: AssetPrice,
): AssetAllocation[] {
  const pesoDollarAmount = (monthlySpending * allocation.peso) / 100;
  const goldAmount = (monthlySpending * allocation.gold) / 100; // PHP to grams
  const btcAmount = (monthlySpending * allocation.btc) / 100; // PHP to BTC

  return [
    {
      symbol: "PHP",
      percentage: allocation.peso,
      suggestedAmount: Math.round(pesoDollarAmount * 100) / 100,
      reasoning: "Daily transactions & emergency buffer",
    },
    {
      symbol: "GOLD",
      percentage: allocation.gold,
      suggestedAmount: Math.round((goldAmount / goldPrice.price) * 1000) / 1000, // Convert to grams
      reasoning: `Inflation hedge (~${goldPrice.price}/gram). Stabilize purchasing power.`,
    },
    {
      symbol: "BTC",
      percentage: allocation.btc,
      suggestedAmount:
        Math.round((btcAmount / btcPrice.price) * 100000000) / 100000000, // Convert to BTC (8 decimals)
      reasoning: `Store of value. Uncorrelated to Peso. Current: ₱${btcPrice.price.toLocaleString()}`,
    },
  ];
}

/**
 * Detect buy opportunities (prices dipped significantly)
 */
function identifyBuyOpportunities(
  btcPrice: AssetPrice,
  goldPrice: AssetPrice,
  btcHistoryRange: { min: number; max: number },
  goldHistoryRange: { min: number; max: number },
): {
  opportunities: {
    asset: "BTC" | "GOLD";
    currentPrice: number;
    percentilePrice: number;
    discount: number; // %
    strength: "moderate" | "strong" | "excellent";
  }[];
} {
  const opportunities = [];

  // BTC opportunity if current price is below 80% of recent range low
  const btc80Threshold = goldHistoryRange.max * 0.8;
  if (btcPrice.price < btc80Threshold) {
    const discount = ((btc80Threshold - btcPrice.price) / btc80Threshold) * 100;
    const strength: "moderate" | "strong" | "excellent" =
      discount > 15 ? "excellent" : discount > 10 ? "strong" : "moderate";
    opportunities.push({
      asset: "BTC" as const,
      currentPrice: btcPrice.price,
      percentilePrice: btc80Threshold,
      discount: Math.round(discount * 100) / 100,
      strength,
    });
  }

  // Gold opportunity if current price is below 80% of recent range high
  const gold80Threshold = goldHistoryRange.max * 0.8;
  if (goldPrice.price < gold80Threshold) {
    const discount =
      ((gold80Threshold - goldPrice.price) / gold80Threshold) * 100;
    const strength: "moderate" | "strong" | "excellent" =
      discount > 5 ? "excellent" : discount > 2 ? "strong" : "moderate";
    opportunities.push({
      asset: "GOLD" as const,
      currentPrice: goldPrice.price,
      percentilePrice: gold80Threshold,
      discount: Math.round(discount * 100) / 100,
      strength,
    });
  }

  return { opportunities };
}

/**
 * Generate rebalancing suggestion
 * Tells user when to rotate from Peso into harder assets
 */
export function generateRebalancingSuggestion(
  monthlySpendingPeso: number,
  currentInflationRate: number,
  btcPrice: AssetPrice,
  goldPrice: AssetPrice,
): RotationSuggestion {
  const allocation = generatePortfolioAllocation(
    currentInflationRate,
    btcPrice.change,
    goldPrice.change,
  );

  const allocations = allocateUnitsBySpending(
    monthlySpendingPeso,
    allocation,
    btcPrice,
    goldPrice,
  );

  const actionable =
    currentInflationRate > 4 || btcPrice.change > 5 || goldPrice.change > 3;
  const confidence = actionable ? 0.85 : 0.65;

  return {
    id: `suggestion_rebalance_${Date.now()}`,
    type: "rebalance",
    title: actionable
      ? "⚠️ Diversify Your Assets"
      : "Consider Diversifying Holdings",
    description: `At ${currentInflationRate}% inflation, your Peso is losing purchasing power. Diversifying into Gold and Bitcoin can hedge inflation risk.`,
    suggestedAllocations: allocations,
    currentSpending: monthlySpendingPeso,
    inflationRate: currentInflationRate,
    actionable,
    confidence,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate opportunity alert when prices are favorable
 */
export function generateOpportunitySuggestion(
  btcPrice: AssetPrice,
  goldPrice: AssetPrice,
  btcPriceHistory: number[],
  goldPriceHistory: number[],
): RotationSuggestion | null {
  const btcRange = {
    min: Math.min(...btcPriceHistory),
    max: Math.max(...btcPriceHistory),
  };
  const goldRange = {
    min: Math.min(...goldPriceHistory),
    max: Math.max(...goldPriceHistory),
  };

  const opportunities = identifyBuyOpportunities(
    btcPrice,
    goldPrice,
    btcRange,
    goldRange,
  );

  if (opportunities.opportunities.length === 0) {
    return null;
  }

  const opportunityText = opportunities.opportunities
    .map((o) => {
      if (o.asset === "BTC") {
        return `Bitcoin is down ${o.discount}% from 80-day high (${o.strength} buy signal)`;
      } else {
        return `Gold is down ${o.discount}% from recent levels (${o.strength} buy signal)`;
      }
    })
    .join(" | ");

  return {
    id: `suggestion_opportunity_${Date.now()}`,
    type: "opportunity",
    title: "💎 Buy Opportunity Detected",
    description: opportunityText,
    suggestedAllocations: [
      {
        symbol: "BTC",
        percentage: opportunities.opportunities.some((o) => o.asset === "BTC")
          ? 10
          : 0,
        suggestedAmount: opportunities.opportunities.some(
          (o) => o.asset === "BTC",
        )
          ? 50000 / btcPrice.price
          : 0, // ₱50k equivalent
        reasoning:
          opportunities.opportunities.find((o) => o.asset === "BTC")
            ?.strength === "excellent"
            ? "Strongly discounted"
            : "Slightly undervalued",
      },
      {
        symbol: "GOLD",
        percentage: opportunities.opportunities.some((o) => o.asset === "GOLD")
          ? 10
          : 0,
        suggestedAmount: opportunities.opportunities.some(
          (o) => o.asset === "GOLD",
        )
          ? 50000 / goldPrice.price
          : 0, // ₱50k in grams
        reasoning:
          opportunities.opportunities.find((o) => o.asset === "GOLD")
            ?.strength === "excellent"
            ? "Good buying opportunity"
            : "Fair value",
      },
    ],
    currentSpending: 0,
    inflationRate: 0,
    marketSignal: opportunityText,
    actionable: true,
    confidence: 0.75,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main function: Generate all rotation suggestions for a user
 */
export function generateAssetRotationSuggestions(
  expenses: Expense[],
  btcPrice: AssetPrice,
  goldPrice: AssetPrice,
  priceHistory?: { btc: number[]; gold: number[] },
): RotationSuggestion[] {
  // Get current spending forecast
  const spendingForecast = forecastMonthlySpending(expenses);
  const monthlySpending = spendingForecast.predictedAmount || 50000; // Default to 50k if no data

  // Get inflation metrics
  const inflationTrend = getInflationTrend();

  // Generate rebalancing suggestion
  const rebalanceSuggestion = generateRebalancingSuggestion(
    monthlySpending,
    inflationTrend.currentRate,
    btcPrice,
    goldPrice,
  );

  const suggestions: RotationSuggestion[] = [rebalanceSuggestion];

  // Generate opportunity suggestion if price history available
  if (
    priceHistory &&
    priceHistory.btc.length > 0 &&
    priceHistory.gold.length > 0
  ) {
    const opportunitySuggestion = generateOpportunitySuggestion(
      btcPrice,
      goldPrice,
      priceHistory.btc,
      priceHistory.gold,
    );
    if (opportunitySuggestion) {
      suggestions.push(opportunitySuggestion);
    }
  }

  // Only return actionable suggestions (filter noise)
  return suggestions.filter((s) => s.confidence > 0.6);
}

/**
 * Get a simple text recommendation for emergency situations
 */
export function getQuickRecommendation(
  inflationRate: number,
  btcChange: number,
  goldChange: number,
): string {
  if (inflationRate > 5) {
    return "🔴 Critical: High inflation detected. Protect your savings with Gold/BTC now.";
  }
  if (inflationRate > 4 && btcChange > 5) {
    return "🟡 Moderate: Inflation rising + Bitcoin rallying. Consider rotation.";
  }
  if (btcChange < -10) {
    return "🔵 Caution: Bitcoin crashed. May be overpriced for buying right now.";
  }
  if (goldChange > 3 && inflationRate > 3) {
    return "🟢 Opportunity: Gold rising during inflation. Small diversification step useful.";
  }
  return "📊 Stable: Market conditions normal. Standard 70/20/10 allocation recommended.";
}
