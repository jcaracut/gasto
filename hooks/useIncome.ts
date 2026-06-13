import { useCallback, useEffect, useState } from "react";
import { generateId, getDatabase, initDatabase } from "../db/database";
import { Income } from "../types/expense";

// Global income tracking (not tied to spaces).
export const useIncome = () => {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initDatabase();
      const db = await getDatabase();
      const rows = await db.getAllAsync<Income>(
        "SELECT * FROM income ORDER BY date DESC",
      );
      setIncome(rows);
    } catch (error) {
      console.error("Failed to load income from SQLite:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addIncome = useCallback(async (entry: Omit<Income, "id">) => {
    try {
      const newIncome: Income = { ...entry, id: generateId() };
      setIncome((prev) => [newIncome, ...prev]);
      const db = await getDatabase();
      await db.runAsync(
        "INSERT INTO income (id, amount, source, description, date) VALUES (?, ?, ?, ?, ?)",
        [
          newIncome.id,
          newIncome.amount,
          newIncome.source,
          newIncome.description,
          newIncome.date,
        ],
      );
      return newIncome;
    } catch (error) {
      console.error("Failed to add income:", error);
      throw error;
    }
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    try {
      setIncome((prev) => prev.filter((i) => i.id !== id));
      const db = await getDatabase();
      await db.runAsync("DELETE FROM income WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete income:", error);
      throw error;
    }
  }, []);

  const updateIncome = useCallback(
    async (id: string, updatedData: Partial<Income>) => {
      try {
        let updated: Income | undefined;
        setIncome((prev) =>
          prev.map((i) => {
            if (i.id === id) {
              updated = { ...i, ...updatedData };
              return updated;
            }
            return i;
          }),
        );
        if (!updated) return;
        const db = await getDatabase();
        await db.runAsync(
          "UPDATE income SET amount = ?, source = ?, description = ?, date = ? WHERE id = ?",
          [updated.amount, updated.source, updated.description, updated.date, id],
        );
      } catch (error) {
        console.error("Failed to update income:", error);
        throw error;
      }
    },
    [],
  );

  const getMonthlyIncome = useCallback((): number => {
    const now = new Date();
    return income
      .filter((i) => {
        const d = new Date(i.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, i) => sum + i.amount, 0);
  }, [income]);

  const getIncomeByDateRange = useCallback(
    (startDate: Date, endDate: Date): Income[] => {
      return income.filter((i) => {
        const d = new Date(i.date);
        return d >= startDate && d <= endDate;
      });
    },
    [income],
  );

  return {
    income,
    loading,
    addIncome,
    deleteIncome,
    updateIncome,
    getMonthlyIncome,
    getIncomeByDateRange,
    refreshIncome: loadData,
  };
};
