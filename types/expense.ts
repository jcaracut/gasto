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
