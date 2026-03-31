import CategorySelector from "@/components/CategorySelector";
import { useExpenses } from "@/hooks/useExpenses";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addExpense, categories, currentSpaceId, spaces } = useExpenses();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "digital" | "other"
  >("card");
  const [selectedSpaceId, setSelectedSpaceId] =
    useState<string>(currentSpaceId);
  const [loading, setLoading] = useState(false);

  const currentSpace = spaces.find((s) => s.id === currentSpaceId);
  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
  const activeSpaces = spaces.filter((s) => !s.isArchived);

  // Sync selectedSpaceId with currentSpaceId whenever current space changes
  useEffect(() => {
    setSelectedSpaceId(currentSpaceId);
  }, [currentSpaceId]);

  const handleAddExpense = async () => {
    if (!amount || !selectedCategory || !description.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      await addExpense(
        {
          amount: parsedAmount,
          category: selectedCategory,
          description: description.trim(),
          date: new Date().toISOString(),
          paymentMethod,
        },
        selectedSpaceId,
      );

      Alert.alert("Success", "Expense added successfully!", [
        {
          text: "OK",
          onPress: () => {
            setAmount("");
            setDescription("");
            setSelectedCategory(null);
            setPaymentMethod("card");
            setSelectedSpaceId(currentSpaceId);
            router.back();
          },
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Expense</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Space Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Space</Text>
            <View style={styles.spaceSelectorContainer}>
              {activeSpaces.map((space) => (
                <TouchableOpacity
                  key={space.id}
                  style={[
                    styles.spaceSelectorButton,
                    selectedSpaceId === space.id &&
                      styles.spaceSelectorButtonActive,
                  ]}
                  onPress={() => setSelectedSpaceId(space.id)}
                >
                  <Text style={styles.spaceSelectorIcon}>{space.icon}</Text>
                  <Text
                    style={[
                      styles.spaceSelectorText,
                      selectedSpaceId === space.id &&
                        styles.spaceSelectorTextActive,
                    ]}
                  >
                    {space.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#CCC"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="What did you spend on?"
              placeholderTextColor="#CCC"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{description.length}/100</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {(["cash", "card", "digital", "other"] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method && styles.paymentMethodActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method &&
                        styles.paymentMethodTextActive,
                    ]}
                  >
                    {method === "cash"
                      ? "💵 Cash"
                      : method === "card"
                        ? "💳 Card"
                        : method === "digital"
                          ? "📱 Digital"
                          : "📌 Other"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddExpense}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? "Adding..." : "Add Expense"}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  backButton: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 50,
  },
  spaceSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  spaceSelectorButton: {
    width: "45%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 8,
    marginVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  spaceSelectorButtonActive: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  spaceSelectorIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  spaceSelectorText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999",
    textAlign: "center",
  },
  spaceSelectorTextActive: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    height: 50,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  descriptionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 10,
    color: "#CCC",
    marginTop: 4,
    textAlign: "right",
  },
  paymentMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -8,
  },
  paymentMethodButton: {
    width: "45%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    marginHorizontal: 8,
    marginVertical: 6,
    alignItems: "center",
  },
  paymentMethodActive: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
  paymentMethodTextActive: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  addButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bottomPadding: {
    height: 40,
  },
});
