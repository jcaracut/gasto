import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Category } from "../types/expense";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.name && styles.categoryButtonActive,
          ]}
          onPress={() => onSelectCategory(category.name)}
        >
          <View
            style={[
              styles.categoryIconContainer,
              {
                backgroundColor:
                  selectedCategory === category.name
                    ? category.color
                    : "transparent",
              },
            ]}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          </View>
          <Text
            style={[
              styles.categoryName,
              selectedCategory === category.name && styles.categoryNameActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
  },
  categoryButton: {
    alignItems: "center",
    marginRight: 12,
  },
  categoryButtonActive: {
    opacity: 1,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    maxWidth: 60,
  },
  categoryNameActive: {
    color: "#333",
    fontWeight: "600",
  },
});

export default CategorySelector;
