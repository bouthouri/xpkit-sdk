// from crayons@0.0.194 — utils/onboarding-store.ts — READ ONLY
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist } from "zustand/middleware";
import * as Application from "expo-application";
import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

interface OnboardingState {
  isOnboarded: boolean;
  lastSeenVersion: string | null;
}

interface OnboardingActions {
  complete: () => void;
  reset: () => void;
  setLastSeenVersion: (version: string) => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

interface OnboardingStoreConfig {
  storageKey?: string;
  storage?: StateStorage | false;
  persist?: boolean;
  initialState?: Partial<OnboardingState>;
}

const currentVersion = Application.nativeApplicationVersion;

let store: UseBoundStore<StoreApi<OnboardingStore>> | null = null;
let config: OnboardingStoreConfig = {};
let configured = false;

const createDefaultStorage = (): StateStorage => {
  const mmkv = new MMKV();
  return {
    setItem: (name: string, value: string) => mmkv.set(name, value),
    getItem: (name: string) => mmkv.getString(name) ?? null,
    removeItem: (name: string) => mmkv.delete(name),
  };
};

const getDefaultKey = () =>
  `${Application.applicationId ?? "app"}-onboarding-store`;

const createStore = () => {
  const shouldPersist = config.persist !== false;
  const defaults = {
    isOnboarded: config.initialState?.isOnboarded ?? false,
    lastSeenVersion: config.initialState?.lastSeenVersion ?? null,
  };

  if (!shouldPersist) {
    return create<OnboardingStore>()(
      immer((set) => ({
        isOnboarded: defaults.isOnboarded,
        lastSeenVersion: defaults.lastSeenVersion,
        complete: () =>
          set((state) => {
            state.isOnboarded = true;
            state.lastSeenVersion = currentVersion;
          }),
        reset: () =>
          set((state) => {
            state.isOnboarded = false;
          }),
        setLastSeenVersion: (version: string) =>
          set((state) => {
            state.lastSeenVersion = version;
          }),
      }))
    );
  }

  const storageKey = config.storageKey ?? getDefaultKey();
  const storage =
    config.storage === false
      ? undefined
      : config.storage ?? createDefaultStorage();

  return create<OnboardingStore>()(
    persist(
      immer((set) => ({
        isOnboarded: defaults.isOnboarded,
        lastSeenVersion: defaults.lastSeenVersion,
        complete: () =>
          set((state) => {
            state.isOnboarded = true;
            state.lastSeenVersion = currentVersion;
          }),
        reset: () =>
          set((state) => {
            state.isOnboarded = false;
          }),
        setLastSeenVersion: (version: string) =>
          set((state) => {
            state.lastSeenVersion = version;
          }),
      })),
      {
        name: storageKey,
        ...(storage ? { storage: createJSONStorage(() => storage) } : {}),
      }
    )
  );
};

const getStore = () => {
  if (!store) {
    store = createStore();
  }
  return store;
};

export const useOnboardingStore: UseBoundStore<StoreApi<OnboardingStore>> & {
  configure: (options: OnboardingStoreConfig) => void;
} = Object.assign(
  (...args: Parameters<UseBoundStore<StoreApi<OnboardingStore>>>) =>
    getStore()(...args),
  {
    getState: () => getStore().getState(),
    setState: (...args: Parameters<StoreApi<OnboardingStore>["setState"]>) =>
      getStore().setState(...args),
    subscribe: (
      ...args: Parameters<StoreApi<OnboardingStore>["subscribe"]>
    ) => getStore().subscribe(...args),
    getInitialState: () => getStore().getInitialState(),
    configure: (options: OnboardingStoreConfig) => {
      if (store) {
        console.warn(
          "[useOnboardingStore] configure() called after store was already created. Config ignored."
        );
        return;
      }
      config = options;
      configured = true;
    },
  }
) as any;

export type { OnboardingStoreConfig, OnboardingStore };
