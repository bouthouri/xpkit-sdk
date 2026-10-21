import { describe, expect, it, vi } from 'vitest'
import { createMMKVStorage, createMemoryStorage } from './storage.js'

function fakeMMKV() {
  const data = new Map<string, string>()
  return {
    data,
    getString: vi.fn((k: string) => data.get(k)),
    set: vi.fn((k: string, v: string) => {
      data.set(k, v)
    }),
    delete: vi.fn((k: string) => {
      data.delete(k)
    }),
  }
}

describe('createMMKVStorage', () => {
  it('maps undefined getString to null and passes values through', () => {
    const mmkv = fakeMMKV()
    const storage = createMMKVStorage(mmkv)

    expect(storage.get('a')).toBeNull()
    storage.set('a', '1')
    expect(mmkv.set).toHaveBeenCalledWith('a', '1')
    expect(storage.get('a')).toBe('1')
  })

  it('remove deletes the key from MMKV', () => {
    const mmkv = fakeMMKV()
    const storage = createMMKVStorage(mmkv)
    storage.set('a', '1')
    storage.remove('a')
    expect(mmkv.delete).toHaveBeenCalledWith('a')
    expect(storage.get('a')).toBeNull()
  })
})

describe('createMemoryStorage', () => {
  it('stores and removes values (re-exported from core)', async () => {
    const storage = createMemoryStorage()
    expect(await storage.get('missing')).toBeNull()
    await storage.set('k', 'v')
    expect(await storage.get('k')).toBe('v')
    await storage.remove('k')
    expect(await storage.get('k')).toBeNull()
  })
})
