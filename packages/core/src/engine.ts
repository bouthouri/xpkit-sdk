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
  /** Called after every state change (each applied event, and async hydration), signal or not. */
  onChange(listener: () => void): () => void
  /** Resolves once stored state is loaded and queued events are applied. Already resolved for sync storage. */
  ready: Promise<void>
  /**
   * Force-replaces the whole state (app import, reset). Persists it, calls `onChange`
   * listeners, fires no signals. Throws a TypeError for an invalid state (state unchanged).
   * Before async hydration finishes, the replacement wins over the stored value; events
   * emitted before the call are dropped, later ones apply on top.
   */
  replaceState(state: EngineState): void
}

/** Storage key the engine persists its state under. Apps that must inspect storage can use it. */
export const ENGINE_STATE_KEY = 'xpkit_state'

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

const allValues = (v: unknown, ok: (x: unknown) => boolean): v is Record<string, unknown> =>
  isRecord(v) && Object.values(v).every(ok)

/**
 * Validates a persisted or imported engine state. Accepts a JSON string or an already
 * parsed value. Returns a fresh copy, or null when the input is not valid JSON, not a plain
 * object, or any present field has the wrong type. Missing fields get empty defaults, so
 * older or partial blobs still load.
 */
export function parseEngineState(value: unknown): EngineState | null {
  let p = value
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p)
    } catch {
      return null
    }
  }
  if (!isRecord(p)) return null
  const { variables, unlockedAchievements, milestoneLevels, reachedStreakMilestones, xp, currentLevelId } = p
  if (variables !== undefined && !allValues(variables, v => isFiniteNumber(v) || typeof v === 'boolean')) return null
  if (
    unlockedAchievements !== undefined &&
    !(Array.isArray(unlockedAchievements) && unlockedAchievements.every(v => typeof v === 'string'))
  ) return null
  if (milestoneLevels !== undefined && !allValues(milestoneLevels, isFiniteNumber)) return null
  if (reachedStreakMilestones !== undefined && !allValues(reachedStreakMilestones, v => typeof v === 'boolean')) return null
  if (xp !== undefined && !isFiniteNumber(xp)) return null
  if (currentLevelId !== undefined && currentLevelId !== null && typeof currentLevelId !== 'string') return null
  return {
    variables:               { ...(variables as EngineState['variables'] | undefined) },
    unlockedAchievements:    [...((unlockedAchievements as string[] | undefined) ?? [])],
    milestoneLevels:         { ...(milestoneLevels as EngineState['milestoneLevels'] | undefined) },
    reachedStreakMilestones: { ...(reachedStreakMilestones as EngineState['reachedStreakMilestones'] | undefined) },
    xp:                      xp ?? 0,
    currentLevelId:          currentLevelId ?? null,
  }
}

export function createEngine(
  config: XPKitConfig,
  options: {
    storage: StorageAdapter
    /**
     * Seeds the engine only when storage holds no valid state (missing, bad JSON or invalid).
     * It is saved right away and fires no signals. A valid stored state always wins.
     * An invalid initialState throws a TypeError.
     */
    initialState?: EngineState
  },
): Engine {
  const { storage } = options
  const STORAGE_KEY = ENGINE_STATE_KEY

  let seed: EngineState | null = null
  if (options.initialState !== undefined) {
    seed = parseEngineState(options.initialState)
    if (!seed) throw new TypeError('createEngine: invalid initialState')
  }

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

  let state: EngineState = emptyState()

  const listeners = new Set<(signal: EngineSignal) => void>()

  function notify(signal: EngineSignal) {
    for (const listener of listeners) listener(signal)
  }

  const changeListeners = new Set<() => void>()

  function notifyChange() {
    for (const listener of changeListeners) listener()
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

  let replaced = false

  // Bad, invalid or missing stored state means the seed, else a fresh start, never a crash.
  function finishHydration(raw: string | null) {
    let seeded = false
    if (!replaced) {
      const stored = raw === null ? null : parseEngineState(raw)
      state = stored ?? seed ?? emptyState()
      seeded = !stored && seed !== null
    }
    hydrated = true
    if (pending.length > 0) {
      for (const event of pending.splice(0)) apply(event)
      save()
    } else if (seeded) {
      save()
    }
    notifyChange()
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
      notifyChange()
    },

    replaceState(next: EngineState) {
      const parsed = parseEngineState(next)
      if (!parsed) throw new TypeError('replaceState: invalid state')
      state = parsed
      if (!hydrated) {
        replaced = true
        pending.length = 0
      }
      save()
      notifyChange()
    },

    getState(): EngineState {
      return JSON.parse(JSON.stringify(state)) as EngineState
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    onChange(listener) {
      changeListeners.add(listener)
      return () => changeListeners.delete(listener)
    },
  }
}

function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function'
}
