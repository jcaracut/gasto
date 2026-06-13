import { AccountType, IncomeSource } from "../types/expense";

// Income source options shown in the add-income picker.
export const INCOME_SOURCES: { source: IncomeSource; icon: string }[] = [
  { source: "Salary", icon: "💼" },
  { source: "Business", icon: "🏪" },
  { source: "Freelance", icon: "💻" },
  { source: "Investment", icon: "📈" },
  { source: "Gift", icon: "🎁" },
  { source: "Other", icon: "📌" },
];

export const getIncomeSourceIcon = (source: string): string =>
  INCOME_SOURCES.find((s) => s.source === source)?.icon ?? "📌";

// Icon choices when creating/editing an account.
export const ACCOUNT_ICONS = ["🏦", "💳", "📱", "💵", "🐷", "💰", "🏧", "📊"];

// Account type options shown in the add-account modal.
export const ACCOUNT_TYPES: { type: AccountType; label: string }[] = [
  { type: "bank", label: "Bank" },
  { type: "ewallet", label: "E-Wallet" },
  { type: "cash", label: "Cash" },
  { type: "other", label: "Other" },
];
