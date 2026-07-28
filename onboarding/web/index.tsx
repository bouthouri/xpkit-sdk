/**
 * onboarding/web — the renderer you can actually run.
 *
 * PLACEHOLDER. It lists the parsed config so `bun dev` shows something real on a fresh
 * clone; it does not yet render a carousel, and it deliberately does not touch the
 * store (which throws until you write it).
 *
 * What it has to become — read `examples/onboarding/OnboardingCarousel.tsx` and
 * docs/02-onboarding-explained.md, then rebuild it here:
 *
 *  - a horizontal pager. Use `<div>` + `scroll-snap` on web; on native use
 *    `ScrollView pagingEnabled`, NOT PagerView (crayons already made that swap for
 *    SettingsList in 0.0.179 and it is the reason the logic can be shared).
 *  - four slide types from the schema: `content`, `video`, `permission`,
 *    `notification`. (crayons has a fifth, `custom`; v1 has no slot for it.)
 *  - a back chevron that appears from slide 2, and a Skip in the header.
 *  - pagination dots.
 *  - one footer button whose label follows the rules in docs/02 — including
 *    "Continue without" on an ungranted permission slide, which is the least obvious
 *    and most important one.
 *  - `null` when `isOnboarded`. No route, no navigation: mount it as a sibling of the
 *    app's router and let it absolutely-fill the screen. See
 *    examples/usage/energy-xp-layout-excerpt.tsx.
 *
 * Everything web-safe you need already works in both worlds: plain layout, `<video>`
 * (RN: `expo-video`), and an injected permission handler.
 */

import type { CSSProperties } from "react";

import { resolveAsset } from "../../shared/index";
import type { OnboardingProps } from "../types";

const shell: CSSProperties = {
  border: "1px dashed currentColor",
  borderRadius: 12,
  padding: "16px 20px",
  opacity: 0.75,
  lineHeight: 1.5,
};

const row: CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "4px 0",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
};

function assetStatus(assets: OnboardingProps["assets"], key: string): string {
  try {
    resolveAsset(assets, { kind: "asset", key });
    return "asset ok";
  } catch {
    return "ASSET MISSING";
  }
}

export function Onboarding({ config, assets }: OnboardingProps) {
  return (
    <div style={shell}>
      <strong>Onboarding — not built yet.</strong>
      <div>
        {config.screens.length} screen{config.screens.length === 1 ? "" : "s"} parsed.
        Rebuild the carousel here — docs/05-first-task.md, task 2.
      </div>
      <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
        {config.screens.map((screen) => (
          <li key={screen.id} style={row}>
            <span>[{screen.type}]</span>
            <span>{screen.id}</span>
            {"source" in screen && (
              <span>— {assetStatus(assets, screen.source.key)}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { useOnboardingStore } from "./use-store";
