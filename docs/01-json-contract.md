# 01 — The JSON contract

XP Kit has two halves that never see each other's code. An **editor** emits JSON; a
**runtime** (this repo) consumes it. This file is the schema both sides agree on, plus
the exact translation from what the apps hardcode today, plus an honest list of what v1
cannot yet express.

The schema lives in one file: [`shared/index.ts`](../shared/index.ts). It is Zod, and
it is the only definition of these shapes in the repo — `onboarding/types.ts` and
`achievements/types.ts` both re-export from it rather than restating anything.

---

## Top level

```jsonc
{
  "schemaVersion": "1.0.0",   // gated before field validation — see below
  "projectName": "Energy XP",
  "announcements": [],        // WhatsNew entries; out of scope for the fixtures
  "onboarding": { "screens": [] },
  "gamification": {
    "levels": [],             // XP thresholds. No app uses these yet.
    "variables": [],          // the counters conditions read
    "achievements": [],       // badges
    "milestones": [],         // thresholds that fire once and apply an effect
    "streaks": []             // no app uses these yet
  }
}
```

`parseConfig` checks `schemaVersion` **before** running Zod, so a v2 file fails with
`Unsupported schemaVersion: 2.0.0` rather than forty confusing field errors. Keep that
ordering if you touch it.

`parseOnboardingConfig` accepts either a full config or an onboarding-only file
(`{ schemaVersion, onboarding }`), because the editor should not have to emit a whole
gamification suite just to ship four screens.

## `AssetRef` — keys, never paths

```jsonc
{ "kind": "asset", "key": "onboarding-1" }
```

Refused by the schema: anything containing `require(`, or starting with `.` or `/`. A
path is meaningless across platforms; a key is not. The app answers the key with an
`AssetMap`:

```ts
// React Native
const assets = { "onboarding-1": require("../assets/intro/onboarding-1.mp4") };
// web (Vite hands back a URL string)
const assets = { "onboarding-1": onboarding1 };
```

`resolveAsset(assets, ref)` throws by name on a miss — see it happen live by opening the
Karv fixture in the playground.

## `variables[]`

```jsonc
{ "id": "progressCreated", "name": "…", "type": "counter", "description": "…" }
```

`id` must match `/^[a-zA-Z_][a-zA-Z0-9_]*$/` — it is an identifier, not a label.
`type` is `counter | streak | boolean`; everything shipping today is `counter`.

## `conditions[]`

```jsonc
{ "variableId": "progressCreated", "operator": ">=", "threshold": 3 }
```

Operators: `>= > == < <= !=`. An achievement's conditions are **AND**ed.
`conditions: []` must **never** unlock — see `docs/03`.

## `onboarding.screens[]`

Four types, discriminated on `type`:

| type | fields |
|---|---|
| `content` | `id`, `title`, `body`, `image?` |
| `video` | `id`, `source`, `title?`, `subtitle?`, `buttonText?` |
| `permission` | `id`, `permission`, `title`, `subtitle?`, `grantedTitle?` |
| `notification` | `id`, `title`, `subtitle?`, `grantedTitle?` |

## `milestones[]`

```jsonc
{
  "id": "the-groove", "level": 3, "threshold": 21, "label": "The Groove",
  "tier": "mastery", "hint": "…",
  "effect": { "type": "energyReduction", "percent": 25 }
}
```

`effect` is `{ type }` plus whatever that type needs (`.catchall(z.unknown())`) — open
on purpose, so a new effect kind is a runtime feature and not a schema bump.

---

# Mapping: Progres → v1

Source: [`examples/achievements/config.ts`](../examples/achievements/config.ts) (the
25-badge catalog) and `types.ts` (the 6 counters). Today's shape is minimal —
`{ id, name, description, emoji, target, goal }`. No operators, no tiers, no levels.

| today | v1 |
|---|---|
| the 6 `GamificationCounters` keys | `variables[]` → `{ id: key, type: "counter", name }` |
| `id` | `id` — **frozen forever** (Rule 2; unlocks persist by this string) |
| `emoji` | `icon` |
| `target` + `goal` | `conditions: [{ variableId: target, operator: ">=", threshold: goal }]` |
| `counters[target] >= goal` | AND over `conditions` |
| the `// ── Progress Creation ──` section comments | `category` |

**Order.** Display order today is `Object.values(ACHIEVEMENTS)` — i.e. insertion order
in `config.ts`. That is preserved as array order in `progres.json`, and it is what the
spec test asserts. `variables[]` order follows the `GamificationCounters` interface
declaration order (note `progressAchieved` before `pathAchieved`).

# Mapping: Energy XP onboarding → v1

Source: [`examples/usage/energy-xp-onboardingScreens.tsx`](../examples/usage/energy-xp-onboardingScreens.tsx).

| today | v1 |
|---|---|
| `require("../assets/intro/onboarding-2.mp4")` | `source: { kind: "asset", key: "onboarding-2" }` |
| `type: "notification-permission"` | `type: "notification"` |
| `onFirstComplete` prop | the `onComplete` prop |
| `isOnboarded` / `lastSeenVersion` in the app | inside the library's store |
| (no ids today — screens are positional) | `id`, minted per screen |

The shipped app opens on **`onboarding-2.mp4`**, not `-1`. That is not a mistake in the
fixture; it is the shipped order, and `fixtures.test.ts` pins it.

# Mapping: Karv → v1

Source: `examples/milestones/milestones.ts` + `examples/usage/karv-onboardingScreens.tsx`.

| today | v1 |
|---|---|
| `count` | `threshold` |
| `level` | `level` — **karv's frozen field** (`milestone_achieved.id = ${habitId}_${level}`) |
| `label`, `tier`, `hint` | same |
| `reductionPercent` | `effect: { type: "energyReduction", percent }` |
| — | `id`, minted as a slug. New, and free to change — karv persists by `level`. |

---

# ⚠️ v1 can't reproduce today's onboarding yet

Writing the fixtures surfaced fields the apps use that PR #13's schema has no slot for.
These are **feedback for intern A**, documented rather than silently patched into
`shared/index.ts` — widening the schema here would just hide the divergence until it
became a data migration.

## Missing fields

- **`notification` screen**: no `grantedSubtitle`, `grantedButtonText`, `buttonText`.
  Energy XP ships `grantedSubtitle: "We'll nudge you when it matters."` and karv ships
  `"We'll remind you when it matters."` — both are dropped in the fixtures.
- **`permission` screen**: no `icon`, `buttonText`, `grantedButtonText`, `skipText`,
  `grantedSubtitle`.
- **every screen**: no `disableSwipe`, `hideFooterButton`. Both are real crayons
  features the carousel reads.
- **`content` screen**: crayons calls the body `content`, the schema calls it `body`.
- crayons has a fifth screen type, `custom` (an escape hatch taking a ReactNode). v1 has
  no slot for it, and arguably shouldn't — a JSON contract can't carry a component.

## Naming inconsistencies to settle before anything persists

| concept | schema says | brief §7 says | crayons says |
|---|---|---|---|
| condition's variable | `variableId` | `variableKey` | — |
| condition's operator | `operator` | `op` | — |
| condition's value | `threshold` | `value` | — |
| a variable's label | `name` | `label` | — |
| content body | `body` | — | `content` |

Worse, the inconsistency is **inside** the schema already: `conditionSchema` uses
`variableId` while `streakSchema` uses `variableKey` for the same concept. Pick one.

This repo implements the schema's spelling (`variableId` / `operator` / `threshold` /
`name`) because PR #13 is the base. Changing it later is cheap **as long as nothing has
persisted yet** — which is exactly why it should be settled now.

## Modelling gaps

- **Per-entity variables.** Progres's six counters are global integers. Karv's
  `completionCount` is per-habit — every habit has its own, and milestones fire against
  each one independently. `variables[]` has no way to say "one of these per entity", so
  `karv.json` declares `completionCount` as a plain counter with a note. Any real karv
  integration needs this resolved.
- **`StorageAdapter` shape.** PR #13 defines `{ get, set }`. This repo defines
  `{ getItem, setItem, removeItem }`, matching zustand's `StateStorage` — which is what
  makes MMKV (sync), AsyncStorage (async) and `localStorage` all work through one
  interface, hydration included, and what lets web skip writing an adapter entirely.
  `{ get, set }` can't express removal and can't be async. See `docs/04`.
- **Rule 8.** The brief says core has zero runtime deps. This repo adds `zustand`. The
  amended rule: *no **platform** code in the shared layer.* `zod` and zustand vanilla are
  platform-free; `react-native` and `react-native-mmkv` are not. Flagged rather than
  quietly broken.
