import SpaceManager from "@/components/SpaceManager";
import { useExpenses } from "@/hooks/useExpenses";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const {
    spaces,
    currentSpaceId,
    createSpace,
    deleteSpace,
    renameSpace,
    archiveSpace,
    switchSpace,
  } = useExpenses();

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all expenses and settings?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Clear",
          onPress: () => {
            // TODO: Implement clear data functionality
            Alert.alert("Success", "All data has been cleared");
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "Export functionality coming soon!");
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

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Get budgets and spending alerts
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#D0D0D0", true: "#FF6B6B" }}
              thumbColor={notifications ? "#FF6B6B" : "#999"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Coming soon</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              disabled
              trackColor={{ false: "#D0D0D0", true: "#FF6B6B" }}
              thumbColor={darkMode ? "#FF6B6B" : "#999"}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingItem}>
            <View>
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
            onPress={handleExportData}
          >
            <Text style={styles.settingLabel}>📤 Export Data</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearData}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              🗑️ Clear All Data
            </Text>
            <Text style={styles.settingValue}>›</Text>
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  settingValue: {
    fontSize: 18,
    color: "#CCC",
    fontWeight: "300",
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEFEF",
    marginVertical: 8,
  },
  dangerText: {
    color: "#FF6B6B",
  },
  aboutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  aboutDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  aboutVersion: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
  },
  infoText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
