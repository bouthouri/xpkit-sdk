# Changesets

Run `bun changeset` for every user-facing change. Packages version independently.
On merge to `main` the release workflow opens a "chore: release packages" PR; merging it
publishes to npm. See [CONTRIBUTING.md](../CONTRIBUTING.md).
