// from karv/apps/mobile/app/(tabs)/(home)/milestone.tsx — READ ONLY
import { Text, triggerReview } from "@bouthouri/crayons";
import { nanoid } from "@livestore/livestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { MilestonePrompt } from "../../../components/mastery/MilestonePrompt";
import { events, tables } from "../../../livestore/schema";
import { useStore } from "../../../livestore/store";
import { addDays, formatDate } from "../../../utils";
import { MILESTONES } from "../../../utils/milestones";

export default function MilestoneScreen() {
  const router = useRouter();
  const { store } = useStore();
  const params = useLocalSearchParams<{
    habitId: string;
    habitName: string;
    currentEnergy: string;
    completionCount: string;
    milestoneLevel: string;
    date: string;
  }>();

  const milestone = MILESTONES.find((m) => m.level === Number(params.milestoneLevel));
  const milestoneLevel = milestone?.level;

  // Trigger review on any dismissal path (confirm, continue, swipe-down, grabber).
  // All four funnel through screen unmount. Defer via rAF so the happiness modal
  // mounts after the formSheet finishes dismissing — iOS otherwise drops the Modal.
  useEffect(() => {
    return () => {
      if (!milestoneLevel) return;
      requestAnimationFrame(() => {
        triggerReview({ reason: `milestone:${milestoneLevel}` });
      });
    };
  }, [milestoneLevel]);

  if (!params.habitId || !milestone) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No milestone pending.</Text>
      </View>
    );
  }

  const pendingMilestone = {
    habitId: params.habitId,
    habitName: params.habitName,
    currentEnergy: Number(params.currentEnergy),
    completionCount: Number(params.completionCount),
    milestone,
  };

  // New energy takes effect the day AFTER the milestone — the completion
  // on the milestone date used the old energy.
  const milestoneDate = params.date ?? formatDate(new Date());
  const effectiveDate = addDays(milestoneDate, 1);

  return (
    <MilestonePrompt
      key={`${params.habitId}-${params.completionCount}`}
      pendingMilestone={pendingMilestone}
      onConfirm={(habitId, newEnergy) => {
        const currentEnergy = Number(params.currentEnergy);
        if (newEnergy !== currentEnergy) {
          store.commit(events.habitUpdated({ id: habitId, energy: newEnergy }));
          const habit = store.query(tables.habits.where({ id: habitId }))[0];
          if (habit) {
            store.commit(
              events.frequencyChanged({
                id: nanoid(),
                habitId,
                frequency: JSON.parse(habit.frequency),
                energy: newEnergy,
                effectiveFrom: effectiveDate,
              }),
            );
          }
        }
        router.back();
      }}
      onDismiss={() => {
        router.back();
      }}
    />
  );
}
