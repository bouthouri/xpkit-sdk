/**
 * `import { Onboarding } from "@bouthouri/xpkit-core/onboarding"`
 *
 * Subpath = folder path. If you'd rather not take the dependency at all, copy this
 * folder into your app — it imports nothing outside itself except `../shared`, and
 * nothing from `achievements/`.
 *
 * The whole app-side integration is one component:
 *
 *   configureXPKit({ storage: mmkvAdapter, keyPrefix: "energy-xp" });   // once
 *
 *   <Onboarding
 *     config={config.onboarding}
 *     assets={assetMap}
 *     onComplete={() => presentPaywall()}
 *   />
 *
 * It renders nothing if the user is already onboarded, persists on completion, and
 * `replayOnboarding()` re-shows it for the Settings row.
 *
 * The default renderer here is **web**, because that is the one that runs today.
 * React Native apps import `@bouthouri/xpkit-core/onboarding/native` for the renderer;
 * the store, the lifecycle and the types are shared either way and are the parts you
 * actually reuse.
 */

export * from "./types";
export * from "./store";
export { Onboarding, useOnboardingStore } from "./web/index";
