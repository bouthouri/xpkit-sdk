/**
 * The three-line renderer hook. `native/use-store.ts` is byte-identical — the store is
 * platform-free, only the markup differs.
 */

import { useStore as useZustandStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import type { OnboardingStore } from "../types";

export function useOnboardingStore<T>(
  store: StoreApi<OnboardingStore>,
  selector: (state: OnboardingStore) => T,
): T {
  return useZustandStore(store, selector);
}
