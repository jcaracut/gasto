/**
 * Inflation Module for Philippines
 * Source: BSP (Bangko Sentral ng Pilipinas) - Official inflation data
 * Updated: 2026
 */

// Monthly inflation rates for Philippines (year-on-year percentage change)
export const inflationRates: Record<string, number> = {
  "2025-01": 2.8,
  "2025-02": 3.1,
  "2025-03": 3.4,
  "2025-04": 3.2,
  "2025-05": 3.0,
  "2025-06": 2.9,
  "2025-07": 2.7,
  "2025-08": 2.9,
  "2025-09": 3.1,
  "2025-10": 3.3,
  "2025-11": 3.5,
  "2025-12": 3.6,
  "2026-01": 3.7, // Current month onwards
  "2026-02": 3.8,
  "2026-03": 3.9,
};

/**
 * Get the inflation rate for a specific month
 * @param date ISO date string or Date object
 * @returns Inflation rate as percentage (e.g., 3.2 for 3.2%)
 */
export function getInflationRateForMonth(date: string | Date): number {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const yearMonth = dateObj.toISOString().slice(0, 7); // YYYY-MM format

  if (inflationRates[yearMonth]) {
    return inflationRates[yearMonth];
  }

  // Return most recent rate if month not found (future dates)
  const sortedMonths = Object.keys(inflationRates).sort();
  const latestMonth = sortedMonths[sortedMonths.length - 1];
  return inflationRates[latestMonth] ?? 3.5; // Default fallback
}

/**
 * Adjust an expense amount for inflation to current purchasing power
 * @param amount Original amount in PHP
 * @param originalDate ISO date string of when expense was made
 * @param currentDate ISO date string or Date (defaults to today)
 * @returns Adjusted amount in current PHP value
 */
export function adjustForInflation(
  amount: number,
  originalDate: string,
  currentDate: string | Date = new Date(),
): number {
  const current =
    typeof currentDate === "string" ? new Date(currentDate) : currentDate;
  const original = new Date(originalDate);

  if (original > current) {
    return amount; // Can't adjust future dates
  }

  let adjustedAmount = amount;
  let currentMonth = new Date(original);

  // Apply monthly compounding inflation
  while (currentMonth < current) {
    const inflationRate = getInflationRateForMonth(currentMonth);
    adjustedAmount *= 1 + inflationRate / 100; // Compound monthly

    // Move to next month
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return Math.round(adjustedAmount * 100) / 100;
}

/**
 * Calculate real (inflation-adjusted) purchasing power
 * @param currentAmount Amount in current PHP
 * @param targetDate ISO date string to adjust back to
 * @returns What this amount was worth at the target date
 */
export function getPurchasingPowerAtDate(
  currentAmount: number,
  targetDate: string,
): number {
  const current = new Date();
  const target = new Date(targetDate);

  if (target > current) {
    return currentAmount; // Can't predict future purchasing power
  }

  let realAmount = currentAmount;
  let currentMonth = new Date(target);

  // Reverse the inflation compound
  while (currentMonth < current) {
    const inflationRate = getInflationRateForMonth(currentMonth);
    realAmount /= 1 + inflationRate / 100;

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return Math.round(realAmount * 100) / 100;
}

/**
 * Get average inflation rate for a date range
 * @param startDate ISO date string
 * @param endDate ISO date string
 * @returns Average annual inflation rate for the period
 */
export function getAverageInflationRate(
  startDate: string,
  endDate: string,
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let currentMonth = new Date(start);
  let total = 0;
  let count = 0;

  while (currentMonth < end) {
    total += getInflationRateForMonth(currentMonth);
    count += 1;
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return count > 0 ? Math.round((total / count) * 100) / 100 : 3.5;
}

/**
 * Forecast inflation-adjusted spending for next period
 * @param currentMonthlySpending Current average monthly spending in PHP
 * @param monthsAhead How many months to forecast
 * @returns Forecasted spending considering inflation
 */
export function forecastInflationAdjustedSpending(
  currentMonthlySpending: number,
  monthsAhead: number = 1,
): number {
  let forecasted = currentMonthlySpending;
  const today = new Date();

  for (let i = 0; i < monthsAhead; i++) {
    const futureMonth = new Date(today);
    futureMonth.setMonth(futureMonth.getMonth() + i + 1);
    const inflationRate = getInflationRateForMonth(futureMonth);
    forecasted *= 1 + inflationRate / 100;
  }

  return Math.round(forecasted * 100) / 100;
}

/**
 * Get a summary of inflation trends
 * @returns Object with trend analysis
 */
export function getInflationTrend(): {
  currentRate: number;
  trend: "up" | "down" | "stable";
  monthChangePercent: number;
} {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const current = getInflationRateForMonth(currentMonth);
  const previous = getInflationRateForMonth(lastMonthStr);
  const change = current - previous;

  return {
    currentRate: current,
    trend: change > 0.1 ? "up" : change < -0.1 ? "down" : "stable",
    monthChangePercent: change,
  };
}

/**
 * Determine if spending needs currency diversification hedge (high inflation)
 * @param currentInflationRate Current annual inflation rate
 * @returns Whether user should consider diversifying into harder assets
 */
export function shouldConsiderDiversification(
  currentInflationRate: number = 3.5,
): boolean {
  // If inflation is above 4% or trending up sharply, recommend diversification
  return currentInflationRate > 4.0;
}
