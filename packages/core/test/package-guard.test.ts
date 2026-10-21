import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')

describe('package guard', () => {
  it('src has no react or react-native reference', () => {
    const files = readdirSync(join(root, 'src'), { recursive: true }) as string[]
    for (const f of files.filter(f => f.endsWith('.ts'))) {
      expect(readFileSync(join(root, 'src', f), 'utf8').toLowerCase()).not.toContain('react')
    }
  })

  it('is @xpkit-dev/core with no react dependency', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('@xpkit-dev/core')
    const deps = { ...pkg.dependencies, ...pkg.peerDependencies }
    expect(Object.keys(deps).filter(d => d.includes('react'))).toEqual([])
  })
})
