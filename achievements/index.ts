/**
 * `import { ... } from "@bouthouri/xpkit-core/achievements"`
 *
 * Subpath = folder path. If you'd rather not take the dependency at all, copy this
 * folder into your app — it imports nothing outside itself except `../shared`.
 *
 * The default renderer here is **web**, because that is the one that runs today.
 * React Native apps import `@bouthouri/xpkit-core/achievements/native` for the
 * renderer; the engine, the types and the store are shared either way and are the
 * parts you actually reuse.
 */

export * from "./types";
export * from "./engine";
export * from "./store";
export { AchievementGrid, useAchievementsStore } from "./web/index";
export type { AchievementGridProps } from "./web/index";
