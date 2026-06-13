import { getDatabase, initDatabase } from "@/db/database";
import {
  Account,
  Budget,
  Category,
  Expense,
  Income,
  Space,
} from "@/types/expense";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

// Bump when the export shape changes in a backward-incompatible way.
export const EXPORT_VERSION = 1;
const APP_NAME = "Gasto";

// Raw DB row shapes (booleans stored as 0/1).
type SpaceRow = Omit<Space, "isArchived"> & { isArchived: number };

export interface GastoBackup {
  app: string;
  version: number;
  exportedAt: string;
  data: {
    expenses: Expense[];
    categories: Category[];
    budgets: Budget[];
    spaces: Space[];
    income: Income[];
    accounts: Account[];
  };
}

// Reads every table into a single serializable backup object.
const gatherBackup = async (): Promise<GastoBackup> => {
  await initDatabase();
  const db = await getDatabase();

  const [expenses, categories, budgetRows, spaceRows, income, accounts] =
    await Promise.all([
      db.getAllAsync<Expense>("SELECT * FROM expenses ORDER BY date DESC"),
      db.getAllAsync<Category>("SELECT * FROM categories"),
      db.getAllAsync<Budget>(
        'SELECT id, category, "limit" as "limit", period FROM budgets',
      ),
      db.getAllAsync<SpaceRow>("SELECT * FROM spaces"),
      db.getAllAsync<Income>("SELECT * FROM income ORDER BY date DESC"),
      db.getAllAsync<Account>("SELECT * FROM accounts ORDER BY sortOrder ASC"),
    ]);

  return {
    app: APP_NAME,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      expenses,
      categories,
      budgets: budgetRows,
      spaces: spaceRows.map((s) => ({ ...s, isArchived: !!s.isArchived })),
      income,
      accounts,
    },
  };
};

// Friendly date stamp for file names, e.g. 2026-06-14.
const dateStamp = (): string => new Date().toISOString().slice(0, 10);

const writeAndShare = async (
  fileName: string,
  contents: string,
  encoding: FileSystem.EncodingType,
  mimeType: string,
  dialogTitle: string,
): Promise<void> => {
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: undefined });
  }
};

// Exports the full backup as a JSON file and opens the share sheet.
export const exportAsJson = async (): Promise<void> => {
  const backup = await gatherBackup();
  const json = JSON.stringify(backup, null, 2);
  await writeAndShare(
    `gasto-backup-${dateStamp()}.json`,
    json,
    FileSystem.EncodingType.UTF8,
    "application/json",
    "Export Gasto data (JSON)",
  );
};

// Exports a multi-sheet .xlsx workbook (one sheet per table) and shares it.
export const exportAsExcel = async (): Promise<void> => {
  const { data } = await gatherBackup();
  const wb = XLSX.utils.book_new();

  const addSheet = <T extends object>(name: string, rows: T[]) => {
    // SheetJS needs at least one row to infer columns; fall back to a header.
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet("Expenses", data.expenses);
  addSheet("Income", data.income);
  addSheet("Accounts", data.accounts);
  addSheet("Categories", data.categories);
  addSheet("Budgets", data.budgets);
  addSheet("Spaces", data.spaces);

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  await writeAndShare(
    `gasto-export-${dateStamp()}.xlsx`,
    base64,
    FileSystem.EncodingType.Base64,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Export Gasto data (Excel)",
  );
};

// Wipes all user data tables (keeps `meta`, e.g. theme + current space). The
// next hook load reseeds defaults via the migration guard only if `migrated`
// is cleared — here we leave defaults absent so the user starts clean.
export const clearAllData = async (): Promise<void> => {
  await initDatabase();
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      "DELETE FROM expenses; DELETE FROM income; DELETE FROM budgets;",
    );
  });
};

export interface ImportSummary {
  expenses: number;
  categories: number;
  budgets: number;
  spaces: number;
  income: number;
  accounts: number;
}

const isBackup = (value: any): value is GastoBackup =>
  value &&
  typeof value === "object" &&
  value.data &&
  typeof value.data === "object" &&
  Array.isArray(value.data.expenses) &&
  Array.isArray(value.data.categories) &&
  Array.isArray(value.data.spaces);

// Lets the user pick a previously-exported JSON file, validates it, and merges
// the rows into SQLite (INSERT OR REPLACE keyed by id). Returns null if the
// user cancels the picker, or a per-table count of imported rows.
export const importFromJson = async (): Promise<ImportSummary | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "*/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isBackup(parsed)) {
    throw new Error("This file is not a Gasto backup.");
  }

  const { data } = parsed;
  await initDatabase();
  const db = await getDatabase();

  const summary: ImportSummary = {
    expenses: 0,
    categories: 0,
    budgets: 0,
    spaces: 0,
    income: 0,
    accounts: 0,
  };

  await db.withTransactionAsync(async () => {
    for (const s of data.spaces ?? []) {
      await db.runAsync(
        "INSERT OR REPLACE INTO spaces (id, name, icon, color, isArchived, createdDate) VALUES (?, ?, ?, ?, ?, ?)",
        [s.id, s.name, s.icon, s.color, s.isArchived ? 1 : 0, s.createdDate],
      );
      summary.spaces++;
    }
    for (const c of data.categories ?? []) {
      await db.runAsync(
        "INSERT OR REPLACE INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)",
        [c.id, c.name, c.icon, c.color],
      );
      summary.categories++;
    }
    for (const e of data.expenses ?? []) {
      await db.runAsync(
        "INSERT OR REPLACE INTO expenses (id, amount, category, description, date, paymentMethod, spaceId) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          e.id,
          e.amount,
          e.category,
          e.description ?? "",
          e.date,
          e.paymentMethod ?? "other",
          e.spaceId,
        ],
      );
      summary.expenses++;
    }
    for (const b of data.budgets ?? []) {
      await db.runAsync(
        'INSERT OR REPLACE INTO budgets (id, category, "limit", period) VALUES (?, ?, ?, ?)',
        [b.id, b.category, b.limit, b.period],
      );
      summary.budgets++;
    }
    for (const i of data.income ?? []) {
      await db.runAsync(
        "INSERT OR REPLACE INTO income (id, amount, source, description, date) VALUES (?, ?, ?, ?, ?)",
        [i.id, i.amount, i.source, i.description ?? "", i.date],
      );
      summary.income++;
    }
    for (const a of data.accounts ?? []) {
      await db.runAsync(
        "INSERT OR REPLACE INTO accounts (id, name, type, icon, color, balance, updatedDate, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          a.id,
          a.name,
          a.type,
          a.icon,
          a.color ?? "#64748B",
          a.balance,
          a.updatedDate ?? new Date().toISOString(),
          a.sortOrder ?? 0,
        ],
      );
      summary.accounts++;
    }
  });

  return summary;
};
