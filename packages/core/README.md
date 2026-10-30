# @xpkit-dev/core

Platform-free XP Kit engine: config schema, levels, streaks, milestones, achievements and
persisted stores. Storage is injected; no UI, no platform APIs.

## Install

```bash
bun add @xpkit-dev/core
```

## Usage

```ts
import { parseConfig, createEngine, createMemoryStorage } from '@xpkit-dev/core'

const config = parseConfig(rawJson)                 // validates the JSON config
const engine = createEngine(config, { storage: createMemoryStorage() })

engine.subscribe(signal => {
  if (signal.type === 'achievementUnlocked') console.log('unlocked', signal.id)
})

engine.onChange(() => render(engine.getState()))      // any state change, signal or not

await engine.ready                                  // stored state loaded (async storage)
engine.emit({ type: 'tasks_completed' })            // type = a variable id from your config
console.log(engine.getState().xp)
```

A `StorageAdapter` is just `get` / `set` / `remove` (sync or async), so MMKV, AsyncStorage,
localStorage or your own backend all fit.

### Seeding and replacing state

```ts
import { createEngine, parseEngineState, ENGINE_STATE_KEY } from '@xpkit-dev/core'

// Migrate once: used only when storage has no valid state, saved once loading finishes
// (right away with sync storage), no signals. Throws TypeError when the seed is invalid.
// A failed storage read keeps the seed in memory only: it is not saved until the next change.
const engine = createEngine(config, { storage, initialState: legacyToEngineState(old) })

// Import or reset: force-replaces state, persists it, calls onChange, no signals.
engine.replaceState(importedState)        // throws TypeError when invalid

parseEngineState(json)                    // EngineState copy, or null when invalid
storage.get(ENGINE_STATE_KEY)             // the key, for apps that must inspect storage
```

See the [root README](../../README.md) for the full package list and docs.

## License

MIT
