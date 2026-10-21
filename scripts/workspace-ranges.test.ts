import { describe, expect, it } from 'bun:test'
import { internalRangeProblems, resolveWorkspaceRange, rewriteWorkspaceRanges } from './workspace-ranges'

const versions = { '@xpkit-dev/core': '0.1.0', '@xpkit-dev/react-native': '0.1.1' }
const rn = {
  name: '@xpkit-dev/react-native',
  version: '0.1.1',
  dependencies: { '@xpkit-dev/core': 'workspace:*', zod: '^3.25.0' },
  peerDependencies: { react: '>=18' },
}

describe('resolveWorkspaceRange', () => {
  it('maps workspace protocols to ranges on the current version', () => {
    expect(resolveWorkspaceRange('workspace:*', '0.1.0')).toBe('^0.1.0')
    expect(resolveWorkspaceRange('workspace:^', '0.1.0')).toBe('^0.1.0')
    expect(resolveWorkspaceRange('workspace:~', '0.1.0')).toBe('~0.1.0')
    expect(resolveWorkspaceRange('workspace:^0.1.0', '0.2.0')).toBe('^0.1.0')
  })
})

describe('rewriteWorkspaceRanges', () => {
  it('uses the package.json version, not a stale lockfile one', () => {
    const out = rewriteWorkspaceRanges(rn, versions)
    expect(out.dependencies).toEqual({ '@xpkit-dev/core': '^0.1.0', zod: '^3.25.0' })
    expect(out.peerDependencies).toEqual({ react: '>=18' })
    expect(rn.dependencies['@xpkit-dev/core']).toBe('workspace:*') // input untouched
  })

  it('throws on a workspace range to an unknown package', () => {
    expect(() => rewriteWorkspaceRanges({ ...rn, dependencies: { nope: 'workspace:*' } }, versions)).toThrow()
  })
})

describe('internalRangeProblems', () => {
  it('flags the 0.1.0 bug: core pinned to 0.0.0 while core is 0.1.0', () => {
    const packed = { ...rn, dependencies: { '@xpkit-dev/core': '0.0.0' } }
    expect(internalRangeProblems(packed, versions)).toEqual([
      'dependencies.@xpkit-dev/core: 0.0.0 does not include the current @xpkit-dev/core@0.1.0',
    ])
  })

  it('flags a leftover workspace range', () => {
    expect(internalRangeProblems(rn, versions)).toHaveLength(1)
  })

  it('accepts a rewritten manifest', () => {
    expect(internalRangeProblems(rewriteWorkspaceRanges(rn, versions), versions)).toEqual([])
  })
})
