// from progres/apps/mobile/app/(tabs)/(settings)/achievements.tsx — READ ONLY
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { BadgeList } from "../../../components/achievements/achievement-list";
import { useStore } from "../../../store";

export default function AchievementsScreen() {
  const { getAchievementsWithStatus, unlockedAchievements } = useStore();
  const achievements = getAchievementsWithStatus();
  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {unlockedCount}/{totalCount} achievements unlocked
        </Text>
      </View>
      <BadgeList achievements={achievements} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  statusContainer: {
    paddingVertical: 16,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
  },
});
