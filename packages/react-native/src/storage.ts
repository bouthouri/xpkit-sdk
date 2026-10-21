import type { StorageAdapter } from '@xpkit-dev/core'

export { createMemoryStorage } from '@xpkit-dev/core'

/** Duck-typed subset of react-native-mmkv v3's `MMKV` instance (no dependency on it). */
export interface MMKVLike {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
}

export function createMMKVStorage(mmkv: MMKVLike): StorageAdapter {
  return {
    get: key => mmkv.getString(key) ?? null,
    set: (key, value) => {
      mmkv.set(key, value)
    },
    remove: key => {
      mmkv.delete(key)
    },
  }
}
