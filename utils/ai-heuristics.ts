import { Expense, Prediction } from "@/types/expense";
import { forecastInflationAdjustedSpending } from "@/utils/inflation";

/**
 * Heuristic AI Module for Gasto
 * Uses statistical patterns and moving averages for predictions
 * No external ML libraries—lightweight and mobile-optimized
 */

export interface AnomalyResults {
  anomalies: {
    expenseId: string;
    amount: number;
    expectedRange: { min: number; max: number };
    zscore: number;
    severity: "low" | "medium" | "high";
  }[];
  averageExpense: number;
  standardDeviation: number;
}

/**
 * Detect anomalous (unusual) expenses using z-score method
 * Useful for identifying potential data entry errors or unusual spending
 */
export function detectAnomalies(
  expenses: Expense[],
  thresholdZScore: number = 2.5,
): AnomalyResults {
  if (expenses.length < 3) {
    return {
      anomalies: [],
      averageExpense: 0,
      standardDeviation: 0,
    };
  }

  const amounts = expenses.map((e) => e.amount);
  const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, x) => sum + Math.pow(x - average, 2), 0) /
    amounts.length;
  const standardDeviation = Math.sqrt(variance);

  const anomalies = expenses
    .map((expense) => {
      const zscore = (expense.amount - average) / (standardDeviation || 1);
      const severity: "low" | "medium" | "high" =
        Math.abs(zscore) > thresholdZScore
          ? "high"
          : Math.abs(zscore) > 1.96
            ? "medium"
            : "low";
      return {
        expenseId: expense.id,
        amount: expense.amount,
        expectedRange: {
          min: Math.max(0, average - 2 * standardDeviation),
          max: average + 2 * standardDeviation,
        },
        zscore,
        severity,
      };
    })
    .filter((a) => Math.abs(a.zscore) >= 1.96); // Keep those beyond 2 std devs

  return {
    anomalies,
    averageExpense: Math.round(average * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
  };
}

/**
 * Calculate spending trend (increase, decrease, or stable)
 */
export function calculateSpendingTrend(
  expenses: Expense[],
  monthsToAnalyze: number = 3,
): {
  trend: "increasing" | "decreasing" | "stable";
  percentChange: number;
  monthlyAverages: number[];
} {
  if (expenses.length === 0) {
    return {
      trend: "stable",
      percentChange: 0,
      monthlyAverages: [],
    };
  }
  const monthlyTotals: Record<string, number> = {};

  // Group expenses by month
  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] ?? 0) + expense.amount;
  });

  const sortedMonths = Object.keys(monthlyTotals).sort();
  const recentMonths = sortedMonths.slice(-monthsToAnalyze);
  const monthlyAverages = recentMonths.map((m) => monthlyTotals[m]);

  if (monthlyAverages.length < 2) {
    return {
      trend: "stable",
      percentChange: 0,
      monthlyAverages,
    };
  }

  const firstMonth = monthlyAverages[0];
  const lastMonth = monthlyAverages[monthlyAverages.length - 1];
  const percentChange = ((lastMonth - firstMonth) / firstMonth) * 100;

  return {
    trend:
      percentChange > 5
        ? "increasing"
        : percentChange < -5
          ? "decreasing"
          : "stable",
    percentChange: Math.round(percentChange * 100) / 100,
    monthlyAverages: monthlyAverages.map((m) => Math.round(m * 100) / 100),
  };
}

/**
 * Forecast next month's spending considering inflation and trends
 */
export function forecastMonthlySpending(
  expenses: Expense[],
  inflationAdjust: boolean = true,
): Prediction {
  const threMonthsAgo = new Date();
  threMonthsAgo.setMonth(threMonthsAgo.getMonth() - 3);

  const recentExpenses = expenses.filter(
    (e) => new Date(e.date) >= threMonthsAgo,
  );

  if (recentExpenses.length === 0) {
    return {
      id: `pred_${Date.now()}`,
      type: "monthly_spending",
      predictedAmount: 0,
      confidence: 0,
      reasoning: "Not enough spending data to forecast",
      timestamp: new Date().toISOString(),
      dateRange: {
        start: new Date().toISOString().slice(0, 10),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      },
    };
  }

  // Calculate average spending
  const averageMonthlySpend =
    recentExpenses.reduce((sum, e) => sum + e.amount, 0) / 3;

  // Adjust for inflation if requested
  let forecast = averageMonthlySpend;
  if (inflationAdjust) {
    forecast = forecastInflationAdjustedSpending(averageMonthlySpend, 1);
  }

  // Calculate confidence based on data consistency
  const trend = calculateSpendingTrend(
    recentExpenses.slice(0, Math.min(100, recentExpenses.length)),
    3,
  );
  const volatility =
    trend.monthlyAverages.length > 1
      ? Math.max(0.3, 1 - Math.abs(trend.percentChange) / 100)
      : 0.5;
  const confidence = Math.min(0.95, Math.max(0.3, volatility + 0.1));

  return {
    id: `pred_${Date.now()}`,
    type: "monthly_spending",
    predictedAmount: Math.round(forecast * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `Based on ${recentExpenses.length} recent expenses. Trend: ${trend.trend} (${Math.abs(trend.percentChange)}% change)${inflationAdjust ? ". Adjusted for inflation." : ""}`,
    timestamp: new Date().toISOString(),
    dateRange: {
      start: new Date().toISOString().slice(0, 10),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    },
  };
}

/**
 * Forecast spending by category
 */
export function forecastCategorySpending(
  expenses: Expense[],
  category: string,
): Prediction | null {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const categoryExpenses = expenses.filter(
    (e) => e.category === category && new Date(e.date) >= threeMonthsAgo,
  );

  if (categoryExpenses.length === 0) {
    return null;
  }

  const averageSpend =
    categoryExpenses.reduce((sum, e) => sum + e.amount, 0) / 3;
  const forecast = forecastInflationAdjustedSpending(averageSpend, 1);

  return {
    id: `pred_cat_${category}_${Date.now()}`,
    type: "category_trend",
    category,
    predictedAmount: Math.round(forecast * 100) / 100,
    confidence: Math.min(0.85, 0.5 + (categoryExpenses.length / 30) * 0.35),
    reasoning: `${categoryExpenses.length} ${category} expenses in past 3 months`,
    timestamp: new Date().toISOString(),
    dateRange: {
      start: new Date().toISOString().slice(0, 10),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    },
  };
}

/**
 * Detect recurring expenses (same amount, same category, roughly same interval)
 */
export function detectRecurringExpenses(expenses: Expense[]): {
  category: string;
  amount: number;
  frequency: "daily" | "weekly" | "bi-weekly" | "monthly";
  confidence: number;
  lastOccurrence: string;
  nextExpected: string;
}[] {
  if (expenses.length < 3) return [];

  // Group by (category, amount) pair
  const groups: Record<string, Expense[]> = {};
  expenses.forEach((e) => {
    const key = `${e.category}_${Math.round(e.amount / 10) * 10}`; // Round to nearest 10
    groups[key] = groups[key] || [];
    groups[key].push(e);
  });

  const recurring = [];

  for (const [key, groupExpenses] of Object.entries(groups)) {
    if (groupExpenses.length < 2) continue;

    // Sort by date
    const sorted = groupExpenses.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate intervals between occurrences
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const daysBetween =
        (new Date(sorted[i].date).getTime() -
          new Date(sorted[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24);
      intervals.push(Math.round(daysBetween));
    }

    // Check if intervals are consistent
    if (intervals.length === 0) continue;

    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance =
      intervals.reduce((sum, x) => sum + Math.pow(x - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // If interval variation is low, it's likely recurring
    const consistency = Math.max(0, 1 - stdDev / avgInterval);
    if (consistency < 0.5) continue;

    let frequency: "daily" | "weekly" | "bi-weekly" | "monthly" = "monthly";
    if (avgInterval < 2) frequency = "daily";
    else if (avgInterval < 8) frequency = "weekly";
    else if (avgInterval < 16) frequency = "bi-weekly";

    const [category, amountStr] = key.split("_");
    const lastExpense = sorted[sorted.length - 1];
    const nextExpected = new Date(lastExpense.date);
    nextExpected.setDate(nextExpected.getDate() + avgInterval);

    recurring.push({
      category,
      amount:
        Math.round(
          (avgInterval === 7
            ? sorted[sorted.length - 1].amount
            : parseFloat(amountStr)) * 100,
        ) / 100,
      frequency,
      confidence: consistency,
      lastOccurrence: lastExpense.date,
      nextExpected: nextExpected.toISOString(),
    });
  }

  return recurring;
}

/**
 * Identify top spending categories with trends
 */
export function getTopSpendingCategories(
  expenses: Expense[],
  count: number = 5,
): {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
  trend: "up" | "down" | "stable";
}[] {
  if (expenses.length === 0) return [];

  const categoryTotals: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
    categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1;
  });

  const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  // Calculate trend for each category
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twoWeeksBeforeThat = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const recentTotals: Record<string, number> = {};
  const priorTotals: Record<string, number> = {};

  expenses.forEach((e) => {
    const date = new Date(e.date);
    if (date > twoWeeksAgo) {
      recentTotals[e.category] = (recentTotals[e.category] ?? 0) + e.amount;
    } else if (date > twoWeeksBeforeThat) {
      priorTotals[e.category] = (priorTotals[e.category] ?? 0) + e.amount;
    }
  });

  return Object.keys(categoryTotals)
    .sort((a, b) => (categoryTotals[b] ?? 0) - (categoryTotals[a] ?? 0))
    .slice(0, count)
    .map((category) => {
      const recent = recentTotals[category] ?? 0;
      const prior = priorTotals[category] ?? 0;
      const trend =
        recent > prior * 1.1 ? "up" : recent < prior * 0.9 ? "down" : "stable";

      return {
        category,
        total: Math.round(categoryTotals[category] * 100) / 100,
        percentage:
          Math.round((categoryTotals[category] / total) * 100 * 100) / 100,
        transactionCount: categoryCounts[category] ?? 0,
        trend,
      };
    });
}
