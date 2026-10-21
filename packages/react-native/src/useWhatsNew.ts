import * as React from 'react'
import type { Announcement, StorageAdapter } from '@xpkit-dev/core'

export const LAST_SEEN_VERSION_KEY = 'xpkit_last_seen_version'

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function unseenSince(announcements: Announcement[], lastSeenVersion: string | null): Announcement[] {
  return announcements.filter((a) => compareVersions(a.version, lastSeenVersion ?? '') > 0)
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function'
}

export function useWhatsNew(announcements: Announcement[], appVersion: string, storage: StorageAdapter) {
  const [unseenEntries, setUnseenEntries] = React.useState<Announcement[]>(() => {
    try {
      const stored = storage.get(LAST_SEEN_VERSION_KEY)
      return isPromiseLike(stored) ? [] : unseenSince(announcements, stored)
    } catch {
      return unseenSince(announcements, null)
    }
  })
  const [visible, setVisible] = React.useState<boolean>(() => unseenEntries.length > 0 && Boolean(appVersion))

  // Async storage: read the stored version once, then decide.
  React.useEffect(() => {
    let stored: string | null | Promise<string | null>
    try {
      stored = storage.get(LAST_SEEN_VERSION_KEY)
    } catch {
      return
    }
    if (!isPromiseLike(stored)) return
    let active = true
    Promise.resolve(stored).then(
      raw => {
        if (!active) return
        const entries = unseenSince(announcements, raw)
        setUnseenEntries(entries)
        setVisible(entries.length > 0 && Boolean(appVersion))
      },
      () => {},
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage])

  const dismiss = React.useCallback(() => {
    try {
      const result = storage.set(LAST_SEEN_VERSION_KEY, appVersion)
      if (isPromiseLike(result)) result.then(undefined, () => {})
    } catch {
      /* ignore */
    }
    setVisible(false)
  }, [storage, appVersion])

  return { visible, unseenEntries, dismiss }
}
