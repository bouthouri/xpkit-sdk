// from karv/apps/mobile/constants/onboardingScreens.tsx — READ ONLY
import type { OnboardingV2Screen } from "@bouthouri/crayons";

const onboardingWelcome1 = require("../assets/intro/onboarding1.mp4");
const onboardingWelcome2 = require("../assets/intro/onboarding2.mp4");
const onboardingWelcome3 = require("../assets/intro/onboarding3.mp4");

export const onboardingScreens: OnboardingV2Screen[] = [
  {
    type: "video",
    source: onboardingWelcome1,
    title: "Welcome to Karv",
    subtitle: "Build habits that last. Every habit costs energy. Repeat it, and it gets easier.",
    buttonText: "Get Started",
  },
  {
    type: "video",
    source: onboardingWelcome2,
    title: "Your Daily Energy",
    subtitle:
      "100 energy each day. Each habit costs some. Bad sleep? Low day? Tap the gauge to match your real energy.",
  },
  {
    type: "video",
    source: onboardingWelcome3,
    title: "Mastery Milestones",
    subtitle:
      "The more you show up, the easier it gets. You'll unlock milestones that drop the energy cost.",
  },
  {
    type: "notification-permission",
    title: "Keep your streak alive",
    subtitle: "Get gentle reminders so you never miss twice.",
    grantedTitle: "You're all set",
    grantedSubtitle: "We'll remind you when it matters.",
  },
];
