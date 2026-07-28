// from progres/apps/mobile/store/gamification/config.ts — READ ONLY
import { Achievement } from "./types";

/**
 * ACHIEVEMENT CATALOG
 * ─────────────────────────────────────────────────────────────────────────
 * 25 badges driven by 6 integer counters. A badge unlocks when its target
 * counter first reaches its goal value.
 *
 * Counters (state.counters) & what increments each:
 *   progressCreated   addProgres()                ProgressSlice.ts:46
 *   pathCreated       addPath()                   ProgressSlice.ts:143
 *   goalCreated       updatePath() adds .goal     ProgressSlice.ts:166
 *   goalAchieved      score crosses .goal OR a    ProgressSlice.ts:177,199
 *                     number-path milestone
 *   pathAchieved      markStepAsDone() finishes   ProgressSlice.ts:306
 *                     the last step of a path
 *   progressAchieved  markStepAsDone() crosses    ProgressSlice.ts:314
 *                     progres percentage 100
 *
 * Unlock evaluation: gamification-slice.ts:32 (incrementCounter).
 *
 * How to test in simulator:
 *   1. Settings → long-press version footer → Debug Console → "Reset
 *      achievements" (if missing, use the resetAchievements() action).
 *   2. Create 3 progres → 3 paths of each type per progres → complete
 *      one path of each type. Watch the Metro console for counter bumps
 *      and unlock lines.
 *   3. Compare against the goals below. Every bump and unlock must
 *      match.
 *
 * When adding a new achievement: pick an existing counter (or wire a new
 * one), pick a goal, add an entry here. Richer docs live in
 * /apps/mobile/docs/achievements.md.
 */
export const ACHIEVEMENTS: Record<string, Achievement> = {
  // ── Progress Creation ───────────────────────────────────────────────
  starter: {
    id: "starter",
    name: "Starter",
    description: "Create your 1st progress tracker",
    emoji: "🌱",
    target: "progressCreated",
    goal: 1,
  },
  strategist: {
    id: "strategist",
    name: "Strategist",
    description: "Create 3 progress trackers",
    emoji: "🧠",
    target: "progressCreated",
    goal: 3,
  },
  planner: {
    id: "planner",
    name: "Planner",
    description: "Create 10 progress trackers",
    emoji: "📋",
    target: "progressCreated",
    goal: 10,
  },
  visionary: {
    id: "visionary",
    name: "Visionary",
    description: "Create 25 progress trackers",
    emoji: "🔭",
    target: "progressCreated",
    goal: 25,
  },
  legacy_builder: {
    id: "legacy_builder",
    name: "Legacy Builder",
    description: "Create 50 progress trackers",
    emoji: "🏛️",
    target: "progressCreated",
    goal: 50,
  },

  // ── Path Creation ───────────────────────────────────────────────────
  pathfinder: {
    id: "pathfinder",
    name: "Pathfinder",
    description: "Create 3 paths",
    emoji: "🛤️",
    target: "pathCreated",
    goal: 3,
  },
  trailblazer: {
    id: "trailblazer",
    name: "Trailblazer",
    description: "Create 10 paths",
    emoji: "🔥",
    target: "pathCreated",
    goal: 10,
  },
  architect: {
    id: "architect",
    name: "Architect",
    description: "Design 25 paths to your goals",
    emoji: "🏗️",
    target: "pathCreated",
    goal: 25,
  },
  mapmaker: {
    id: "mapmaker",
    name: "Mapmaker",
    description: "Craft 50 detailed paths",
    emoji: "🗺️",
    target: "pathCreated",
    goal: 50,
  },

  // ── Goal Creation ───────────────────────────────────────────────────
  goal_setter: {
    id: "goal_setter",
    name: "Goal Setter",
    description: "Create 3 goals",
    emoji: "🧱",
    target: "goalCreated",
    goal: 3,
  },
  dreamweaver: {
    id: "dreamweaver",
    name: "Dreamweaver",
    description: "Create 10 goals",
    emoji: "✨",
    target: "goalCreated",
    goal: 10,
  },
  vision_crafter: {
    id: "vision_crafter",
    name: "Vision Crafter",
    description: "Create 25 goals",
    emoji: "🔨",
    target: "goalCreated",
    goal: 25,
  },
  goal_engineer: {
    id: "goal_engineer",
    name: "Goal Engineer",
    description: "Create 50 goals",
    emoji: "🏛️",
    target: "goalCreated",
    goal: 50,
  },

  // ── Goal Completion ─────────────────────────────────────────────────
  achiever: {
    id: "achiever",
    name: "Achiever",
    description: "Complete your 1st goal",
    emoji: "👣",
    target: "goalAchieved",
    goal: 1,
  },
  finisher: {
    id: "finisher",
    name: "Finisher",
    description: "Complete 5 goals",
    emoji: "🏁",
    target: "goalAchieved",
    goal: 5,
  },
  closer: {
    id: "closer",
    name: "Closer",
    description: "Complete 15 goals",
    emoji: "🎯",
    target: "goalAchieved",
    goal: 15,
  },
  goal_crusher: {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Complete 50 goals",
    emoji: "⚔️",
    target: "goalAchieved",
    goal: 50,
  },

  // ── Path Completion ─────────────────────────────────────────────────
  path_master: {
    id: "path_master",
    name: "Path Master",
    description: "Complete 3 paths",
    emoji: "🌟",
    target: "pathAchieved",
    goal: 3,
  },
  wayfinder: {
    id: "wayfinder",
    name: "Wayfinder",
    description: "Complete 10 paths",
    emoji: "🧭",
    target: "pathAchieved",
    goal: 10,
  },
  trail_seeker: {
    id: "trail_seeker",
    name: "Trail Seeker",
    description: "Complete 25 paths",
    emoji: "🔥",
    target: "pathAchieved",
    goal: 25,
  },
  epic_explorer: {
    id: "epic_explorer",
    name: "Epic Explorer",
    description: "Complete 50 paths",
    emoji: "🚀",
    target: "pathAchieved",
    goal: 50,
  },

  // ── Progress Completion ─────────────────────────────────────────────
  progress_master: {
    id: "progress_master",
    name: "Progress Master",
    description: "Complete your 1st full progress",
    emoji: "💫",
    target: "progressAchieved",
    goal: 1,
  },
  hero: {
    id: "hero",
    name: "Hero",
    description: "Complete 3 full progress trackers",
    emoji: "🦸",
    target: "progressAchieved",
    goal: 3,
  },
  sage: {
    id: "sage",
    name: "Sage",
    description: "Complete 10 full progress trackers",
    emoji: "🧘",
    target: "progressAchieved",
    goal: 10,
  },
  eternal: {
    id: "eternal",
    name: "Eternal",
    description: "Complete 25 full progress trackers",
    emoji: "🏆",
    target: "progressAchieved",
    goal: 25,
  },
};

// Helper to get all achievements as array when needed
export const getAllAchievements = (): Achievement[] =>
  Object.values(ACHIEVEMENTS);
