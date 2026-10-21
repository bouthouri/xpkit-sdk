# Contributing

## Setup

```bash
bun install
bun run typecheck
bun run test
bun run build
bun run check:pack   # tarballs contain only dist, README.md, LICENSE, package.json
```

## Changesets

Every user-facing change needs a changeset: `bun changeset`. Pick the affected packages and
the bump type; commit the generated file in `.changeset/`.

## Versioning

Semver. Never break users on upgrade: breaking changes need a major bump (minor while 0.x)
and a migration note in the changeset.

## Pull requests

Open PRs against `main`. CI (typecheck, test, build, pack check) must be green.
