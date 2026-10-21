# 04 — Storage and state

Two rules shape this whole layer:

1. **The library owns the store. The app answers "where do you persist".**
2. **The store is zustand *vanilla*, so it is React-free and therefore platform-free.**

Everything else follows.

---

## `configureXPKit` — one call, at startup

```ts
import { configureXPKit } from "@bouthouri/xpkit-core";

configureXPKit({ storage: mmkvAdapter, keyPrefix: "energy-xp", appVersion: v }); // RN
configureXPKit({ storage: localStorage });                                      // web
```

| option | default | notes |
|---|---|---|
| `storage` | `localStorage`, else memory + a warning | any `StorageAdapter` |
| `keyPrefix` | `"xpkit"` | namespaces every key → `energy-xp:onboarding` |
| `appVersion` | `null` | stamped as `lastSeenVersion` on completion |

**Ordering matters.** Options are frozen the first time any store is created. Call
`configureXPKit` before the first XP Kit component mounts; calling it later is a no-op with
a warning. This is the same constraint crayons has, and the reason
[`energy-xp/app/_layout.tsx`](reference/examples/usage/energy-xp-layout-excerpt.tsx) has
`import "../utils/onboarding-migration"` on **line 2** — above the crayons import.

On web there is nothing to configure: `localStorage` already satisfies `StorageAdapter`, so
the default is correct and the call is optional.

## The interface

```ts
export interface StorageAdapter {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): unknown | Promise<unknown>;
  removeItem(name: string): unknown | Promise<unknown>;
}
```

This is deliberately zustand's own `StateStorage` shape, and every method may return a
promise. That single fact is what makes MMKV (sync), AsyncStorage (async) and
`localStorage` all work through one interface — zustand's `persist` middleware awaits
whatever you return and handles hydration either way.

It also settles the brief's ★ open question about sync-vs-async `emit`. There is no
question: `persist` handles async storage natively, so the store's API stays synchronous
regardless of what the adapter does.

> PR #13 defines this as `{ get, set }`. That shape can't express removal and can't be
> async, so it can't back `persist`. Recorded as a divergence to reconcile in
> [`01-json-contract.md`](01-json-contract.md#modelling-gaps).

## Writing an adapter

### MMKV (Energy XP, Progres, Voila — synchronous)

```ts
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV();

export const mmkvAdapter: StorageAdapter = {
  getItem: (name) => mmkv.getString(name) ?? null,   // undefined → null matters
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.delete(name),
};
```

### AsyncStorage (asynchronous — the case that proves the interface)

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const asyncStorageAdapter: StorageAdapter = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};
```

No adapter code differs beyond these three lines. That is the point.

### `localStorage` (web — no adapter)

```ts
configureXPKit({ storage: localStorage });
```

### In-memory (tests)

Pass `{ persist: false }` to a store factory and the middleware is skipped entirely —
cleaner than injecting a null storage. `examples/onboarding/onboarding-store.ts` does
exactly this.

## Wiring a store

```ts
import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";
import { getXPKitRuntime, xpkitStorageKey } from "../shared/index";

const { storage } = getXPKitRuntime();

createStore<OnboardingStore>()(
  persist(
    (set) => ({ /* state + actions */ }),
    {
      name: xpkitStorageKey("onboarding"),          // → "energy-xp:onboarding"
      storage: createJSONStorage(() => storage),
      // achievements only — never persist the catalog
      // partialize: ({ counters, unlocked }) => ({ counters, unlocked }),
    },
  ),
);
```

`createStore` from **`zustand/vanilla`**, not `create` from `zustand`. `create` pulls in
React. Vanilla doesn't, which is why the same store file is importable from a node test.

## The three-line renderer hook

Each renderer adds this and nothing else:

```ts
import { useStore as useZustandStore } from "zustand";

export function useOnboardingStore<T>(store, selector: (s) => T): T {
  return useZustandStore(store, selector);
}
```

`onboarding/web/use-store.ts` and `onboarding/native/use-store.ts` are byte-identical. If
you ever find yourself writing a second version of one of these, something has leaked out
of the shared layer.

## Hydration

With a synchronous adapter, hydration is done before your first render and you will never
notice this section. With an async one it is not, and the consequence is visible: on every
cold start a returning user sees a flash of slide 1 before `isOnboarded` arrives.

`persist` exposes `hasHydrated()` and `onFinishHydration(cb)`. Render nothing until
hydration settles. Handle it now — MMKV and `localStorage` both hide the bug, so it will
not surface until someone's first RN build with AsyncStorage.

## What persists, and what must not

| store | persisted | never persisted |
|---|---|---|
| onboarding | `isOnboarded`, `lastSeenVersion` | the screens |
| achievements | `counters`, `unlocked` | the catalog |

The rule: **user state persists, config does not.** Config arrives fresh from the JSON on
every launch, which is what lets the editor ship a copy fix or a new badge without a
migration. Persisting a derived or config value turns every future edit into a data
problem — see
[`examples/usage/energy-xp-onboarding-migration.ts`](reference/examples/usage/energy-xp-onboarding-migration.ts)
for the shape of that mistake, already paid for once.

Keys are namespaced by `keyPrefix`, so two of these apps on one device never collide.
Once a key ships, it is frozen — same as an achievement id.
