// from karv/apps/mobile/components/mastery/MilestonePrompt.tsx — READ ONLY
import { Chip, Text } from "@bouthouri/crayons";
import { SimpleLineIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { type ReactElement, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CannonConfetti } from "react-native-fast-confetti";

import type { PendingMilestone } from "../../utils/milestones";
import EnergySelector from "../energy-selector";

interface MilestonePromptProps {
  pendingMilestone: PendingMilestone;
  onConfirm: (habitId: string, newEnergy: number, milestoneCount: number) => void;
  onDismiss: () => void;
}

export function MilestonePrompt({
  pendingMilestone,
  onConfirm,
  onDismiss,
}: MilestonePromptProps): ReactElement {
  const { habitId, habitName, currentEnergy, completionCount, milestone } = pendingMilestone;

  const isCarved = milestone.label === "Carved";
  const [newEnergy, setNewEnergy] = useState(currentEnergy);
  const energyChanged = newEnergy !== currentEnergy;

  useEffect(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, []);

  const title = isCarved ? `${habitName} Carved!` : `${milestone.label}!`;

  const handleUpdate = () => {
    onConfirm(habitId, newEnergy, milestone.count);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, isCarved && styles.titleGold]}>{title}</Text>
        <Text style={styles.completionText}>Completed {completionCount} times</Text>
      </View>

      {/* Science hint */}
      <View style={styles.hintSection}>
        <Text style={styles.hintLabel}>Science says</Text>
        <Text style={styles.hintText}>{milestone.hint}</Text>
      </View>

      {/* Energy hint + selector */}
      <Text style={styles.energyHint}>Feels easier now? Adjust the energy cost below</Text>
      <View style={styles.energySection}>
        <Text style={styles.energyLabel}>Current energy</Text>
        <EnergySelector
          defaultEnergy={currentEnergy}
          onValidate={(value) => setNewEnergy(value)}
          trigger={
            <Chip icon={<SimpleLineIcons name="energy" size={24} color="#FFC928" />}>
              {newEnergy}
            </Chip>
          }
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {energyChanged && (
          <Pressable style={styles.primaryButton} onPress={handleUpdate}>
            <Text style={styles.primaryButtonText}>
              Update from {currentEnergy} to {newEnergy}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={energyChanged ? styles.secondaryButton : styles.primaryButton}
          onPress={onDismiss}
        >
          <Text style={energyChanged ? styles.secondaryButtonText : styles.primaryButtonText}>
            Continue
          </Text>
        </Pressable>
      </View>

      {/* Confetti */}
      <View pointerEvents="none" style={styles.confettiOverlay}>
        <CannonConfetti
          autoplay
          autoStartDelay={500}
          fadeOutOnEnd
          gravity={1.2}
          drag={2}
          sprayDuration={300}
        >
          <CannonConfetti.Origin position="bottom-left" count={100} initialSpeed={2.5}>
            <CannonConfetti.Flake width={6} height={10} />
            <CannonConfetti.Flake size={8} radius={4} />
            <CannonConfetti.Flake width={10} height={16} />
          </CannonConfetti.Origin>
          <CannonConfetti.Origin position="bottom-right" count={100} initialSpeed={2.5}>
            <CannonConfetti.Flake width={6} height={10} />
            <CannonConfetti.Flake size={8} radius={4} />
            <CannonConfetti.Flake width={10} height={16} />
          </CannonConfetti.Origin>
        </CannonConfetti>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  confettiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    marginHorizontal: -24,
    marginVertical: -16,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  titleGold: {
    color: "#FFD700",
  },
  completionText: {
    fontSize: 14,
    opacity: 0.7,
  },
  hintSection: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 16,
    gap: 6,
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  energyHint: {
    fontSize: 14,
    opacity: 0.6,
  },
  energySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  energyLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
