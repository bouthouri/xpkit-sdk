import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'
import { applyIncrement, applySetCounter, parseConfig } from '../src/index.js'

const raw = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/progres.json', import.meta.url)), 'utf8'),
)
const { variables, achievements: catalog } = parseConfig(raw).gamification

describe('progres fixture through the pure engine', () => {
  it('no achievement has empty conditions', () => {
    for (const a of catalog) expect(a.conditions.length, a.id).toBeGreaterThan(0)
  })

  it('setting progressCreated 0 -> 50 unlocks all five in catalog order', () => {
    const result = applySetCounter({ catalog, counters: {}, unlocked: [], variableId: 'progressCreated', value: 50 })
    expect(result.newlyUnlocked).toEqual(['starter', 'strategist', 'planner', 'visionary', 'legacy_builder'])
    expect(result.unlocked).toEqual(result.newlyUnlocked)
  })

  it('one increment of each counter unlocks only the first-tier badges', () => {
    let counters = {}
    let unlocked: string[] = []
    const fired: Record<string, string[]> = {}
    for (const v of variables) {
      const r = applyIncrement({ catalog, counters, unlocked, variableId: v.id })
      counters = r.counters
      unlocked = r.unlocked
      fired[v.id] = r.newlyUnlocked
    }
    expect(fired).toEqual({
      progressCreated: ['starter'],
      pathCreated: [],
      goalCreated: [],
      goalAchieved: ['achiever'],
      progressAchieved: ['progress_master'],
      pathAchieved: [],
    })
    expect(unlocked).toEqual(['starter', 'achiever', 'progress_master'])
  })
})
