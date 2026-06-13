import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/contexts/ThemeContext";
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
  const styles = useThemedStyles(makeStyles);

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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: c.background,
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
    borderColor: c.border,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 11,
    color: c.textSecondary,
    textAlign: "center",
    maxWidth: 60,
  },
  categoryNameActive: {
    color: c.text,
    fontWeight: "600",
  },
});

export default CategorySelector;
