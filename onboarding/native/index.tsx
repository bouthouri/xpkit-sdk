/**
 * onboarding/native — the React Native renderer. SCAFFOLD.
 *
 * See ./README.md for the web→native mapping table, the verified blockers, and why
 * this comes last.
 *
 * This file intentionally does NOT import `react-native` — see the README's last
 * section. The imports you'll need:
 *
 *   import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
 *   import { useVideoPlayer, VideoView } from "expo-video";
 *   import { useSafeAreaInsets } from "react-native-safe-area-context";
 *
 * Then: same store, same types, `ScrollView pagingEnabled` instead of `scroll-snap`,
 * `expo-video` instead of `<video>`, permissions via the injected `PermissionHandler`.
 */

import { notImplemented } from "../../shared/index";
import type { OnboardingProps } from "../types";

export function Onboarding(_props: OnboardingProps): never {
  return notImplemented("Onboarding (native)", "onboarding/native/README.md");
}

export { useOnboardingStore } from "../web/use-store";
