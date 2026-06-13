import SpaceManager from "@/components/SpaceManager";
import { ThemeColors } from "@/constants/theme";
import { ThemeMode, useTheme, useThemedStyles } from "@/contexts/ThemeContext";
import { useExpenses } from "@/hooks/useExpenses";
import {
  clearAllData,
  exportAsExcel,
  exportAsJson,
  importFromJson,
} from "@/utils/dataTransfer";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "system", label: "System", icon: "📱" },
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [busy, setBusy] = useState<string | null>(null);
  const {
    spaces,
    currentSpaceId,
    createSpace,
    deleteSpace,
    renameSpace,
    archiveSpace,
    switchSpace,
    refreshData,
  } = useExpenses();

  const handleExport = () => {
    Alert.alert("Export Data", "Choose a format to export your data.", [
      {
        text: "JSON (backup)",
        onPress: async () => {
          try {
            setBusy("export");
            await exportAsJson();
          } catch (error) {
            console.error(error);
            Alert.alert("Export failed", "Could not export your data.");
          } finally {
            setBusy(null);
          }
        },
      },
      {
        text: "Excel (.xlsx)",
        onPress: async () => {
          try {
            setBusy("export");
            await exportAsExcel();
          } catch (error) {
            console.error(error);
            Alert.alert("Export failed", "Could not export your data.");
          } finally {
            setBusy(null);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleImport = () => {
    Alert.alert(
      "Import Data",
      "Select a Gasto JSON backup. Matching entries will be overwritten; new ones added.",
      [
        {
          text: "Choose file",
          onPress: async () => {
            try {
              setBusy("import");
              const summary = await importFromJson();
              if (!summary) return; // user cancelled the picker
              await refreshData();
              Alert.alert(
                "Import complete",
                `Imported ${summary.expenses} expenses, ${summary.income} income, ${summary.accounts} accounts, ${summary.categories} categories, ${summary.budgets} budgets, ${summary.spaces} spaces.`,
              );
            } catch (error: any) {
              console.error(error);
              Alert.alert(
                "Import failed",
                error?.message ?? "Could not import the selected file.",
              );
            } finally {
              setBusy(null);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This permanently deletes all expenses, income, and budgets on this device. This cannot be undone. Consider exporting a backup first.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy("clear");
              await clearAllData();
              await refreshData();
              Alert.alert("Done", "All data has been cleared.");
            } catch (error) {
              console.error(error);
              Alert.alert("Failed", "Could not clear your data.");
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Spaces Management */}
        <SpaceManager
          spaces={spaces}
          currentSpaceId={currentSpaceId}
          onCreateSpace={createSpace}
          onDeleteSpace={deleteSpace}
          onRenameSpace={renameSpace}
          onArchiveSpace={archiveSpace}
          onSwitchSpace={switchSpace}
        />

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelWrap}>
              <Text style={styles.settingLabel}>Theme</Text>
              <Text style={styles.settingDescription}>
                {mode === "system"
                  ? "Following your device setting"
                  : `Always ${mode}`}
              </Text>
            </View>
          </View>

          <View style={styles.segment}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  onPress={() => setMode(opt.value)}
                >
                  <Text style={styles.segmentIcon}>{opt.icon}</Text>
                  <Text
                    style={[
                      styles.segmentLabel,
                      active && styles.segmentLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLabelWrap}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingDescription}>PHP</Text>
            </View>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleExport}
            disabled={busy !== null}
          >
            <Text style={styles.settingLabel}>📤 Export Data</Text>
            {busy === "export" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.settingValue}>›</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleImport}
            disabled={busy !== null}
          >
            <Text style={styles.settingLabel}>📥 Import Data</Text>
            {busy === "import" ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.settingValue}>›</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearData}
            disabled={busy !== null}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              🗑️ Clear All Data
            </Text>
            {busy === "clear" ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={styles.settingValue}>›</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutItem}>
            <View>
              <Text style={styles.aboutLabel}>Gasto</Text>
              <Text style={styles.aboutDescription}>Expense Tracker</Text>
            </View>
            <Text style={styles.aboutVersion}>v1.0.0</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Gasto helps you track your daily expenses and manage your
              budget effectively.
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: c.text,
    },
    section: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textMuted,
      marginBottom: 12,
      textTransform: "uppercase",
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: c.surface,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 8,
    },
    settingLabelWrap: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    settingValue: {
      fontSize: 18,
      color: c.textFaint,
      fontWeight: "300",
    },
    segment: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    segmentItemActive: {
      backgroundColor: c.primarySoft,
    },
    segmentIcon: {
      fontSize: 14,
    },
    segmentLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: c.textMuted,
    },
    segmentLabelActive: {
      color: c.primary,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 8,
    },
    dangerText: {
      color: c.danger,
    },
    aboutItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: c.surface,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 12,
    },
    aboutLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
      marginBottom: 2,
    },
    aboutDescription: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    aboutVersion: {
      fontSize: 12,
      color: c.textMuted,
      fontWeight: "500",
    },
    infoBox: {
      backgroundColor: c.primarySoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
    },
    infoText: {
      fontSize: 12,
      color: c.text,
      lineHeight: 18,
    },
    bottomPadding: {
      height: 40,
    },
  });
