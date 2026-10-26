import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { createEngine, parseConfig } from '@xpkit-dev/core'
import type { StorageAdapter } from '@xpkit-dev/core'
import { XPKitProvider, useEmit, useLevel, useUnlockedAchievements, useXPKit, useOnboarding } from './index.js'

const config = parseConfig({
  schemaVersion: '1.0.0',
  projectName: 'Demo',
  announcements: [],
  onboarding: { screens: [] },
  gamification: {
    levels: [
      { id: 'l1', name: 'One', xpThreshold: 0 },
      { id: 'l2', name: 'Two', xpThreshold: 2 },
    ],
    variables: [{ id: 'win', name: 'Wins', type: 'counter', description: '' }],
    achievements: [{ id: 'first', name: 'First', conditions: [{ variableId: 'win', operator: '>=', threshold: 1 }] }],
    milestones: [],
    streaks: [],
  },
})

function asyncStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const storage: StorageAdapter = {
    get: async key => {
      await gate
      return values.get(key) ?? null
    },
    set: async (key, value) => {
      values.set(key, value)
    },
    remove: async key => {
      values.delete(key)
    },
  }
  return { storage, release, values }
}

describe('async storage hydration', () => {
  it('refreshes provider state after the engine is ready', async () => {
    const stored = JSON.stringify({
      variables: { win: 3 },
      unlockedAchievements: ['first'],
      milestoneLevels: {},
      reachedStreakMilestones: {},
      xp: 3,
      currentLevelId: 'l2',
    })
    const { storage, release } = asyncStorage({ xpkit_state: stored })

    const { result } = renderHook(() => ({ unlocked: useUnlockedAchievements(), level: useLevel() }), {
      wrapper: ({ children }: { children?: React.ReactNode }) => (
        <XPKitProvider config={config} storage={storage}>{children}</XPKitProvider>
      ),
    })

    expect(result.current.unlocked).toEqual([])
    expect(result.current.level.xp).toBe(0)

    await act(async () => {
      release()
    })

    await waitFor(() => expect(result.current.unlocked.map(a => a.id)).toEqual(['first']))
    expect(result.current.level.xp).toBe(3)
    expect(result.current.level.level?.id).toBe('l2')
  })

  it('applies events emitted before hydration on top of stored state', async () => {
    const { storage, release } = asyncStorage()
    const { result } = renderHook(() => ({ emit: useEmit(), unlocked: useUnlockedAchievements() }), {
      wrapper: ({ children }: { children?: React.ReactNode }) => (
        <XPKitProvider config={config} storage={storage}>{children}</XPKitProvider>
      ),
    })

    act(() => result.current.emit('win'))
    expect(result.current.unlocked).toEqual([])

    await act(async () => {
      release()
    })
    await waitFor(() => expect(result.current.unlocked.map(a => a.id)).toEqual(['first']))
  })

  it('useOnboarding stays hidden until async storage resolves, then shows', async () => {
    const { storage, release } = asyncStorage()
    const { result } = renderHook(() => useOnboarding(true, storage))
    expect(result.current).toMatchObject({ loading: true, visible: false })
    await act(async () => {
      release()
    })
    await waitFor(() => expect(result.current).toMatchObject({ loading: false, visible: true }))
  })

  it('useOnboarding stays hidden when the stored flag is set (async)', async () => {
    const { storage, release } = asyncStorage({ xpkit_onboarded: '1' })
    const { result } = renderHook(() => useOnboarding(true, storage))
    await act(async () => {
      release()
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.visible).toBe(false)
  })
})

describe('engine.onChange', () => {
  it('fires once when async hydration finishes and not after unsubscribe', async () => {
    const { storage, release } = asyncStorage()
    const engine = createEngine(config, { storage })
    let calls = 0
    const stop = engine.onChange(() => {
      calls += 1
    })
    release()
    await engine.ready
    expect(calls).toBe(1)
    engine.emit({ type: 'win' })
    expect(calls).toBe(2)
    stop()
    engine.emit({ type: 'win' })
    expect(calls).toBe(2)
  })
})

describe('external engine prop', () => {
  it('uses the given engine instead of creating one', async () => {
    const storage = asyncStorage().storage
    const engine = createEngine(config, { storage: { get: () => null, set: () => {}, remove: () => {} } })
    engine.emit({ type: 'win' })

    function Probe() {
      const xp = useXPKit()
      return <div data-testid="probe">{String(xp.engine === engine)}:{xp.state.xp}</div>
    }

    render(
      <XPKitProvider config={config} engine={engine} storage={storage}>
        <Probe />
      </XPKitProvider>,
    )
    await act(async () => {})
    expect(screen.getByTestId('probe').textContent).toBe('true:1')
  })

  it('reflects emits and signals from the external engine', async () => {
    const engine = createEngine(config, { storage: { get: () => null, set: () => {}, remove: () => {} } })
    const { result } = renderHook(() => useUnlockedAchievements(), {
      wrapper: ({ children }: { children?: React.ReactNode }) => (
        <XPKitProvider config={config} engine={engine} storage={asyncStorage().storage}>{children}</XPKitProvider>
      ),
    })
    await act(async () => {})
    expect(result.current).toEqual([])
    // Emitted directly on the engine, outside the provider's emit: the signal refreshes state.
    act(() => engine.emit({ type: 'win' }))
    expect(result.current.map(a => a.id)).toEqual(['first'])
  })

  it('reflects external emits that raise no signal (counter and xp only)', async () => {
    const engine = createEngine(config, { storage: { get: () => null, set: () => {}, remove: () => {} } })
    const { result } = renderHook(() => ({ level: useLevel(), xpkit: useXPKit() }), {
      wrapper: ({ children }: { children?: React.ReactNode }) => (
        <XPKitProvider config={config} engine={engine} storage={asyncStorage().storage}>{children}</XPKitProvider>
      ),
    })
    await act(async () => {})
    act(() => {
      engine.emit({ type: 'loss' })
      engine.emit({ type: 'loss' })
    })
    expect(result.current.level.level?.id).toBe('l2')
    // Third emit: 'loss' unlocks nothing and l2 is the top level, so the engine raises no signal.
    act(() => engine.emit({ type: 'loss' }))
    expect(result.current.level.xp).toBe(3)
    expect(result.current.xpkit.state.variables.loss).toBe(3)
  })
})
