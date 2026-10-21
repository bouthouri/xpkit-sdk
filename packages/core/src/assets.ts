import type { AssetRef } from './schema.js'

/**
 * Maps AssetRef keys to whatever the platform can render, e.g.
 * `{ "onboarding-1": videoModule }` in an app or `{ "onboarding-1": url }` in a browser.
 */
export type AssetMap = Record<string, unknown>

/**
 * Text form of an achievement icon. The schema allows an emoji/glyph string OR an
 * AssetRef; renderers without an asset pipeline for badges show a placeholder for the
 * latter.
 */
export function iconText(icon: string | AssetRef): string {
  return typeof icon === 'string' ? icon : '🏅'
}

/**
 * Resolve an AssetRef. Fails loudly and by name — a missing video should not be
 * a blank slide you notice in review.
 */
export function resolveAsset(assets: AssetMap, ref: AssetRef): unknown {
  const value = assets[ref.key]
  if (value === undefined) {
    const known = Object.keys(assets)
    throw new Error(
      `[xpkit] Asset "${ref.key}" is missing from the asset map. Known keys: ${
        known.length ? known.join(', ') : '(none)'
      }`,
    )
  }
  return value
}
