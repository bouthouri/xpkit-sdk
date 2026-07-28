// from energy-xp/apps/mobile/utils/onboarding-migration.ts — READ ONLY
/**
 * One-time migration from old onboarding store to crayons V2 onboarding store.
 * Must be imported BEFORE any crayons imports in _layout.tsx so configure() runs
 * before the store is instantiated.
 */
import { MMKV } from "react-native-mmkv";
import * as Application from "expo-application";
import { useOnboardingStore } from "@bouthouri/crayons";

const MIGRATION_FLAG = "energy-xp-onboarding-migrated";
const OLD_ONBOARDING_KEY = "energy-xp-onboarding-store";
const OLD_MAIN_STORE_KEY = "energy-xp-store";

const mmkv = new MMKV();

if (!mmkv.getString(MIGRATION_FLAG)) {
  let isOnboarded = false;
  let lastSeenVersion: string | null = null;

  // Primary signal: old onboarding store
  const oldOnboarding = mmkv.getString(OLD_ONBOARDING_KEY);
  if (oldOnboarding) {
    try {
      const parsed = JSON.parse(oldOnboarding);
      if (parsed?.state?.shouldDisplayOnboarding === false) {
        isOnboarded = true;
        lastSeenVersion = parsed.state.lastSeenVersion ?? null;
      }
    } catch {}
  }

  // Fallback: main store has tasks and displayOnboarding === false
  if (!isOnboarded) {
    const oldMain = mmkv.getString(OLD_MAIN_STORE_KEY);
    if (oldMain) {
      try {
        const parsed = JSON.parse(oldMain);
        const state = parsed?.state;
        if (
          state?.displayOnboarding === false &&
          Array.isArray(state?.tasks) &&
          state.tasks.length > 0
        ) {
          isOnboarded = true;
        }
      } catch {}
    }
  }

  if (isOnboarded) {
    useOnboardingStore.configure({
      initialState: {
        isOnboarded: true,
        lastSeenVersion:
          lastSeenVersion ?? Application.nativeApplicationVersion,
      },
    });
  }

  // Mark migration done regardless (new installs too, so we don't re-check)
  mmkv.set(MIGRATION_FLAG, "1");

  // Clean up old key
  if (oldOnboarding) {
    mmkv.delete(OLD_ONBOARDING_KEY);
  }
}
