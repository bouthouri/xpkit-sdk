import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { XPKit, XPKitProvider, useXPKit } from './index.js'
import type { XPKitConfig } from '@xpkit-dev/core'

const config: XPKitConfig = {
  schemaVersion: '1.0.0',
  projectName: 'Demo',
  announcements: [],
  onboarding: { screens: [], showSkip: true },
  gamification: { levels: [], variables: [], achievements: [], milestones: [], streaks: [] },
}

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    get: (key: string) => values.get(key) ?? null,
    set: (key: string, value: string) => {
      values.set(key, value)
    },
    remove: (key: string) => {
      values.delete(key)
    },
  }
}

function Probe() {
  const { emit, state } = useXPKit()

  React.useEffect(() => {
    emit({ type: 'demoEvent' })
  }, [emit])

  return <div data-testid="state">{JSON.stringify(state)}</div>
}

function EmitButton() {
  const { emit } = useXPKit()
  return <button onClick={() => emit({ type: 'win' })}>Emit</button>
}

describe('XPKitProvider', () => {
  it('renders without crashing and exposes emit/state', () => {
    render(
      <XPKitProvider
        config={config}
        assetMap={{}}
        storage={createMemoryStorage()}
        handlers={{}}
      >
        <Probe />
        <XPKit />
      </XPKitProvider>,
    )

    expect(screen.getByTestId('state')).toBeTruthy()
  })

  it('useXPKit().emit reaches the engine and updates state', async () => {
    const track = vi.fn()

    render(
      <XPKitProvider
        config={config}
        assetMap={{}}
        storage={createMemoryStorage()}
        handlers={{ track }}
      >
        <Probe />
        <XPKit />
      </XPKitProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('"demoEvent":1')
    })
    expect(track).toHaveBeenCalledWith('demoEvent', { type: 'demoEvent' })
  })

  it('forwards engine signals to the app handler', () => {
    const onSignal = vi.fn()
    const achievementConfig: XPKitConfig = {
      ...config,
      gamification: {
        ...config.gamification,
        variables: [{ id: 'win', name: 'Wins', type: 'counter', description: '' }],
        achievements: [{
          id: 'first-win',
          name: 'First Win',
          description: '',
          icon: '',
          tier: null,
          hidden: false,
          rarity: null,
          category: null,
          purpose: '',
          conditions: [{ variableId: 'win', operator: '>=', threshold: 1 }],
        }],
      },
    }

    render(
      <XPKitProvider
        config={achievementConfig}
        assetMap={{}}
        storage={createMemoryStorage()}
        handlers={{ onSignal }}
      >
        <EmitButton />
      </XPKitProvider>,
    )

    fireEvent.click(screen.getByText('Emit'))

    expect(onSignal).toHaveBeenCalledWith(
      { type: 'achievementUnlocked', id: 'first-win' },
      expect.objectContaining({ config: achievementConfig }),
    )
  })

  it('throws a clear error when useXPKit is used outside a provider', () => {
    function Broken() {
      useXPKit()
      return null
    }

    expect(() => render(<Broken />)).toThrow('useXPKit must be used within XPKitProvider')
  })
})
