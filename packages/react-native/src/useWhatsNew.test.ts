import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWhatsNew, LAST_SEEN_VERSION_KEY } from './useWhatsNew.js'
import type { Announcement, StorageAdapter } from '@xpkit-dev/core'

function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter {
  const values = new Map<string, string>(Object.entries(initial))
  return {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => {
      values.set(key, value)
    },
    remove: (key) => {
      values.delete(key)
    },
  }
}

const announcement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: 'a1',
  version: '1.6.0',
  title: 'New feature',
  description: 'Something new',
  ...overrides,
})

describe('useWhatsNew', () => {
  it('fresh install: shows announcement once with no lastSeenVersion', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() => useWhatsNew([announcement()], '1.6.0', storage))

    expect(result.current.visible).toBe(true)
    expect(result.current.unseenEntries).toHaveLength(1)
  })

  it('existing user: lastSeenVersion >= entry version shows nothing (no re-fire)', () => {
    const storage = createMemoryStorage({ [LAST_SEEN_VERSION_KEY]: '1.6.0' })
    const { result } = renderHook(() => useWhatsNew([announcement()], '1.6.0', storage))

    expect(result.current.visible).toBe(false)
    expect(result.current.unseenEntries).toHaveLength(0)
  })

  it('dismiss writes lastSeenVersion and hides the modal', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() => useWhatsNew([announcement()], '1.6.0', storage))

    expect(result.current.visible).toBe(true)
    act(() => result.current.dismiss())

    expect(result.current.visible).toBe(false)
    expect(storage.get(LAST_SEEN_VERSION_KEY)).toBe('1.6.0')
  })

  it('version bump shows only the new entry', () => {
    const storage = createMemoryStorage({ [LAST_SEEN_VERSION_KEY]: '1.0.0' })
    const entries = [
      announcement({ id: 'a1', version: '1.0.0', title: 'Old' }),
      announcement({ id: 'a2', version: '2.0.0', title: 'New' }),
    ]
    const { result } = renderHook(() => useWhatsNew(entries, '2.0.0', storage))

    expect(result.current.unseenEntries).toHaveLength(1)
    expect(result.current.unseenEntries[0]?.id).toBe('a2')
  })
})
