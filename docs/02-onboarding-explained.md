# 02. Onboarding

`@xpkit-dev/core` owns the data and the lifecycle of onboarding. It draws nothing.
Renderers live in the platform packages, for example
[`../packages/react-native/README.md`](../packages/react-native/README.md).

## Parsing

```ts
import { parseConfig, parseOnboardingConfig } from '@xpkit-dev/core'

const fromFull = parseConfig(raw).onboarding
const fromFile = parseOnboardingConfig(raw)
```

`parseOnboardingConfig(raw)` accepts a full config or an onboarding-only file:

```json
{ "schemaVersion": "1.0.0", "onboarding": { "screens": [] } }
```

`projectName` is optional in that file. The version gate and the error format are the same
as `parseConfig` (see [01](01-json-contract.md)). It returns `{ screens, showSkip }`.

Screen types are in [01](01-json-contract.md). Core also exports the narrowed types
`ContentScreen`, `VideoScreen`, `PermissionScreen` and `NotificationScreen`, for a renderer's
`switch (screen.type)`.

## Assets

Screens refer to media with `{ kind: 'asset', key }`. The renderer receives an `AssetMap`
and calls `resolveAsset(assets, ref)`. A missing key throws an error that names the key
and lists the known ones.

## Permissions

`permission` and `notification` screens need the OS. Core does not import any native
module. It defines the types a renderer takes instead.

- `PermissionHandler`: `check()`, `request()`, optional `openSettings()`.
- `PermissionHandlers`: a record keyed by permission id. A `notification` screen looks up
  `notifications`. A `permission` screen looks up its own `permission` field.
- `PermissionStatus`: `granted`, `denied` or `blocked`.

A missing handler should degrade to a skippable screen, not a crash.
`OnboardingProps` documents the props a renderer is expected to accept (`config`, `assets`,
`onComplete`, `onSkip`, `showSkip`, `permissions`, `testID`).

## The onboarding store

```ts
import { configureXPKit, getOnboardingStore, replayOnboarding } from '@xpkit-dev/core'

configureXPKit({ keyPrefix: 'energy-xp', appVersion: '1.7.1' })

const store = getOnboardingStore()
store.getState().complete()
```

State has two fields:

| field | meaning |
|---|---|
| `isOnboarded` | `true` once finished. A renderer shows nothing when it is `true`. |
| `lastSeenVersion` | the `appVersion` from `configureXPKit` at completion, or `null` |

Actions:

| action | effect |
|---|---|
| `complete()` | `isOnboarded = true`, `lastSeenVersion = appVersion` |
| `replay()` | `isOnboarded = false`, `lastSeenVersion` is kept |
| `reset()` | both back to `false` and `null`, so the next launch is a first run |

The store is a zustand vanilla store, persisted under `<keyPrefix>:onboarding`
(`xpkit:onboarding` by default). Use `createOnboardingStore({ name, persist })` for a
separate instance. `persist: false` skips storage and is meant for tests.
`getOnboardingStore()` returns a lazy singleton, so call `configureXPKit` first.
`replayOnboarding()` calls `replay()` on it. Wire it to a "View onboarding again" row.
`resetOnboardingStoreForTests()` drops the singleton.

## Replay semantics

`replay()` clears `isOnboarded` but keeps `lastSeenVersion`. So `lastSeenVersion !== null`
means the user has seen onboarding before. A renderer uses that to tell a first run from a
replay. By contract, `onComplete` fires on the first completion only, which is where a
paywall goes, and a replay does not fire it.

`lastSeenVersion` is only as useful as the `appVersion` you configure. If you do not pass
one, it stays `null` after `complete()`, and replay cannot be detected.

## Async storage

With an async adapter the store hydrates after creation. `persist` provides
`store.persist.hasHydrated()` and `store.persist.onFinishHydration(fn)`. A renderer should
render nothing until hydration finishes, or a returning user sees the first screen for a
moment. See [04](04-storage-and-state.md).
