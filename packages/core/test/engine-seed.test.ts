import { describe, expect, it } from 'bun:test'

import {
  createEngine,
  createMemoryStorage,
  ENGINE_STATE_KEY,
  parseConfig,
  parseEngineState,
  type EngineSignal,
  type EngineState,
  type StorageAdapter,
} from '../src/index.js'

const config = parseConfig({
  schemaVersion: '1.0.0',
  projectName: 'seed',
  announcements: [],
  onboarding: { screens: [] },
  gamification: {
    levels: [{ id: 'l1', name: 'One', xpThreshold: 2 }],
    variables: [{ id: 'task', name: 'Task', type: 'counter', description: '' }],
    achievements: [
      { id: 'first', name: 'First', conditions: [{ variableId: 'task', operator: '>=', threshold: 1 }] },
      { id: 'third', name: 'Third', conditions: [{ variableId: 'task', operator: '>=', threshold: 3 }] },
    ],
    milestones: [],
    streaks: [],
  },
})

const seedState = (): EngineState => ({
  variables: { task: 2 },
  unlockedAchievements: ['first'],
  milestoneLevels: {},
  reachedStreakMilestones: {},
  xp: 2,
  currentLevelId: 'l1',
})

const otherState = (): EngineState => ({ ...seedState(), variables: { task: 1 }, xp: 7 })

/** Wraps a sync adapter so every call resolves on a later tick, like AsyncStorage. */
function asyncStorage(inner: StorageAdapter, getDelayMs = 5): StorageAdapter {
  return {
    get: async key => {
      await new Promise(resolve => setTimeout(resolve, getDelayMs))
      return inner.get(key)
    },
    set: async (key, value) => {
      await inner.set(key, value)
    },
    remove: async key => {
      await inner.remove(key)
    },
  }
}

function collect(engine: ReturnType<typeof createEngine>) {
  const signals: EngineSignal[] = []
  engine.subscribe(s => signals.push(s))
  return signals
}

describe('parseEngineState', () => {
  it('accepts a full state, as object or JSON string', () => {
    expect(parseEngineState(seedState())).toEqual(seedState())
    expect(parseEngineState(JSON.stringify(seedState()))).toEqual(seedState())
  })

  it('fills defaults for a partial state', () => {
    expect(parseEngineState({ xp: 3 })).toEqual({
      variables: {},
      unlockedAchievements: [],
      milestoneLevels: {},
      reachedStreakMilestones: {},
      xp: 3,
      currentLevelId: null,
    })
    expect(parseEngineState({})?.xp).toBe(0)
  })

  it('returns null for bad JSON and non-objects', () => {
    expect(parseEngineState('{nope')).toBeNull()
    expect(parseEngineState('')).toBeNull()
    expect(parseEngineState([])).toBeNull()
    expect(parseEngineState(null)).toBeNull()
    expect(parseEngineState(undefined)).toBeNull()
    expect(parseEngineState(5)).toBeNull()
    expect(parseEngineState('"str"')).toBeNull()
  })

  it('returns null when any present field has the wrong type', () => {
    const bad: Record<string, unknown>[] = [
      { variables: [] },
      { variables: { a: 'x' } },
      { variables: { a: Number.NaN } },
      { unlockedAchievements: 'first' },
      { unlockedAchievements: [1] },
      { milestoneLevels: { a: true } },
      { milestoneLevels: { a: Infinity } },
      { reachedStreakMilestones: { a: 1 } },
      { xp: '3' },
      { xp: Number.NaN },
      { currentLevelId: 3 },
    ]
    for (const patch of bad) expect(parseEngineState({ ...seedState(), ...patch })).toBeNull()
  })

  it('returns a copy, never the input', () => {
    const input = seedState()
    const out = parseEngineState(input)!
    expect(out).not.toBe(input)
    expect(out.variables).not.toBe(input.variables)
    expect(out.unlockedAchievements).not.toBe(input.unlockedAchievements)
    out.unlockedAchievements.push('x')
    out.variables.task = 99
    expect(input.unlockedAchievements).toEqual(['first'])
    expect(input.variables.task).toBe(2)
  })
})

describe('createEngine initialState (sync storage)', () => {
  it('seeds empty storage, saves it, fires no signals, and continues from it', () => {
    const storage = createMemoryStorage()
    const engine = createEngine(config, { storage, initialState: seedState() })
    const signals = collect(engine)
    expect(engine.getState()).toEqual(seedState())
    expect(JSON.parse(storage.get(ENGINE_STATE_KEY) as string)).toEqual(seedState())
    expect(signals).toEqual([])

    engine.emit({ type: 'task' })
    expect(engine.getState().variables.task).toBe(3)
    // 'first' was already unlocked in the seed: only 'third' fires.
    expect(signals).toEqual([{ type: 'achievementUnlocked', id: 'third' }])
  })

  it('lets a valid stored state win', () => {
    const storage = createMemoryStorage()
    storage.set(ENGINE_STATE_KEY, JSON.stringify(otherState()))
    const engine = createEngine(config, { storage, initialState: seedState() })
    expect(engine.getState()).toEqual(otherState())
    expect(JSON.parse(storage.get(ENGINE_STATE_KEY) as string)).toEqual(otherState())
  })

  it('uses initialState over corrupt stored state', () => {
    for (const raw of ['{nope', JSON.stringify({ ...otherState(), xp: 'many' })]) {
      const storage = createMemoryStorage()
      storage.set(ENGINE_STATE_KEY, raw)
      const engine = createEngine(config, { storage, initialState: seedState() })
      expect(engine.getState()).toEqual(seedState())
      expect(JSON.parse(storage.get(ENGINE_STATE_KEY) as string)).toEqual(seedState())
    }
  })

  it('throws a TypeError for an invalid initialState', () => {
    const bad = { ...seedState(), xp: 'x' } as unknown as EngineState
    expect(() => createEngine(config, { storage: createMemoryStorage(), initialState: bad })).toThrow(TypeError)
  })
})

describe('createEngine initialState (async storage)', () => {
  it('seeds empty storage, saves it, fires no signals, and keeps queued events on top', async () => {
    const backing = createMemoryStorage()
    const engine = createEngine(config, { storage: asyncStorage(backing), initialState: seedState() })
    const signals = collect(engine)
    engine.emit({ type: 'task' })
    await engine.ready
    expect(engine.getState().variables.task).toBe(3)
    expect(signals).toEqual([{ type: 'achievementUnlocked', id: 'third' }])
    expect(JSON.parse(backing.get(ENGINE_STATE_KEY) as string).variables.task).toBe(3)
  })

  it('saves the seed right away when nothing is queued', async () => {
    const backing = createMemoryStorage()
    const engine = createEngine(config, { storage: asyncStorage(backing), initialState: seedState() })
    const signals = collect(engine)
    await engine.ready
    expect(engine.getState()).toEqual(seedState())
    expect(JSON.parse(backing.get(ENGINE_STATE_KEY) as string)).toEqual(seedState())
    expect(signals).toEqual([])
  })

  it('lets a valid stored state win', async () => {
    const backing = createMemoryStorage()
    backing.set(ENGINE_STATE_KEY, JSON.stringify(otherState()))
    const engine = createEngine(config, { storage: asyncStorage(backing), initialState: seedState() })
    await engine.ready
    expect(engine.getState()).toEqual(otherState())
  })

  it('uses initialState over corrupt stored state', async () => {
    for (const raw of ['{nope', JSON.stringify({ ...otherState(), xp: 'many' })]) {
      const backing = createMemoryStorage()
      backing.set(ENGINE_STATE_KEY, raw)
      const engine = createEngine(config, { storage: asyncStorage(backing), initialState: seedState() })
      await engine.ready
      expect(engine.getState()).toEqual(seedState())
    }
  })
})

describe('engine.replaceState', () => {
  it('replaces, persists, calls onChange and fires no signals', () => {
    const storage = createMemoryStorage()
    const engine = createEngine(config, { storage })
    const signals = collect(engine)
    let changes = 0
    engine.onChange(() => changes++)

    engine.replaceState(seedState())
    expect(engine.getState()).toEqual(seedState())
    expect(JSON.parse(storage.get(ENGINE_STATE_KEY) as string)).toEqual(seedState())
    expect(changes).toBe(1)
    expect(signals).toEqual([])
  })

  it('throws a TypeError for an invalid state and leaves state unchanged', () => {
    const storage = createMemoryStorage()
    const engine = createEngine(config, { storage, initialState: seedState() })
    let changes = 0
    engine.onChange(() => changes++)
    const bad = { ...seedState(), unlockedAchievements: 'x' } as unknown as EngineState
    expect(() => engine.replaceState(bad)).toThrow(TypeError)
    expect(engine.getState()).toEqual(seedState())
    expect(changes).toBe(0)
  })

  it('wins over the stored value when called before async hydration finishes', async () => {
    const backing = createMemoryStorage()
    backing.set(ENGINE_STATE_KEY, JSON.stringify(otherState()))
    const engine = createEngine(config, { storage: asyncStorage(backing) })
    engine.emit({ type: 'task' }) // dropped by the replace below
    engine.replaceState(seedState())
    engine.emit({ type: 'task' }) // applies on top of the replacement
    await engine.ready
    expect(engine.getState().xp).toBe(3)
    expect(engine.getState().variables.task).toBe(3)
    expect(engine.getState().unlockedAchievements).toEqual(['first', 'third'])
    expect(JSON.parse(backing.get(ENGINE_STATE_KEY) as string).xp).toBe(3)
  })
})
