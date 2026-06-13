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

// Income: money coming in. Global (not tied to a space).
export type IncomeSource =
  | "Salary"
  | "Business"
  | "Freelance"
  | "Investment"
  | "Gift"
  | "Other";

export interface Income {
  id: string;
  amount: number;
  source: IncomeSource;
  description: string;
  date: string; // ISO format
}

// Net worth: manually-tracked account balances (BPI, Maya, GCash, etc.).
export type AccountType = "bank" | "ewallet" | "cash" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string; // brand/accent color used for the account's icon circle
  balance: number;
  updatedDate: string; // ISO format
  sortOrder: number;
}
