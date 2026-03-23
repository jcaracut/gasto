import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Category, Expense } from "../types/expense";
import { formatAmount } from "../utils/currency";

interface ExpenseItemProps {
  expense: Expense;
  category?: Category;
  onPress?: () => void;
  onDeletePress?: () => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  category,
  onPress,
  onDeletePress,
}) => {
  const date = new Date(expense.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: category?.color || "#FF6B6B" },
          ]}
        >
          <Text style={styles.categoryIcon}>{category?.icon || "📌"}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.category}>{expense.category}</Text>
          <Text style={styles.dateTime}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.amount}>-₱ {formatAmount(expense.amount)}</Text>
          <Text style={styles.paymentMethod}>{expense.paymentMethod}</Text>
        </View>
        {onDeletePress && (
          <TouchableOpacity onPress={onDeletePress} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  dateTime: {
    fontSize: 11,
    color: "#BBB",
  },
  rightSection: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 10,
    color: "#999",
    textTransform: "capitalize",
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#999",
  },
});

export default ExpenseItem;
