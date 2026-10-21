// Release step, run by .github/workflows/release.yml through `bun run release`.
// Publishes the tarballs that scripts/check-pack.ts built in .pack/ (bun pm pack already
// rewrote workspace:* to real versions) with npm, so npm trusted publishing (OIDC) and
// provenance apply. Versions already on npm are skipped. Prints "New tag: name@version"
// (read by changesets/action), then creates the git tags with `changeset tag`.
//   bun scripts/publish-tarballs.ts            publish
//   bun scripts/publish-tarballs.ts --dry-run  npm publish --dry-run, no upload, no tags
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const packDir = join(root, '.pack')
const dryRun = process.argv.includes('--dry-run')

function run(cmd: string[], quiet = false): { code: number; out: string } {
  const proc = Bun.spawnSync(cmd, { cwd: root, stderr: quiet ? 'ignore' : 'inherit' })
  return { code: proc.exitCode ?? 1, out: proc.stdout.toString() }
}

function packedManifest(tarball: string): { name: string; version: string } {
  const { code, out } = run(['tar', '-xzOf', tarball, 'package/package.json'])
  if (code !== 0) throw new Error(`cannot read package.json from ${tarball}`)
  return JSON.parse(out)
}

const tarballs = readdirSync(packDir).filter(f => f.endsWith('.tgz')).map(f => join(packDir, f))
if (tarballs.length === 0) {
  console.error('no tarballs in .pack/: run `bun scripts/check-pack.ts --out .pack` first')
  process.exit(1)
}

let published = 0
for (const tarball of tarballs) {
  const { name, version } = packedManifest(tarball)
  const id = `${name}@${version}`
  const view = run(['npm', 'view', id, 'version'], true) // 404 = not published yet
  if (view.code === 0 && view.out.trim() === version) {
    console.log(`${id}: already on npm, skipping`)
    continue
  }
  // Provenance needs the CI OIDC environment; local dry runs skip it.
  const args = ['npm', 'publish', tarball, '--access', 'public', ...(process.env.CI ? ['--provenance'] : [])]
  if (dryRun) args.push('--dry-run')
  const result = Bun.spawnSync(args, { cwd: root, stdout: 'inherit', stderr: 'inherit' })
  if (result.exitCode !== 0) {
    console.error(`${id}: npm publish failed`)
    process.exit(1)
  }
  if (!dryRun) console.log(`New tag: ${id}`)
  published++
}

if (!dryRun && published > 0) {
  const tag = Bun.spawnSync(['bunx', 'changeset', 'tag'], { cwd: root, stdout: 'inherit', stderr: 'inherit' })
  if (tag.exitCode !== 0) process.exit(1)
}
console.log(`${dryRun ? 'dry run: ' : ''}${published} package(s) ${dryRun ? 'would be ' : ''}published`)
