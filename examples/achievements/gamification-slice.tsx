// from progres/apps/mobile/store/gamification/gamification-slice.tsx — READ ONLY
import { notify, triggerReview } from "@bouthouri/crayons";
import React from "react";
import { Text } from "react-native";
import { StateCreator } from "zustand";

import { AppSlice, ProgressSlice } from "../types";
import {
  GamificationCounters,
  GamificationSlice,
  AchievementWithStatus,
} from "./types";

import { ACHIEVEMENTS, getAllAchievements } from "./config";
import { trackEvent } from "../../utils/analytics";

export const createGamificationSlice: StateCreator<
  AppSlice & ProgressSlice & GamificationSlice,
  [["zustand/immer", never]],
  [],
  GamificationSlice
> = (set, get) => ({
  // State
  counters: {
    progressCreated: 0,
    pathCreated: 0,
    goalCreated: 0,
    goalAchieved: 0,
    progressAchieved: 0,
    pathAchieved: 0,
  },
  unlockedAchievements: [],

  // Actions
  incrementCounter: (counterKey: keyof GamificationCounters) => {
    // First, update the state and get newly unlocked achievements
    let newlyUnlocked: [string, any][] = [];

    set((state: AppSlice & ProgressSlice & GamificationSlice) => {
      // Increment the counter
      state.counters[counterKey] += 1;

      // Check for newly unlocked achievements using Object.entries for efficiency
      newlyUnlocked = Object.entries(ACHIEVEMENTS).filter(
        ([achievementId, achievement]) => {
          // Skip if already unlocked
          if (state.unlockedAchievements.includes(achievementId)) {
            return false;
          }

          // Check if criteria is met
          return (
            state.counters[achievement.target as keyof GamificationCounters] >=
            achievement.goal
          );
        }
      );

      // Add newly unlocked achievements to state (but don't queue notifications yet)
      newlyUnlocked.forEach(([achievementId, achievement]) => {
        state.unlockedAchievements.push(achievementId);
      });
    });

    // After state update is complete, fire celebrate notifications (confetti + haptic).
    // The review prompt is chained to the triggering achievement's toast onHide —
    // firing it immediately races with in-flight formSheet dismiss (progres/new,
    // path/new) and the native <Modal> silently fails to mount on iOS. Waiting
    // for the toast to hide guarantees a clean stack.
    if (newlyUnlocked.length > 0) {
      // 'starter' fires on first tap-to-create (no value delivered yet), so skip it.
      const reviewTriggerId = newlyUnlocked.find(([id]) => id !== "starter")?.[0];

      newlyUnlocked.forEach(([achievementId, achievement]) => {
        const isTriggerer = achievementId === reviewTriggerId;
        notify.celebrate(`${achievement.name} Unlocked!`, {
          description: achievement.description,
          icon: achievement.emoji ? (
            <Text style={{ fontSize: 22 }}>{achievement.emoji}</Text>
          ) : undefined,
          onHide: isTriggerer
            ? () => triggerReview({ reason: `achievement:${achievementId}` })
            : undefined,
        });
        trackEvent("achievement_unlocked", {
          id: achievementId,
          name: achievement.name,
        });
      });
    }
  },

  // Getters
  getAchievements: () => getAllAchievements(),

  getAchievementsWithStatus: (): AchievementWithStatus[] => {
    const { unlockedAchievements } = get();
    return getAllAchievements().map((achievement) => ({
      ...achievement,
      isUnlocked: unlockedAchievements.includes(achievement.id),
    }));
  },

  getUnlockedAchievements: () => {
    const { unlockedAchievements } = get();
    return unlockedAchievements.map((id) => ACHIEVEMENTS[id]).filter(Boolean);
  },

  getLockedAchievements: () => {
    const { unlockedAchievements } = get();
    return Object.values(ACHIEVEMENTS).filter(
      (achievement) => !unlockedAchievements.includes(achievement.id)
    );
  },

  getAchievementProgress: (achievementId: string) => {
    const { counters } = get();
    const achievement = ACHIEVEMENTS[achievementId]; // O(1) access instead of find()

    if (!achievement) return 0;

    const current = counters[achievement.target as keyof GamificationCounters];
    return Math.min((current / achievement.goal) * 100, 100);
  },

  // Manual unlock for testing
  unlockAchievement: (achievementId: string) => {
    let shouldNotify = false;
    let achievement: any = null;

    set((state: AppSlice & ProgressSlice & GamificationSlice) => {
      if (!state.unlockedAchievements.includes(achievementId)) {
        achievement = ACHIEVEMENTS[achievementId]; // O(1) access instead of find()
        if (achievement) {
          state.unlockedAchievements.push(achievementId);
          shouldNotify = true;
        }
      }
    });

    // Fire celebrate notification outside the set() function if needed
    if (shouldNotify && achievement) {
      notify.celebrate(`${achievement.name} Unlocked!`, {
        description: achievement.description,
        icon: achievement.emoji ? (
          <Text style={{ fontSize: 22 }}>{achievement.emoji}</Text>
        ) : undefined,
      });
      trackEvent("achievement_unlocked", {
        id: achievementId,
        name: achievement.name,
      });
    }
  },

  // Reset all achievements and counters for debugging
  resetAchievements: () =>
    set((state: AppSlice & ProgressSlice & GamificationSlice) => {
      state.unlockedAchievements = [];
      state.counters = {
        progressCreated: 0,
        pathCreated: 0,
        goalCreated: 0,
        goalAchieved: 0,
        progressAchieved: 0,
        pathAchieved: 0,
      };
    }),
});
