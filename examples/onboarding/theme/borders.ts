// from crayons@0.0.194 — theme/borders.ts — READ ONLY
/**
 * Default border values used across all crayons components.
 * Override per-component via the style prop.
 */
export const borders = {
  width: 2,
  radius: {
    sm: 8,
    md: 12,
    lg: 15,
  },
} as const;

export type BorderRadius = keyof typeof borders.radius;
