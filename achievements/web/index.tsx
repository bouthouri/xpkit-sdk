/**
 * achievements/web — the renderer you can actually run.
 *
 * PLACEHOLDER. Build this second (the engine comes first — see docs/05-first-task.md).
 *
 * Target: `examples/achievements/achievement-list.tsx` +
 * `examples/achievements/achievement-badge.tsx` + `achievements-screen.tsx`, as one
 * component driven by a parsed config. The behaviour worth keeping:
 *
 *  - two-column grid
 *  - locked badges show 🔒, "???", "Keep progressing to unlock!" — never the real name
 *  - an "N/25 achievements unlocked" header
 *
 * Everything decision-shaped (is it unlocked, what is the progress) comes from
 * `withStatus()` in the engine. This file should contain no unlock logic at all.
 */

import type { CSSProperties } from "react";

import type { AchievementWithStatus } from "../types";

export interface AchievementGridProps {
  achievements: AchievementWithStatus[];
  /** Shown above the grid. Omit to hide the header. */
  title?: string;
}

const shell: CSSProperties = {
  border: "1px dashed currentColor",
  borderRadius: 12,
  padding: "16px 20px",
  opacity: 0.75,
  lineHeight: 1.5,
};

export function AchievementGrid({ achievements, title }: AchievementGridProps) {
  const unlocked = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div style={shell}>
      <strong>AchievementGrid — not built yet.</strong>
      <div>
        {title ? `${title}: ` : ""}
        {unlocked}/{achievements.length} unlocked.
      </div>
      <div>
        Rebuild <code>examples/achievements/achievement-list.tsx</code> here. See
        docs/05-first-task.md, task 3.
      </div>
    </div>
  );
}

export { useAchievementsStore } from "./use-store";
