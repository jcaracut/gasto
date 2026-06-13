import {
  ACCOUNT_ICONS,
  ACCOUNT_PROVIDERS,
  ACCOUNT_TYPES,
  AccountProvider,
  DEFAULT_ACCOUNT_COLOR,
  getAccountProvider,
  getIncomeSourceIcon,
  getMonogramFontSize,
} from "@/constants/finance";
import { ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/contexts/ThemeContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useIncome } from "@/hooks/useIncome";
import { Account, AccountType } from "@/types/expense";
import { formatCurrency } from "@/utils/currency";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NetWorthScreen() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getNetWorth,
    refreshAccounts,
  } = useAccounts();
  const { income, getMonthlyIncome, deleteIncome, refreshIncome } = useIncome();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0]);
  const [color, setColor] = useState(DEFAULT_ACCOUNT_COLOR);
  const [balance, setBalance] = useState("");
  // null = no preset selected, "__custom__" = custom account, else provider name
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const isCustom = selectedProvider === "__custom__";

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const selectProvider = (provider: AccountProvider) => {
    setSelectedProvider(provider.name);
    setName(provider.name);
    setType(provider.type);
    setIcon(provider.icon);
    setColor(provider.color);
  };

  const selectCustom = () => {
    setSelectedProvider("__custom__");
    setName("");
    setType("bank");
    setIcon(ACCOUNT_ICONS[0]);
    setColor(DEFAULT_ACCOUNT_COLOR);
  };

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshIncome();
    }, [refreshAccounts, refreshIncome]),
  );

  const openAddModal = () => {
    setEditingAccount(null);
    setSelectedProvider(null);
    setName("");
    setType("bank");
    setIcon(ACCOUNT_ICONS[0]);
    setColor(DEFAULT_ACCOUNT_COLOR);
    setBalance("");
    setModalVisible(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    // Reflect the matching preset when one exists, otherwise treat as custom.
    setSelectedProvider(
      getAccountProvider(account.name) ? account.name : "__custom__",
    );
    setName(account.name);
    setType(account.type);
    setIcon(account.icon);
    setColor(account.color || DEFAULT_ACCOUNT_COLOR);
    setBalance(String(account.balance));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Account name is required");
      return;
    }
    const parsedBalance = parseFloat(balance) || 0;
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: name.trim(),
          type,
          icon,
          color,
          balance: parsedBalance,
        });
      } else {
        await addAccount({
          name: name.trim(),
          type,
          icon,
          color,
          balance: parsedBalance,
        });
      }
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "Failed to save account");
    }
  };

  const handleDeleteAccount = (account: Account) => {
    Alert.alert("Delete Account", `Delete "${account.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAccount(account.id),
      },
    ]);
  };

  const handleDeleteIncome = (id: string, label: string) => {
    Alert.alert("Delete Income", `Delete "${label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteIncome(id),
      },
    ]);
  };

  const recentIncome = income.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Net Worth</Text>
        </View>

        {/* Net Worth Total */}
        <View style={styles.section}>
          <View style={styles.netWorthCard}>
            <Text style={styles.netWorthLabel}>Total across all accounts</Text>
            <Text style={styles.netWorthValue}>
              {formatCurrency(getNetWorth())}
            </Text>
            <Text style={styles.netWorthSub}>
              {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
            </Text>
          </View>
        </View>

        {/* Accounts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {accounts.length === 0 ? (
            <Text style={styles.emptyText}>
              No accounts yet. Add BPI, Maya, GCash and more.
            </Text>
          ) : (
            accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountRow}
                onPress={() => openEditModal(account)}
              >
                <View
                  style={[
                    styles.accountIcon,
                    { backgroundColor: account.color || DEFAULT_ACCOUNT_COLOR },
                  ]}
                >
                  <Text
                    style={[
                      styles.accountMonogram,
                      { fontSize: getMonogramFontSize(account.icon) },
                    ]}
                  >
                    {account.icon}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountUpdated}>
                    Updated{" "}
                    {new Date(account.updatedDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.accountBalance}>
                  {formatCurrency(account.balance)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteAccount(account)}
                >
                  <AntDesign name="delete" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* This Month's Income */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month&apos;s Income</Text>
          <View style={styles.incomeTotalCard}>
            <Text style={styles.incomeTotalLabel}>Total received this month</Text>
            <Text style={styles.incomeTotalValue}>
              {formatCurrency(getMonthlyIncome())}
            </Text>
          </View>

          {recentIncome.length === 0 ? (
            <Text style={styles.emptyText}>
              No income recorded yet. Add some from the Add tab.
            </Text>
          ) : (
            recentIncome.map((entry) => (
              <View key={entry.id} style={styles.incomeRow}>
                <View style={styles.incomeIcon}>
                  <Text style={styles.accountIconText}>
                    {getIncomeSourceIcon(entry.source)}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>
                    {entry.description || entry.source}
                  </Text>
                  <Text style={styles.accountUpdated}>
                    {entry.source} •{" "}
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.incomeAmount}>
                  +{formatCurrency(entry.amount)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() =>
                    handleDeleteIncome(
                      entry.id,
                      entry.description || entry.source,
                    )
                  }
                >
                  <AntDesign name="delete" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add / Edit Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? "Edit Account" : "Add Account"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AntDesign name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Provider</Text>
                <View style={styles.providerGrid}>
                  {ACCOUNT_PROVIDERS.map((p) => {
                    const active = selectedProvider === p.name;
                    return (
                      <TouchableOpacity
                        key={p.name}
                        style={[
                          styles.providerCard,
                          active && styles.providerCardActive,
                        ]}
                        onPress={() => selectProvider(p)}
                      >
                        <View
                          style={[
                            styles.providerBadge,
                            { backgroundColor: p.color },
                          ]}
                        >
                          <Text
                            style={[
                              styles.providerBadgeText,
                              { fontSize: getMonogramFontSize(p.icon) },
                            ]}
                          >
                            {p.icon}
                          </Text>
                        </View>
                        <Text style={styles.providerName} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[
                      styles.providerCard,
                      isCustom && styles.providerCardActive,
                    ]}
                    onPress={selectCustom}
                  >
                    <View
                      style={[
                        styles.providerBadge,
                        { backgroundColor: DEFAULT_ACCOUNT_COLOR },
                      ]}
                    >
                      <Text style={styles.providerBadgeText}>＋</Text>
                    </View>
                    <Text style={styles.providerName} numberOfLines={1}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. BPI Savings, Cash on hand"
                  placeholderTextColor={colors.textFaint}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {isCustom && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Type</Text>
                    <View style={styles.typeRow}>
                      {ACCOUNT_TYPES.map((t) => (
                        <TouchableOpacity
                          key={t.type}
                          style={[
                            styles.typeButton,
                            type === t.type && styles.typeButtonActive,
                          ]}
                          onPress={() => setType(t.type)}
                        >
                          <Text
                            style={[
                              styles.typeText,
                              type === t.type && styles.typeTextActive,
                            ]}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Icon</Text>
                    <View style={styles.iconPicker}>
                      {ACCOUNT_ICONS.map((ic) => (
                        <TouchableOpacity
                          key={ic}
                          onPress={() => setIcon(ic)}
                          style={[
                            styles.iconButton,
                            icon === ic && styles.iconButtonSelected,
                          ]}
                        >
                          <Text style={styles.iconButtonText}>{ic}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Balance</Text>
                <View style={styles.balanceInputContainer}>
                  <Text style={styles.balanceSymbol}>₱</Text>
                  <TextInput
                    style={styles.balanceInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textFaint}
                    keyboardType="decimal-pad"
                    value={balance}
                    onChangeText={setBalance}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.button, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>
                  {editingAccount ? "Save" : "Add Account"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      paddingVertical: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: c.text,
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
      color: c.text,
      marginBottom: 12,
    },
    addBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.primary,
      borderRadius: 6,
    },
    addBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: c.onPrimary,
    },
    netWorthCard: {
      backgroundColor: c.netWorthCard,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
    },
    netWorthLabel: {
      fontSize: 13,
      color: c.onNetWorthCard,
      opacity: 0.7,
      marginBottom: 8,
    },
    netWorthValue: {
      fontSize: 34,
      fontWeight: "bold",
      color: c.onNetWorthCard,
    },
    netWorthSub: {
      fontSize: 12,
      color: c.onNetWorthCard,
      opacity: 0.6,
      marginTop: 6,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginVertical: 4,
    },
    accountIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceMuted,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    incomeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.successSoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    accountIconText: {
      fontSize: 22,
    },
    accountMonogram: {
      color: c.onPrimary,
      fontWeight: "800",
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
      marginBottom: 2,
    },
    accountUpdated: {
      fontSize: 11,
      color: c.textMuted,
    },
    accountBalance: {
      fontSize: 15,
      fontWeight: "bold",
      color: c.text,
      marginRight: 8,
    },
    incomeRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginVertical: 4,
    },
    incomeAmount: {
      fontSize: 15,
      fontWeight: "bold",
      color: c.success,
      marginRight: 8,
    },
    incomeTotalCard: {
      backgroundColor: c.successSoft,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    incomeTotalLabel: {
      fontSize: 12,
      color: c.textSecondary,
      marginBottom: 4,
    },
    incomeTotalValue: {
      fontSize: 22,
      fontWeight: "bold",
      color: c.success,
    },
    deleteBtn: {
      padding: 6,
    },
    emptyText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: "center",
      paddingVertical: 16,
    },
    bottomPadding: {
      height: 60,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 16,
      maxHeight: "88%",
    },
    modalScroll: {
      flexGrow: 0,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: c.text,
    },
    modalSection: {
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: c.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: c.text,
    },
    typeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    typeButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
      borderWidth: 2,
      borderColor: "transparent",
    },
    typeButtonActive: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    typeText: {
      fontSize: 13,
      fontWeight: "500",
      color: c.textMuted,
    },
    typeTextActive: {
      color: c.primary,
      fontWeight: "700",
    },
    providerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    providerCard: {
      width: "22%",
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 2,
      borderColor: "transparent",
    },
    providerCardActive: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    providerBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    providerBadgeText: {
      color: c.onPrimary,
      fontWeight: "800",
      fontSize: 18,
    },
    providerName: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textSecondary,
    },
    iconPicker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    iconButton: {
      width: "22%",
      aspectRatio: 1,
      borderRadius: 8,
      backgroundColor: c.surfaceMuted,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    iconButtonSelected: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    iconButtonText: {
      fontSize: 26,
    },
    balanceInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    balanceSymbol: {
      fontSize: 20,
      fontWeight: "bold",
      color: c.primary,
      marginRight: 4,
    },
    balanceInput: {
      flex: 1,
      height: 46,
      fontSize: 20,
      fontWeight: "bold",
      color: c.text,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: c.surfaceMuted,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textSecondary,
    },
    saveButton: {
      backgroundColor: c.primary,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: c.onPrimary,
    },
  });
