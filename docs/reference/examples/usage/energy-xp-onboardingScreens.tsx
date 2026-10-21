// from energy-xp/apps/mobile/constants/onboardingScreens.tsx — READ ONLY
import type { OnboardingV2Screen } from "@bouthouri/crayons";

const onboarding1 = require("../assets/intro/onboarding-1.mp4");
const onboarding2 = require("../assets/intro/onboarding-2.mp4");
const onboarding3 = require("../assets/intro/onboarding-3.mp4");

export const onboardingScreens: OnboardingV2Screen[] = [
  {
    type: "video",
    source: onboarding2,
    title: "Not every day is a 100% day",
    subtitle:
      "Tired? Rough night? Tap the gauge and set your real starting energy. You'll see exactly what fits and what doesn't.",
  },
  {
    type: "video",
    title: "Every task has a cost",
    subtitle:
      "Set how much energy each task takes, organize with folders, and choose which days it repeats.",
    source: onboarding1,
  },
  {
    type: "video",
    title: "Adjust as your day unfolds",
    subtitle:
      "Swipe any task to edit it, skip it for today, or remove it entirely.",
    source: onboarding3,
    buttonText: "Almost Done",
  },
  {
    type: "notification-permission",
    title: "Gentle nudges, not noise",
    subtitle:
      "A quiet reminder before each task so you stay on pace with your energy.",
    grantedTitle: "You're all set",
    grantedSubtitle: "We'll nudge you when it matters.",
  },
];
