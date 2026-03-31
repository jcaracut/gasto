import ExpenseItem from "@/components/ExpenseItem";
import { useExpenses } from "@/hooks/useExpenses";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterType = "all" | "week" | "month" | "year" | "specific-month";

const ITEMS_PER_PAGE = 10;

export default function ExpenseListScreen() {
  const { expenses, categories, currentSpaceId, deleteExpense, refreshData } =
    useExpenses();
  const [filterType, setFilterType] = useState<FilterType>("month");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // For specific month filter
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
      setDisplayCount(ITEMS_PER_PAGE);
    }, [refreshData]),
  );

  const filteredExpenses = useMemo(() => {
    // Filter by current space first
    const spaceExpenses = expenses.filter(
      (exp) => exp.spaceId === currentSpaceId,
    );

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(now.getFullYear(), 11, 31);

    switch (filterType) {
      case "week":
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

  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice(0, displayCount);
  }, [filteredExpenses, displayCount]);

  const groupedExpenses = useMemo(() => {
    const grouped: Record<string, typeof paginatedExpenses> = {};

    paginatedExpenses.forEach((expense) => {
      const date = new Date(expense.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(expense);
    });

    return grouped;
  }, [paginatedExpenses]);

  const getCategoryData = (categoryName: string) => {
    return categories.find((cat) => cat.name === categoryName);
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => deleteExpense(id),
          style: "destructive",
        },
      ],
    );
  };

  const handleLoadMore = useCallback(() => {
    if (displayCount < filteredExpenses.length) {
      setDisplayCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filteredExpenses.length),
      );
    }
  }, [displayCount, filteredExpenses.length]);

  const renderSection = (date: string) => (
    <View key={date}>
      <Text style={styles.dateHeader}>{date}</Text>
      {groupedExpenses[date].map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          category={getCategoryData(expense.category)}
          onDeletePress={() => handleDeleteExpense(expense.id)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Expenses</Text>
      </View>

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
            {new Date(selectedYear, selectedMonth).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
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

      {/* Expenses List */}
      <View style={styles.content}>
        {filteredExpenses.length > 0 ? (
          <FlatList
            data={Object.keys(groupedExpenses).sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime(),
            )}
            renderItem={({ item }) => renderSection(item)}
            keyExtractor={(item) => item}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>No expenses found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting the date filter
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  filterScroll: {
    maxHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
    minWidth: 80,
    minHeight: 32,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F0F8FF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0EFFF",
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
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
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
});
