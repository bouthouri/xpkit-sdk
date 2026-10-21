# 04. Storage and state

Core never picks a storage backend. You inject one.

## StorageAdapter

```ts
interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>
  set(key: string, value: string): void | Promise<void>
  remove(key: string): void | Promise<void>
}
```

Each method may be synchronous or return a promise. One interface covers MMKV and
`localStorage` (sync) and AsyncStorage or IndexedDB (async). An MMKV adapter for React
Native is `createMMKVStorage` in
[`../packages/react-native/README.md`](../packages/react-native/README.md).

`createMemoryStorage()` returns a sync adapter backed by a `Map`. Nothing survives the
process. Use it in tests.

## toStateStorage

Zustand's `persist` middleware wants `getItem/setItem/removeItem`.
`toStateStorage(adapter)` maps `get/set/remove` onto those names and returns a `StateStorage`.
The built-in stores do this for you:

```ts
createJSONStorage(() => toStateStorage(storage))
```

You only need it for your own zustand stores.

## The engine

`createEngine(config, { storage })` saves its whole state as JSON under the key
`xpkit_state`. It does not use `keyPrefix`. Give each engine its own adapter if two engines
share a backend.

- Sync storage: state loads before `createEngine` returns, and `engine.ready` is already
  resolved.
- Async storage: the engine starts empty. Events passed to `emit` are queued. When the
  stored state arrives, the queue is applied on top of it, in order, and the result is
  saved once. Await `engine.ready` when you need the loaded state.
- `emit` and `getState` are always synchronous.
- Corrupt or missing JSON gives an empty state. A failed `get` does the same.
- A failed `set`, whether it throws or rejects, is ignored. It never breaks `emit`.

```ts
const engine = createEngine(config, { storage: asyncStorage })
engine.emit({ type: 'taskDone' })   // queued
await engine.ready                  // loaded, queue applied
engine.getState().xp
```

## configureXPKit

The achievements and onboarding stores read one shared runtime config.

```ts
import { configureXPKit } from '@xpkit-dev/core'

configureXPKit({ storage, keyPrefix: 'energy-xp', appVersion: '1.7.1' })
```

| option | default | use |
|---|---|---|
| `storage` | `globalThis.localStorage`, else memory | where stores persist |
| `keyPrefix` | `xpkit` | namespaces keys, so two apps on one device never collide |
| `appVersion` | `null` | stamped on onboarding completion, see [02](02-onboarding-explained.md) |

Call it once, before the first store is created. After that, the options are frozen. A
later call logs a warning and is ignored. Without a `storage` on a platform with no
`localStorage`, core warns and falls back to memory.

`xpkitStorageKey('onboarding')` returns `energy-xp:onboarding`. `getXPKitRuntime()` returns
the resolved options. `resetXPKitForTests()` clears them between tests.

## Keys at a glance

| key | written by |
|---|---|
| `xpkit_state` | `createEngine`, as is |
| `<keyPrefix>:achievements` | `createAchievementsStore` |
| `<keyPrefix>:onboarding` | `createOnboardingStore` |

## Async hydration of the stores

The two stores use zustand `persist`. With an async adapter they hydrate after creation.
Check `store.persist.hasHydrated()` or listen with `store.persist.onFinishHydration(fn)`
before you read them.
