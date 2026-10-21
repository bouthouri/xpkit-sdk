import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OnboardingCarousel } from './index.js'
import type { OnboardingScreen } from './index.js'

const screens: OnboardingScreen[] = [
  { id: 'welcome', type: 'content', title: 'Welcome', body: 'Hello there' },
  { id: 'badges', type: 'content', title: 'Earn badges', body: 'Do things' },
  { id: 'levels', type: 'content', title: 'Level up', body: 'Keep going' },
]

describe('OnboardingCarousel', () => {
  it('renders every content screen with testIDs, title and body', () => {
    render(<OnboardingCarousel screens={screens} assetMap={{}} onComplete={() => {}} />)
    for (const s of screens) {
      const page = screen.getByTestId(`xpkit-onboarding-${s.id}`)
      expect(page.textContent).toContain((s as { title: string }).title)
      expect(page.textContent).toContain((s as { body: string }).body)
    }
  })

  it('next advances the indicator and completes after the last screen', () => {
    const onComplete = vi.fn()
    render(<OnboardingCarousel screens={screens} assetMap={{}} onComplete={onComplete} />)
    expect(screen.getByText('1 / 3')).toBeTruthy()
    fireEvent.click(screen.getByTestId('xpkit-onboarding-next'))
    expect(screen.getByText('2 / 3')).toBeTruthy()
    fireEvent.click(screen.getByTestId('xpkit-onboarding-next'))
    expect(screen.getByText('Get started')).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('xpkit-onboarding-next'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
