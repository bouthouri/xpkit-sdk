/**
 * achievements/store.ts — the persisted store.
 *
 * Platform-free: this is zustand **vanilla** (`createStore`), so the same store
 * instance works in a browser page, in an app runtime, and in a node test. Each renderer
 * adds its own thin hook on top.
 *
 * Storage is INJECTED, never implemented here. `configureXPKit({ storage })` decides
 * where bytes land; any StorageAdapter works, sync or async, because zustand's `persist`
 * middleware awaits every method (adapted via `toStateStorage`).
 */

import { createStore, type StoreApi } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  applyIncrement,
  applySetCounter,
  type AchievementsStore,
} from "./achievements.js";
import { getXPKitRuntime, xpkitStorageKey } from "./runtime.js";
import type { Achievement } from "./schema.js";
import { toStateStorage } from "./storage.js";

export interface AchievementsStoreOptions {
  /**
   * The achievements from a parsed config, in display order.
   * NOT persisted — the catalog comes from the config on every launch. Only the
   * user's counters and unlocked ids are persisted.
   */
  catalog: readonly Achievement[];
  /** Persistence key suffix. Namespaced by `keyPrefix`, so `energy-xp:achievements`. */
  name?: string;
  /** Set false in tests to keep runs isolated. */
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
 *         storage: createJSONStorage(() => toStateStorage(storage)),
 *         partialize: ({ counters, unlocked }) => ({ counters, unlocked }),
 *       },
 *     ),
 *   )
 *
 * `persist: false` skips the middleware entirely rather than passing a null storage.
 */
export function createAchievementsStore(
  options: AchievementsStoreOptions,
): StoreApi<AchievementsStore> {
  const { catalog } = options;

  const initializer = (
    set: (partial: Partial<AchievementsStore>) => void,
    get: () => AchievementsStore,
  ): AchievementsStore => ({
    counters: {},
    unlocked: [],
    increment: (variableId, by) => {
      const { counters, unlocked } = get();
      const next = applyIncrement({ catalog, counters, unlocked, variableId, by });
      set({ counters: next.counters, unlocked: next.unlocked });
      return next.newlyUnlocked;
    },
    setCounter: (variableId, value) => {
      const { counters, unlocked } = get();
      const next = applySetCounter({ catalog, counters, unlocked, variableId, value });
      set({ counters: next.counters, unlocked: next.unlocked });
      return next.newlyUnlocked;
    },
    reset: () => set({ counters: {}, unlocked: [] }),
  });

  if (options.persist === false) {
    return createStore<AchievementsStore>()(initializer);
  }

  const { storage } = getXPKitRuntime();
  return createStore<AchievementsStore>()(
    persist(initializer, {
      name: xpkitStorageKey(options.name ?? "achievements"),
      storage: createJSONStorage(() => toStateStorage(storage)),
      // Only the user's progress. The catalog comes from config on every launch.
      partialize: ({ counters, unlocked }) => ({ counters, unlocked }),
    }),
  );
}
