/**
 * THE SPEC TEST.
 *
 * This file fails on a fresh clone. That is intentional — its failure message is your
 * first instruction:
 *
 *     NotImplementedError: applyIncrement() is not implemented — see docs/05-first-task.md
 *
 * It is not a unit test of your design. It is a replay of what Progres does today,
 * asserted against the shipped catalog in `fixtures/progres.json`. If your engine
 * passes this, a Progres user could be migrated onto it without losing a badge or
 * seeing one fire twice. Do not change the assertions to fit your implementation.
 */

import { beforeAll, describe, expect, it } from "bun:test";

import {
  applyIncrement,
  applySetCounter,
  conditionsMet,
  parseConfig,
  withStatus,
  type Achievement,
  type CounterState,
} from "../src/index.js";
import { progresRaw } from "./helpers/fixtures.js";

let catalog: readonly Achievement[];

beforeAll(() => {
  catalog = parseConfig(progresRaw).gamification.achievements;
});

/**
 * Every unlock, in the order the shipped app fires them, when a user drives each
 * counter to its highest goal one increment at a time.
 *
 * This order is not arbitrary and it is not sorted. It falls out of two facts:
 *   1. `evaluateUnlocks` returns matches in CATALOG order, and
 *   2. within a counter, the catalog already runs low goal → high goal.
 * Break either one and this list changes.
 */
const EXPECTED_UNLOCK_ORDER = [
  // progressCreated: 1, 3, 10, 25, 50
  "starter",
  "strategist",
  "planner",
  "visionary",
  "legacy_builder",
  // pathCreated: 3, 10, 25, 50
  "pathfinder",
  "trailblazer",
  "architect",
  "mapmaker",
  // goalCreated: 3, 10, 25, 50
  "goal_setter",
  "dreamweaver",
  "vision_crafter",
  "goal_engineer",
  // goalAchieved: 1, 5, 15, 50
  "achiever",
  "finisher",
  "closer",
  "goal_crusher",
  // pathAchieved: 3, 10, 25, 50
  "path_master",
  "wayfinder",
  "trail_seeker",
  "epic_explorer",
  // progressAchieved: 1, 3, 10, 25
  "progress_master",
  "hero",
  "sage",
  "eternal",
];

/** The replay: counter id → how many times it gets incremented. */
const REPLAY: ReadonlyArray<readonly [string, number]> = [
  ["progressCreated", 50],
  ["pathCreated", 50],
  ["goalCreated", 50],
  ["goalAchieved", 50],
  ["pathAchieved", 50],
  ["progressAchieved", 25],
];

interface ReplayResult {
  counters: CounterState;
  unlocked: string[];
  /** Concatenation of every `newlyUnlocked` batch, in the order they fired. */
  fired: string[];
}

function replay(
  start: { counters: CounterState; unlocked: string[] } = {
    counters: {},
    unlocked: [],
  },
): ReplayResult {
  let counters = start.counters;
  let unlocked = start.unlocked;
  const fired: string[] = [];

  for (const [variableId, times] of REPLAY) {
    for (let i = 0; i < times; i++) {
      const next = applyIncrement({ catalog, counters, unlocked, variableId });
      counters = next.counters;
      unlocked = next.unlocked;
      fired.push(...next.newlyUnlocked);
    }
  }

  return { counters, unlocked, fired };
}

describe("engine replay — the Progres catalog, as shipped", () => {
  it("unlocks exactly 25 achievements, in the documented order", () => {
    const { fired } = replay();
    expect(fired).toEqual(EXPECTED_UNLOCK_ORDER);
    expect(fired).toHaveLength(25);
  });

  it("leaves the whole catalog unlocked and nothing duplicated", () => {
    const { unlocked } = replay();
    expect(unlocked).toHaveLength(catalog.length);
    expect(new Set(unlocked).size).toBe(unlocked.length);
  });

  it("fires nothing on a second run over already-unlocked state", () => {
    const first = replay();
    // Same 275 increments again, starting from the completed state.
    const second = replay({ counters: first.counters, unlocked: first.unlocked });

    expect(second.fired).toEqual([]);
    expect(second.unlocked).toEqual(first.unlocked);
  });

  it("counts every increment — counters end at the replayed totals", () => {
    const { counters } = replay();
    expect(counters).toEqual({
      progressCreated: 50,
      pathCreated: 50,
      goalCreated: 50,
      goalAchieved: 50,
      pathAchieved: 50,
      progressAchieved: 25,
    });
  });

  it("does not mutate the state it is handed", () => {
    const counters: CounterState = { progressCreated: 0 };
    const unlocked: string[] = [];

    applyIncrement({ catalog, counters, unlocked, variableId: "progressCreated" });

    expect(counters).toEqual({ progressCreated: 0 });
    expect(unlocked).toEqual([]);
  });
});

describe(">= not ==", () => {
  it("a single jump to 50 unlocks the whole path series at once, in catalog order", () => {
    // This is what a data import looks like. `==` would unlock only `mapmaker` and
    // silently lose the other three forever.
    const result = applySetCounter({
      catalog,
      counters: {},
      unlocked: [],
      variableId: "pathCreated",
      value: 50,
    });

    expect(result.newlyUnlocked).toEqual([
      "pathfinder",
      "trailblazer",
      "architect",
      "mapmaker",
    ]);
  });

  it("an increment of 25 in one call is the same as 25 increments of 1", () => {
    const bulk = applyIncrement({
      catalog,
      counters: {},
      unlocked: [],
      variableId: "progressCreated",
      by: 25,
    });

    let counters: CounterState = {};
    let unlocked: string[] = [];
    const fired: string[] = [];
    for (let i = 0; i < 25; i++) {
      const next = applyIncrement({
        catalog,
        counters,
        unlocked,
        variableId: "progressCreated",
      });
      counters = next.counters;
      unlocked = next.unlocked;
      fired.push(...next.newlyUnlocked);
    }

    expect(bulk.newlyUnlocked).toEqual(fired);
    expect(bulk.counters).toEqual(counters);
  });
});

describe("conditions", () => {
  it("an achievement with no conditions never unlocks", () => {
    const orphan: Achievement = {
      ...catalog[0],
      id: "orphan",
      conditions: [],
    };
    expect(conditionsMet(orphan, { progressCreated: 9999 })).toBe(false);
  });

  it("ANDs multiple conditions", () => {
    const both: Achievement = {
      ...catalog[0],
      id: "both",
      conditions: [
        { variableId: "progressCreated", operator: ">=", threshold: 3 },
        { variableId: "pathCreated", operator: ">=", threshold: 3 },
      ],
    };

    expect(conditionsMet(both, { progressCreated: 3 })).toBe(false);
    expect(conditionsMet(both, { progressCreated: 3, pathCreated: 2 })).toBe(false);
    expect(conditionsMet(both, { progressCreated: 3, pathCreated: 3 })).toBe(true);
  });

  it("treats a missing counter as 0", () => {
    expect(conditionsMet(catalog[0], {})).toBe(false);
  });
});

describe("withStatus — what a grid renders", () => {
  it("returns the catalog in order, with status and clamped progress", () => {
    const rows = withStatus({
      catalog,
      counters: { progressCreated: 3 },
      unlocked: ["starter", "strategist"],
    });

    expect(rows).toHaveLength(catalog.length);
    expect(rows.map((r) => r.id)).toEqual(catalog.map((a) => a.id));

    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get("starter")?.isUnlocked).toBe(true);
    expect(byId.get("starter")?.progress).toBe(100);
    expect(byId.get("planner")?.isUnlocked).toBe(false);
    // 3 of 10 progress trackers created.
    expect(byId.get("planner")?.progress).toBeCloseTo(30);
    // Nothing exceeds 100, even at 3/1.
    expect(rows.every((r) => r.progress >= 0 && r.progress <= 100)).toBe(true);
  });
});
