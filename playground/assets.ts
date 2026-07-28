/**
 * The asset map, web edition.
 *
 * This is the whole point of `AssetRef`: the config says `{ kind: "asset", key:
 * "onboarding-1" }` and each platform answers that key with something it can render.
 * Here Vite hands back a URL string. In an Expo app the same map is built with
 * `require("../assets/intro/onboarding-1.mp4")` and returns a module id. The JSON does
 * not change.
 */

import type { AssetMap } from "../shared/index";

import onboarding1 from "../fixtures/assets/onboarding-1.mp4";
import onboarding2 from "../fixtures/assets/onboarding-2.mp4";
import onboarding3 from "../fixtures/assets/onboarding-3.mp4";

/**
 * Keys match `fixtures/energy-xp.json`.
 *
 * `karv.json` asks for `onboarding1`/`onboarding2`/`onboarding3` (karv's own file
 * names, no dash) and those binaries are not bundled — see fixtures/README.md. The
 * playground surfaces that as "ASSET MISSING" rather than a blank slide, which is what
 * a typo in a real app's asset map should look like.
 */
export const webAssets: AssetMap = {
  "onboarding-1": onboarding1,
  "onboarding-2": onboarding2,
  "onboarding-3": onboarding3,
};
