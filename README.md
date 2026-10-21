# XP Kit SDK

XP Kit turns a JSON config (onboarding screens, levels, variables, achievements,
milestones, streaks) into app behaviour. One platform-free engine decides what unlocks
and persists it through an injected storage adapter; renderers stay thin and per platform.

## Install

```bash
bun add @xpkit-dev/core @xpkit-dev/react-native
```

## Usage

Core (any JS runtime):

```ts
import { parseConfig, createEngine, createMemoryStorage } from '@xpkit-dev/core'

const config = parseConfig(rawJson)
const engine = createEngine(config, { storage: createMemoryStorage() })  // or your own StorageAdapter
engine.subscribe(signal => console.log(signal.type))
await engine.ready
engine.emit({ type: 'tasks_completed' })         // a variable id from your config
```

React Native:

<!-- coming soon, PRS-457: @xpkit-dev/react-native does not exist yet -->
```tsx
import { XPKitProvider, useXPKit } from '@xpkit-dev/react-native'

export default function App() {
  return (
    <XPKitProvider config={config} storage={mmkvStorage}>
      <Home />
    </XPKitProvider>
  )
}
```

## Packages

| Package | Path | What it is |
|---|---|---|
| `@xpkit-dev/core` | [`packages/core`](packages/core) | Config schema (zod), `parseConfig`, `createEngine`, achievements, persisted stores, `StorageAdapter`. No UI, no platform APIs. |
| `@xpkit-dev/react-native` | [`packages/react-native`](packages/react-native) | Available. `XPKitProvider`, hooks (`useEmit`, `useLevel`, `useUnlockedAchievements`, signal hooks), `createMMKVStorage`, `AchievementBadge` / `AchievementGrid`, `OnboardingCarousel`, `WhatsNew`. |

## Example app

[`examples/expo-app`](examples/expo-app) is an Expo SDK 55 app wired to `@xpkit-dev/react-native`
(onboarding, a "Complete" button, levels, achievement grid, MMKV persistence). It needs a dev
build (react-native-mmkv is native), not Expo Go:

```bash
bun install
bun run build                      # the app consumes the built packages
cd examples/expo-app && bunx expo run:ios
```

Older reference material (vendored app code the
engine was extracted from) lives in [`docs/reference/examples`](docs/reference/examples).

## Develop

```bash
bun install
bun run test        # all workspaces
bun run typecheck
bun run build       # emits packages/*/dist
```

Or run a single package: `cd packages/core && bun test`.

## Package scope

`@xpkit-dev` is a working npm scope; every package name lives in `packages/*/package.json` and imports, rename = replace `@xpkit-dev/`.

## Docs

The notes in [`docs/`](docs) describe the JSON contract, onboarding, achievements and
storage. Test fixtures (three real app configs) are in
[`packages/core/fixtures`](packages/core/fixtures).
