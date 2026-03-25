import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
    Budget,
    Category,
    Expense,
    ExpenseStatistics,
    Space,
} from "../types/expense";

const EXPENSES_KEY = "@gasto_expenses";
const CATEGORIES_KEY = "@gasto_categories";
const BUDGETS_KEY = "@gasto_budgets";
const SPACES_KEY = "@gasto_spaces";
const CURRENT_SPACE_KEY = "@gasto_current_space";

// Simple ID generator that doesn't require crypto
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Food & Dining", icon: "🍔", color: "#FF6B6B" },
  { id: "2", name: "Transportation", icon: "🚗", color: "#4ECDC4" },
  { id: "3", name: "Entertainment", icon: "🎬", color: "#95E1D3" },
  { id: "4", name: "Shopping", icon: "🛍️", color: "#F38181" },
  { id: "5", name: "Utilities", icon: "⚡", color: "#AA96DA" },
  { id: "6", name: "Health", icon: "🏥", color: "#FCBAD3" },
  { id: "7", name: "Education", icon: "📚", color: "#A8D8EA" },
  { id: "8", name: "Other", icon: "📌", color: "#C7CEEA" },
];

const DEFAULT_SPACE: Space = {
  id: generateId(),
  name: "Personal",
  icon: "👤",
  color: "#FF6B6B",
  isArchived: false,
  createdDate: new Date().toISOString(),
};

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([DEFAULT_SPACE]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string>(
    DEFAULT_SPACE.id,
  );
  const [loading, setLoading] = useState(true);

  // Migration: Convert old data to space-based structure
  const migrateDataToSpaces = useCallback(async (loadedExpenses: Expense[]) => {
    try {
      const spacesExist = await AsyncStorage.getItem(SPACES_KEY);

      if (!spacesExist) {
        // First time with spaces: create Personal space and assign all expenses to it
        const personalSpace = DEFAULT_SPACE;
        const migratedExpenses = loadedExpenses.map((exp) => ({
          ...exp,
          spaceId: personalSpace.id,
        }));

        await Promise.all([
          AsyncStorage.setItem(SPACES_KEY, JSON.stringify([personalSpace])),
          AsyncStorage.setItem(CURRENT_SPACE_KEY, personalSpace.id),
          AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(migratedExpenses)),
        ]);

        return {
          spaces: [personalSpace],
          currentSpaceId: personalSpace.id,
          expenses: migratedExpenses,
        };
      }

      const spacesData = await AsyncStorage.getItem(SPACES_KEY);
      const currentSpaceData = await AsyncStorage.getItem(CURRENT_SPACE_KEY);

      return {
        spaces: spacesData ? JSON.parse(spacesData) : [DEFAULT_SPACE],
        currentSpaceId: currentSpaceData || DEFAULT_SPACE.id,
        expenses: loadedExpenses,
      };
    } catch (error) {
      console.error("Migration failed:", error);
      return {
        spaces: [DEFAULT_SPACE],
        currentSpaceId: DEFAULT_SPACE.id,
        expenses: loadedExpenses,
      };
    }
  }, []);

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Verify AsyncStorage is available
      if (!AsyncStorage) {
        console.warn("AsyncStorage is not available, using default data");
        setCategories(DEFAULT_CATEGORIES);
        setSpaces([DEFAULT_SPACE]);
        setCurrentSpaceId(DEFAULT_SPACE.id);
        setLoading(false);
        return;
      }

      const [expensesData, categoriesData, budgetsData] = await Promise.all([
        AsyncStorage.getItem(EXPENSES_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
        AsyncStorage.getItem(BUDGETS_KEY),
      ]);

      const loadedExpenses: Expense[] = expensesData
        ? JSON.parse(expensesData)
        : [];
      const {
        spaces: migratedSpaces,
        currentSpaceId: migratedSpaceId,
        expenses: migratedExpenses,
      } = await migrateDataToSpaces(loadedExpenses);

      setExpenses(migratedExpenses);
      setSpaces(migratedSpaces);
      setCurrentSpaceId(migratedSpaceId);

      if (categoriesData) {
        setCategories(JSON.parse(categoriesData));
      } else {
        await AsyncStorage.setItem(
          CATEGORIES_KEY,
          JSON.stringify(DEFAULT_CATEGORIES),
        );
      }
      if (budgetsData) {
        setBudgets(JSON.parse(budgetsData));
      }
    } catch (error) {
      console.error("Failed to load data from AsyncStorage:", error);
      // Use defaults if loading fails
      setCategories(DEFAULT_CATEGORIES);
      setSpaces([DEFAULT_SPACE]);
      setCurrentSpaceId(DEFAULT_SPACE.id);
    } finally {
      setLoading(false);
    }
  }, [migrateDataToSpaces]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add expense (auto-injects current space)
  const addExpense = useCallback(
    async (expense: Omit<Expense, "id" | "spaceId">) => {
      try {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
          spaceId: currentSpaceId,
        };
        const updatedExpenses = [newExpense, ...expenses];
        setExpenses(updatedExpenses);

        if (AsyncStorage) {
          await AsyncStorage.setItem(
            EXPENSES_KEY,
            JSON.stringify(updatedExpenses),
          );
        }
        return newExpense;
      } catch (error) {
        console.error("Failed to add expense:", error);
        throw error;
      }
    },
    [expenses, currentSpaceId],
  );

  // Delete expense
  const deleteExpense = useCallback(
    async (id: string) => {
      try {
        const updatedExpenses = expenses.filter((exp) => exp.id !== id);
        setExpenses(updatedExpenses);
        if (AsyncStorage) {
          await AsyncStorage.setItem(
            EXPENSES_KEY,
            JSON.stringify(updatedExpenses),
          );
        }
      } catch (error) {
        console.error("Failed to delete expense:", error);
        throw error;
      }
    },
    [expenses],
  );

  // Update expense
  const updateExpense = useCallback(
    async (id: string, updatedData: Partial<Expense>) => {
      try {
        const updatedExpenses = expenses.map((exp) =>
          exp.id === id ? { ...exp, ...updatedData } : exp,
        );
        setExpenses(updatedExpenses);
        if (AsyncStorage) {
          await AsyncStorage.setItem(
            EXPENSES_KEY,
            JSON.stringify(updatedExpenses),
          );
        }
      } catch (error) {
        console.error("Failed to update expense:", error);
        throw error;
      }
    },
    [expenses],
  );

  // Add category
  const addCategory = useCallback(
    async (category: Omit<Category, "id">) => {
      try {
        const newCategory: Category = {
          ...category,
          id: generateId(),
        };
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        if (AsyncStorage) {
          await AsyncStorage.setItem(
            CATEGORIES_KEY,
            JSON.stringify(updatedCategories),
          );
        }
        return newCategory;
      } catch (error) {
        console.error("Failed to add category:", error);
        throw error;
      }
    },
    [categories],
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const updatedCategories = categories.filter((cat) => cat.id !== id);
        setCategories(updatedCategories);
        if (AsyncStorage) {
          await AsyncStorage.setItem(
            CATEGORIES_KEY,
            JSON.stringify(updatedCategories),
          );
        }
      } catch (error) {
        console.error("Failed to delete category:", error);
        throw error;
      }
    },
    [categories],
  );

  // Set budget
  const setBudget = useCallback(
    async (budget: Budget) => {
      try {
        const updatedBudgets = budgets.filter(
          (b) => b.category !== budget.category,
        );
        updatedBudgets.push(budget);
        setBudgets(updatedBudgets);
        if (AsyncStorage) {
          await AsyncStorage.setItem(
            BUDGETS_KEY,
            JSON.stringify(updatedBudgets),
          );
        }
      } catch (error) {
        console.error("Failed to set budget:", error);
        throw error;
      }
    },
    [budgets],
  );

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
        const updatedSpaces = [...spaces, newSpace];
        setSpaces(updatedSpaces);

        if (AsyncStorage) {
          await AsyncStorage.setItem(SPACES_KEY, JSON.stringify(updatedSpaces));
        }
        return newSpace;
      } catch (error) {
        console.error("Failed to create space:", error);
        throw error;
      }
    },
    [spaces],
  );

  const deleteSpace = useCallback(
    async (spaceId: string) => {
      try {
        // Don't delete the Personal space (first space)
        if (spaceId === spaces[0]?.id) {
          console.warn("Cannot delete the Personal space");
          return;
        }

        // Find the Personal space to reassign expenses
        const personalSpace = spaces[0];
        if (!personalSpace) return;

        // Reassign all expenses from deleted space to Personal space
        const updatedExpenses = expenses.map((exp) =>
          exp.spaceId === spaceId ? { ...exp, spaceId: personalSpace.id } : exp,
        );

        // Remove the space
        const updatedSpaces = spaces.filter((s) => s.id !== spaceId);

        setExpenses(updatedExpenses);
        setSpaces(updatedSpaces);

        // If deleting current space, switch to Personal
        if (currentSpaceId === spaceId) {
          setCurrentSpaceId(personalSpace.id);
          if (AsyncStorage) {
            await AsyncStorage.setItem(CURRENT_SPACE_KEY, personalSpace.id);
          }
        }

        if (AsyncStorage) {
          await Promise.all([
            AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updatedExpenses)),
            AsyncStorage.setItem(SPACES_KEY, JSON.stringify(updatedSpaces)),
          ]);
        }
      } catch (error) {
        console.error("Failed to delete space:", error);
        throw error;
      }
    },
    [spaces, expenses, currentSpaceId],
  );

  const renameSpace = useCallback(
    async (spaceId: string, newName: string): Promise<void> => {
      try {
        const updatedSpaces = spaces.map((s) =>
          s.id === spaceId ? { ...s, name: newName } : s,
        );
        setSpaces(updatedSpaces);

        if (AsyncStorage) {
          await AsyncStorage.setItem(SPACES_KEY, JSON.stringify(updatedSpaces));
        }
      } catch (error) {
        console.error("Failed to rename space:", error);
        throw error;
      }
    },
    [spaces],
  );

  const archiveSpace = useCallback(
    async (spaceId: string, isArchived: boolean): Promise<void> => {
      try {
        const updatedSpaces = spaces.map((s) =>
          s.id === spaceId ? { ...s, isArchived } : s,
        );
        setSpaces(updatedSpaces);

        if (AsyncStorage) {
          await AsyncStorage.setItem(SPACES_KEY, JSON.stringify(updatedSpaces));
        }
      } catch (error) {
        console.error("Failed to archive space:", error);
        throw error;
      }
    },
    [spaces],
  );

  const switchSpace = useCallback(async (spaceId: string): Promise<void> => {
    try {
      setCurrentSpaceId(spaceId);
      if (AsyncStorage) {
        await AsyncStorage.setItem(CURRENT_SPACE_KEY, spaceId);
      }
    } catch (error) {
      console.error("Failed to switch space:", error);
      throw error;
    }
  }, []);

  const getCurrentSpace = useCallback((): Space | undefined => {
    return spaces.find((s) => s.id === currentSpaceId);
  }, [spaces, currentSpaceId]);

  // Get statistics for current space
  const getStatistics = useCallback((): ExpenseStatistics => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter to current space only
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
