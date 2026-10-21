import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'
import { parseConfig, xpkitConfigSchema } from '../src/index.js'

const raw = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/progres.json', import.meta.url)), 'utf8'),
)

describe('progres fixture', () => {
  it('validates against xpkitConfigSchema and parseConfig', () => {
    expect(xpkitConfigSchema.safeParse(raw).success).toBe(true)
    expect(() => parseConfig(raw)).not.toThrow()
  })

  it('has 6 counter variables, 25 achievements, no levels', () => {
    const { gamification } = parseConfig(raw)
    expect(gamification.variables).toHaveLength(6)
    expect(gamification.variables.every(v => v.type === 'counter')).toBe(true)
    expect(gamification.achievements).toHaveLength(25)
    expect(gamification.levels).toEqual([])
  })

  it('every achievement has category, icon and one >= condition on a declared variable', () => {
    const { gamification } = parseConfig(raw)
    const ids = new Set(gamification.variables.map(v => v.id))
    for (const a of gamification.achievements) {
      expect(a.category, a.id).toBeTruthy()
      expect(a.icon, a.id).toBeTruthy()
      expect(a.conditions, a.id).toHaveLength(1)
      expect(a.conditions[0].operator).toBe('>=')
      expect(ids.has(a.conditions[0].variableId), a.id).toBe(true)
    }
  })
})
