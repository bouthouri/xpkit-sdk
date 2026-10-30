# 01. The JSON contract

XP Kit has two halves. An editor emits JSON. The runtime, `@xpkit-dev/core`, consumes it.
This file describes schema version `1.0.0`.

The schema is defined once, in zod, in [`packages/core/src/schema.ts`](../packages/core/src/schema.ts).
Every type in the package is inferred from it.

## Top level

`xpkitConfigSchema`:

```jsonc
{
  "schemaVersion": "1.0.0",
  "projectName": "Energy XP",
  "announcements": [],
  "onboarding": { "screens": [], "showSkip": true },
  "gamification": {
    "levels": [],
    "variables": [],
    "achievements": [],
    "milestones": [],
    "streaks": []
  }
}
```

All five top-level keys are required. Arrays may be empty.

## parseConfig

```ts
import { parseConfig } from '@xpkit-dev/core'

const config = parseConfig(JSON.parse(text))
```

`parseConfig(raw: unknown): XPKitConfig` does three things in order.

1. `raw` must be a plain object, else it throws `Config must be an object.`
2. `schemaVersion` must equal `1.0.0`, else it throws `Unsupported schemaVersion: 2.0.0`.
   This runs before zod, so a future file fails with one clear message.
3. Zod validates the rest. On failure it throws one `Error` that lists every issue as
   `path: message`, joined by `, `. For example:
   `gamification.achievements.0.conditions: Every achievement needs at least one unlock condition.`

Defaults are applied in the returned value (see achievements and `showSkip` below).

## AssetRef

```jsonc
{ "kind": "asset", "key": "onboarding-1" }
```

An asset is a key, never a path. The schema rejects keys that contain `require(` or start
with `.` or `/`. The app maps keys to platform values with an `AssetMap`
(`Record<string, unknown>`), and `resolveAsset(assets, ref)` throws by name when a key is
missing. `iconText(icon)` returns a string icon as is, and a placeholder for an `AssetRef`.

## announcements[]

| field | type | notes |
|---|---|---|
| `id` | string | trimmed, not empty |
| `version` | string | `X.X.X`, for example `1.6.0` |
| `title` | string | trimmed, not empty |
| `description` | string | trimmed, not empty |
| `image` | AssetRef | optional |

## onboarding

`onboarding.screens` is an array. `onboarding.showSkip` is a boolean and defaults to `true`.
Screens are discriminated on `type`. Every screen has a string `id`.

| type | required | optional |
|---|---|---|
| `content` | `title`, `body` | `image`, `buttonText`, `disableSwipe`, `hideFooterButton` |
| `video` | `source` (AssetRef) | `title`, `subtitle`, `buttonText`, `disableSwipe`, `hideFooterButton` |
| `permission` | `permission` (string), `title` | `subtitle`, `grantedTitle`, `grantedSubtitle`, `grantedButtonText`, `buttonText`, `disableSwipe`, `hideFooterButton` |
| `notification` | `title` | `subtitle`, `grantedTitle`, `grantedSubtitle`, `grantedButtonText`, `buttonText`, `disableSwipe`, `hideFooterButton` |

See [02](02-onboarding-explained.md).

## gamification

### levels[]

`{ id, name, xpThreshold }`. The engine picks the highest level whose `xpThreshold` is at
or below the current XP. Order in the file does not matter.

### variables[]

```jsonc
{ "id": "progressCreated", "name": "Progress created", "type": "counter", "description": "..." }
```

`id` must match `/^[a-zA-Z_][a-zA-Z0-9_]*$/`. `type` is `counter`, `streak` or `boolean`.
Only `boolean` changes engine behaviour: a boolean variable is set to `true` instead of
counting up.

### achievements[]

| field | type | default |
|---|---|---|
| `id` | string | required, never rename it once users have unlocks |
| `name` | string | required |
| `description` | string | `''` |
| `icon` | string or AssetRef | `''` |
| `tier`, `rarity`, `category` | string or null | `null` |
| `hidden` | boolean | `false` |
| `purpose` | string | `''` |
| `conditions` | array, at least 1 | required |

A condition is `{ variableId, operator, threshold }`. Operators: `>=`, `>`, `==`, `<`,
`<=`, `!=`. All conditions of one achievement must hold (AND). See [03](03-achievements-explained.md).

### milestones[]

```jsonc
{
  "id": "the-groove", "level": 3, "threshold": 21, "label": "The Groove",
  "variableKey": "completionCount", "tier": "mastery", "hint": "...",
  "effect": { "type": "energyReduction", "percent": 25 }
}
```

Required: `id`, `level` (number), `threshold` (number), `label`. Optional: `variableKey`,
`hint`, `tier`, `effect`. When `variableKey` is set the milestone only checks that variable.
`effect` is `{ type: string }` plus any extra fields. It is passed through to the
`milestoneReached` signal untouched, so a new effect kind needs no schema change.

### streaks[]

`{ id, variableKey, milestones: number[] }`. When the variable reaches one of the numbers,
the engine fires `streakMilestone` once for it.

## importSchema and exportSchema

These describe the editor's level, variable and achievement export, separate from the full config.

| version | shape |
|---|---|
| `1.0.0` (`exportSchemaV1_0`) | `{ schemaVersion: '1.0.0', projectName, levels }` |
| `1.1.0` (`exportSchemaV1_1`) | the above with `schemaVersion: '1.1.0'`, plus `variables` and `achievements` (both default to `[]`) |

`importSchema` accepts both, discriminated on `schemaVersion`. `exportSchema` is the 1.1.0
schema, the one new exports use. Use `.parse` or `.safeParse` on them. They do not have
the version gate message of `parseConfig`.

## Known gaps

- No per-entity variables. A counter is global. A per-habit counter, such as Karv's
  `completionCount`, is declared as one plain counter in `fixtures/karv.json`.
- No `custom` screen type. A JSON file cannot carry a component.
- The permission screen has no `icon` or `skipText`.
- Naming is not uniform. Conditions use `variableId`. Milestones and streaks use
  `variableKey`.
- No effect type is defined by the schema. Effects are open on purpose.
- `emit` adds 1. No weighted increment, such as Karv's "energy spent" (PRS-464).

## Kept in the app on purpose

Checked against Progres and Karv (PRS-469). Add a field only when a second app needs it.

- **Which app action counts.** The event type already is the variable id (see
  [03](03-achievements-explained.md)). Which app code emits it (Progres' `addProgres()`)
  stays in the variable's `description`.
- **What happens on unlock.** Toasts, analytics and review prompts are app UX. Every app
  gets them from the `achievementUnlocked` signal (`useOnAchievementUnlocked` in
  `@xpkit-dev/react-native`). App rules such as "ask for a review on the first unlock that
  is not `starter`" stay in app code.

## Using the platform packages

The React Native package reads this same config. See
[`../packages/react-native/README.md`](../packages/react-native/README.md).
