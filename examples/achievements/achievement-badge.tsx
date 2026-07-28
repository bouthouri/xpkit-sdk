// from progres/apps/mobile/components/achievements/achievement-badge.tsx — READ ONLY
import { Text, View, StyleSheet } from "react-native";
import { colors } from "@bouthouri/crayons";
import { Achievement } from "./types";

interface AchievementBadgeProps {
  achievement: Achievement;
}

export const AchievementBadge = ({ achievement }: AchievementBadgeProps) => {
  const isLocked = !achievement.isUnlocked;

  return (
    <View style={[styles.cardContainer, styles.cardContainerActive]}>
      <View style={styles.card}>
        <Text style={styles.emoji}>{isLocked ? "🔒" : achievement.emoji}</Text>
        <Text style={[styles.achievementName, isLocked && styles.lockedText]}>
          {isLocked ? "???" : achievement.name}
        </Text>
        <Text style={[styles.description, isLocked && styles.lockedText]}>
          {isLocked ? "Keep progressing to unlock!" : achievement.description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "column",
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 15,
    minHeight: 140,
    flex: 1,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  cardContainerActive: {
    backgroundColor: "white",
  },
  card: {
    borderRadius: 13, // Slightly smaller to fit within border
    backgroundColor: "white",
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 136, // Account for border
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
    textAlign: "center",
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: colors.palette.neutral600,
    textAlign: "center",
    lineHeight: 16,
  },
  lockedText: {
    color: colors.palette.neutral400,
    fontStyle: "italic",
  },
});
