> Moved: this code now lives in the [`xpkit`](https://github.com/bouthouri/xpkit) monorepo (`packages/`). This repo is frozen.

# XP Kit — runtime

```bash
bun install
bun dev      # → http://localhost:5173
bun test
```

`bun dev` opens a page that loads three real app configs and lets you fire the events that
drive them. `bun test` passes for the fixtures and **fails for the engine** — those
failures are the task list. Start at [`docs/05-first-task.md`](docs/05-first-task.md).

---

## What XP Kit is

Energy XP, Progres and Karv each hardcode their own onboarding carousel and their own
achievement system. Same shapes, three copies, and no way to change a screen's copy without
a store release.

XP Kit splits that in two:

- an **editor** (the [`xpkit`](https://github.com/bouthouri/xpkit) repo) where you configure
  onboarding and achievements, which emits JSON
- a **runtime** (this repo) that consumes that JSON and renders it

The JSON is the contract, and the two halves are built independently against it. That is
what [`fixtures/`](fixtures/) is for.

## What's here

One package. No workspace, no build step — `main` points at raw TypeScript and the consuming
app transpiles it, exactly like `@bouthouri/crayons`. **Subpath = folder path**, so importing
a module is just its directory, and if you'd rather not take the dependency at all you can
copy the folder into your app.

```
xpkit-core/
├─ README.md                    ← you are here
├─ playground/ · index.html      `bun dev` → browser. The runtime you can actually see.
│
├─ shared/                      platform-free: schema, parseConfig, StorageAdapter, configureXPKit
├─ onboarding/                  ⬅ INTERN FOLDER 1
│  ├─ index.ts                  the import entry point
│  ├─ types.ts · store.ts       platform-free lifecycle (zustand vanilla + persist)
│  ├─ web/                      the renderer you can run
│  └─ native/                   RN renderer — scaffolded; README explains what blocks it
├─ achievements/                ⬅ INTERN FOLDER 2
│  ├─ index.ts
│  ├─ types.ts · engine.ts · store.ts
│  ├─ web/
│  └─ native/
│
├─ examples/                    ⬅ READ ONLY. Real shipped code, for reference.
├─ fixtures/                    ⬅ the JSON contract. Also read only.
└─ docs/
```

You work in **`onboarding/`** and **`achievements/`**. You never edit `examples/` or
`fixtures/`.

## The shape of it

**One platform-free brain, thin per-platform renderers.**

The brain is schema + stores + lifecycle + unlock evaluation. It runs identically in a
browser and in React Native because the store is zustand **vanilla** (`createStore`), which
is React-free. Each renderer adds a three-line `useStore` hook and the platform bits —
`expo-video` vs `<video>`, MMKV vs `localStorage`.

Two consequences worth stating up front.

**Storage is injected, not implemented.** The library owns the store; the app answers "where
do you persist".

```ts
configureXPKit({ storage: mmkvAdapter, keyPrefix: "energy-xp" });   // RN
configureXPKit({ storage: localStorage });                          // web
```

**Lifecycle is the library's job, not the app's.** `isOnboarded`, "complete → hide →
persist", replay detection — all inside. The entire app-side integration is one component:

```tsx
<Onboarding config={config.onboarding} assets={assetMap} onComplete={() => presentPaywall()} />
```

It renders nothing if the user is already onboarded, persists on completion, and
`replayOnboarding()` re-shows it for the Settings row.

## Docs

| File | Contents |
|---|---|
| [`docs/01-json-contract.md`](docs/01-json-contract.md) | the v1 schema field by field, the app→v1 mapping tables, and the parity gaps v1 can't yet express |
| [`docs/02-onboarding-explained.md`](docs/02-onboarding-explained.md) | how the real carousel works — the 5 slide types, why the footer says "Continue without", the 600 ms auto-advance, replay, why it renders `null` |
| [`docs/03-achievements-explained.md`](docs/03-achievements-explained.md) | the 6 counters and their 7 call sites, the full-catalog scan, `>=` not `==`, unlock persistence by id |
| [`docs/04-storage-and-state.md`](docs/04-storage-and-state.md) | `configureXPKit`, writing an adapter, the MMKV / AsyncStorage / localStorage snippets |
| [`docs/05-first-task.md`](docs/05-first-task.md) | **start here** — the ordered task list with acceptance criteria |
| [`docs/issues/onboarding-web-limitation.md`](docs/issues/onboarding-web-limitation.md) | why the shipped carousel can't run in a browser, and why that blocks nothing |
| [`examples/README.md`](examples/README.md) | what's vendored, where from, and why not to import it |
| [`fixtures/README.md`](fixtures/README.md) | the three fixtures and their provenance |

## Rules

- No `@bouthouri/crayons` in `shared/`, `onboarding/` or `achievements/`. It doesn't work on
  web.
- No `react-native` in `dependencies`. (`zod` and zustand vanilla are platform-free;
  `react-native` and `react-native-mmkv` are not.)
- Never edit `examples/` or `fixtures/`.
- Achievement ids and storage keys are **frozen once they ship** — user state persists by
  them.
- `bun typecheck` and `bun test` before pushing.
