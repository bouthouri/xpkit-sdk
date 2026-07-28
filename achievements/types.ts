/**
 * achievements/ — types.
 *
 * Platform-free. Derived from the v1 schema so there is exactly one definition of
 * an achievement in this repo, and it is the one the editor emits.
 */

import type {
  Achievement,
  Condition,
  GamificationConfig,
  Milestone,
  Variable,
} from "../shared/index";

export type { Achievement, Condition, GamificationConfig, Milestone, Variable };

/**
 * `variableId` → current value. Progres's six counters, as data.
 *
 * A missing key reads as 0. Do not pre-seed this from the catalog — a fresh user's
 * state should be `{}`, not six zeros, so persisted state stays small and adding a
 * counter later is not a migration.
 */
export type CounterState = Record<string, number>;

/** Everything achievements persist. Note what is NOT here: the catalog. */
export interface AchievementsState {
  counters: CounterState;
  /**
   * Unlocked achievement ids, in unlock order.
   *
   * This array IS the user's badge collection. Ids come from the config and are
   * frozen forever (Rule 2) — see examples/usage/energy-xp-onboarding-migration.ts
   * for what it costs to rename a persisted key after users exist.
   */
  unlocked: string[];
}

export interface AchievementsActions {
  /** Bump a counter by `by` (default 1), then evaluate the whole catalog. */
  increment: (variableId: string, by?: number) => string[];
  /** Set a counter outright. Used by data import, which can jump many thresholds. */
  setCounter: (variableId: string, value: number) => string[];
  /** Debug/testing only. Clears counters and unlocks. */
  reset: () => void;
}

export type AchievementsStore = AchievementsState & AchievementsActions;

/** What `applyIncrement` returns: the next state plus what just fired. */
export interface IncrementResult extends AchievementsState {
  /** Ids unlocked by THIS call, in catalog order. Empty is the common case. */
  newlyUnlocked: string[];
}

/** An achievement plus its unlock status — what a grid renders. */
export interface AchievementWithStatus extends Achievement {
  isUnlocked: boolean;
  /** 0-100, clamped. Progress toward the first unmet condition. */
  progress: number;
}
