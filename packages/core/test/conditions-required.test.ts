import { describe, expect, it } from 'bun:test'
import { CONDITIONS_REQUIRED_MESSAGE, parseConfig, xpkitConfigSchema } from '../src/index.js'

function configWith(achievement: Record<string, unknown>) {
  return {
    schemaVersion: '1.0.0',
    projectName: 'required',
    announcements: [],
    onboarding: { screens: [] },
    gamification: {
      levels: [],
      variables: [{ id: 'task', name: 'Task', type: 'counter', description: '' }],
      achievements: [achievement],
      milestones: [],
      streaks: [],
    },
  }
}

describe('achievement conditions are required', () => {
  it('rejects conditions: []', () => {
    const result = xpkitConfigSchema.safeParse(configWith({ id: 'a', name: 'A', conditions: [] }))
    expect(result.success).toBe(false)
    expect(result.success ? [] : result.error.issues.map(i => i.message)).toContain(CONDITIONS_REQUIRED_MESSAGE)
    expect(() => parseConfig(configWith({ id: 'a', name: 'A', conditions: [] }))).toThrow()
  })

  it('rejects omitted conditions', () => {
    const result = xpkitConfigSchema.safeParse(configWith({ id: 'a', name: 'A' }))
    expect(result.success).toBe(false)
    expect(result.success ? [] : result.error.issues.map(i => i.message)).toContain(CONDITIONS_REQUIRED_MESSAGE)
    expect(() => parseConfig(configWith({ id: 'a', name: 'A' }))).toThrow()
  })

  it('accepts one condition', () => {
    const cfg = parseConfig(configWith({
      id: 'a', name: 'A', conditions: [{ variableId: 'task', operator: '>=', threshold: 1 }],
    }))
    expect(cfg.gamification.achievements[0].conditions).toHaveLength(1)
  })
})
