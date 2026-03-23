export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO format
  paymentMethod: "cash" | "card" | "digital" | "other";
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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
