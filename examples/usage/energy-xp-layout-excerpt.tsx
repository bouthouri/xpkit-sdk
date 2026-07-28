// from energy-xp/apps/mobile/app/_layout.tsx (lines 1-40, 85-90, 207) — READ ONLY
//
// The real mount site. Three things worth noticing:
//
//  1. `<Onboarding>` is a SIBLING of `<Stack>`, not a route. It absolutely-fills the
//     screen at zIndex 9999 and renders `null` once the user is onboarded — that is
//     why there is no "should I navigate to onboarding?" logic anywhere in the app.
//  2. The whole integration is ONE line (207). No isOnboarded check, no persistence,
//     no replay plumbing at the app level. That is the bar for xpkit's `<Onboarding>`.
//  3. `import "../utils/onboarding-migration"` is line 2 for a reason — configure()
//     must run before the crayons store is instantiated. xpkit's `configureXPKit`
//     has the same ordering constraint; see docs/04-storage-and-state.md.

// Must run before crayons store is instantiated
import "../utils/onboarding-migration";

import {
  customFontsToLoad,
  type ErrorContext,
  ForceUpgradeGate,
  LoadingOverlay,
  Onboarding,
  RootProvider,
  sheetOptionsWithDetents,
  useOnboardingStore,
  useWhatsNew,
} from "@bouthouri/crayons";
import { Stack } from "expo-router/stack";

import { announcements } from "../constants/announcements";
import { onboardingScreens } from "../constants/onboardingScreens";
import { revenueCat } from "../utils/revenuecat";
import { trackEvent } from "../utils/analytics";

function AppLayout() {
  // `lastSeenVersion` is read here only to drive the What's New sheet. Onboarding
  // itself never needs it at the app level — the store owns replay detection.
  const { isOnboarded, lastSeenVersion, setLastSeenVersion } = useOnboardingStore();

  const { hasUnseen } = useWhatsNew({
    announcements,
    lastSeenVersion,
    setLastSeenVersion,
    enabled: announcements.length > 0,
  });

  return (
    <RootProvider /* ...theme, Sentry, RevenueCat, gesture handler... */>
      <ForceUpgradeGate />

      {/* ── the entire onboarding integration ───────────────────────────────── */}
      <Onboarding
        screens={onboardingScreens}
        onFirstComplete={() => {
          trackEvent("onboarding_completed");
          revenueCat.presentPaywall();
        }}
      />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        {/* ...whats-new, seed, etc... */}
      </Stack>
    </RootProvider>
  );
}
