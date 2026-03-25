import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Space } from "../types/expense";

interface SpaceManagerProps {
  spaces: Space[];
  currentSpaceId: string;
  onCreateSpace: (name: string, icon: string, color: string) => Promise<void>;
  onDeleteSpace: (spaceId: string) => Promise<void>;
  onRenameSpace: (spaceId: string, newName: string) => Promise<void>;
  onArchiveSpace: (spaceId: string, isArchived: boolean) => Promise<void>;
  onSwitchSpace: (spaceId: string) => Promise<void>;
}

const SPACE_ICONS = ["👤", "✈️", "🏠", "💼", "🎓", "🏥", "🎮", "📚"];
const SPACE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#95E1D3",
  "#F38181",
  "#AA96DA",
  "#FCBAD3",
  "#A8D8EA",
  "#C7CEEA",
];

export default function SpaceManager({
  spaces,
  currentSpaceId,
  onCreateSpace,
  onDeleteSpace,
  onRenameSpace,
  onArchiveSpace,
  onSwitchSpace,
}: SpaceManagerProps) {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [showArchivedSpaces, setShowArchivedSpaces] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(SPACE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[0]);
  const [renamingSpaceId, setRenamingSpaceId] = useState<string | null>(null);
  const [renamingSpaceName, setRenamingSpaceName] = useState("");

  const activeSpaces = spaces.filter((s) => !s.isArchived);
  const archivedSpaces = spaces.filter((s) => s.isArchived);
  const currentSpace = spaces.find((s) => s.id === currentSpaceId);

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      Alert.alert("Error", "Space name is required");
      return;
    }

    // Check for duplicate names
    if (
      spaces.some((s) => s.name.toLowerCase() === newSpaceName.toLowerCase())
    ) {
      Alert.alert("Error", "A space with this name already exists");
      return;
    }

    try {
      await onCreateSpace(newSpaceName, selectedIcon, selectedColor);
      setNewSpaceName("");
      setSelectedIcon(SPACE_ICONS[0]);
      setSelectedColor(SPACE_COLORS[0]);
      setIsCreateModalVisible(false);
      Alert.alert("Success", `Space "${newSpaceName}" created!`);
    } catch {
      Alert.alert("Error", "Failed to create space");
    }
  };

  const handleRenameSpace = async () => {
    if (!renamingSpaceName.trim() || !renamingSpaceId) {
      return;
    }

    // Check for duplicate names
    if (
      spaces.some(
        (s) =>
          s.id !== renamingSpaceId &&
          s.name.toLowerCase() === renamingSpaceName.toLowerCase(),
      )
    ) {
      Alert.alert("Error", "A space with this name already exists");
      return;
    }

    try {
      await onRenameSpace(renamingSpaceId, renamingSpaceName);
      setRenamingSpaceId(null);
      setRenamingSpaceName("");
      setIsRenameModalVisible(false);
      Alert.alert("Success", "Space renamed!");
    } catch {
      Alert.alert("Error", "Failed to rename space");
    }
  };

  const handleDeleteSpace = (space: Space) => {
    Alert.alert(
      "Delete Space",
      `Are you sure you want to delete "${space.name}"? All expenses in this space will be moved to Personal.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await onDeleteSpace(space.id);
              Alert.alert("Success", "Space deleted");
            } catch {
              Alert.alert("Error", "Failed to delete space");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleArchiveSpace = async (space: Space) => {
    try {
      await onArchiveSpace(space.id, true);
      Alert.alert("Success", `"${space.name}" archived`);
    } catch {
      Alert.alert("Error", "Failed to archive space");
    }
  };

  const handleRestoreSpace = async (space: Space) => {
    try {
      await onArchiveSpace(space.id, false);
      Alert.alert("Success", `"${space.name}" restored`);
    } catch {
      Alert.alert("Error", "Failed to restore space");
    }
  };

  const handleSwitchSpace = async (space: Space) => {
    try {
      await onSwitchSpace(space.id);
    } catch {
      Alert.alert("Error", "Failed to switch space");
    }
  };

  const SpaceItem = ({
    space,
    isArchived = false,
  }: {
    space: Space;
    isArchived?: boolean;
  }) => {
    const isCurrentSpace = space.id === currentSpaceId;

    return (
      <TouchableOpacity
        onPress={() => !isArchived && handleSwitchSpace(space)}
        disabled={isArchived}
      >
        <View
          style={[styles.spaceItem, isCurrentSpace && styles.currentSpaceItem]}
        >
          <View
            style={[
              styles.spaceIcon,
              { backgroundColor: space.color },
              isArchived && styles.archivedIcon,
            ]}
          >
            <Text style={styles.spaceIconText}>{space.icon}</Text>
          </View>
          <View style={styles.spaceInfo}>
            <Text
              style={[
                styles.spaceName,
                isCurrentSpace && styles.currentSpaceName,
              ]}
            >
              {space.name}
            </Text>
            {isCurrentSpace && <Text style={styles.badgeText}>Current</Text>}
            {isArchived && <Text style={styles.badgeText}>Archived</Text>}
          </View>
          <View style={styles.spaceActions}>
            {!isArchived && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setRenamingSpaceId(space.id);
                    setRenamingSpaceName(space.name);
                    setIsRenameModalVisible(true);
                  }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>✎</Text>
                </TouchableOpacity>
                {space.id !== spaces[0]?.id && (
                  <>
                    <TouchableOpacity
                      onPress={() => handleArchiveSpace(space)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>📦</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSpace(space)}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            {isArchived && (
              <TouchableOpacity
                onPress={() => handleRestoreSpace(space)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>↩️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Current Space Display */}
      <View style={styles.currentSpaceSection}>
        <Text style={styles.sectionLabel}>Current Space</Text>
        {currentSpace && (
          <View style={styles.currentSpaceDisplay}>
            <View
              style={[
                styles.spaceIcon,
                { backgroundColor: currentSpace.color },
              ]}
            >
              <Text style={styles.spaceIconText}>{currentSpace.icon}</Text>
            </View>
            <View>
              <Text style={styles.currentSpaceNameLarge}>
                {currentSpace.name}
              </Text>
              <Text style={styles.spaceCreatedDate}>
                Created{" "}
                {new Date(currentSpace.createdDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Active Spaces */}
      <View style={styles.spacesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>All Spaces</Text>
          <TouchableOpacity
            onPress={() => setIsCreateModalVisible(true)}
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>+ New Space</Text>
          </TouchableOpacity>
        </View>
        {activeSpaces.length > 0 ? (
          <FlatList
            data={activeSpaces}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SpaceItem space={item} />}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No spaces yet</Text>
        )}
      </View>

      {/* Archived Spaces */}
      {archivedSpaces.length > 0 && (
        <View style={styles.spacesSection}>
          <TouchableOpacity
            onPress={() => setShowArchivedSpaces(!showArchivedSpaces)}
            style={styles.archiveHeader}
          >
            <Text style={styles.archiveHeaderText}>
              📦 Archived Spaces ({archivedSpaces.length})
            </Text>
            <Text style={styles.toggleIcon}>
              {showArchivedSpaces ? "▼" : "▶"}
            </Text>
          </TouchableOpacity>
          {showArchivedSpaces && (
            <FlatList
              data={archivedSpaces}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SpaceItem space={item} isArchived />}
              scrollEnabled={false}
            />
          )}
        </View>
      )}

      {/* Create Space Modal */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Space</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Space Name Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Space Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Japan Travel, Home"
                placeholderTextColor="#CCC"
                value={newSpaceName}
                onChangeText={setNewSpaceName}
              />
            </View>

            {/* Icon Picker */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Choose Icon</Text>
              <View style={styles.iconPicker}>
                {SPACE_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon && styles.iconButtonSelected,
                    ]}
                  >
                    <Text style={styles.iconButtonText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Picker */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Choose Color</Text>
              <View style={styles.colorPicker}>
                {SPACE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonSelected,
                    ]}
                  >
                    {selectedColor === color && (
                      <Text style={styles.colorButtonCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsCreateModalVisible(false)}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSpace}
                style={[styles.button, styles.createSubmitButton]}
              >
                <Text style={styles.createSubmitButtonText}>Create Space</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Space Modal */}
      <Modal visible={isRenameModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Space</Text>
              <TouchableOpacity onPress={() => setIsRenameModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Space Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Space name"
                placeholderTextColor="#CCC"
                value={renamingSpaceName}
                onChangeText={setRenamingSpaceName}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsRenameModalVisible(false)}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRenameSpace}
                style={[styles.button, styles.createSubmitButton]}
              >
                <Text style={styles.createSubmitButtonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  currentSpaceSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currentSpaceDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  currentSpaceNameLarge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  spaceCreatedDate: {
    fontSize: 12,
    color: "#999",
  },
  spacesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase",
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF6B6B",
    borderRadius: 6,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  spaceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  currentSpaceItem: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  spaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  archivedIcon: {
    opacity: 0.5,
  },
  spaceIconText: {
    fontSize: 24,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  currentSpaceName: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  badgeText: {
    fontSize: 11,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  spaceActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "#FFE5E5",
  },
  deleteButtonText: {
    fontSize: 14,
  },
  archiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  archiveHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  toggleIcon: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingVertical: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    fontSize: 28,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorButton: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorButtonSelected: {
    borderColor: "#333",
  },
  colorButtonCheckmark: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
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
  createSubmitButton: {
    backgroundColor: "#FF6B6B",
  },
  createSubmitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
