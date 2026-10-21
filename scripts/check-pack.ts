// Packs every packages/* with `bun pm pack` (the same tarball the release publishes) and
// fails if a tarball holds anything outside dist/, README.md, LICENSE, package.json, or if
// its package.json still has a `workspace:` range (bun rewrites them to real versions).
// Package names/dirs come from packages/*/package.json. Run after `bun run build`.
//   bun scripts/check-pack.ts              check only (tarballs in a temp dir)
//   bun scripts/check-pack.ts --out .pack  check and keep the tarballs in .pack/
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = join(import.meta.dir, '..')
const pkgsDir = join(root, 'packages')
const outFlag = process.argv.indexOf('--out')
const outDir = outFlag > -1 ? resolve(root, process.argv[outFlag + 1]) : mkdtempSync(join(tmpdir(), 'xpkit-pack-'))
mkdirSync(outDir, { recursive: true })

const allowed = (p: string) => p.startsWith('dist/') || ['README.md', 'LICENSE', 'package.json'].includes(p)
const depFields = ['dependencies', 'peerDependencies', 'optionalDependencies'] as const

function sh(cmd: string[], cwd: string): string {
  const proc = Bun.spawnSync(cmd, { cwd })
  if (proc.exitCode !== 0) throw new Error(`${cmd.join(' ')} failed in ${cwd}\n${proc.stderr.toString()}`)
  return proc.stdout.toString()
}

let failed = false
for (const dir of readdirSync(pkgsDir)) {
  const cwd = join(pkgsDir, dir)
  if (!existsSync(join(cwd, 'package.json'))) continue
  const pkg = await Bun.file(join(cwd, 'package.json')).json()
  if (pkg.private) continue
  const name = pkg.name as string
  const tarball = join(outDir, `${name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`)

  sh(['bun', 'pm', 'pack', '--destination', outDir, '--quiet', '--ignore-scripts'], cwd)
  const files = sh(['tar', '-tzf', tarball], root)
    .split('\n')
    .filter(Boolean)
    .map(f => f.replace(/^package\//, ''))
  const packed = JSON.parse(sh(['tar', '-xzOf', tarball, 'package/package.json'], root))

  const bad = files.filter(f => !allowed(f))
  const missing = ['README.md', 'LICENSE', 'package.json'].filter(f => !files.includes(f))
  if (!files.some(f => f.startsWith('dist/'))) missing.push('dist/ (run bun run build)')
  const workspaceRanges = depFields.flatMap(field =>
    Object.entries((packed[field] ?? {}) as Record<string, string>)
      .filter(([, range]) => range.startsWith('workspace:'))
      .map(([dep, range]) => `${field}.${dep}: ${range}`),
  )

  if (bad.length || missing.length || workspaceRanges.length) {
    failed = true
    if (bad.length) console.error(`${name}: unexpected files in tarball:\n  ${bad.join('\n  ')}`)
    if (missing.length) console.error(`${name}: missing from tarball: ${missing.join(', ')}`)
    if (workspaceRanges.length) console.error(`${name}: workspace ranges in packed package.json:\n  ${workspaceRanges.join('\n  ')}`)
  } else {
    console.log(`${name}@${pkg.version}: ok (${files.length} files) -> ${tarball}`)
  }
}
process.exit(failed ? 1 : 0)
