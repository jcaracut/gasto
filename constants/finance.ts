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

// Icon choices when creating/editing a custom account.
export const ACCOUNT_ICONS = ["🏦", "💳", "📱", "💵", "🐷", "💰", "🏧", "📊"];

// Neutral fallback color for custom accounts (no brand).
export const DEFAULT_ACCOUNT_COLOR = "#64748B";

// Account type options shown in the add-account modal.
export const ACCOUNT_TYPES: { type: AccountType; label: string }[] = [
  { type: "bank", label: "Bank" },
  { type: "ewallet", label: "E-Wallet" },
  { type: "cash", label: "Cash" },
  { type: "other", label: "Other" },
];

// Preset PH banks / e-wallets shown as a tappable list in the add-account
// modal. Each carries the provider's actual brand color plus a short monogram
// so accounts are instantly recognizable. `icon` is shown white on a circle
// filled with `color`.
export interface AccountProvider {
  name: string;
  type: AccountType;
  icon: string; // short monogram (or emoji) shown in the icon circle
  color: string; // brand color used as the icon circle background
}

export const ACCOUNT_PROVIDERS: AccountProvider[] = [
  { name: "BPI", type: "bank", icon: "BPI", color: "#B11116" },
  { name: "Maya", type: "ewallet", icon: "M", color: "#00C764" },
  { name: "GCash", type: "ewallet", icon: "G", color: "#0070FF" },
  { name: "GoTyme", type: "bank", icon: "GT", color: "#16284A" },
  { name: "UnionBank", type: "bank", icon: "UB", color: "#F58220" },
  { name: "Metrobank", type: "bank", icon: "MB", color: "#00529B" },
  { name: "Maribank", type: "bank", icon: "MR", color: "#F15A29" },
  { name: "RCBC", type: "bank", icon: "RCBC", color: "#1C3F94" },
];

// Looks up a preset provider by (case-insensitive) name.
export const getAccountProvider = (
  name: string,
): AccountProvider | undefined =>
  ACCOUNT_PROVIDERS.find(
    (p) => p.name.toLowerCase() === name.trim().toLowerCase(),
  );

// Picks a readable font size for the monogram based on its length so 1–4
// character labels all fit inside the icon circle.
export const getMonogramFontSize = (label: string): number => {
  const len = [...label].length;
  if (len <= 1) return 20;
  if (len === 2) return 16;
  if (len === 3) return 13;
  return 11;
};
