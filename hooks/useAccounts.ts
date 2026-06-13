import { useCallback, useEffect, useState } from "react";
import { generateId, getDatabase, initDatabase } from "../db/database";
import { Account } from "../types/expense";

// Manually-tracked account balances (BPI, Maya, GCash, etc.) for net worth.
export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initDatabase();
      const db = await getDatabase();
      const rows = await db.getAllAsync<Account>(
        "SELECT * FROM accounts ORDER BY sortOrder ASC",
      );
      setAccounts(rows);
    } catch (error) {
      console.error("Failed to load accounts from SQLite:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addAccount = useCallback(
    async (account: Omit<Account, "id" | "updatedDate" | "sortOrder">) => {
      try {
        const newAccount: Account = {
          ...account,
          id: generateId(),
          updatedDate: new Date().toISOString(),
          sortOrder: accounts.length,
        };
        setAccounts((prev) => [...prev, newAccount]);
        const db = await getDatabase();
        await db.runAsync(
          "INSERT INTO accounts (id, name, type, icon, balance, updatedDate, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            newAccount.id,
            newAccount.name,
            newAccount.type,
            newAccount.icon,
            newAccount.balance,
            newAccount.updatedDate,
            newAccount.sortOrder,
          ],
        );
        return newAccount;
      } catch (error) {
        console.error("Failed to add account:", error);
        throw error;
      }
    },
    [accounts.length],
  );

  const updateAccount = useCallback(
    async (
      id: string,
      updatedData: Partial<Omit<Account, "id" | "updatedDate">>,
    ) => {
      try {
        let updated: Account | undefined;
        const updatedDate = new Date().toISOString();
        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id === id) {
              updated = { ...a, ...updatedData, updatedDate };
              return updated;
            }
            return a;
          }),
        );
        if (!updated) return;
        const db = await getDatabase();
        await db.runAsync(
          "UPDATE accounts SET name = ?, type = ?, icon = ?, balance = ?, updatedDate = ?, sortOrder = ? WHERE id = ?",
          [
            updated.name,
            updated.type,
            updated.icon,
            updated.balance,
            updated.updatedDate,
            updated.sortOrder,
            id,
          ],
        );
      } catch (error) {
        console.error("Failed to update account:", error);
        throw error;
      }
    },
    [],
  );

  const deleteAccount = useCallback(async (id: string) => {
    try {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      const db = await getDatabase();
      await db.runAsync("DELETE FROM accounts WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  }, []);

  const getNetWorth = useCallback((): number => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    getNetWorth,
    refreshAccounts: loadData,
  };
};
