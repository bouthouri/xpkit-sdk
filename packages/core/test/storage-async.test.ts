import { describe, expect, it } from 'bun:test'

import {
  createEngine,
  createMemoryStorage,
  parseConfig,
  type EngineSignal,
  type StorageAdapter,
} from '../src/index.js'

const config = parseConfig({
  schemaVersion: '1.0.0',
  projectName: 'async-storage',
  announcements: [],
  onboarding: { screens: [] },
  gamification: {
    levels: [],
    variables: [{ id: 'task', name: 'Task', type: 'counter', description: '' }],
    achievements: [
      { id: 'first', name: 'First', conditions: [{ variableId: 'task', operator: '>=', threshold: 1 }] },
      { id: 'third', name: 'Third', conditions: [{ variableId: 'task', operator: '>=', threshold: 3 }] },
      { id: 'fifth', name: 'Fifth', conditions: [{ variableId: 'task', operator: '>=', threshold: 5 }] },
    ],
    milestones: [],
    streaks: [],
  },
})

/** Wraps a sync adapter so every call resolves on a later tick, like AsyncStorage. */
function asyncStorage(inner: StorageAdapter, getDelayMs = 5) {
  const writes: string[] = []
  const adapter: StorageAdapter = {
    get: async key => {
      await new Promise(resolve => setTimeout(resolve, getDelayMs))
      return inner.get(key)
    },
    set: async (key, value) => {
      writes.push(value)
      await inner.set(key, value)
    },
    remove: async key => {
      await inner.remove(key)
    },
  }
  return { adapter, writes }
}

describe('engine with asynchronous storage', () => {
  it('applies events emitted before ready on top of the stored state', async () => {
    const backing = createMemoryStorage()
    const seed = createEngine(config, { storage: backing })
    seed.emit({ type: 'task' })
    seed.emit({ type: 'task' })
    expect(seed.getState().unlockedAchievements).toEqual(['first'])

    const { adapter } = asyncStorage(backing)
    const engine = createEngine(config, { storage: adapter })
    const signals: EngineSignal[] = []
    engine.subscribe(signal => signals.push(signal))

    // Not hydrated yet: starts empty, events are queued, nothing fires.
    engine.emit({ type: 'task' })
    engine.emit({ type: 'task' })
    expect(engine.getState().variables).toEqual({})
    expect(signals).toEqual([])

    await engine.ready

    // 2 stored + 2 queued = 4. `first` is not re-fired; `third` fires.
    expect(engine.getState().variables.task).toBe(4)
    expect(engine.getState().unlockedAchievements).toEqual(['first', 'third'])
    expect(signals).toEqual([{ type: 'achievementUnlocked', id: 'third' }])

    // After ready, emit is applied immediately.
    engine.emit({ type: 'task' })
    expect(engine.getState().unlockedAchievements).toEqual(['first', 'third', 'fifth'])
  })

  it('persists the merged state after hydration', async () => {
    const backing = createMemoryStorage()
    const { adapter, writes } = asyncStorage(backing)
    const engine = createEngine(config, { storage: adapter })
    engine.emit({ type: 'task' })
    await engine.ready
    expect(writes.length).toBeGreaterThan(0)
    await Promise.resolve()
    const restored = createEngine(config, { storage: backing })
    expect(restored.getState().unlockedAchievements).toEqual(['first'])
  })

  it('starts empty and still flushes queued events when the read rejects', async () => {
    const adapter: StorageAdapter = {
      get: () => Promise.reject(new Error('disk on fire')),
      set: () => Promise.reject(new Error('disk on fire')),
      remove: () => Promise.resolve(),
    }
    const engine = createEngine(config, { storage: adapter })
    engine.emit({ type: 'task' })
    await engine.ready
    expect(engine.getState().unlockedAchievements).toEqual(['first'])
    // A rejecting write must not produce an unhandled rejection.
    engine.emit({ type: 'task' })
    await new Promise(resolve => setTimeout(resolve, 5))
  })

  it('treats corrupt stored JSON as an empty state (sync and async)', async () => {
    const backing = createMemoryStorage()
    backing.set('xpkit_state', '{not json')
    const sync = createEngine(config, { storage: backing })
    expect(sync.getState().xp).toBe(0)

    const { adapter } = asyncStorage(backing)
    const async_ = createEngine(config, { storage: adapter })
    await async_.ready
    expect(async_.getState().xp).toBe(0)
  })

  it('sync storage is ready immediately', async () => {
    const engine = createEngine(config, { storage: createMemoryStorage() })
    await engine.ready
    engine.emit({ type: 'task' })
    expect(engine.getState().unlockedAchievements).toEqual(['first'])
  })
})
