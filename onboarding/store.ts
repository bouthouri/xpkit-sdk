/**
 * onboarding/store.ts — the lifecycle.
 *
 * This file is why the app-side integration is one line. `isOnboarded`, "complete →
 * hide → persist", and replay detection all live here, not in the app. Compare
 * `examples/usage/energy-xp-layout-excerpt.tsx`: the app passes screens and a
 * callback, and that is the whole contract.
 *
 * Platform-free: zustand **vanilla** (`createStore`), React-free, so it runs in a
 * browser, in RN, and in a node test. Storage is injected via `configureXPKit`.
 */

import { createStore, type StoreApi } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  getXPKitRuntime,
  notImplemented,
  xpkitStorageKey,
} from "../shared/index";
import type { OnboardingStore } from "./types";

export interface OnboardingStoreOptions {
  /** Persistence key suffix. Namespaced by `keyPrefix` → `energy-xp:onboarding`. */
  name?: string;
  /** Set false in tests and in the playground to keep runs isolated. */
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
 *         storage: createJSONStorage(() => storage),
 *       },
 *     ),
 *   )
 *
 * Hydration is asynchronous when the adapter is (AsyncStorage). `persist` exposes
 * `hasHydrated()` / `onFinishHydration` — the renderer must render nothing until
 * hydration settles, or a returning user sees a flash of slide 1 on every cold start.
 */
export function createOnboardingStore(
  options: OnboardingStoreOptions = {},
): StoreApi<OnboardingStore> {
  return notImplemented("createOnboardingStore()");
}

let singleton: StoreApi<OnboardingStore> | null = null;

/**
 * The process-wide store, created on first use.
 *
 * A singleton because `<Onboarding>` and the Settings "view onboarding again" row are
 * in different parts of the tree and must see the same state — exactly like crayons'
 * `useOnboardingStore` (`examples/onboarding/onboarding-store.ts`). Creation is lazy
 * for the same reason: `configureXPKit` has to be able to run first.
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
 *
 *   <SettingsRow label="View onboarding again" onPress={replayOnboarding} />
 */
export function replayOnboarding(): void {
  getOnboardingStore().getState().replay();
}
