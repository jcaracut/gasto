import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { Account, Category, Space } from "../types/expense";

const DB_NAME = "gasto.db";

// Simple ID generator that doesn't require crypto
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Food & Dining", icon: "🍔", color: "#FF6B6B" },
  { id: "2", name: "Transportation", icon: "🚗", color: "#4ECDC4" },
  { id: "3", name: "Entertainment", icon: "🎬", color: "#95E1D3" },
  { id: "4", name: "Shopping", icon: "🛍️", color: "#F38181" },
  { id: "5", name: "Utilities", icon: "⚡", color: "#AA96DA" },
  { id: "6", name: "Health", icon: "🏥", color: "#FCBAD3" },
  { id: "7", name: "Education", icon: "📚", color: "#A8D8EA" },
  { id: "8", name: "Other", icon: "📌", color: "#C7CEEA" },
];

export const createDefaultSpace = (): Space => ({
  id: generateId(),
  name: "Personal",
  icon: "👤",
  color: "#FF6B6B",
  isArchived: false,
  createdDate: new Date().toISOString(),
});

// Seeded on first run so users have something to edit immediately. Uses each
// provider's actual brand color + monogram (see ACCOUNT_PROVIDERS).
const buildDefaultAccounts = (): Account[] => {
  const now = new Date().toISOString();
  return [
    { id: generateId(), name: "BPI", type: "bank", icon: "BPI", color: "#B11116", balance: 0, updatedDate: now, sortOrder: 0 },
    { id: generateId(), name: "Maya", type: "ewallet", icon: "M", color: "#00C764", balance: 0, updatedDate: now, sortOrder: 1 },
    { id: generateId(), name: "GCash", type: "ewallet", icon: "G", color: "#0070FF", balance: 0, updatedDate: now, sortOrder: 2 },
  ];
};

// Legacy AsyncStorage keys (read once during migration).
const LEGACY_KEYS = {
  expenses: "@gasto_expenses",
  categories: "@gasto_categories",
  budgets: "@gasto_budgets",
  spaces: "@gasto_spaces",
  currentSpace: "@gasto_current_space",
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

export const getDatabase = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

const createSchema = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      spaceId TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      "limit" REAL NOT NULL,
      period TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      isArchived INTEGER NOT NULL DEFAULT 0,
      createdDate TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      source TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#64748B',
      balance REAL NOT NULL DEFAULT 0,
      updatedDate TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);
};

// Brand colors + monograms for preset providers, used to backfill accounts
// created before the `color` column existed (kept in sync with ACCOUNT_PROVIDERS).
const PRESET_ACCOUNT_THEMES: Record<string, { icon: string; color: string }> = {
  bpi: { icon: "BPI", color: "#B11116" },
  maya: { icon: "M", color: "#00C764" },
  gcash: { icon: "G", color: "#0070FF" },
  gotyme: { icon: "GT", color: "#16284A" },
  unionbank: { icon: "UB", color: "#F58220" },
  metrobank: { icon: "MB", color: "#00529B" },
  maribank: { icon: "MR", color: "#F15A29" },
  rcbc: { icon: "RCBC", color: "#1C3F94" },
};

// Brings older account tables up to the current schema: adds the `color`
// column when missing, then upgrades any preset accounts that still carry the
// original emoji icon / placeholder color to their real brand color + monogram.
const migrateAccountSchema = async (
  db: SQLite.SQLiteDatabase,
): Promise<void> => {
  const columns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(accounts)",
  );
  const hadColor = columns.some((c) => c.name === "color");
  if (!hadColor) {
    await db.execAsync(
      "ALTER TABLE accounts ADD COLUMN color TEXT NOT NULL DEFAULT '#64748B'",
    );
    // Newly-added column means every existing account predates branding —
    // upgrade any that match a known provider by name.
    const rows = await db.getAllAsync<{ id: string; name: string }>(
      "SELECT id, name FROM accounts",
    );
    for (const row of rows) {
      const theme = PRESET_ACCOUNT_THEMES[row.name.trim().toLowerCase()];
      if (theme) {
        await db.runAsync(
          "UPDATE accounts SET icon = ?, color = ? WHERE id = ?",
          [theme.icon, theme.color, row.id],
        );
      }
    }
  }
};

export const getMeta = async (
  db: SQLite.SQLiteDatabase,
  key: string,
): Promise<string | null> => {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [key],
  );
  return row ? row.value : null;
};

export const setMeta = async (
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> => {
  await db.runAsync(
    "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
    [key, value],
  );
};

const parseJson = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

// One-time import of any legacy AsyncStorage data into SQLite, plus seeding of
// defaults. Idempotent: guarded by the `migrated` meta flag.
const migrateFromAsyncStorage = async (
  db: SQLite.SQLiteDatabase,
): Promise<void> => {
  if ((await getMeta(db, "migrated")) === "1") {
    return;
  }

  const [legacyExpenses, legacyCategories, legacyBudgets, legacySpaces] =
    await Promise.all([
      parseJson<any[]>(LEGACY_KEYS.expenses),
      parseJson<Category[]>(LEGACY_KEYS.categories),
      parseJson<any[]>(LEGACY_KEYS.budgets),
      parseJson<Space[]>(LEGACY_KEYS.spaces),
    ]);
  const legacyCurrentSpace = await AsyncStorage.getItem(LEGACY_KEYS.currentSpace);

  // Determine spaces: legacy if present, otherwise a fresh Personal space.
  const spaces: Space[] =
    legacySpaces && legacySpaces.length > 0
      ? legacySpaces
      : [createDefaultSpace()];
  const defaultSpaceId = spaces[0].id;
  const currentSpaceId =
    legacyCurrentSpace && spaces.some((s) => s.id === legacyCurrentSpace)
      ? legacyCurrentSpace
      : defaultSpaceId;

  const categories: Category[] =
    legacyCategories && legacyCategories.length > 0
      ? legacyCategories
      : DEFAULT_CATEGORIES;

  await db.withTransactionAsync(async () => {
    for (const s of spaces) {
      await db.runAsync(
        "INSERT OR REPLACE INTO spaces (id, name, icon, color, isArchived, createdDate) VALUES (?, ?, ?, ?, ?, ?)",
        [s.id, s.name, s.icon, s.color, s.isArchived ? 1 : 0, s.createdDate],
      );
    }
    for (const c of categories) {
      await db.runAsync(
        "INSERT OR REPLACE INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)",
        [c.id, c.name, c.icon, c.color],
      );
    }
    if (legacyExpenses) {
      for (const e of legacyExpenses) {
        await db.runAsync(
          "INSERT OR REPLACE INTO expenses (id, amount, category, description, date, paymentMethod, spaceId) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            e.id,
            e.amount,
            e.category,
            e.description ?? "",
            e.date,
            e.paymentMethod ?? "other",
            e.spaceId ?? defaultSpaceId,
          ],
        );
      }
    }
    if (legacyBudgets) {
      for (const b of legacyBudgets) {
        await db.runAsync(
          'INSERT OR REPLACE INTO budgets (id, category, "limit", period) VALUES (?, ?, ?, ?)',
          [b.id, b.category, b.limit, b.period],
        );
      }
    }
    for (const a of buildDefaultAccounts()) {
      await db.runAsync(
        "INSERT OR REPLACE INTO accounts (id, name, type, icon, color, balance, updatedDate, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [a.id, a.name, a.type, a.icon, a.color, a.balance, a.updatedDate, a.sortOrder],
      );
    }
    await db.runAsync(
      "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
      ["current_space_id", currentSpaceId],
    );
    await db.runAsync(
      "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
      ["migrated", "1"],
    );
  });
};

// Opens the DB, ensures schema, and runs the one-time migration. Safe to call
// repeatedly — the work happens once per app session.
export const initDatabase = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDatabase();
      await createSchema(db);
      await migrateAccountSchema(db);
      await migrateFromAsyncStorage(db);
    })();
  }
  return initPromise;
};
