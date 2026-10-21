/**
 * onboarding/store.ts — the lifecycle.
 *
 * `isOnboarded`, "complete → hide → persist", and replay detection all live here,
 * not in the app: the app passes screens and a callback, and that is the whole contract.
 *
 * Platform-free: zustand **vanilla** (`createStore`), so it runs in a
 * browser, in an app runtime, and in a node test. Storage is injected via `configureXPKit`.
 */

import { createStore, type StoreApi } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";

import type { OnboardingStore } from "./onboarding.js";
import { getXPKitRuntime, xpkitStorageKey } from "./runtime.js";
import { toStateStorage } from "./storage.js";

export interface OnboardingStoreOptions {
  /** Persistence key suffix. Namespaced by `keyPrefix` → `energy-xp:onboarding`. */
  name?: string;
  /** Set false in tests to keep runs isolated. */
  persist?: boolean;
}

/**
 * Build the store.
 *
 * State: `{ isOnboarded: false, lastSeenVersion: null }`.
 *
 * Actions:
 *  - `complete()` → `isOnboarded = true`, `lastSeenVersion = getXPKitRuntime().appVersion`
 *  - `replay()`   → `isOnboarded = false`, **leave `lastSeenVersion` alone**. That
 *                   asymmetry is the whole replay mechanism; see types.ts.
 *  - `reset()`    → both back to initial, so the next launch is a true first run
 *
 * Persist both fields. Wiring:
 *
 *   const { storage } = getXPKitRuntime();
 *   createStore<OnboardingStore>()(
 *     persist(
 *       (set) => ({ ... }),
 *       {
 *         name: xpkitStorageKey(options.name ?? "onboarding"),
 *         storage: createJSONStorage(() => toStateStorage(storage)),
 *       },
 *     ),
 *   )
 *
 * Hydration is asynchronous when the adapter is. `persist` exposes
 * `hasHydrated()` / `onFinishHydration` — the renderer must render nothing until
 * hydration settles, or a returning user sees a flash of slide 1 on every cold start.
 */
export function createOnboardingStore(
  options: OnboardingStoreOptions = {},
): StoreApi<OnboardingStore> {
  const initializer = (
    set: (partial: Partial<OnboardingStore>) => void,
  ): OnboardingStore => ({
    isOnboarded: false,
    lastSeenVersion: null,
    complete: () =>
      set({ isOnboarded: true, lastSeenVersion: getXPKitRuntime().appVersion }),
    replay: () => set({ isOnboarded: false }),
    reset: () => set({ isOnboarded: false, lastSeenVersion: null }),
  });

  if (options.persist === false) {
    return createStore<OnboardingStore>()(initializer);
  }

  const { storage } = getXPKitRuntime();
  return createStore<OnboardingStore>()(
    persist(initializer, {
      name: xpkitStorageKey(options.name ?? "onboarding"),
      storage: createJSONStorage(() => toStateStorage(storage)),
    }),
  );
}

let singleton: StoreApi<OnboardingStore> | null = null;

/**
 * The process-wide store, created on first use.
 *
 * A singleton because the onboarding view and the Settings "view onboarding again" row
 * are in different parts of the app and must see the same state. Creation is lazy
 * so that `configureXPKit` can run first.
 */
export function getOnboardingStore(): StoreApi<OnboardingStore> {
  if (!singleton) singleton = createOnboardingStore();
  return singleton;
}

/** Test-only. Drops the singleton so the next call builds a fresh store. */
export function resetOnboardingStoreForTests(): void {
  singleton = null;
}

/**
 * Re-show onboarding. Wire this straight to the Settings row — no other state needed.
 */
export function replayOnboarding(): void {
  getOnboardingStore().getState().replay();
}
