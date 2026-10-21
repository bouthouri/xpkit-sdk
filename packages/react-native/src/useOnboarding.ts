import * as React from 'react'
import type { StorageAdapter } from '@xpkit-dev/core'

export const ONBOARDED_KEY = 'xpkit_onboarded'

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function'
}

/**
 * Whether the onboarding carousel should show. With a synchronous storage the answer is
 * available on the first render. With an asynchronous one `visible` stays false (and
 * `loading` true) until the stored flag has been read.
 */
export function useOnboarding(hasScreens: boolean, storage: StorageAdapter) {
  const [state, setState] = React.useState<{ loading: boolean; visible: boolean }>(() => {
    if (!hasScreens) return { loading: false, visible: false }
    let stored: string | null | Promise<string | null>
    try {
      stored = storage.get(ONBOARDED_KEY)
    } catch {
      stored = null
    }
    if (isPromiseLike(stored)) return { loading: true, visible: false }
    return { loading: false, visible: stored !== '1' }
  })

  React.useEffect(() => {
    if (!state.loading) return
    let active = true
    Promise.resolve(storage.get(ONBOARDED_KEY)).then(
      raw => {
        if (active) setState({ loading: false, visible: raw !== '1' })
      },
      () => {
        if (active) setState({ loading: false, visible: true })
      },
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage])

  const dismiss = React.useCallback(() => {
    try {
      const result = storage.set(ONBOARDED_KEY, '1')
      if (isPromiseLike(result)) result.then(undefined, () => {})
    } catch {
      /* ignore */
    }
    setState({ loading: false, visible: false })
  }, [storage])

  return { visible: state.visible, loading: state.loading, dismiss }
}
