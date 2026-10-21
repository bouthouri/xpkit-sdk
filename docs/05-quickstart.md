# 05. Quickstart

Install the core package and parse a config.

```bash
bun add @xpkit-dev/core
```

```ts
import { createEngine, createMemoryStorage, parseConfig } from '@xpkit-dev/core'
import raw from './xpkit.json'

const config = parseConfig(raw)               // throws on a bad file, with field paths
const storage = createMemoryStorage()         // swap for MMKV, localStorage or AsyncStorage
const engine = createEngine(config, { storage })

const stop = engine.subscribe(signal => {
  if (signal.type === 'achievementUnlocked') console.log('unlocked', signal.id)
  if (signal.type === 'levelUp') console.log('level', signal.levelId)
})

engine.emit({ type: 'pathCreated' })          // variable id, +1 XP
console.log(engine.getState().xp)             // 1
stop()
```

State is saved after each `emit` under `xpkit_state`. Create a new engine with the same
storage and it picks up where the last one stopped. With an async adapter, `await engine.ready` first.

## Test it

```ts
import { expect, it } from 'bun:test'
import { createEngine, createMemoryStorage, parseConfig } from '@xpkit-dev/core'

it('unlocks and persists', async () => {
  const storage = createMemoryStorage()
  const config = parseConfig(raw)
  const first = createEngine(config, { storage })
  first.emit({ type: 'pathCreated' })

  const second = createEngine(config, { storage })
  await second.ready
  expect(second.getState().xp).toBe(1)
})
```

The package fixtures in `packages/core/fixtures` are real configs from three apps.
They are exported as `@xpkit-dev/core/fixtures/progres.json` and so on.

## Next

- [01](01-json-contract.md) the JSON contract
- [02](02-onboarding-explained.md) onboarding
- [03](03-achievements-explained.md) achievements, XP and levels
- [04](04-storage-and-state.md) storage
- React Native: [`../packages/react-native/README.md`](../packages/react-native/README.md)
