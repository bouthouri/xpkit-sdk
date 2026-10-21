/**
 * Contract test: every shipped fixture must parse, drive the engine, and unlock every
 * achievement that can be reached by emitting events on its condition variables.
 */

import { describe, expect, it } from 'bun:test'

import {
  createEngine,
  createMemoryStorage,
  parseConfig,
  parseOnboardingConfig,
  type Achievement,
  type Condition,
  type EngineSignal,
  type XPKitConfig,
} from '../src/index.js'
import { fixtureNames, rawFixtures } from './helpers/fixtures.js'

type VariableTypes = Map<string, 'counter' | 'streak' | 'boolean'>

// Operators whose satisfaction is not monotonic in "more events" (`<`, `<=`, `==`, `!=`)
// are skipped: emitting events can only move a counter up, so "reach it by emitting" is
// not a well-defined recipe for them. They are covered by engine-conditions.test.ts.
const REACHABLE_OPERATORS = new Set<Condition['operator']>(['>=', '>'])

/** Events needed on one variable to satisfy one condition. */
function eventsNeeded(condition: Condition, type: string | undefined): number {
  if (type === 'boolean') return 1
  // `>=`: threshold events. `>`: threshold + 1. At least one so the engine evaluates.
  const n = condition.operator === '>' ? Math.floor(condition.threshold) + 1 : Math.ceil(condition.threshold)
  return Math.max(1, n)
}

/** Value a variable holds after `events` events (booleans count as 1 once set). */
function valueAfter(events: number, type: string | undefined): number {
  return type === 'boolean' ? (events > 0 ? 1 : 0) : events
}

function isReachable(achievement: Achievement, types: VariableTypes, plan: Map<string, number>): boolean {
  if (achievement.conditions.length === 0) return false
  return achievement.conditions.every(c => {
    if (!REACHABLE_OPERATORS.has(c.operator)) return false
    const value = valueAfter(plan.get(c.variableId) ?? 0, types.get(c.variableId))
    return c.operator === '>=' ? value >= c.threshold : value > c.threshold
  })
}

function buildPlan(config: XPKitConfig) {
  const types: VariableTypes = new Map(config.gamification.variables.map(v => [v.id, v.type]))
  // Per variable: the most events any (supported-operator) condition on it requires.
  const plan = new Map<string, number>()
  for (const achievement of config.gamification.achievements) {
    for (const condition of achievement.conditions) {
      if (!REACHABLE_OPERATORS.has(condition.operator)) continue
      const needed = eventsNeeded(condition, types.get(condition.variableId))
      plan.set(condition.variableId, Math.max(plan.get(condition.variableId) ?? 0, needed))
    }
  }
  const reachable = config.gamification.achievements.filter(a => isReachable(a, types, plan))
  return { plan, reachable }
}

describe.each(fixtureNames)('contract: %s fixture', name => {
  it('parses and drives the engine; reachable achievements unlock and persist', () => {
    const config = parseConfig(rawFixtures[name])
    const { plan, reachable } = buildPlan(config)

    const storage = createMemoryStorage()
    const engine = createEngine(config, { storage })
    const signals: EngineSignal[] = []
    engine.subscribe(signal => signals.push(signal))

    for (const [variableId, count] of plan) {
      for (let i = 0; i < count; i++) engine.emit({ type: variableId })
    }

    const unlocked = engine.getState().unlockedAchievements
    const fired = signals.flatMap(s => (s.type === 'achievementUnlocked' ? [s.id] : []))

    for (const achievement of reachable) {
      expect(unlocked).toContain(achievement.id)
      expect(fired).toContain(achievement.id)
    }
    // No achievement fires twice.
    expect(new Set(fired).size).toBe(fired.length)
    expect([...fired].sort()).toEqual([...unlocked].sort())

    // A second engine over the same storage restores the unlocks without re-firing.
    const second = createEngine(config, { storage })
    const refired: EngineSignal[] = []
    second.subscribe(signal => refired.push(signal))
    expect(second.getState().unlockedAchievements).toEqual(unlocked)
    expect(refired).toEqual([])
  })
})

describe('contract: coverage sanity', () => {
  it('at least one fixture exercises reachable achievements', () => {
    const total = fixtureNames.reduce(
      (sum, name) => sum + buildPlan(parseConfig(rawFixtures[name])).reachable.length,
      0,
    )
    expect(total).toBeGreaterThan(0)
  })

  it('progres: all 25 achievements are reachable with >= conditions', () => {
    const { reachable } = buildPlan(parseConfig(rawFixtures.progres))
    expect(reachable).toHaveLength(25)
  })
})

describe('contract: named outcomes per fixture', () => {
  it('karv: completionCount reaches every milestone exactly once, kept after restore', () => {
    const config = parseConfig(rawFixtures.karv)
    const milestones = config.gamification.milestones
    expect(milestones).toHaveLength(7)
    const max = Math.max(...milestones.map(m => m.threshold))

    const storage = createMemoryStorage()
    const engine = createEngine(config, { storage })
    const reached: string[] = []
    engine.subscribe(s => {
      if (s.type === 'milestoneReached') reached.push(s.id)
    })
    for (let i = 0; i < max + 5; i++) engine.emit({ type: 'completionCount' })

    expect([...reached].sort()).toEqual(milestones.map(m => m.id).sort())
    expect(engine.getState().variables.completionCount).toBe(max + 5)

    const again = createEngine(config, { storage })
    const refired: EngineSignal[] = []
    again.subscribe(s => refired.push(s))
    again.emit({ type: 'completionCount' })
    expect(refired.filter(s => s.type === 'milestoneReached')).toEqual([])
    expect(Object.keys(again.getState().milestoneLevels)).toHaveLength(7)
  })

  it('karv: one event short of the first threshold reaches nothing', () => {
    const config = parseConfig(rawFixtures.karv)
    const first = Math.min(...config.gamification.milestones.map(m => m.threshold))
    const engine = createEngine(config, { storage: createMemoryStorage() })
    for (let i = 0; i < first - 1; i++) engine.emit({ type: 'completionCount' })
    expect(engine.getState().milestoneLevels).toEqual({})
  })

  it('energy-xp: onboarding has 4 screens and parses on its own', () => {
    const config = parseConfig(rawFixtures['energy-xp'])
    expect(config.onboarding.screens).toHaveLength(4)
    expect(parseOnboardingConfig(rawFixtures['energy-xp']).screens.map(s => s.id)).toEqual(
      config.onboarding.screens.map(s => s.id),
    )
  })

  it('progres: all 25 achievements unlock, none before its threshold', () => {
    const config = parseConfig(rawFixtures.progres)
    const { plan } = buildPlan(config)
    const engine = createEngine(config, { storage: createMemoryStorage() })
    for (const [variableId, count] of plan) {
      for (let i = 0; i < count - 1; i++) engine.emit({ type: variableId })
    }
    const early = new Set(engine.getState().unlockedAchievements)
    for (const a of config.gamification.achievements) {
      const lastStep = a.conditions.some(c => (plan.get(c.variableId) ?? 0) === eventsNeeded(c, undefined))
      if (lastStep && a.conditions.length === 1) expect(early.has(a.id)).toBe(false)
    }
    for (const [variableId] of plan) engine.emit({ type: variableId })
    expect(engine.getState().unlockedAchievements).toHaveLength(25)
  })

  it('every fixture fails parseConfig when a required field is removed', () => {
    for (const name of fixtureNames) {
      const broken = structuredClone(rawFixtures[name]) as Record<string, unknown>
      delete broken.gamification
      expect(() => parseConfig(broken)).toThrow()
    }
  })

  it('two engines on separate storage do not share state', () => {
    const config = parseConfig(rawFixtures.karv)
    const a = createEngine(config, { storage: createMemoryStorage() })
    const b = createEngine(config, { storage: createMemoryStorage() })
    a.emit({ type: 'completionCount' })
    expect(b.getState().variables).toEqual({})
  })
})
