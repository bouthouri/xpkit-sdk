import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@xpkit-dev/core': path.resolve(here, '../core/src/index.ts'),
      // react-native is a peerDependency; tests use a DOM-backed stub instead of the real runtime.
      'react-native': path.resolve(here, './src/test/reactNativeStub.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
