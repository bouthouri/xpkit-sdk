import { describe, expect, it } from 'bun:test'
import { createEngine, createMemoryStorage, parseConfig, type EngineSignal } from '../src/index.js'

function makeConfig(achievementIds: string[]) {
  const all: Record<string, number> = { first: 1, third: 3, fifth: 5 }
  return parseConfig({
    schemaVersion: '1.0.0',
    projectName: 'restore',
    announcements: [],
    onboarding: { screens: [] },
    gamification: {
      // xp grows by 1 per emit.
      levels: [
        { id: 'l1', name: 'One', xpThreshold: 2 },
        { id: 'l2', name: 'Two', xpThreshold: 4 },
      ],
      variables: [{ id: 'task', name: 'Task', type: 'counter', description: '' }],
      achievements: achievementIds.map(id => ({
        id,
        name: id,
        conditions: [{ variableId: 'task', operator: '>=', threshold: all[id] }],
      })),
      milestones: [],
      streaks: [],
    },
  })
}

describe('createEngine restore', () => {
  it('restores unlocks and level from storage and does not re-fire them', () => {
    const storage = createMemoryStorage()
    const config = makeConfig(['first', 'third', 'fifth'])

    const a = createEngine(config, { storage })
    const firstRun: EngineSignal[] = []
    a.subscribe(s => firstRun.push(s))
    for (let i = 0; i < 4; i++) a.emit({ type: 'task' })
    const before = a.getState()
    expect(before.unlockedAchievements).toEqual(['first', 'third'])
    expect(before.currentLevelId).toBe('l2')
    expect(firstRun.filter(s => s.type === 'levelUp')).toHaveLength(2)

    const b = createEngine(config, { storage })
    const after = b.getState()
    expect(after.unlockedAchievements).toEqual(before.unlockedAchievements)
    expect(after.currentLevelId).toBe(before.currentLevelId)

    const secondRun: EngineSignal[] = []
    b.subscribe(s => secondRun.push(s))
    b.emit({ type: 'task' }) // task = 5: only fifth is new; xp 5 is still level l2
    expect(secondRun).toEqual([{ type: 'achievementUnlocked', id: 'fifth' }])
    expect(b.getState().unlockedAchievements).toEqual(['first', 'third', 'fifth'])
  })

  it('keeps an unlocked id in state after it is removed from config', () => {
    const storage = createMemoryStorage()
    const a = createEngine(makeConfig(['first', 'third']), { storage })
    a.emit({ type: 'task' })
    expect(a.getState().unlockedAchievements).toEqual(['first'])

    const b = createEngine(makeConfig(['third']), { storage })
    expect(b.getState().unlockedAchievements).toEqual(['first'])
    b.emit({ type: 'task' })
    b.emit({ type: 'task' })
    expect(b.getState().unlockedAchievements).toEqual(['first', 'third'])
  })
})
