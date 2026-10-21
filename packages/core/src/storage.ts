/**
 * Storage is INJECTED, never implemented by the engine or the stores. One interface
 * covers synchronous backends (in-memory, localStorage, MMKV) and asynchronous ones
 * (AsyncStorage, IndexedDB, a network store).
 */
export interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>
  set(key: string, value: string): void | Promise<void>
  remove(key: string): void | Promise<void>
}

/** In-memory adapter. Nothing persists past the process; handy for tests and as a fallback. */
export function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>()
  return {
    get: key => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value)
    },
    remove: key => {
      map.delete(key)
    },
  }
}

/** The `getItem/setItem/removeItem` shape zustand's `createJSONStorage` expects. */
export interface StateStorage {
  getItem(name: string): string | null | Promise<string | null>
  setItem(name: string, value: string): void | Promise<void>
  removeItem(name: string): void | Promise<void>
}

/** Adapt a StorageAdapter for zustand's `persist` middleware. */
export function toStateStorage(adapter: StorageAdapter): StateStorage {
  return {
    getItem: name => adapter.get(name),
    setItem: (name, value) => adapter.set(name, value),
    removeItem: name => adapter.remove(name),
  }
}
