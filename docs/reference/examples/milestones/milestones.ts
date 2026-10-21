// from karv/apps/mobile/utils/milestones.ts — READ ONLY
export type MilestoneTier = "momentum" | "shift" | "mastery";

export interface MilestoneInfo {
  count: number;
  level: number;
  reductionPercent: number;
  label: string;
  tier: MilestoneTier;
  hint: string;
}

export interface PendingMilestone {
  habitId: string;
  habitName: string;
  currentEnergy: number;
  completionCount: number;
  milestone: MilestoneInfo;
}

export interface EnergyHistoryEntry {
  milestone: number;
  energyBefore: number;
}

export const MILESTONES: MilestoneInfo[] = [
  {
    count: 3,
    level: 0,
    reductionPercent: 0,
    label: "First Spark",
    tier: "momentum",
    hint: "You've beaten the hardest part - starting. Your brain now recognizes this as a pattern.",
  },
  {
    count: 7,
    level: 1,
    reductionPercent: 0,
    label: "Week Anchor",
    tier: "momentum",
    hint: "A full week! Your brain is building new neural pathways for this habit.",
  },
  {
    count: 14,
    level: 2,
    reductionPercent: 0,
    label: "The Shift",
    tier: "shift",
    hint: "Two weeks in - your body has physically adapted. The resistance you felt on day 1 is lower. If it feels easier, consider adjusting the energy.",
  },
  {
    count: 21,
    level: 3,
    reductionPercent: 25,
    label: "The Groove",
    tier: "mastery",
    hint: "Your brain just automated this. It moved from effortful thinking to autopilot - that's real neurological change.",
  },
  {
    count: 50,
    level: 4,
    reductionPercent: 50,
    label: "Second Nature",
    tier: "mastery",
    hint: "This is now unconscious competence. You do it without thinking. Be careful not to go on autopilot - keep paying attention to quality.",
  },
  {
    count: 66,
    level: 5,
    reductionPercent: 75,
    label: "Autopilot",
    tier: "mastery",
    hint: "Science says 66 days is the median for full automaticity. This habit is now wired into who you are.",
  },
  {
    count: 100,
    level: 6,
    reductionPercent: 100,
    label: "Carved",
    tier: "mastery",
    hint: "100 times. You didn't just build a habit - you carved it into your identity. This is mastery.",
  },
];

export const MASTERY_THRESHOLD = 100;

/**
 * Returns the milestone info if completionCount exactly matches a milestone threshold.
 * Only exact matches trigger (not "at or above").
 */
export function getMilestone(completionCount: number): MilestoneInfo | null {
  const milestone = MILESTONES.find((m) => m.count === completionCount);
  return milestone || null;
}

/**
 * Calculates suggested new energy after milestone is reached.
 * Uses Math.round for clean numbers.
 */
export function calculateSuggestedEnergy(currentEnergy: number, milestone: MilestoneInfo): number {
  return Math.max(0, Math.round(currentEnergy * (1 - milestone.reductionPercent / 100)));
}

/**
 * Returns true if the habit has reached mastery level (completionCount >= 100).
 */
export function isMastered(completionCount: number): boolean {
  return completionCount >= MASTERY_THRESHOLD;
}

/**
 * Returns true if the habit has ever been carved (peakCompletionCount >= 100).
 * Once carved, this is permanent even if completionCount decays.
 */
export function isCarved(peakCompletionCount: number): boolean {
  return peakCompletionCount >= MASTERY_THRESHOLD;
}

/**
 * Returns the highest milestone that has been reached (completionCount >= milestone.count),
 * or null if none reached.
 */
export function getCurrentLevel(completionCount: number): MilestoneInfo | null {
  const reachedMilestones = MILESTONES.filter((m) => completionCount >= m.count);

  if (reachedMilestones.length === 0) return null;

  return reachedMilestones[reachedMilestones.length - 1];
}

/**
 * Given an energyHistory and a completionCount that just dropped below a milestone,
 * returns the energy to restore to. Finds the lowest milestone the user dropped below
 * and restores energy from before that milestone was applied.
 */
export function getEnergyAfterDelevel(
  completionCount: number,
  energyHistory: EnergyHistoryEntry[],
): number | null {
  // Find milestones the user has dropped below (mastery tier only, since momentum/shift don't change energy)
  const masteryMilestones = MILESTONES.filter((m) => m.tier === "mastery" || m.tier === "shift");

  // Find the lowest milestone the user is now below that has an energy history entry
  for (const milestone of masteryMilestones) {
    if (completionCount < milestone.count) {
      const entry = energyHistory.find((e) => e.milestone === milestone.count);
      if (entry) {
        return entry.energyBefore;
      }
    }
  }

  return null;
}
