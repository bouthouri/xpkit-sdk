import { describe, expect, it } from 'bun:test'
import {
  assetRefSchema,
  createEngine,
  createMemoryStorage,
  parseConfig,
  xpkitConfigSchema,
  type XPKitConfig,
} from '../src/index.js'

describe('xpkit-core schema and parser', () => {
  it('accepts a hand-written valid v1 config', () => {
    const validConfig = {
      schemaVersion: '1.0.0',
      projectName: 'Example App',
      announcements: [
        {
          id: 'announcement-1',
          version: '1.0.0',
          title: 'Welcome',
          description: 'Thanks for trying the app.',
          image: { kind: 'asset', key: 'welcome-image' },
        },
      ],
      onboarding: {
        screens: [
          {
            id: 'screen-1',
            type: 'content',
            title: 'Welcome',
            body: 'Get started quickly.',
          },
          {
            id: 'screen-2',
            type: 'video',
            title: 'Watch the demo',
            subtitle: 'See how it works.',
            source: { kind: 'asset', key: 'demo-video' },
            buttonText: 'Continue',
          },
          {
            id: 'screen-3',
            type: 'permission',
            permission: 'notifications',
            title: 'Allow notifications',
            subtitle: 'Stay updated.',
            grantedTitle: 'Notifications enabled',
          },
        ],
      },
      gamification: {
        levels: [
          { id: 'level-1', name: 'Starter', xpThreshold: 0 },
          { id: 'level-2', name: 'Pro', xpThreshold: 100 },
        ],
        variables: [
          {
            id: 'login_count',
            name: 'Login Count',
            type: 'counter',
            description: 'Tracks logins',
          },
        ],
        achievements: [
          {
            id: 'first-login',
            name: 'First Login',
            description: 'Log in for the first time',
            icon: '',
            tier: 'bronze',
            hidden: false,
            conditions: [
              { variableId: 'login_count', operator: '>=', threshold: 1 },
            ],
          },
        ],
        milestones: [
          {
            id: 'milestone-1',
            level: 1,
            threshold: 10,
            label: 'Getting started',
            effect: { type: 'energyReduction', percent: 25 },
          },
        ],
        streaks: [
          {
            id: 'streak-1',
            variableKey: 'login_count',
            milestones: [3, 7, 14],
          },
        ],
      },
    }

    const result = xpkitConfigSchema.safeParse(validConfig)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.projectName).toBe('Example App')
    }
  })

  it('fails when an entity is missing an id', () => {
    const invalidConfig = {
      schemaVersion: '1.0.0',
      projectName: 'Example App',
      announcements: [
        {
          version: '1.0.0',
          title: 'Welcome',
          description: 'Missing id',
        },
      ],
      onboarding: { screens: [] },
      gamification: {
        levels: [],
        variables: [],
        achievements: [],
        milestones: [],
        streaks: [],
      },
    }

    const result = xpkitConfigSchema.safeParse(invalidConfig)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('id'))).toBe(true)
    }
  })

  it('fails when an announcement has blank required fields or a malformed version', () => {
    const invalidConfig = {
      schemaVersion: '1.0.0',
      projectName: 'Example App',
      announcements: [
        {
          id: 'announcement-1',
          version: 'hijdjd',
          title: '',
          description: '   ',
        },
      ],
      onboarding: { screens: [] },
      gamification: {
        levels: [],
        variables: [],
        achievements: [],
        milestones: [],
        streaks: [],
      },
    }

    const result = xpkitConfigSchema.safeParse(invalidConfig)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.join('.') === 'announcements.0.version')).toBe(true)
      expect(result.error.issues.some(issue => issue.path.join('.') === 'announcements.0.title')).toBe(true)
      expect(result.error.issues.some(issue => issue.path.join('.') === 'announcements.0.description')).toBe(true)
    }
  })

  it('fails when a condition operator is invalid', () => {
    const invalidConfig = {
      schemaVersion: '1.0.0',
      projectName: 'Example App',
      announcements: [],
      onboarding: { screens: [] },
      gamification: {
        levels: [],
        variables: [],
        achievements: [
          {
            id: 'achievement-1',
            name: 'Bad condition',
            description: '',
            icon: '',
            tier: null,
            hidden: false,
            conditions: [
              { variableId: 'login_count', operator: 'between', threshold: 1 },
            ],
          },
        ],
        milestones: [],
        streaks: [],
      },
    }

    const result = xpkitConfigSchema.safeParse(invalidConfig)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.message.includes('Invalid enum value'))).toBe(true)
    }
  })

  it('round-trips a sample config through parseConfig and preserves the data', () => {
    const sampleConfig = {
      schemaVersion: '1.0.0',
      projectName: 'Example App',
      announcements: [],
      onboarding: { screens: [] },
      gamification: {
        levels: [{ id: 'level-1', name: 'Starter', xpThreshold: 0 }],
        variables: [
          {
            id: 'counter_1',
            name: 'Counter',
            type: 'counter',
            description: 'Counts actions',
          },
        ],
        achievements: [
          {
            id: 'ach-1',
            name: 'Done',
            description: 'Complete the task',
            icon: '',
            tier: null,
            hidden: false,
            conditions: [{ variableId: 'counter_1', operator: '>=', threshold: 1 }],
          },
        ],
        milestones: [],
        streaks: [],
      },
    }

    const parsed = parseConfig(sampleConfig)

    expect(parsed.schemaVersion as string).toBe(sampleConfig.schemaVersion)
    expect(parsed.projectName).toBe(sampleConfig.projectName)
    expect(parsed.announcements).toEqual(sampleConfig.announcements)
      expect(parsed.onboarding).toEqual({
        ...sampleConfig.onboarding,
        showSkip: true,
      })
    expect(parsed.gamification.levels).toEqual(sampleConfig.gamification.levels)
    expect(parsed.gamification.variables as unknown).toEqual(sampleConfig.gamification.variables)
    expect(parsed.gamification.achievements[0]?.id).toBe(sampleConfig.gamification.achievements[0]?.id)
    expect(parsed.gamification.achievements[0]?.name).toBe(sampleConfig.gamification.achievements[0]?.name)
    expect(parsed.gamification.achievements[0]?.conditions as unknown).toEqual(sampleConfig.gamification.achievements[0]?.conditions)
    expect(parsed.gamification.milestones).toEqual(sampleConfig.gamification.milestones)
    expect(parsed.gamification.streaks).toEqual(sampleConfig.gamification.streaks)
  })

  it('rejects raw asset paths through the AssetRef schema', () => {
    const result = assetRefSchema.safeParse({ kind: 'asset', key: './icon.png' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('not a raw path')
    }
  })
})

// ─── Engine tests ────────────────────────────────────────────────────────────

function makeConfig(overrides: {
  levels?: unknown[]
  variables?: unknown[]
  achievements?: unknown[]
  milestones?: unknown[]
  streaks?: unknown[]
} = {}): XPKitConfig {
  return xpkitConfigSchema.parse({
    schemaVersion: '1.0.0',
    projectName: 'Test',
    announcements: [],
    onboarding: { screens: [] },
    gamification: {
      levels:       overrides.levels       ?? [],
      variables:    overrides.variables    ?? [],
      achievements: overrides.achievements ?? [],
      milestones:   overrides.milestones   ?? [],
      streaks:      overrides.streaks      ?? [],
    },
  })
}

const VARS = ['progressCreated', 'pathCreated', 'goalCreated', 'goalAchieved', 'progressAchieved'] as const

describe('createEngine', () => {
  it('replays 5 counters × 25 achievements and unlocks exact 25 in exact order', () => {
    const variables = VARS.map(id => ({ id, name: id, type: 'counter', description: '' }))
    // 5 variables × 5 thresholds = 25 achievements, defined in VARS order
    const achievements = VARS.flatMap(varId =>
      [1, 2, 3, 4, 5].map(t => ({
        id: `ach_${varId}_${t}`,
        name: `${varId} ×${t}`,
        conditions: [{ variableId: varId, operator: '>=', threshold: t }],
      }))
    )
    const engine = createEngine(makeConfig({ variables, achievements }), { storage: createMemoryStorage() })

    const unlocked: string[] = []
    engine.subscribe(s => { if (s.type === 'achievementUnlocked') unlocked.push(s.id) })

    for (const varId of VARS) {
      for (let i = 0; i < 5; i++) engine.emit({ type: varId })
    }

    const expected = VARS.flatMap(v => [1, 2, 3, 4, 5].map(t => `ach_${v}_${t}`))
    expect(unlocked).toEqual(expected)
  })

  it('idempotent: re-running the same sequence fires no duplicate achievementUnlocked signals', () => {
    const variables = [{ id: 'x', name: 'x', type: 'counter', description: '' }]
    const achievements = [{ id: 'ach', name: 'x≥1', conditions: [{ variableId: 'x', operator: '>=', threshold: 1 }] }]
    const engine = createEngine(makeConfig({ variables, achievements }), { storage: createMemoryStorage() })

    const unlocked: string[] = []
    engine.subscribe(s => { if (s.type === 'achievementUnlocked') unlocked.push(s.id) })

    for (let i = 0; i < 5; i++) engine.emit({ type: 'x' })

    expect(unlocked).toEqual(['ach'])
  })

  it('Karv 7-tier milestones: level 3 signals milestoneReached with energyReduction; re-emit no re-signal', () => {
    const milestones = [
      { id: 'm0', level: 0, threshold: 3,   label: 'momentum' },
      { id: 'm1', level: 1, threshold: 7,   label: 'momentum' },
      { id: 'm2', level: 2, threshold: 14,  label: 'shift' },
      { id: 'm3', level: 3, threshold: 21,  label: 'mastery', effect: { type: 'energyReduction', percent: 25 } },
      { id: 'm4', level: 4, threshold: 50,  label: 'mastery', effect: { type: 'energyReduction', percent: 50 } },
      { id: 'm5', level: 5, threshold: 66,  label: 'mastery', effect: { type: 'energyReduction', percent: 75 } },
      { id: 'm6', level: 6, threshold: 100, label: 'mastery', effect: { type: 'energyReduction', percent: 100 } },
    ]
    const variables = [{ id: 'habit_1', name: 'Habit 1', type: 'counter', description: '' }]
    const engine = createEngine(makeConfig({ variables, milestones }), { storage: createMemoryStorage() })

    const reached: Array<{ id: string; effect: unknown }> = []
    engine.subscribe(s => { if (s.type === 'milestoneReached') reached.push({ id: s.id, effect: s.effect }) })

    for (let i = 0; i < 21; i++) engine.emit({ type: 'habit_1' })

    const level3 = reached.find(s => s.id === 'm3')
    expect(level3).toBeDefined()
    expect(level3?.effect).toEqual({ type: 'energyReduction', percent: 25 })

    // Re-emit: milestones 0-3 already reached, no new signals
    const countBefore = reached.length
    engine.emit({ type: 'habit_1' })
    expect(reached.length).toBe(countBefore)
  })

  it('state survives a simulated reload from a populated StorageAdapter', () => {
    const storage = createMemoryStorage()
    const variables = [{ id: 'x', name: 'x', type: 'counter', description: '' }]
    const achievements = [{ id: 'ach', name: 'x≥3', conditions: [{ variableId: 'x', operator: '>=', threshold: 3 }] }]
    const config = makeConfig({ variables, achievements })

    // Session 1 — unlock achievement
    const engine1 = createEngine(config, { storage })
    for (let i = 0; i < 3; i++) engine1.emit({ type: 'x' })
    expect(engine1.getState().unlockedAchievements).toContain('ach')

    // Session 2 — reload from same storage
    const refiredSignals: string[] = []
    const engine2 = createEngine(config, { storage })
    engine2.subscribe(s => { if (s.type === 'achievementUnlocked') refiredSignals.push(s.id) })

    expect(engine2.getState().unlockedAchievements).toContain('ach')
    expect(refiredSignals).toEqual([])   // no re-fire on load

    engine2.emit({ type: 'x' })
    expect(refiredSignals).toEqual([])   // still no re-fire
  })

  it('effects are passed as data in signals and never executed by the engine', () => {
    const effect = { type: 'energyReduction', percent: 25 }
    const milestones = [{ id: 'm', level: 1, threshold: 1, label: 'l', effect }]
    const variables = [{ id: 'x', name: 'x', type: 'counter', description: '' }]
    const engine = createEngine(makeConfig({ variables, milestones }), { storage: createMemoryStorage() })

    let capturedEffect: unknown
    engine.subscribe(s => { if (s.type === 'milestoneReached') capturedEffect = s.effect })

    engine.emit({ type: 'x' })

    // Effect descriptor forwarded as-is; engine state holds only counters, not executed results
    expect(capturedEffect).toEqual(effect)
    expect(engine.getState().variables['x']).toBe(1)
  })

  it('targeted milestones only fire for their variableKey', () => {
    const milestones = [{ id: 'm', variableKey: 'target', level: 1, threshold: 1, label: 'l' }]
    const variables = [
      { id: 'target', name: 'Target', type: 'counter', description: '' },
      { id: 'other', name: 'Other', type: 'counter', description: '' },
    ]
    const engine = createEngine(makeConfig({ variables, milestones }), { storage: createMemoryStorage() })
    const reached: string[] = []

    engine.subscribe(s => { if (s.type === 'milestoneReached') reached.push(s.id) })
    engine.emit({ type: 'other' })
    expect(reached).toEqual([])

    engine.emit({ type: 'target' })
    expect(reached).toEqual(['m'])
  })

  it('boolean variable: set to true on emit, achievement condition == 1 evaluates correctly', () => {
    const variables = [{ id: 'premium', name: 'Premium', type: 'boolean', description: '' }]
    const achievements = [{
      id: 'ach_premium',
      name: 'Premium user',
      conditions: [{ variableId: 'premium', operator: '==', threshold: 1 }],
    }]
    const engine = createEngine(makeConfig({ variables, achievements }), { storage: createMemoryStorage() })

    const unlocked: string[] = []
    engine.subscribe(s => { if (s.type === 'achievementUnlocked') unlocked.push(s.id) })

    engine.emit({ type: 'premium' })
    expect(engine.getState().variables['premium']).toBe(true)
    expect(unlocked).toEqual(['ach_premium'])

    // Re-emit: stays true, no duplicate signal
    engine.emit({ type: 'premium' })
    expect(unlocked).toEqual(['ach_premium'])
  })

  it('streak milestones: fires streakMilestone at each configured count, idempotent', () => {
    const variables = [{ id: 'login_count', name: 'Login Count', type: 'streak', description: '' }]
    const streaks = [{ id: 'streak_login', variableKey: 'login_count', milestones: [3, 7, 14] }]
    const engine = createEngine(makeConfig({ variables, streaks }), { storage: createMemoryStorage() })

    const reached: Array<{ id: string; value: number }> = []
    engine.subscribe(s => { if (s.type === 'streakMilestone') reached.push({ id: s.id, value: s.value }) })

    for (let i = 0; i < 14; i++) engine.emit({ type: 'login_count' })

    expect(reached).toEqual([
      { id: 'streak_login', value: 3 },
      { id: 'streak_login', value: 7 },
      { id: 'streak_login', value: 14 },
    ])

    // Re-emit: no duplicate streak milestones
    engine.emit({ type: 'login_count' })
    expect(reached).toHaveLength(3)
  })

  it('levelUp: signals each crossed threshold exactly once in order', () => {
    const levels = [
      { id: 'lvl1', name: 'Level 1', xpThreshold: 2 },
      { id: 'lvl2', name: 'Level 2', xpThreshold: 5 },
    ]
    const variables = [{ id: 'action', name: 'Action', type: 'counter', description: '' }]
    const engine = createEngine(makeConfig({ levels, variables }), { storage: createMemoryStorage() })

    const levelUps: string[] = []
    engine.subscribe(s => { if (s.type === 'levelUp') levelUps.push(s.levelId) })

    engine.emit({ type: 'action' }) // xp=1, below threshold 2
    expect(levelUps).toEqual([])

    engine.emit({ type: 'action' }) // xp=2 → lvl1
    expect(levelUps).toEqual(['lvl1'])

    engine.emit({ type: 'action' }) // xp=3, still lvl1
    engine.emit({ type: 'action' }) // xp=4, still lvl1
    expect(levelUps).toEqual(['lvl1'])

    engine.emit({ type: 'action' }) // xp=5 → lvl2
    expect(levelUps).toEqual(['lvl1', 'lvl2'])

    engine.emit({ type: 'action' }) // xp=6, no new level
    expect(levelUps).toEqual(['lvl1', 'lvl2'])
  })
})
