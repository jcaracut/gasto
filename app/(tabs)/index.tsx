import ExpenseItem from "@/components/ExpenseItem";
import StatCard from "@/components/StatCard";
import { useExpenses } from "@/hooks/useExpenses";
import { formatAmount, formatCurrency } from "@/utils/currency";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { expenses, categories, currentSpaceId, getStatistics, refreshData } =
    useExpenses();
  const router = useRouter();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData]),
  );

  const stats = getStatistics();
  // Filter expenses by current space and get the 5 most recent
  const recentExpenses = expenses
    .filter((exp) => exp.spaceId === currentSpaceId)
    .slice(0, 5);

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
          <Text style={styles.sectionTitle}>This Month</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statsScroll}
          >
            <StatCard
              label="Total Spent"
              value={formatCurrency(stats.totalExpenses)}
              icon="💰"
              color="#FF6B6B"
              backgroundColor="#FFF5F5"
            />
            <StatCard
              label="Transactions"
              value={stats.expenseCount}
              icon="📊"
              color="#4ECDC4"
              backgroundColor="#F0FFFE"
            />
            <StatCard
              label="Top Category"
              value={formatCurrency(stats.highestAmount)}
              icon={
                categories.find((cat) => cat.name === stats.highestCategory)
                  ?.icon || "📌"
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
            {Object.entries(stats.averageByCategory).map(
              ([categoryName, amount]) => {
                const categoryData = getCategoryData(categoryName);
                const percentage =
                  stats.totalExpenses > 0
                    ? ((amount / stats.totalExpenses) * 100).toFixed(0)
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
