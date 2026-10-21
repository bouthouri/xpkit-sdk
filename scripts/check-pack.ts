// Fails if `npm pack` would publish anything outside dist/, README.md, LICENSE, package.json.
// Package names/dirs come from packages/*/package.json. Run after `bun run build`.
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const pkgsDir = join(root, 'packages')
const allowed = (p: string) =>
  p.startsWith('dist/') || ['README.md', 'LICENSE', 'package.json'].includes(p)

let failed = false
for (const dir of readdirSync(pkgsDir)) {
  const cwd = join(pkgsDir, dir)
  if (!existsSync(join(cwd, 'package.json'))) continue
  const name = (await Bun.file(join(cwd, 'package.json')).json()).name as string
  const proc = Bun.spawnSync(['npm', 'pack', '--dry-run', '--json', '--ignore-scripts'], { cwd })
  if (proc.exitCode !== 0) {
    console.error(`${name}: npm pack failed\n${proc.stderr.toString()}`)
    failed = true
    continue
  }
  const files: string[] = JSON.parse(proc.stdout.toString())[0].files.map((f: { path: string }) => f.path)
  const bad = files.filter(f => !allowed(f))
  const missing = ['README.md', 'LICENSE', 'package.json'].filter(f => !files.includes(f))
  if (!files.some(f => f.startsWith('dist/'))) missing.push('dist/ (run bun run build)')
  if (bad.length || missing.length) {
    failed = true
    if (bad.length) console.error(`${name}: unexpected files in tarball:\n  ${bad.join('\n  ')}`)
    if (missing.length) console.error(`${name}: missing from tarball: ${missing.join(', ')}`)
  } else {
    console.log(`${name}: ok (${files.length} files)`)
  }
}
process.exit(failed ? 1 : 0)
