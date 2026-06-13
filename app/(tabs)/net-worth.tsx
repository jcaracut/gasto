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
import { useAccounts } from "@/hooks/useAccounts";
import { useIncome } from "@/hooks/useIncome";
import { Account, AccountType } from "@/types/expense";
import { formatCurrency } from "@/utils/currency";
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
                  <Text style={styles.deleteBtnText}>🗑️</Text>
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
                  <Text style={styles.deleteBtnText}>🗑️</Text>
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
                <Text style={styles.closeButton}>✕</Text>
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
                  placeholderTextColor="#CCC"
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
                    placeholderTextColor="#CCC"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
    marginBottom: 12,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF6B6B",
    borderRadius: 6,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  netWorthCard: {
    backgroundColor: "#2D3748",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  netWorthLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  netWorthValue: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  netWorthSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  incomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FFF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 22,
  },
  accountMonogram: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  accountUpdated: {
    fontSize: 11,
    color: "#999",
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
  },
  incomeAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 8,
  },
  incomeTotalCard: {
    backgroundColor: "#F0FFF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D7F5DF",
  },
  incomeTotalLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  incomeTotalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    paddingVertical: 16,
  },
  bottomPadding: {
    height: 60,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
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
    color: "#333",
  },
  closeButton: {
    fontSize: 20,
    color: "#999",
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
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
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeButtonActive: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
  typeTextActive: {
    color: "#FF6B6B",
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
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "transparent",
  },
  providerCardActive: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
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
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
  },
  providerName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
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
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconButtonSelected: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  iconButtonText: {
    fontSize: 26,
  },
  balanceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  balanceSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginRight: 4,
  },
  balanceInput: {
    flex: 1,
    height: 46,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
    backgroundColor: "#F0F0F0",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
