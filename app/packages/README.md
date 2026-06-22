# Vendored Higgsfield packages

This directory is managed by `scripts/sync-higgsfield-packages.sh`.

It contains local workspace snapshots of:

- `@higgsfield/fnf` — SDK core: jobs, media, profile, observability, adapters.
- `@higgsfield/fnf-react` — React provider, TanStack Query options, cache door, controllers.
- `@higgsfield/quanta` — Higgsfield design tokens, CSS entries, and React components.

Do not manually edit these package snapshots in generated apps. Their source of
truth is the `fnf-web` repository. To refresh them from a local checkout:

```bash
HIGGSFIELD_REPO=/Users/dastantynyshtyk/Documents/fnf-web \
FNF_REF=HEAD \
QUANTA_REF=HEAD \
bun run sync:packages
```

The sync writes `packages/.snapshot.json` with the source commits, bundle
artifact name/SHA256, actor, sync mode, and timestamp. After syncing, run
`bun install` at the template root so workspace links and `bun.lock` match the
new snapshots.

Before using a package, read its agent guide:

- `packages/fnf/ai/AGENTS.md`
- `packages/fnf-react/ai/AGENTS.md`
- `packages/quanta/ai/AGENTS.md`
