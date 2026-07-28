// from crayons@0.0.194 — components/onboarding/types.ts — READ ONLY
import { ReactNode } from "react";

export type VideoSource = number | { uri: string };

export type OnboardingScreen =
  | {
      type: "content";
      title: string;
      content: string;
      image?: ReactNode;
      buttonText?: string;
      disableSwipe?: boolean;
      hideFooterButton?: boolean;
    }
  | {
      type: "video";
      source: VideoSource;
      title?: string;
      subtitle?: string;
      buttonText?: string;
      disableSwipe?: boolean;
      hideFooterButton?: boolean;
    }
  | {
      type: "permission";
      permission: string;
      title: string;
      subtitle?: string;
      icon?: string;
      buttonText?: string;
      grantedButtonText?: string;
      skipText?: string;
      onGrant?: () => Promise<void>;
      onCheckStatus?: () => Promise<"granted" | "denied" | "blocked">;
      onSkip?: () => void;
      grantedTitle?: string;
      grantedSubtitle?: string;
      disableSwipe?: boolean;
      hideFooterButton?: boolean;
    }
  | {
      type: "notification-permission";
      title: string;
      subtitle?: string;
      grantedButtonText?: string;
      grantedTitle?: string;
      grantedSubtitle?: string;
      disableSwipe?: boolean;
      hideFooterButton?: boolean;
    }
  | {
      type: "custom";
      component: ReactNode;
      disableSwipe?: boolean;
      hideFooterButton?: boolean;
    };

export interface OnboardingCarouselProps {
  screens: OnboardingScreen[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  showProgress?: boolean;
  isReplay?: boolean;
  /**
   * Test identifier forwarded to the carousel root. Per-control testIDs are derived:
   * `${testID}-skip`, `${testID}-back`, `${testID}-next`, `${testID}-slide-${index}`.
   */
  testID?: string;
}

/** @deprecated Use OnboardingScreen */
export type OnboardingV2Screen = OnboardingScreen;
/** @deprecated Use OnboardingCarouselProps */
export type OnboardingV2Props = OnboardingCarouselProps;
