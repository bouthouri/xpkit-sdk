# XP Kit SDK

XP Kit turns a JSON config (onboarding screens, levels, variables, achievements,
milestones, streaks) into app behaviour. One platform-free engine decides what unlocks
and persists it through an injected storage adapter; renderers stay thin and per platform.

## Packages

| Package | Path | What it is |
|---|---|---|
| `@xpkit-dev/core` | [`packages/core`](packages/core) | Config schema (zod), `parseConfig`, `createEngine`, achievements, persisted stores, `StorageAdapter`. No UI, no platform APIs. |

`examples/` is reserved for workspace apps. Older reference material (vendored app code the
engine was extracted from) lives in [`docs/reference/examples`](docs/reference/examples).

## Develop

```bash
bun install
bun run test        # all workspaces
bun run typecheck
bun run build       # emits packages/*/dist
```

Or run a single package: `cd packages/core && bun test`.

## Package scope

`@xpkit-dev` is a working npm scope; every package name lives in `packages/*/package.json` and imports, rename = replace `@xpkit-dev/`.

## Docs

Start with [`docs/05-quickstart.md`](docs/05-quickstart.md). The other notes in
[`docs/`](docs) cover the [JSON contract](docs/01-json-contract.md),
[onboarding](docs/02-onboarding-explained.md),
[achievements](docs/03-achievements-explained.md) and
[storage](docs/04-storage-and-state.md). Test fixtures (three real app configs) are in
[`packages/core/fixtures`](packages/core/fixtures).
