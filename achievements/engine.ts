/**
 * achievements/engine.ts — the unlock engine.
 *
 * Platform-free, and deliberately PURE: no store, no persistence, no notifications.
 * State in, state out. That is what makes `engine.test.ts` able to replay a whole
 * user's history in a millisecond, and what lets the same engine run behind Zustand
 * (Progres), LiveStore (Karv), or a browser page.
 *
 * The behaviour you are reproducing is in
 * `examples/achievements/gamification-slice.tsx` — `incrementCounter`. Read it first.
 * The three details that matter, and why, are in docs/03-achievements-explained.md.
 *
 * Every function below throws until you write it. `achievements/engine.test.ts`
 * fails on a fresh clone; its failure message is your first instruction.
 */

import { notImplemented } from "../shared/index";
import type {
  Achievement,
  AchievementWithStatus,
  Condition,
  CounterState,
  IncrementResult,
} from "./types";

/** Missing counter reads as 0. Already implemented — you'll want it constantly. */
export function counterValue(counters: CounterState, variableId: string): number {
  return counters[variableId] ?? 0;
}

/**
 * Is a single condition satisfied by the current counters?
 *
 * All six operators in the schema must work (`>=`, `>`, `==`, `<`, `<=`, `!=`), even
 * though every achievement shipping today uses `>=`. The editor can emit the others.
 */
export function conditionMet(
  condition: Condition,
  counters: CounterState,
): boolean {
  return notImplemented("conditionMet()");
}

/**
 * Is an achievement's whole condition set satisfied? **AND** over all conditions.
 *
 * Edge case that is not an edge case: `conditions: []`. An achievement with no
 * conditions must NEVER unlock — an empty AND is vacuously true in logic, but here it
 * would mean a half-configured badge silently fires for every user on first launch.
 */
export function conditionsMet(
  achievement: Achievement,
  counters: CounterState,
): boolean {
  return notImplemented("conditionsMet()");
}

/**
 * Scan the whole catalog and return the ids that should unlock NOW but haven't yet.
 *
 * Two requirements:
 *  - **Catalog order.** Return them in the order they appear in `catalog`, not
 *    sorted, not reversed. The order is what the user sees in a toast queue, and it
 *    is asserted in the spec test.
 *  - **Full scan, every time.** Do not try to be clever and only check achievements
 *    touching the counter that changed. Conditions can span variables.
 */
export function evaluateUnlocks(input: {
  catalog: readonly Achievement[];
  counters: CounterState;
  unlocked: readonly string[];
}): string[] {
  return notImplemented("evaluateUnlocks()");
}

/**
 * The reducer. Bump one counter, then evaluate.
 *
 * Must be pure — do not mutate `input.counters` or `input.unlocked`. The caller keeps
 * the old state; a store will hand you its current state and expect a new object.
 *
 * `by` defaults to 1 and may be greater. A data import that takes `pathCreated` from
 * 0 to 50 in one call has to unlock all four path badges, in catalog order, in that
 * one call. That is why the comparison is `>=` and not `==`.
 */
export function applyIncrement(input: {
  catalog: readonly Achievement[];
  counters: CounterState;
  unlocked: readonly string[];
  variableId: string;
  by?: number;
}): IncrementResult {
  return notImplemented("applyIncrement()");
}

/**
 * Same as applyIncrement but sets the counter outright. Import/restore uses this.
 */
export function applySetCounter(input: {
  catalog: readonly Achievement[];
  counters: CounterState;
  unlocked: readonly string[];
  variableId: string;
  value: number;
}): IncrementResult {
  return notImplemented("applySetCounter()");
}

/**
 * Decorate the catalog for display: unlock status + 0-100 progress.
 *
 * Progres computes progress as `min(current / goal * 100, 100)` against its single
 * condition (`examples/achievements/gamification-slice.tsx`, `getAchievementProgress`).
 * Generalise that to N conditions however you can defend — the least-complete
 * condition is the obvious choice. Locked achievements still get a real progress
 * number; the renderer decides whether to show it.
 */
export function withStatus(input: {
  catalog: readonly Achievement[];
  counters: CounterState;
  unlocked: readonly string[];
}): AchievementWithStatus[] {
  return notImplemented("withStatus()");
}
