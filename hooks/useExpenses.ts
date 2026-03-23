import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Budget, Category, Expense, ExpenseStatistics } from "../types/expense";

const EXPENSES_KEY = "@gasto_expenses";
const CATEGORIES_KEY = "@gasto_categories";
const BUDGETS_KEY = "@gasto_budgets";

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

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from storage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Verify AsyncStorage is available
      if (!AsyncStorage) {
        console.warn("AsyncStorage is not available, using default data");
        setCategories(DEFAULT_CATEGORIES);
        setLoading(false);
        return;
      }

      const [expensesData, categoriesData, budgetsData] = await Promise.all([
        AsyncStorage.getItem(EXPENSES_KEY),
        AsyncStorage.getItem(CATEGORIES_KEY),
        AsyncStorage.getItem(BUDGETS_KEY),
      ]);

      if (expensesData) {
        setExpenses(JSON.parse(expensesData));
      }
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add expense
  const addExpense = useCallback(
    async (expense: Omit<Expense, "id">) => {
      try {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
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
    [expenses],
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

  // Get statistics
  const getStatistics = useCallback((): ExpenseStatistics => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses.filter((exp) => {
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
  }, [expenses]);

  const getExpensesByCategory = useCallback(
    (category: string): Expense[] => {
      return expenses.filter((exp) => exp.category === category);
    },
    [expenses],
  );

  const getExpensesByDateRange = useCallback(
    (startDate: Date, endDate: Date): Expense[] => {
      return expenses.filter((exp) => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= endDate;
      });
    },
    [expenses],
  );

  return {
    expenses,
    categories,
    budgets,
    loading,
    addExpense,
    deleteExpense,
    updateExpense,
    addCategory,
    deleteCategory,
    setBudget,
    getStatistics,
    getExpensesByCategory,
    getExpensesByDateRange,
    refreshData: loadData,
  };
};
