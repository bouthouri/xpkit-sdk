// Internal dependency ranges for packing. bun pm pack resolves `workspace:*` from bun.lock,
// which keeps the old workspace versions after `changeset version` (bun 1.3: neither
// `bun install` nor `--lockfile-only` refreshes them). So we rewrite internal ranges from the
// packages' own package.json versions before packing, and check the result after.

export const DEP_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies'] as const

type Manifest = Record<string, unknown> & { name: string; version: string }

/** `workspace:*` / `workspace:^` -> `^v`, `workspace:~` -> `~v`, `workspace:<range>` -> `<range>`. */
export function resolveWorkspaceRange(range: string, version: string): string {
  const spec = range.slice('workspace:'.length)
  if (spec === '*' || spec === '^' || spec === '') return `^${version}`
  if (spec === '~') return `~${version}`
  return spec
}

/** Copy of `manifest` with every `workspace:` range replaced, using `versions` (name -> current version). */
export function rewriteWorkspaceRanges(manifest: Manifest, versions: Record<string, string>): Manifest {
  const out: Manifest = { ...manifest }
  for (const field of DEP_FIELDS) {
    const deps = manifest[field] as Record<string, string> | undefined
    if (!deps) continue
    const next: Record<string, string> = {}
    for (const [dep, range] of Object.entries(deps)) {
      if (!range.startsWith('workspace:')) {
        next[dep] = range
        continue
      }
      const version = versions[dep]
      if (!version) throw new Error(`${manifest.name}: ${field}.${dep} uses ${range} but ${dep} is not a workspace package`)
      next[dep] = resolveWorkspaceRange(range, version)
    }
    out[field] = next
  }
  return out
}

/**
 * Problems in a packed manifest: any `workspace:` range left, or a dependency on a workspace
 * package whose range does not include that package's current version.
 */
export function internalRangeProblems(packed: Manifest, versions: Record<string, string>): string[] {
  const problems: string[] = []
  for (const field of DEP_FIELDS) {
    if (field === 'devDependencies') continue // not installed by consumers
    const deps = (packed[field] ?? {}) as Record<string, string>
    for (const [dep, range] of Object.entries(deps)) {
      if (range.startsWith('workspace:')) {
        problems.push(`${field}.${dep}: ${range} (workspace range left in packed package.json)`)
        continue
      }
      const current = versions[dep]
      if (current && !Bun.semver.satisfies(current, range)) {
        problems.push(`${field}.${dep}: ${range} does not include the current ${dep}@${current}`)
      }
    }
  }
  return problems
}
