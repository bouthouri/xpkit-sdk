// from progres/apps/mobile/store/gamification/types.ts — READ ONLY
// Gamification interfaces
export interface GamificationCounters {
  progressCreated: number;
  pathCreated: number;
  goalCreated: number;
  goalAchieved: number;
  progressAchieved: number;
  pathAchieved: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  target: keyof GamificationCounters;
  goal: number;
}

// Achievement with unlock status for UI components
export interface AchievementWithStatus extends Achievement {
  isUnlocked: boolean;
}

export interface GamificationSlice {
  // State
  counters: GamificationCounters;
  unlockedAchievements: string[];

  // Actions
  incrementCounter: (counterKey: keyof GamificationCounters) => void;
  unlockAchievement: (achievementId: string) => void;
  resetAchievements: () => void;

  // Getters
  getAchievements: () => Achievement[];
  getAchievementsWithStatus: () => AchievementWithStatus[];
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getAchievementProgress: (achievementId: string) => number;
}
