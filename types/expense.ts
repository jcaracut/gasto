export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO format
  paymentMethod: "cash" | "card" | "digital" | "other";
  spaceId: string; // Link to the space this expense belongs to
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Space {
  id: string;
  name: string;
  icon: string;
  color: string;
  isArchived: boolean;
  createdDate: string; // ISO format
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "monthly" | "weekly" | "yearly";
}

export interface ExpenseStatistics {
  totalExpenses: number;
  averageByCategory: Record<string, number>;
  highestCategory: string;
  highestAmount: number;
  expenseCount: number;
}

// AI Features: Asset Prices
export interface AssetPrice {
  id: string; // "BTC" | "GOLD" | "USD"
  symbol: string;
  name: string; // "Bitcoin", "Gold (per gram)", "US Dollar"
  price: number; // Current price in PHP
  previousPrice: number; // Previous recorded price
  change: number; // Price change percentage
  timestamp: string; // ISO format
  source: "cache" | "api" | "estimated"; // Where the price came from
}

export interface PriceHistory {
  symbol: string;
  priceHistory: {
    date: string; // ISO format
    price: number;
  }[];
  lastFetched: string; // ISO format
}

// AI Features: Predictions & Analysis
export interface Prediction {
  id: string;
  type: "monthly_spending" | "category_trend" | "anomaly";
  category?: string; // For category-specific predictions
  predictedAmount: number;
  confidence: number; // 0-1 score
  reasoning: string; // Human-readable explanation
  timestamp: string; // ISO format
  dateRange: {
    start: string;
    end: string;
  };
}

export interface InflationAdjustment {
  originalAmount: number;
  adjustedAmount: number;
  inflationRate: number;
  dateRange: {
    from: string;
    to: string;
  };
}

// AI Features: Asset Rotation Suggestions
export interface AssetAllocation {
  symbol: string;
  percentage: number;
  suggestedAmount: number; // PHP equivalent of this percentage
  reasoning: string;
}

export interface RotationSuggestion {
  id: string;
  type: "rebalance" | "opportunity" | "inflation_hedge";
  title: string;
  description: string;
  suggestedAllocations: AssetAllocation[]; // E.g., [60% PHP, 30% Gold, 10% BTC]
  currentSpending: number; // Current monthly PHP spending
  inflationRate: number; // Current PHP inflation %
  marketSignal?: string; // E.g., "Bitcoin -5%", "Gold +3%"
  actionable: boolean; // Whether user should act on this
  confidence: number; // 0-1
  timestamp: string; // ISO format
}

// AI Features: Unified Insights
export interface AIInsight {
  id: string;
  category: "prediction" | "anomaly" | "opportunity" | "rotation";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical"; // critical = immediate action needed
  actionUrl?: string; // Which screen to navigate to
  timestamp: string; // ISO format
  dismissed: boolean;
  expiresAt?: string; // When this insight becomes stale
}
