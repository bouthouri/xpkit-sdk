// from progres/apps/mobile/components/achievements/types.ts — READ ONLY
import { AchievementWithStatus } from "../../store/gamification/types";

// Re-export for component use
export type Achievement = AchievementWithStatus;

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export interface GamificationState {
  unlockedAchievements: string[]; // Array of achievement IDs
  lastCheckedTimestamp: number;
}
