// Packs every packages/* with `bun pm pack` (the same tarball the release publishes) and
// fails if a tarball holds anything outside dist/, README.md, LICENSE, package.json, or if
// an internal dependency is not `^<current version>`-compatible. `workspace:` ranges are
// rewritten from packages/*/package.json before packing (bun.lock keeps stale versions,
// which shipped react-native@0.1.0 depending on core 0.0.0). See scripts/workspace-ranges.ts.
// Package names/dirs come from packages/*/package.json. Run after `bun run build`.
//   bun scripts/check-pack.ts              check only (tarballs in a temp dir)
//   bun scripts/check-pack.ts --out .pack  check and keep the tarballs in .pack/
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { internalRangeProblems, rewriteWorkspaceRanges } from './workspace-ranges'

const root = join(import.meta.dir, '..')
const pkgsDir = join(root, 'packages')
const outFlag = process.argv.indexOf('--out')
const outDir = outFlag > -1 ? resolve(root, process.argv[outFlag + 1]) : mkdtempSync(join(tmpdir(), 'xpkit-pack-'))
mkdirSync(outDir, { recursive: true })

const allowed = (p: string) => p.startsWith('dist/') || ['README.md', 'LICENSE', 'package.json'].includes(p)

function sh(cmd: string[], cwd: string): string {
  const proc = Bun.spawnSync(cmd, { cwd })
  if (proc.exitCode !== 0) throw new Error(`${cmd.join(' ')} failed in ${cwd}\n${proc.stderr.toString()}`)
  return proc.stdout.toString()
}

// name -> current version, from every packages/*/package.json (the source of truth).
const workspaces = readdirSync(pkgsDir)
  .map(dir => join(pkgsDir, dir))
  .filter(cwd => existsSync(join(cwd, 'package.json')))
const versions: Record<string, string> = {}
for (const cwd of workspaces) {
  const pkg = await Bun.file(join(cwd, 'package.json')).json()
  versions[pkg.name] = pkg.version
}
// --no-rewrite packs with bun's own workspace resolution (from bun.lock), to show the check catching it.
const rewrite = !process.argv.includes('--no-rewrite')

let failed = false
for (const cwd of workspaces) {
  const manifestPath = join(cwd, 'package.json')
  const original = readFileSync(manifestPath, 'utf8')
  const pkg = JSON.parse(original)
  if (pkg.private) continue
  const name = pkg.name as string
  const tarball = join(outDir, `${name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`)

  try {
    if (rewrite) writeFileSync(manifestPath, `${JSON.stringify(rewriteWorkspaceRanges(pkg, versions), null, 2)}\n`)
    sh(['bun', 'pm', 'pack', '--destination', outDir, '--quiet', '--ignore-scripts'], cwd)
  } finally {
    writeFileSync(manifestPath, original)
  }
  const files = sh(['tar', '-tzf', tarball], root)
    .split('\n')
    .filter(Boolean)
    .map(f => f.replace(/^package\//, ''))
  const packed = JSON.parse(sh(['tar', '-xzOf', tarball, 'package/package.json'], root))

  const bad = files.filter(f => !allowed(f))
  const missing = ['README.md', 'LICENSE', 'package.json'].filter(f => !files.includes(f))
  if (!files.some(f => f.startsWith('dist/'))) missing.push('dist/ (run bun run build)')
  const rangeProblems = internalRangeProblems(packed, versions)

  if (bad.length || missing.length || rangeProblems.length) {
    failed = true
    if (bad.length) console.error(`${name}: unexpected files in tarball:\n  ${bad.join('\n  ')}`)
    if (missing.length) console.error(`${name}: missing from tarball: ${missing.join(', ')}`)
    if (rangeProblems.length) console.error(`${name}: bad internal dependency ranges:\n  ${rangeProblems.join('\n  ')}`)
  } else {
    const internal = Object.entries((packed.dependencies ?? {}) as Record<string, string>)
      .filter(([dep]) => dep in versions)
      .map(([dep, range]) => ` ${dep}@${range}`)
      .join('')
    console.log(`${name}@${pkg.version}: ok (${files.length} files${internal ? `,${internal}` : ''}) -> ${tarball}`)
  }
}
process.exit(failed ? 1 : 0)
