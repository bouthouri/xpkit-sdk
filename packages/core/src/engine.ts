import { conditionsMet, type CounterState } from './achievements.js'
import type { XPKitConfig } from './schema.js'
import type { StorageAdapter } from './storage.js'

// --- Engine ---
// emit() and getState() are always synchronous. With a synchronous StorageAdapter the
// stored state is loaded before createEngine returns. With an asynchronous one the
// engine starts empty, queues emitted events, and applies them on top of the stored
// state once hydration finishes (`engine.ready`).

export type EngineEvent = { type: string; [key: string]: unknown }

export type EngineSignal =
  | { type: 'achievementUnlocked'; id: string }
  | { type: 'milestoneReached'; id: string; effect: unknown }
  | { type: 'levelUp'; levelId: string }
  | { type: 'streakMilestone'; id: string; value: number }

export type EngineState = {
  variables: Record<string, number | boolean>
  unlockedAchievements: string[]
  milestoneLevels: Record<string, number>          // key: `${entityId}_${milestoneLevel}`
  reachedStreakMilestones: Record<string, boolean>  // key: `${streakId}_${value}`
  xp: number
  currentLevelId: string | null
}

export interface Engine {
  emit(event: EngineEvent): void
  getState(): EngineState
  subscribe(listener: (signal: EngineSignal) => void): () => void
  /** Resolves once stored state is loaded and queued events are applied. Already resolved for sync storage. */
  ready: Promise<void>
}

export function createEngine(
  config: XPKitConfig,
  options: { storage: StorageAdapter },
): Engine {
  const { storage } = options
  const STORAGE_KEY = 'xpkit_state'

  const sortedLevels = [...config.gamification.levels].sort(
    (a, b) => a.xpThreshold - b.xpThreshold,
  )

  const emptyState = (): EngineState => ({
    variables: {},
    unlockedAchievements: [],
    milestoneLevels: {},
    reachedStreakMilestones: {},
    xp: 0,
    currentLevelId: null,
  })

  // Bad or missing stored JSON means a fresh start, never a crash.
  function parseStored(raw: string | null): EngineState {
    if (!raw) return emptyState()
    try {
      const p = JSON.parse(raw) as Partial<EngineState> | null
      if (typeof p !== 'object' || p === null) return emptyState()
      return {
        variables:               p.variables               ?? {},
        unlockedAchievements:    p.unlockedAchievements    ?? [],
        milestoneLevels:         p.milestoneLevels         ?? {},
        reachedStreakMilestones: p.reachedStreakMilestones ?? {},
        xp:                      p.xp                      ?? 0,
        currentLevelId:          p.currentLevelId          ?? null,
      }
    } catch {
      return emptyState()
    }
  }

  let state: EngineState = emptyState()

  const listeners = new Set<(signal: EngineSignal) => void>()

  function notify(signal: EngineSignal) {
    for (const listener of listeners) listener(signal)
  }

  // Fire and forget: a failing write (sync throw or rejected promise) must never break
  // emit() or surface as an unhandled rejection.
  function save() {
    try {
      const result = storage.set(STORAGE_KEY, JSON.stringify(state))
      if (isPromiseLike(result)) result.then(undefined, () => {})
    } catch {
      /* ignore */
    }
  }

  function numericVariables(): CounterState {
    const out: CounterState = {}
    for (const [id, raw] of Object.entries(state.variables)) {
      out[id] = typeof raw === 'boolean' ? (raw ? 1 : 0) : raw
    }
    return out
  }

  function evaluateAchievements() {
    const counters = numericVariables()
    for (const achievement of config.gamification.achievements) {
      if (state.unlockedAchievements.includes(achievement.id)) continue

      // Same semantics as the pure engine. Booleans count as 1/0. An achievement with
      // no conditions never unlocks.
      const allMet = conditionsMet(achievement, counters)

      if (allMet) {
        state.unlockedAchievements.push(achievement.id)
        notify({ type: 'achievementUnlocked', id: achievement.id })
      }
    }
  }

  function evaluateMilestones(entityId: string) {
    for (const milestone of config.gamification.milestones) {
      if (milestone.variableKey && milestone.variableKey !== entityId) continue

      const key = `${entityId}_${milestone.level}`
      if (state.milestoneLevels[key] !== undefined) continue

      const varValue = (state.variables[entityId] as number) ?? 0
      if (varValue >= milestone.threshold) {
        state.milestoneLevels[key] = milestone.level
        notify({ type: 'milestoneReached', id: milestone.id, effect: milestone.effect })
      }
    }
  }

  function evaluateStreaks(varId: string) {
    for (const streak of config.gamification.streaks) {
      if (streak.variableKey !== varId) continue
      const varValue = (state.variables[varId] as number) ?? 0
      for (const value of streak.milestones) {
        const key = `${streak.id}_${value}`
        if (state.reachedStreakMilestones[key]) continue
        if (varValue >= value) {
          state.reachedStreakMilestones[key] = true
          notify({ type: 'streakMilestone', id: streak.id, value })
        }
      }
    }
  }

  function evaluateLevels() {
    let newLevelId: string | null = null
    for (const level of sortedLevels) {
      if (state.xp >= level.xpThreshold) newLevelId = level.id
    }
    if (newLevelId !== null && newLevelId !== state.currentLevelId) {
      state.currentLevelId = newLevelId
      notify({ type: 'levelUp', levelId: newLevelId })
    }
  }

  function apply(event: EngineEvent) {
    const varId = event.type
    const varDef = config.gamification.variables.find(v => v.id === varId)

    if (varDef?.type === 'boolean') {
      state.variables[varId] = true
    } else {
      const current = (state.variables[varId] as number) ?? 0
      state.variables[varId] = current + 1
    }

    state.xp += 1

    evaluateAchievements()
    evaluateMilestones(varId)
    evaluateStreaks(varId)
    evaluateLevels()
  }

  let hydrated = false
  const pending: EngineEvent[] = []

  function finishHydration(raw: string | null) {
    state = parseStored(raw)
    hydrated = true
    if (pending.length > 0) {
      for (const event of pending.splice(0)) apply(event)
      save()
    }
  }

  let ready: Promise<void>
  let initial: string | null | Promise<string | null>
  try {
    initial = storage.get(STORAGE_KEY)
  } catch {
    initial = null
  }
  if (isPromiseLike(initial)) {
    ready = Promise.resolve(initial).then(
      raw => finishHydration(raw),
      () => finishHydration(null),
    )
  } else {
    finishHydration(initial)
    ready = Promise.resolve()
  }

  return {
    ready,

    emit(event: EngineEvent) {
      if (!hydrated) {
        pending.push(event)
        return
      }
      apply(event)
      save()
    },

    getState(): EngineState {
      return JSON.parse(JSON.stringify(state)) as EngineState
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function'
}
