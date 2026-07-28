/**
 * achievements/native — the React Native renderer. SCAFFOLD.
 *
 * See ./README.md for why this comes last and why it costs almost nothing to write
 * once `web/` works.
 *
 * This file intentionally does NOT import `react-native` — the package is absent from
 * `dependencies` on purpose, and importing it here would break `bun typecheck` for the
 * one person who can't run it anyway. The imports you need:
 *
 *   import { FlatList, StyleSheet, Text, View } from "react-native";
 *
 * Then: same `withStatus()` output, same vanilla store, `FlatList numColumns={2}`
 * instead of a CSS grid. Reference examples/achievements/achievement-list.tsx.
 */

import { notImplemented } from "../../shared/index";
import type { AchievementWithStatus } from "../types";

export interface AchievementGridProps {
  achievements: AchievementWithStatus[];
  title?: string;
}

export function AchievementGrid(_props: AchievementGridProps): never {
  return notImplemented(
    "AchievementGrid (native)",
    "achievements/native/README.md",
  );
}

export { useAchievementsStore } from "../web/use-store";
