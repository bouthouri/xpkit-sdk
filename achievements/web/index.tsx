/**
 * achievements/web — the renderer you can actually run.
 *
 * Rebuilds examples/achievements/achievement-list.tsx + achievement-badge.tsx +
 * achievements-screen.tsx as one component driven by a parsed config:
 *  - two-column grid
 *  - locked badges show 🔒, "???", "Keep progressing to unlock!" — never the real name
 *  - an "N/25 achievements unlocked" header
 *
 * Everything decision-shaped (is it unlocked, what is the progress) comes from
 * `withStatus()` in the engine. This file contains no unlock logic at all — it only
 * reads `isUnlocked`/`progress` off what it's handed.
 */

import type { CSSProperties } from "react";

import type { AchievementWithStatus } from "../types";

export interface AchievementGridProps {
  achievements: AchievementWithStatus[];
  /** Shown above the grid. Omit to hide the header. */
  title?: string;
}

const container: CSSProperties = {
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 12,
};

const headerTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const headerCount: CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.5)",
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const badge: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  gap: 6,
  minHeight: 130,
  padding: 16,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const badgeLocked: CSSProperties = {
  ...badge,
  opacity: 0.6,
};

/**
 * Unlocked badges escalate visually with `Achievement.tier` — the harder the
 * achievement, the more elaborate the design (thicker border, richer gradient,
 * bigger glow). Locked badges never show this — see docs/03, they must show
 * neither the name nor anything else that reveals what the badge is.
 */
function tierStyle(tier: string | null): CSSProperties {
  switch (tier) {
    case "bronze":
      return {
        border: "1px solid #cd7f32",
        background: "rgba(205,127,50,0.10)",
      };
    case "silver":
      return {
        border: "1px solid #c9ced6",
        background: "linear-gradient(160deg, rgba(201,206,214,0.16), rgba(201,206,214,0.04))",
        boxShadow: "0 0 12px rgba(201,206,214,0.15)",
      };
    case "gold":
      return {
        border: "1.5px solid #ffd700",
        background: "linear-gradient(160deg, rgba(255,215,0,0.20), rgba(255,215,0,0.04))",
        boxShadow: "0 0 18px rgba(255,215,0,0.25)",
      };
    case "legendary":
      return {
        border: "2px solid transparent",
        backgroundImage:
          "linear-gradient(#20141c, #20141c), linear-gradient(135deg, #ff5ecb, #7c4dff, #ffd700)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: "0 0 28px rgba(124,77,255,0.45), 0 0 12px rgba(255,94,203,0.35)",
      };
    default:
      return {};
  }
}

const emoji: CSSProperties = {
  fontSize: 30,
};

const name: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
};

const nameLocked: CSSProperties = {
  ...name,
  fontStyle: "italic",
  color: "rgba(255,255,255,0.45)",
};

const description: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  color: "rgba(255,255,255,0.6)",
};

const descriptionLocked: CSSProperties = {
  ...description,
  fontStyle: "italic",
  color: "rgba(255,255,255,0.4)",
};

export function AchievementGrid({ achievements, title }: AchievementGridProps) {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div style={container}>
      {title !== undefined && (
        <div style={header}>
          <span style={headerTitle}>{title}</span>
          <span style={headerCount}>
            {unlockedCount}/{achievements.length} unlocked
          </span>
        </div>
      )}
      <div style={grid}>
        {achievements.map((achievement) => {
          const locked = !achievement.isUnlocked;
          const style = locked ? badgeLocked : { ...badge, ...tierStyle(achievement.tier) };
          return (
            <div key={achievement.id} style={style}>
              <span style={emoji}>{locked ? "🔒" : achievement.icon}</span>
              <span style={locked ? nameLocked : name}>
                {locked ? "???" : achievement.name}
              </span>
              <span style={locked ? descriptionLocked : description}>
                {locked ? "Keep progressing to unlock!" : achievement.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { useAchievementsStore } from "./use-store";
