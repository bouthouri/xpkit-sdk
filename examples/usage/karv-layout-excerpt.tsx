// from karv/apps/mobile/app/_layout.tsx (lines 20-45, 80, 224) — READ ONLY
//
// The second real mount site. Same one-liner, different app, different data layer
// (karv is on LiveStore, not Zustand/MMKV) — and onboarding does not care. That
// independence is the reason storage is injected rather than implemented.
//
// Note `<Onboarding>` sits INSIDE `<LiveStoreProvider>` here purely because it is a
// sibling of the Stack it overlays; it has no LiveStore dependency of its own.

import {
  customFontsToLoad,
  ForceUpgradeGate,
  Onboarding,
  RootProvider,
  useOnboardingStore,
  useWhatsNew,
} from "@bouthouri/crayons";
import { Stack } from "expo-router/stack";

import { announcements } from "../constants/announcements";
import { onboardingScreens } from "../constants/onboardingScreens";
import { usePaywallGate } from "../hooks/usePaywallGate";

function AppLayout() {
  const { showPaywall } = usePaywallGate();
  const { isOnboarded, lastSeenVersion, setLastSeenVersion } = useOnboardingStore();

  return (
    <RootProvider /* ... */>
      <LiveStoreProvider
        key={storeGeneration}
        renderLoading={() => null}
        renderError={() => null}
      >
        {/* ── the entire onboarding integration ─────────────────────────────── */}
        <Onboarding
          screens={onboardingScreens}
          onFirstComplete={() => showPaywall("onboarding_finish")}
        />

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          {/* ...autocomplete, milestone, etc... */}
        </Stack>
      </LiveStoreProvider>
    </RootProvider>
  );
}
