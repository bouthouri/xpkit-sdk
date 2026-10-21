// from crayons@0.0.194 — components/onboarding/Onboarding.tsx — READ ONLY
import { StyleSheet } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { OnboardingCarousel } from "./OnboardingCarousel";
import { useOnboardingStore } from "../../utils/onboarding-store";
import type { OnboardingScreen } from "./types";

export interface OnboardingProps {
  screens: OnboardingScreen[];
  onFirstComplete?: () => void;
  showSkip?: boolean;
  /** Test identifier forwarded to the carousel root and inherited by per-slide testIDs. */
  testID?: string;
}

export const Onboarding = ({
  screens,
  onFirstComplete,
  showSkip = true,
  testID,
}: OnboardingProps) => {
  const { isOnboarded, complete } = useOnboardingStore();

  if (isOnboarded) return null;

  return (
    <OnboardingInner
      screens={screens}
      onFirstComplete={onFirstComplete}
      showSkip={showSkip}
      complete={complete}
      testID={testID}
    />
  );
};

const OnboardingInner = ({
  screens,
  onFirstComplete,
  showSkip,
  complete,
  testID,
}: OnboardingProps & { complete: () => void }) => {
  // Captured once when this inner component mounts (i.e., when onboarding becomes visible).
  // On first launch lastSeenVersion is null → not replay. On replay from settings it's set → replay.
  const isReplay = useOnboardingStore.getState().lastSeenVersion !== null;

  return (
    <Animated.View exiting={FadeOut.duration(300)} style={styles.overlay} testID={testID}>
      <OnboardingCarousel
        screens={screens}
        onComplete={() => {
          complete();
          if (!isReplay && onFirstComplete) onFirstComplete();
        }}
        onSkip={() => complete()}
        showSkip={showSkip}
        isReplay={isReplay}
        testID={testID ? `${testID}-carousel` : undefined}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "white",
  },
});
