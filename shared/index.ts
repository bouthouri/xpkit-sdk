/**
 * XP Kit — shared layer.
 *
 * Everything in this file is PLATFORM-FREE. It runs unchanged in a browser, in
 * Node (vitest), and in React Native. That is the whole point: the brain is
 * shared, the renderers are thin.
 *
 * Allowed here: zod, zustand (vanilla), plain TypeScript.
 * Banned here:  react-native, react-native-mmkv, expo-*, the crayons library,
 *               anything touching the DOM.
 *
 * Contents:
 *   1. The v1 config schema (seeded from xpkit PR #13)
 *   2. parseConfig / parseOnboardingConfig — the version gate
 *   3. StorageAdapter — storage is INJECTED, never implemented here
 *   4. configureXPKit — one call at app startup
 *   5. Assets — AssetRef resolution against an app-supplied AssetMap
 *   6. notImplemented — the stub helper the intern deletes as they go
 */

import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────────────
// 1. Schema — v1
//
// Seeded from xpkit PR #13 (packages/xpkit-core/src/index.ts) and intentionally
// NOT widened. Where the shipped apps use a field v1 has no slot for, that is
// recorded in docs/01-json-contract.md as a parity gap for intern A to close in
// the editor's schema — not silently patched here.
// ───────────────────────────────────────────────────────────────────────────────

/** The only schema version this runtime accepts. Bump deliberately. */
export const schemaVersion = "1.0.0";

/**
 * A reference to a binary asset by KEY, never by path.
 *
 * The editor emits `{ kind: "asset", key: "onboarding-1" }`. The app supplies an
 * AssetMap mapping that key to whatever its platform needs — a `require()` module
 * id on React Native, a URL string on web. This is why the same JSON works on
 * both platforms.
 */
export const assetRefSchema = z.object({
  kind: z.literal("asset"),
  key: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) =>
        !value.includes("require(") &&
        !value.startsWith(".") &&
        !value.startsWith("/"),
      { message: "AssetRef.key must be a non-empty asset key, not a raw path." },
    ),
});

export const levelSchema = z.object({
  id: z.string(),
  name: z.string(),
  xpThreshold: z.number(),
});

export const variableSchema = z.object({
  id: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  name: z.string(),
  type: z.enum(["counter", "streak", "boolean"]),
  description: z.string(),
});

export const conditionSchema = z.object({
  variableId: z.string(),
  operator: z.enum([">=", ">", "==", "<", "<=", "!="]),
  threshold: z.number(),
});

export const achievementSchema = z.object({
  /**
   * FROZEN FOREVER (Rule 2). Unlocks persist by this string — rename it and every
   * existing user silently loses that badge.
   */
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  icon: z.string().optional().default(""),
  tier: z.string().nullable().optional().default(null),
  hidden: z.boolean().optional().default(false),
  rarity: z.string().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
  purpose: z.string().optional().default(""),
  /** AND over all conditions. An empty array means "never unlocks". */
  conditions: z.array(conditionSchema).optional().default([]),
});

export const announcementSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  image: assetRefSchema.optional(),
});

export const onboardingScreenSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("content"),
    title: z.string(),
    body: z.string(),
    image: assetRefSchema.optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("video"),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    source: assetRefSchema,
    buttonText: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("permission"),
    permission: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    grantedTitle: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("notification"),
    title: z.string(),
    subtitle: z.string().optional(),
    grantedTitle: z.string().optional(),
  }),
]);

export const onboardingConfigSchema = z.object({
  screens: z.array(onboardingScreenSchema),
});

/** Open-ended by design: an effect is a `type` plus whatever that type needs. */
export const effectSchema = z.object({ type: z.string() }).catchall(z.unknown());

export const milestoneSchema = z.object({
  id: z.string(),
  level: z.number(),
  threshold: z.number(),
  label: z.string(),
  hint: z.string().optional(),
  tier: z.string().optional(),
  effect: effectSchema.optional(),
});

export const streakSchema = z.object({
  id: z.string(),
  /** NOTE: `variableKey` here, `variableId` in conditionSchema. See parity gaps. */
  variableKey: z.string(),
  milestones: z.array(z.number()),
});

export const gamificationConfigSchema = z.object({
  levels: z.array(levelSchema),
  variables: z.array(variableSchema),
  achievements: z.array(achievementSchema),
  milestones: z.array(milestoneSchema),
  streaks: z.array(streakSchema),
});

export const xpkitConfigSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  projectName: z.string(),
  announcements: z.array(announcementSchema),
  onboarding: onboardingConfigSchema,
  gamification: gamificationConfigSchema,
});

/**
 * An onboarding-only file. The editor does not have to emit a whole suite just
 * to ship four screens — see parseOnboardingConfig.
 */
export const onboardingFileSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  projectName: z.string().optional(),
  onboarding: onboardingConfigSchema,
});

export type AssetRef = z.infer<typeof assetRefSchema>;
export type Level = z.infer<typeof levelSchema>;
export type Variable = z.infer<typeof variableSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type OnboardingScreen = z.infer<typeof onboardingScreenSchema>;
export type OnboardingConfig = z.infer<typeof onboardingConfigSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Streak = z.infer<typeof streakSchema>;
export type GamificationConfig = z.infer<typeof gamificationConfigSchema>;
export type XPKitConfig = z.infer<typeof xpkitConfigSchema>;

/** Narrowed screen types, handy when writing a renderer's switch. */
export type ContentScreen = Extract<OnboardingScreen, { type: "content" }>;
export type VideoScreen = Extract<OnboardingScreen, { type: "video" }>;
export type PermissionScreen = Extract<OnboardingScreen, { type: "permission" }>;
export type NotificationScreen = Extract<
  OnboardingScreen,
  { type: "notification" }
>;

// ───────────────────────────────────────────────────────────────────────────────
// 2. Parsing — the version gate
// ───────────────────────────────────────────────────────────────────────────────

function assertObject(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Config must be an object.");
  }
  return raw as Record<string, unknown>;
}

function assertVersion(candidate: Record<string, unknown>): void {
  const version = candidate.schemaVersion;
  if (version !== schemaVersion) {
    throw new Error(`Unsupported schemaVersion: ${String(version)}`);
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(", ");
}

/**
 * Parse a full XP Kit config. Throws on an unknown schemaVersion BEFORE zod runs,
 * so a v2 file fails with "Unsupported schemaVersion: 2.0.0" rather than forty
 * confusing field errors.
 */
export function parseConfig(raw: unknown): XPKitConfig {
  const candidate = assertObject(raw);
  assertVersion(candidate);

  const result = xpkitConfigSchema.safeParse(raw);
  if (!result.success) throw new Error(formatIssues(result.error));
  return result.data;
}

/**
 * Parse an onboarding-only file — or pull the onboarding block out of a full
 * config. Same version gate. Use this when all you are mounting is <Onboarding>.
 */
export function parseOnboardingConfig(raw: unknown): OnboardingConfig {
  const candidate = assertObject(raw);
  assertVersion(candidate);

  const result = onboardingFileSchema.safeParse(raw);
  if (!result.success) throw new Error(formatIssues(result.error));
  return result.data.onboarding;
}

// ───────────────────────────────────────────────────────────────────────────────
// 3. Storage — injected, never implemented
//
// This is deliberately zustand's own StateStorage shape. Every method may return
// a promise, which is why MMKV (sync), AsyncStorage (async) and localStorage all
// work through one interface — zustand's `persist` middleware awaits them and
// handles hydration either way.
//
// `localStorage` already satisfies this. Web needs no adapter.
// ───────────────────────────────────────────────────────────────────────────────

export interface StorageAdapter {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): unknown | Promise<unknown>;
  removeItem(name: string): unknown | Promise<unknown>;
}

/** In-memory fallback so a fresh clone runs before anyone has wired storage. */
function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => map.set(name, value),
    removeItem: (name) => map.delete(name),
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// 4. configureXPKit — one call at app startup
// ───────────────────────────────────────────────────────────────────────────────

export interface XPKitOptions {
  /** Where to persist. Omit on web and `localStorage` is used. */
  storage?: StorageAdapter;
  /** Namespaces every key, so two apps on one device never collide. */
  keyPrefix?: string;
  /**
   * The app's current version. Onboarding writes this on completion, and a
   * non-null stored value is what makes a later mount a REPLAY rather than a
   * first run. On RN pass `Application.nativeApplicationVersion`.
   */
  appVersion?: string | null;
}

interface ResolvedXPKitOptions {
  storage: StorageAdapter;
  keyPrefix: string;
  appVersion: string | null;
}

let options: XPKitOptions = {};
let resolved: ResolvedXPKitOptions | null = null;

/**
 * Call once, before the first XP Kit component mounts.
 *
 *   configureXPKit({ storage: mmkvAdapter, keyPrefix: "energy-xp" });  // RN
 *   configureXPKit({ storage: localStorage });                        // web
 *
 * Calling it after a store has been created is a no-op with a warning — the
 * store has already captured its storage, exactly like crayons' onboarding store.
 */
export function configureXPKit(next: XPKitOptions): void {
  if (resolved) {
    console.warn(
      "[xpkit] configureXPKit() called after a store was already created. Config ignored.",
    );
    return;
  }
  options = { ...options, ...next };
}

function defaultStorage(): StorageAdapter {
  const ls = (globalThis as { localStorage?: StorageAdapter }).localStorage;
  if (ls) return ls;
  console.warn(
    "[xpkit] No storage configured and no localStorage available — falling back to memory. Nothing will persist. Call configureXPKit({ storage }).",
  );
  return createMemoryStorage();
}

/** Resolves (and freezes) the runtime options. Stores call this, apps rarely do. */
export function getXPKitRuntime(): ResolvedXPKitOptions {
  if (!resolved) {
    resolved = {
      storage: options.storage ?? defaultStorage(),
      keyPrefix: options.keyPrefix ?? "xpkit",
      appVersion: options.appVersion ?? null,
    };
  }
  return resolved;
}

/** Namespaced persistence key, e.g. `energy-xp:onboarding`. */
export function xpkitStorageKey(name: string): string {
  return `${getXPKitRuntime().keyPrefix}:${name}`;
}

/** Test-only. Drops both the pending options and the frozen resolution. */
export function resetXPKitForTests(): void {
  options = {};
  resolved = null;
}

// ───────────────────────────────────────────────────────────────────────────────
// 5. Assets
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Maps AssetRef keys to whatever the platform can render.
 *   RN:  { "onboarding-1": require("../assets/intro/onboarding-1.mp4") }
 *   web: { "onboarding-1": onboarding1Url }
 */
export type AssetMap = Record<string, unknown>;

/**
 * Resolve an AssetRef. Fails loudly and by name — a missing video should not be
 * a blank slide you notice in review.
 */
export function resolveAsset(assets: AssetMap, ref: AssetRef): unknown {
  const value = assets[ref.key];
  if (value === undefined) {
    const known = Object.keys(assets);
    throw new Error(
      `[xpkit] Asset "${ref.key}" is missing from the asset map. Known keys: ${
        known.length ? known.join(", ") : "(none)"
      }`,
    );
  }
  return value;
}

// ───────────────────────────────────────────────────────────────────────────────
// 6. notImplemented
//
// Every stub in onboarding/ and achievements/ throws through this. The message IS
// the task list — see docs/05-first-task.md. Delete the call, write the body.
// ───────────────────────────────────────────────────────────────────────────────

export class NotImplementedError extends Error {
  readonly fn: string;
  constructor(fn: string, doc = "docs/05-first-task.md") {
    super(`${fn} is not implemented — see ${doc}`);
    this.name = "NotImplementedError";
    this.fn = fn;
  }
}

export function notImplemented(fn: string, doc?: string): never {
  throw new NotImplementedError(fn, doc);
}
