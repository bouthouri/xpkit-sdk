/**
 * onboarding/ — types.
 *
 * Platform-free. Screen shapes come straight from the v1 schema: there is one
 * definition of a screen in this repo and it is the one the editor emits.
 */

import type {
  AssetMap,
  AssetRef,
  ContentScreen,
  NotificationScreen,
  OnboardingConfig,
  OnboardingScreen,
  PermissionScreen,
  VideoScreen,
} from "../shared/index";

export type {
  AssetMap,
  AssetRef,
  ContentScreen,
  NotificationScreen,
  OnboardingConfig,
  OnboardingScreen,
  PermissionScreen,
  VideoScreen,
};

/** Everything onboarding persists. Two fields, and both earn their place. */
export interface OnboardingState {
  /** `<Onboarding>` renders `null` when true. The app never checks this itself. */
  isOnboarded: boolean;
  /**
   * The app version at the moment onboarding was first completed.
   *
   * This is the replay flag. `lastSeenVersion !== null` means "the user has been
   * through this before", which is what suppresses `onComplete` and turns off the
   * 600 ms permission auto-advance on a replay. `isOnboarded` alone can't tell you
   * that, because `replay()` sets it back to false.
   */
  lastSeenVersion: string | null;
}

export interface OnboardingActions {
  /** Finish: mark onboarded, stamp `lastSeenVersion`, persist. */
  complete: () => void;
  /**
   * Re-show the carousel — the Settings → "View onboarding again" row.
   * Clears `isOnboarded` but LEAVES `lastSeenVersion` set, which is what makes the
   * second viewing a replay rather than a first run.
   */
  replay: () => void;
  /** Debug only. Clears both fields, so the next launch is a true first run. */
  reset: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;

export type PermissionStatus = "granted" | "denied" | "blocked";

/**
 * Permissions are injected, for the same reason storage is: `expo-notifications` is a
 * hard native import (`examples/onboarding/slides/NotificationPermissionSlide.tsx`
 * imports it at the top level, which is blocker #4 for running any of that on web).
 *
 * A web build can pass a handler backed by the Notification API, a stub that resolves
 * `"denied"`, or nothing at all.
 */
export interface PermissionHandler {
  /** Current status, without prompting. Called on mount. */
  check: () => Promise<PermissionStatus>;
  /** Prompt. Resolves with the post-prompt status. */
  request: () => Promise<PermissionStatus>;
  /** Deep-link to OS settings. Only reachable from `"blocked"`. */
  openSettings?: () => void | Promise<void>;
}

/**
 * Keyed by the screen's permission id. A `type: "notification"` screen looks up
 * `"notifications"`; a `type: "permission"` screen looks up its own `permission` field.
 * A missing handler must degrade to a skippable slide, never a crash.
 */
export type PermissionHandlers = Record<string, PermissionHandler>;

export interface OnboardingProps {
  /** From `parseConfig(raw).onboarding` or `parseOnboardingConfig(raw)`. */
  config: OnboardingConfig;
  /** Maps every `AssetRef.key` in the config to something this platform can render. */
  assets: AssetMap;
  /**
   * Fires on FIRST completion only — never on a replay. This is where the paywall
   * goes. (crayons calls this `onFirstComplete`; the name changed, the semantics
   * did not.)
   */
  onComplete?: () => void;
  /** Fires when the user taps Skip. The store is still marked complete. */
  onSkip?: () => void;
  showSkip?: boolean;
  permissions?: PermissionHandlers;
  /** Root test id. Per-control ids derive from it: `-skip`, `-back`, `-next`, `-slide-N`. */
  testID?: string;
}
