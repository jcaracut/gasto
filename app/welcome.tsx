import { ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/contexts/ThemeContext";
import { useProfile } from "@/contexts/ProfileContext";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { setName } = useProfile();
  const router = useRouter();
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const canContinue = trimmed.length > 0;

  const handleGetStarted = async () => {
    if (!canContinue) return;
    await setName(trimmed);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.logoCircle}>
            <AntDesign name="wallet" size={44} color={colors.onPrimary} />
          </View>

          <Text style={styles.appName}>Gasto</Text>
          <Text style={styles.tagline}>Expense tracking made simple.</Text>

          <View style={styles.formBlock}>
            <Text style={styles.question}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textFaint}
              value={value}
              onChangeText={setValue}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={40}
              onSubmitEditing={handleGetStarted}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={!canContinue}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <AntDesign name="arrow-right" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "space-between",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    logoCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    appName: {
      fontSize: 32,
      fontWeight: "bold",
      color: c.text,
      marginBottom: 6,
    },
    tagline: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 48,
    },
    formBlock: {
      width: "100%",
    },
    question: {
      fontSize: 18,
      fontWeight: "600",
      color: c.text,
      marginBottom: 12,
      textAlign: "center",
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: c.text,
      textAlign: "center",
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 24,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: c.onPrimary,
    },
  });
