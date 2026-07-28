/**
 * achievements/store.ts — the persisted store.
 *
 * Platform-free: this is zustand **vanilla** (`createStore`), which is React-free, so
 * the same store instance works in a browser page, in a React Native app, and in a
 * node test. Each renderer adds its own three-line `useStore` hook on top — see
 * `web/use-store.ts`.
 *
 * Storage is INJECTED, never implemented here. `configureXPKit({ storage })` decides
 * where bytes land; MMKV, AsyncStorage and localStorage all satisfy the same
 * interface because zustand's `persist` middleware awaits every method.
 */

import { createStore, type StoreApi } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  getXPKitRuntime,
  notImplemented,
  xpkitStorageKey,
} from "../shared/index";
import type { Achievement, AchievementsStore } from "./types";

export interface AchievementsStoreOptions {
  /**
   * The achievements from a parsed config, in display order.
   * NOT persisted — the catalog comes from the config on every launch. Only the
   * user's counters and unlocked ids are persisted.
   */
  catalog: readonly Achievement[];
  /** Persistence key suffix. Namespaced by `keyPrefix`, so `energy-xp:achievements`. */
  name?: string;
  /** Set false in tests and in the playground to keep runs isolated. */
  persist?: boolean;
}

/**
 * Build the store.
 *
 * What it must do:
 *  1. Hold `{ counters: {}, unlocked: [] }` as initial state.
 *  2. `increment(variableId, by?)` → call `applyIncrement`, commit the new state,
 *     return `newlyUnlocked` so the caller can fire toasts. Returning the ids rather
 *     than firing anything here is what keeps the store platform-free — a browser has
 *     no haptics and no `notify.celebrate`.
 *  3. `setCounter(variableId, value)` → same, via `applySetCounter`.
 *  4. `reset()` → back to `{ counters: {}, unlocked: [] }`.
 *  5. Persist ONLY `counters` and `unlocked` (use `partialize`). Never persist the
 *     catalog; a config change must be able to add badges without a migration.
 *
 * Wiring you'll need — `persist` + `createJSONStorage` around the injected adapter:
 *
 *   const { storage } = getXPKitRuntime();
 *   createStore<AchievementsStore>()(
 *     persist(
 *       (set, get) => ({ ...state, ...actions }),
 *       {
 *         name: xpkitStorageKey(options.name ?? "achievements"),
 *         storage: createJSONStorage(() => storage),
 *         partialize: ({ counters, unlocked }) => ({ counters, unlocked }),
 *       },
 *     ),
 *   )
 *
 * `persist: false` should skip the middleware entirely rather than pass a null
 * storage — see `examples/onboarding/onboarding-store.ts`, which does exactly that.
 */
export function createAchievementsStore(
  options: AchievementsStoreOptions,
): StoreApi<AchievementsStore> {
  return notImplemented("createAchievementsStore()");
}
