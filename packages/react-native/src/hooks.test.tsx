import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, renderHook } from '@testing-library/react'
import {
  XPKitProvider,
  createMemoryStorage,
  useEmit,
  useLevel,
  useOnAchievementUnlocked,
  useOnLevelUp,
  useUnlockedAchievements,
  useXPKit,
  useXPKitSignal,
} from './index.js'
import type { Achievement, EngineSignal, XPKitConfig } from './index.js'

function achievement(id: string, variableId: string, threshold: number): Achievement {
  return {
    id,
    name: id,
    description: '',
    icon: '',
    tier: null,
    hidden: false,
    rarity: null,
    category: null,
    purpose: '',
    conditions: [{ variableId, operator: '>=', threshold }],
  }
}

const config: XPKitConfig = {
  schemaVersion: '1.0.0',
  projectName: 'Demo',
  announcements: [],
  onboarding: { screens: [], showSkip: true },
  gamification: {
    levels: [
      { id: 'l3', name: 'Three', xpThreshold: 5 },
      { id: 'l1', name: 'One', xpThreshold: 0 },
      { id: 'l2', name: 'Two', xpThreshold: 3 },
    ],
    variables: [
      { id: 'win', name: 'Wins', type: 'counter', description: '' },
      { id: 'jump', name: 'Jumps', type: 'counter', description: '' },
    ],
    // Declared in the opposite order of the expected unlock order.
    achievements: [achievement('jumper', 'jump', 1), achievement('winner', 'win', 1)],
    milestones: [],
    streaks: [],
  },
}

function wrapperFor(storage = createMemoryStorage()) {
  return ({ children }: { children?: React.ReactNode }) => (
    <XPKitProvider config={config} storage={storage}>{children}</XPKitProvider>
  )
}

describe('useEmit', () => {
  it('emits events, updating variables and xp, with a stable callback', () => {
    const { result } = renderHook(() => ({ emit: useEmit(), xpkit: useXPKit() }), { wrapper: wrapperFor() })
    const first = result.current.emit

    act(() => result.current.emit('win'))
    act(() => result.current.emit('win', { source: 'test' }))

    expect(result.current.xpkit.state.variables.win).toBe(2)
    expect(result.current.xpkit.state.xp).toBe(2)
    expect(result.current.emit).toBe(first)
  })
})

describe('useUnlockedAchievements', () => {
  it('returns achievements in unlock order', () => {
    const { result } = renderHook(() => ({ emit: useEmit(), unlocked: useUnlockedAchievements() }), {
      wrapper: wrapperFor(),
    })
    expect(result.current.unlocked).toEqual([])

    act(() => result.current.emit('win'))
    act(() => result.current.emit('jump'))

    expect(result.current.unlocked.map(a => a.id)).toEqual(['winner', 'jumper'])
  })
})

describe('useLevel', () => {
  it('tracks xp, level, next level and progress', () => {
    const { result } = renderHook(() => ({ emit: useEmit(), info: useLevel() }), { wrapper: wrapperFor() })

    expect(result.current.info).toMatchObject({ xp: 0, progress: 0 })
    expect(result.current.info.level?.id).toBe('l1')
    expect(result.current.info.nextLevel?.id).toBe('l2')

    act(() => result.current.emit('win'))
    expect(result.current.info.xp).toBe(1)
    expect(result.current.info.level?.id).toBe('l1')
    expect(result.current.info.nextLevel?.id).toBe('l2')
    expect(result.current.info.progress).toBeCloseTo(1 / 3)

    act(() => result.current.emit('win'))
    act(() => result.current.emit('win'))
    expect(result.current.info.level?.id).toBe('l2')
    expect(result.current.info.nextLevel?.id).toBe('l3')
    expect(result.current.info.progress).toBe(0)

    act(() => result.current.emit('win'))
    act(() => result.current.emit('win'))
    expect(result.current.info.level?.id).toBe('l3')
    expect(result.current.info.nextLevel).toBeNull()
    expect(result.current.info.progress).toBe(1)
  })
})

describe('signal hooks', () => {
  it('useOnAchievementUnlocked fires once with the achievement and stops after unmount', () => {
    const listener = vi.fn()
    const { result, unmount } = renderHook(() => {
      useOnAchievementUnlocked(listener)
      return useEmit()
    }, { wrapper: wrapperFor() })

    act(() => result.current('win'))
    act(() => result.current('win'))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(config.gamification.achievements[1])

    unmount()
    act(() => result.current('jump'))
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('useOnLevelUp fires with the level', () => {
    const listener = vi.fn()
    const { result } = renderHook(() => {
      useOnLevelUp(listener)
      return useEmit()
    }, { wrapper: wrapperFor() })

    act(() => result.current('win'))
    expect(listener).toHaveBeenLastCalledWith({ id: 'l1', name: 'One', xpThreshold: 0 })
    act(() => result.current('win'))
    act(() => result.current('win'))
    expect(listener).toHaveBeenLastCalledWith({ id: 'l2', name: 'Two', xpThreshold: 3 })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('useXPKitSignal uses the latest listener without resubscribing', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(
      ({ listener }: { listener: (s: EngineSignal) => void }) => {
        useXPKitSignal(listener)
        return useEmit()
      },
      { wrapper: wrapperFor(), initialProps: { listener: first } },
    )

    rerender({ listener: second })
    act(() => result.current('win'))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({ type: 'achievementUnlocked', id: 'winner' })
  })
})

describe('provider', () => {
  it('restores state from storage on a second mount', () => {
    const storage = createMemoryStorage()
    const first = renderHook(() => useEmit(), { wrapper: wrapperFor(storage) })
    act(() => first.result.current('win'))
    first.unmount()

    const second = renderHook(() => useUnlockedAchievements(), { wrapper: wrapperFor(storage) })
    expect(second.result.current.map(a => a.id)).toEqual(['winner'])
  })

  it('exposes the engine via useXPKit', () => {
    const { result } = renderHook(() => useXPKit(), { wrapper: wrapperFor() })
    expect(typeof result.current.engine.emit).toBe('function')
    expect(typeof result.current.engine.subscribe).toBe('function')
  })

  it('works without assetMap and renders children', () => {
    const { container } = render(
      <XPKitProvider config={config} storage={createMemoryStorage()}><span>hi</span></XPKitProvider>,
    )
    expect(container.textContent).toBe('hi')
  })
})
