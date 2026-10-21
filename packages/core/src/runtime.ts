/**
 * Runtime configuration — one `configureXPKit` call at app startup decides where the
 * persisted stores write, how keys are namespaced, and which app version onboarding
 * stamps on completion.
 */

import { createMemoryStorage, type StorageAdapter } from './storage.js'

// No DOM or Node typings are required by this package; declare the one global we log to.
declare const console: { warn(...args: unknown[]): void }

export interface XPKitOptions {
  /** Where to persist. Omit and `globalThis.localStorage` is used when present, else memory. */
  storage?: StorageAdapter
  /** Namespaces every key, so two apps on one device never collide. */
  keyPrefix?: string
  /**
   * The app's current version. Onboarding writes this on completion, and a
   * non-null stored value is what makes a later mount a REPLAY rather than a
   * first run.
   */
  appVersion?: string | null
}

export interface ResolvedXPKitOptions {
  storage: StorageAdapter
  keyPrefix: string
  appVersion: string | null
}

let options: XPKitOptions = {}
let resolved: ResolvedXPKitOptions | null = null

/**
 * Call once, before the first store is created.
 *
 *   configureXPKit({ storage: mmkvAdapter, keyPrefix: "energy-xp" })
 *
 * Calling it after a store has been created is a no-op with a warning — the
 * store has already captured its storage.
 */
export function configureXPKit(next: XPKitOptions): void {
  if (resolved) {
    console.warn(
      '[xpkit] configureXPKit() called after a store was already created. Config ignored.',
    )
    return
  }
  options = { ...options, ...next }
}

interface WebStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function defaultStorage(): StorageAdapter {
  const ls = (globalThis as { localStorage?: WebStorageLike }).localStorage
  if (ls) {
    return {
      get: key => ls.getItem(key),
      set: (key, value) => ls.setItem(key, value),
      remove: key => ls.removeItem(key),
    }
  }
  console.warn(
    '[xpkit] No storage configured and no localStorage available — falling back to memory. Nothing will persist. Call configureXPKit({ storage }).',
  )
  return createMemoryStorage()
}

/** Resolves (and freezes) the runtime options. Stores call this, apps rarely do. */
export function getXPKitRuntime(): ResolvedXPKitOptions {
  if (!resolved) {
    resolved = {
      storage: options.storage ?? defaultStorage(),
      keyPrefix: options.keyPrefix ?? 'xpkit',
      appVersion: options.appVersion ?? null,
    }
  }
  return resolved
}

/** Namespaced persistence key, e.g. `energy-xp:onboarding`. */
export function xpkitStorageKey(name: string): string {
  return `${getXPKitRuntime().keyPrefix}:${name}`
}

/** Test-only. Drops both the pending options and the frozen resolution. */
export function resetXPKitForTests(): void {
  options = {}
  resolved = null
}
