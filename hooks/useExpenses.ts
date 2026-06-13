import { useCallback, useEffect, useState } from "react";
import {
    createDefaultSpace,
    DEFAULT_CATEGORIES,
    generateId,
    getDatabase,
    initDatabase,
    setMeta,
} from "../db/database";
import {
    Budget,
    Category,
    Expense,
    ExpenseStatistics,
    Space,
} from "../types/expense";

// Raw row shape for spaces (isArchived stored as 0/1 in SQLite).
type SpaceRow = Omit<Space, "isArchived"> & { isArchived: number };

const DEFAULT_SPACE = createDefaultSpace();

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([DEFAULT_SPACE]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string>(
    DEFAULT_SPACE.id,
  );
  const [loading, setLoading] = useState(true);

  // Load data from SQLite
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await initDatabase();
      const db = await getDatabase();

      const [expenseRows, categoryRows, budgetRows, spaceRows, currentRow] =
        await Promise.all([
          db.getAllAsync<Expense>(
            "SELECT * FROM expenses ORDER BY date DESC",
          ),
          db.getAllAsync<Category>("SELECT * FROM categories"),
          db.getAllAsync<Budget>(
            'SELECT id, category, "limit" as "limit", period FROM budgets',
          ),
          db.getAllAsync<SpaceRow>("SELECT * FROM spaces"),
          db.getFirstAsync<{ value: string }>(
            "SELECT value FROM meta WHERE key = 'current_space_id'",
          ),
        ]);

      setExpenses(expenseRows);
      setCategories(
        categoryRows.length > 0 ? categoryRows : DEFAULT_CATEGORIES,
      );
      setBudgets(budgetRows);

      const loadedSpaces: Space[] =
        spaceRows.length > 0
          ? spaceRows.map((s) => ({ ...s, isArchived: !!s.isArchived }))
          : [DEFAULT_SPACE];
      setSpaces(loadedSpaces);
      setCurrentSpaceId(currentRow?.value || loadedSpaces[0].id);
    } catch (error) {
      console.error("Failed to load data from SQLite:", error);
      setCategories(DEFAULT_CATEGORIES);
      setSpaces([DEFAULT_SPACE]);
      setCurrentSpaceId(DEFAULT_SPACE.id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add expense (auto-injects current space, or use provided spaceId)
  const addExpense = useCallback(
    async (expense: Omit<Expense, "id" | "spaceId">, spaceId?: string) => {
      try {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
          spaceId: spaceId || currentSpaceId,
        };
        setExpenses((prev) => [newExpense, ...prev]);
        const db = await getDatabase();
        await db.runAsync(
          "INSERT INTO expenses (id, amount, category, description, date, paymentMethod, spaceId) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            newExpense.id,
            newExpense.amount,
            newExpense.category,
            newExpense.description,
            newExpense.date,
            newExpense.paymentMethod,
            newExpense.spaceId,
          ],
        );
        return newExpense;
      } catch (error) {
        console.error("Failed to add expense:", error);
        throw error;
      }
    },
    [currentSpaceId],
  );

  // Delete expense
  const deleteExpense = useCallback(async (id: string) => {
    try {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      const db = await getDatabase();
      await db.runAsync("DELETE FROM expenses WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete expense:", error);
      throw error;
    }
  }, []);

  // Update expense
  const updateExpense = useCallback(
    async (id: string, updatedData: Partial<Expense>) => {
      try {
        let updated: Expense | undefined;
        setExpenses((prev) =>
          prev.map((exp) => {
            if (exp.id === id) {
              updated = { ...exp, ...updatedData };
              return updated;
            }
            return exp;
          }),
        );
        if (!updated) return;
        const db = await getDatabase();
        await db.runAsync(
          "UPDATE expenses SET amount = ?, category = ?, description = ?, date = ?, paymentMethod = ?, spaceId = ? WHERE id = ?",
          [
            updated.amount,
            updated.category,
            updated.description,
            updated.date,
            updated.paymentMethod,
            updated.spaceId,
            id,
          ],
        );
      } catch (error) {
        console.error("Failed to update expense:", error);
        throw error;
      }
    },
    [],
  );

  // Add category
  const addCategory = useCallback(async (category: Omit<Category, "id">) => {
    try {
      const newCategory: Category = { ...category, id: generateId() };
      setCategories((prev) => [...prev, newCategory]);
      const db = await getDatabase();
      await db.runAsync(
        "INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)",
        [newCategory.id, newCategory.name, newCategory.icon, newCategory.color],
      );
      return newCategory;
    } catch (error) {
      console.error("Failed to add category:", error);
      throw error;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    try {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      const db = await getDatabase();
      await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
    } catch (error) {
      console.error("Failed to delete category:", error);
      throw error;
    }
  }, []);

  // Set budget (one per category)
  const setBudget = useCallback(async (budget: Budget) => {
    try {
      setBudgets((prev) => [
        ...prev.filter((b) => b.category !== budget.category),
        budget,
      ]);
      const db = await getDatabase();
      await db.runAsync("DELETE FROM budgets WHERE category = ?", [
        budget.category,
      ]);
      await db.runAsync(
        'INSERT INTO budgets (id, category, "limit", period) VALUES (?, ?, ?, ?)',
        [budget.id, budget.category, budget.limit, budget.period],
      );
    } catch (error) {
      console.error("Failed to set budget:", error);
      throw error;
    }
  }, []);

  // Space Management Functions
  const createSpace = useCallback(
    async (
      name: string,
      icon: string = "📍",
      color: string = "#FF6B6B",
    ): Promise<Space> => {
      try {
        const newSpace: Space = {
          id: generateId(),
          name,
          icon,
          color,
          isArchived: false,
          createdDate: new Date().toISOString(),
        };
        setSpaces((prev) => [...prev, newSpace]);
        const db = await getDatabase();
        await db.runAsync(
          "INSERT INTO spaces (id, name, icon, color, isArchived, createdDate) VALUES (?, ?, ?, ?, ?, ?)",
          [newSpace.id, newSpace.name, newSpace.icon, newSpace.color, 0, newSpace.createdDate],
        );
        return newSpace;
      } catch (error) {
        console.error("Failed to create space:", error);
        throw error;
      }
    },
    [],
  );

  const deleteSpace = useCallback(
    async (spaceId: string) => {
      try {
        // Don't delete the Personal space (first space)
        const personalSpace = spaces[0];
        if (!personalSpace || spaceId === personalSpace.id) {
          console.warn("Cannot delete the Personal space");
          return;
        }

        // Reassign all expenses from deleted space to Personal space
        setExpenses((prev) =>
          prev.map((exp) =>
            exp.spaceId === spaceId
              ? { ...exp, spaceId: personalSpace.id }
              : exp,
          ),
        );
        setSpaces((prev) => prev.filter((s) => s.id !== spaceId));

        const db = await getDatabase();
        await db.runAsync(
          "UPDATE expenses SET spaceId = ? WHERE spaceId = ?",
          [personalSpace.id, spaceId],
        );
        await db.runAsync("DELETE FROM spaces WHERE id = ?", [spaceId]);

        // If deleting current space, switch to Personal
        if (currentSpaceId === spaceId) {
          setCurrentSpaceId(personalSpace.id);
          await setMeta(db, "current_space_id", personalSpace.id);
        }
      } catch (error) {
        console.error("Failed to delete space:", error);
        throw error;
      }
    },
    [spaces, currentSpaceId],
  );

  const renameSpace = useCallback(
    async (spaceId: string, newName: string): Promise<void> => {
      try {
        setSpaces((prev) =>
          prev.map((s) => (s.id === spaceId ? { ...s, name: newName } : s)),
        );
        const db = await getDatabase();
        await db.runAsync("UPDATE spaces SET name = ? WHERE id = ?", [
          newName,
          spaceId,
        ]);
      } catch (error) {
        console.error("Failed to rename space:", error);
        throw error;
      }
    },
    [],
  );

  const archiveSpace = useCallback(
    async (spaceId: string, isArchived: boolean): Promise<void> => {
      try {
        setSpaces((prev) =>
          prev.map((s) => (s.id === spaceId ? { ...s, isArchived } : s)),
        );
        const db = await getDatabase();
        await db.runAsync("UPDATE spaces SET isArchived = ? WHERE id = ?", [
          isArchived ? 1 : 0,
          spaceId,
        ]);
      } catch (error) {
        console.error("Failed to archive space:", error);
        throw error;
      }
    },
    [],
  );

  const switchSpace = useCallback(async (spaceId: string): Promise<void> => {
    try {
      setCurrentSpaceId(spaceId);
      const db = await getDatabase();
      await setMeta(db, "current_space_id", spaceId);
    } catch (error) {
      console.error("Failed to switch space:", error);
      throw error;
    }
  }, []);

  const getCurrentSpace = useCallback((): Space | undefined => {
    return spaces.find((s) => s.id === currentSpaceId);
  }, [spaces, currentSpaceId]);

  // Get statistics for current space (current month)
  const getStatistics = useCallback((): ExpenseStatistics => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spaceExpenses = expenses.filter(
      (exp) => exp.spaceId === currentSpaceId,
    );

    const monthExpenses = spaceExpenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return (
        expDate.getMonth() === currentMonth &&
        expDate.getFullYear() === currentYear
      );
    });

    const totalExpenses = monthExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const averageByCategory: Record<string, number> = {};
    let highestAmount = 0;
    let highestCategory = "";

    monthExpenses.forEach((exp) => {
      if (!averageByCategory[exp.category]) {
        averageByCategory[exp.category] = 0;
      }
      averageByCategory[exp.category] += exp.amount;
      if (averageByCategory[exp.category] > highestAmount) {
        highestAmount = averageByCategory[exp.category];
        highestCategory = exp.category;
      }
    });

    return {
      totalExpenses,
      averageByCategory,
      highestCategory,
      highestAmount,
      expenseCount: monthExpenses.length,
    };
  }, [expenses, currentSpaceId]);

  const getExpensesByCategory = useCallback(
    (category: string): Expense[] => {
      return expenses.filter(
        (exp) => exp.category === category && exp.spaceId === currentSpaceId,
      );
    },
    [expenses, currentSpaceId],
  );

  const getExpensesByDateRange = useCallback(
    (startDate: Date, endDate: Date): Expense[] => {
      return expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return (
          expDate >= startDate &&
          expDate <= endDate &&
          exp.spaceId === currentSpaceId
        );
      });
    },
    [expenses, currentSpaceId],
  );

  return {
    expenses,
    categories,
    budgets,
    spaces,
    currentSpaceId,
    loading,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    deleteCategory,
    setBudget,
    createSpace,
    deleteSpace,
    renameSpace,
    archiveSpace,
    switchSpace,
    getCurrentSpace,
    getStatistics,
    getExpensesByCategory,
    getExpensesByDateRange,
    refreshData: loadData,
  };
};
