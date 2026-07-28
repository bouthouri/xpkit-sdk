/**
 * The three-line renderer hook. This — and the platform bits — is all a renderer adds
 * on top of the platform-free vanilla store.
 *
 * `native/use-store.ts` is byte-identical. That is the point.
 */

import { useStore as useZustandStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import type { AchievementsStore } from "../types";

export function useAchievementsStore<T>(
  store: StoreApi<AchievementsStore>,
  selector: (state: AchievementsStore) => T,
): T {
  return useZustandStore(store, selector);
}
