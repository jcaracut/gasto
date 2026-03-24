import ExpenseItem from "@/components/ExpenseItem";
import { useExpenses } from "@/hooks/useExpenses";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterType = "all" | "week" | "month" | "year";

const ITEMS_PER_PAGE = 10;

export default function ExpenseListScreen() {
  const { expenses, categories, deleteExpense, refreshData } = useExpenses();
  const [filterType, setFilterType] = useState<FilterType>("month");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
      setDisplayCount(ITEMS_PER_PAGE);
    }, [refreshData]),
  );

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (filterType) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
      default:
        return expenses;
    }

    return expenses.filter((expense) => new Date(expense.date) >= startDate);
  }, [expenses, filterType]);

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
    deleteExpense(id);
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
      <View style={styles.filterContainer}>
        {(["all", "week", "month", "year"] as const).map((filter) => (
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
                    : "This Year"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
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
