import * as React from 'react'
import type { Achievement, EngineSignal, Level } from '@xpkit-dev/core'
import { useXPKit } from './provider.js'

export interface LevelInfo {
  xp: number
  level: Level | null
  nextLevel: Level | null
  /** 0..1 progress between the current level threshold and the next one. */
  progress: number
}

export function useEmit(): (type: string, payload?: Record<string, unknown>) => void {
  const { emit } = useXPKit()
  const emitRef = React.useRef(emit)
  emitRef.current = emit

  return React.useCallback((type: string, payload?: Record<string, unknown>) => {
    emitRef.current({ ...payload, type })
  }, [])
}

export function useUnlockedAchievements(): Achievement[] {
  const { config, state } = useXPKit()
  const { achievements } = config.gamification
  const unlocked = state.unlockedAchievements

  return React.useMemo(() => {
    const byId = new Map(achievements.map(achievement => [achievement.id, achievement]))
    return unlocked.flatMap(id => {
      const achievement = byId.get(id)
      return achievement ? [achievement] : []
    })
  }, [achievements, unlocked])
}

export function useLevel(): LevelInfo {
  const { config, state } = useXPKit()
  const { levels } = config.gamification
  const { xp } = state

  return React.useMemo(() => {
    const sorted = [...levels].sort((a, b) => a.xpThreshold - b.xpThreshold)
    // Derived from xp (highest reached threshold), so a fresh user already sits on a 0-xp level.
    const level = sorted.filter(item => item.xpThreshold <= xp).pop() ?? null
    const nextLevel = sorted.find(item => item.xpThreshold > xp) ?? null
    const floor = level?.xpThreshold ?? 0
    let progress = 1
    if (nextLevel) {
      const span = nextLevel.xpThreshold - floor
      progress = span > 0 ? Math.min(1, Math.max(0, (xp - floor) / span)) : 1
    }
    return { xp, level, nextLevel, progress }
  }, [levels, xp])
}

export function useXPKitSignal(listener: (signal: EngineSignal) => void): void {
  const { engine } = useXPKit()
  const listenerRef = React.useRef(listener)
  listenerRef.current = listener

  React.useEffect(() => {
    return engine.subscribe(signal => listenerRef.current(signal))
  }, [engine])
}

export function useOnAchievementUnlocked(listener: (achievement: Achievement) => void): void {
  const { config } = useXPKit()
  const achievements = config.gamification.achievements

  useXPKitSignal(signal => {
    if (signal.type !== 'achievementUnlocked') return
    const achievement = achievements.find(item => item.id === signal.id)
    if (achievement) listener(achievement)
  })
}

export function useOnLevelUp(listener: (level: Level) => void): void {
  const { config } = useXPKit()
  const levels = config.gamification.levels

  useXPKitSignal(signal => {
    if (signal.type !== 'levelUp') return
    const level = levels.find(item => item.id === signal.levelId)
    if (level) listener(level)
  })
}
