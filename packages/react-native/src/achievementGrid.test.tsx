import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { AchievementGrid, XPKitProvider, createMemoryStorage, useEmit } from './index.js'
import type { Achievement, XPKitConfig } from './index.js'

function achievement(id: string, name: string, extra: Partial<Achievement> = {}): Achievement {
  return {
    id,
    name,
    description: '',
    icon: '⭐',
    tier: null,
    hidden: false,
    rarity: null,
    category: null,
    purpose: '',
    conditions: [{ variableId: 'win', operator: '>=', threshold: 1 }],
    ...extra,
  }
}

const config: XPKitConfig = {
  schemaVersion: '1.0.0',
  projectName: 'Demo',
  announcements: [],
  onboarding: { screens: [], showSkip: true },
  gamification: {
    levels: [],
    variables: [{ id: 'win', name: 'Wins', type: 'counter', description: '' }],
    achievements: [
      achievement('first', 'First Win'),
      achievement('secret', 'Secret Win', {
        hidden: true,
        conditions: [{ variableId: 'win', operator: '>=', threshold: 99 }],
      }),
    ],
    milestones: [],
    streaks: [],
  },
}

let emitFn: ((type: string) => void) | null = null
function Capture() {
  emitFn = useEmit()
  return null
}

describe('AchievementGrid', () => {
  it('renders locked badges greyed and unlocks them after an emit', () => {
    render(
      <XPKitProvider config={config} storage={createMemoryStorage()}>
        <Capture />
        <AchievementGrid />
      </XPKitProvider>,
    )

    expect(screen.getByTestId('xpkit-badge-first').getAttribute('aria-label')).toBe('First Win, locked')
    expect(screen.getByTestId('xpkit-badge-first').textContent).toContain('🔒')

    act(() => emitFn!('win'))

    const badge = screen.getByTestId('xpkit-badge-first')
    expect(badge.getAttribute('aria-label')).toBe('First Win, unlocked')
    expect(badge.textContent).toContain('⭐')
    expect(badge.textContent).toContain('First Win')
  })

  it('shows ??? for hidden locked achievements', () => {
    render(
      <XPKitProvider config={config} storage={createMemoryStorage()}>
        <AchievementGrid />
      </XPKitProvider>,
    )
    const badge = screen.getByTestId('xpkit-badge-secret')
    expect(badge.textContent).toContain('???')
    expect(badge.textContent).not.toContain('Secret Win')
    expect(badge.getAttribute('aria-label')).not.toContain('Secret Win')
  })

  it('accepts an explicit achievements list and calls onPress', () => {
    const onPress = vi.fn()
    render(
      <XPKitProvider config={config} storage={createMemoryStorage()}>
        <AchievementGrid achievements={[config.gamification.achievements[0]!]} columns={2} onPress={onPress} />
      </XPKitProvider>,
    )
    expect(screen.queryByTestId('xpkit-badge-secret')).toBeNull()
    fireEvent.click(screen.getByTestId('xpkit-badge-first'))
    expect(onPress).toHaveBeenCalledWith(config.gamification.achievements[0])
  })
})
