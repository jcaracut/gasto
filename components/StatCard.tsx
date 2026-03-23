import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  backgroundColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = "#FF6B6B",
  backgroundColor = "#FFF5F5",
}) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default StatCard;
