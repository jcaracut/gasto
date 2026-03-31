import ExpenseItem from "@/components/ExpenseItem";
import StatCard from "@/components/StatCard";
import { useExpenses } from "@/hooks/useExpenses";
import { formatAmount, formatCurrency } from "@/utils/currency";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterType = "all" | "week" | "month" | "year" | "specific-month";

export default function HomeScreen() {
  const { expenses, categories, currentSpaceId, getStatistics, refreshData } =
    useExpenses();
  const router = useRouter();
  const [filterType, setFilterType] = useState<FilterType>("month");

  // For specific month filter
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData]),
  );

  // Filter expenses based on time period and current space
  const filteredExpenses = useMemo(() => {
    const spaceExpenses = expenses.filter(
      (exp) => exp.spaceId === currentSpaceId,
    );

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now.getFullYear(), 11, 31); // Default to end of year

    switch (filterType) {
      case "week":
        // Get the start of this week (7 days ago)
        startDate.setDate(now.getDate() - 7);
        endDate = new Date();
        break;
      case "month":
        // Get the first day of this month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case "year":
        // Get the first day of this year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      case "specific-month":
        // Get the first day of selected month
        startDate = new Date(selectedYear, selectedMonth, 1);
        // Get the last day of selected month
        endDate = new Date(selectedYear, selectedMonth + 1, 0);
        break;
      case "all":
      default:
        return spaceExpenses;
    }

    return spaceExpenses.filter((expense) => {
      const expDate = new Date(expense.date);
      return expDate >= startDate && expDate <= endDate;
    });
  }, [expenses, currentSpaceId, filterType, selectedMonth, selectedYear]);

  // Calculate stats for filtered period
  const filteredStats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const averageByCategory: Record<string, number> = {};
    let highestAmount = 0;
    let highestCategory = "";

    filteredExpenses.forEach((exp) => {
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
      expenseCount: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  // Get 5 most recent filtered expenses
  const recentExpenses = filteredExpenses.slice(0, 5);

  const getFilterLabel = (): string => {
    switch (filterType) {
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "specific-month":
        const monthName = new Date(
          selectedYear,
          selectedMonth,
        ).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return monthName;
      case "all":
        return "All Time";
      default:
        return "This Month";
    }
  };

  const getCategoryData = (categoryName: string) => {
    return categories.find((cat) => cat.name === categoryName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>👤</Text>
          </View>
        </View>

        {/* Main Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getFilterLabel()}</Text>

          {/* Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {(["all", "week", "month", "year", "specific-month"] as const).map(
              (filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    filterType === filter && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterType(filter)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterType === filter && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter === "all"
                      ? "All Time"
                      : filter === "week"
                        ? "This Week"
                        : filter === "month"
                          ? "This Month"
                          : filter === "year"
                            ? "This Year"
                            : "Pick Month"}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>

          {/* Month/Year Picker for Specific Month Filter */}
          {filterType === "specific-month" && (
            <View style={styles.monthPickerContainer}>
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
              >
                <Text style={styles.monthNavButtonText}>← Prev</Text>
              </TouchableOpacity>

              <Text style={styles.monthDisplay}>
                {new Date(selectedYear, selectedMonth).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )}
              </Text>

              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
              >
                <Text style={styles.monthNavButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statsScroll}
          >
            <StatCard
              label="Total Spent"
              value={formatCurrency(filteredStats.totalExpenses)}
              icon="💰"
              color="#FF6B6B"
              backgroundColor="#FFF5F5"
            />
            <StatCard
              label="Transactions"
              value={filteredStats.expenseCount}
              icon="📊"
              color="#4ECDC4"
              backgroundColor="#F0FFFE"
            />
            <StatCard
              label="Top Category"
              value={formatCurrency(filteredStats.highestAmount)}
              icon={
                categories.find(
                  (cat) => cat.name === filteredStats.highestCategory,
                )?.icon || "📌"
              }
              color="#95E1D3"
              backgroundColor="#F5FFFE"
            />
          </ScrollView>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
          </View>
          <View style={styles.categoryBreakdown}>
            {Object.entries(filteredStats.averageByCategory).map(
              ([categoryName, amount]) => {
                const categoryData = getCategoryData(categoryName);
                const percentage =
                  filteredStats.totalExpenses > 0
                    ? ((amount / filteredStats.totalExpenses) * 100).toFixed(0)
                    : "0";
                return (
                  <View key={categoryName} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>
                        {categoryData?.icon} {categoryName}
                      </Text>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: categoryData?.color + "30" },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${percentage}%` as any,
                              backgroundColor: categoryData?.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.categoryAmount}>
                      ₱ {formatAmount(amount)}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            {recentExpenses.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                category={getCategoryData(expense.category)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>No expenses yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tracking your spending
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    fontSize: 20,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllLink: {
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  statsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
    minWidth: 80,
    alignItems: "center",
  },
  filterButtonActive: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999",
  },
  filterButtonTextActive: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  monthPickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E0EFFF",
  },
  monthNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  monthNavButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  monthDisplay: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  categoryBreakdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    minWidth: 70,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#999",
  },
  bottomPadding: {
    height: 60,
  },
});
