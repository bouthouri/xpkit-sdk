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

await engine.ready                                  // stored state loaded (async storage)
engine.emit({ type: 'tasks_completed' })            // type = a variable id from your config
console.log(engine.getState().xp)
```

A `StorageAdapter` is just `get` / `set` / `remove` (sync or async), so MMKV, AsyncStorage,
localStorage or your own backend all fit.

See the [root README](../../README.md) for the full package list and docs.

## License

MIT
