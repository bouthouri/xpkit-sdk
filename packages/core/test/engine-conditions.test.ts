import { describe, expect, it } from 'bun:test'
import { createEngine, createMemoryStorage, parseConfig, type EngineSignal } from '../src/index.js'

const parsed = parseConfig({
  schemaVersion: '1.0.0',
  projectName: 'conditions',
  announcements: [],
  onboarding: { screens: [] },
  gamification: {
    levels: [],
    variables: [
      { id: 'task', name: 'Task', type: 'counter', description: '' },
      { id: 'onboarded', name: 'Onboarded', type: 'boolean', description: '' },
    ],
    achievements: [
      { id: 'flag', name: 'Flag', conditions: [{ variableId: 'onboarded', operator: '>=', threshold: 1 }] },
      { id: 'two', name: 'Two', conditions: [{ variableId: 'task', operator: '>=', threshold: 2 }] },
    ],
    milestones: [],
    streaks: [],
  },
})

// parseConfig now rejects achievements without conditions; inject them post-parse to
// keep testing the engine's defensive behaviour.
const config = {
  ...parsed,
  gamification: {
    ...parsed.gamification,
    achievements: [
      { id: 'empty', name: 'Empty', conditions: [] },
      { id: 'omitted', name: 'Omitted' },
      ...parsed.gamification.achievements,
    ],
  },
} as unknown as typeof parsed

describe('createEngine achievement conditions', () => {
  it('never unlocks an achievement with conditions: []', () => {
    const engine = createEngine(config, { storage: createMemoryStorage() })
    const signals: EngineSignal[] = []
    engine.subscribe(s => signals.push(s))
    for (let i = 0; i < 5; i++) engine.emit({ type: 'task' })
    expect(engine.getState().unlockedAchievements).not.toContain('empty')
    expect(engine.getState().unlockedAchievements).not.toContain('omitted')
    expect(signals.some(s => s.type === 'achievementUnlocked' && (s.id === 'empty' || s.id === 'omitted'))).toBe(false)
  })

  it('still maps boolean variables to 1/0 and evaluates numeric conditions', () => {
    const engine = createEngine(config, { storage: createMemoryStorage() })
    engine.emit({ type: 'onboarded' })
    expect(engine.getState().unlockedAchievements).toEqual(['flag'])
    engine.emit({ type: 'task' })
    engine.emit({ type: 'task' })
    expect(engine.getState().unlockedAchievements).toEqual(['flag', 'two'])
  })
})
