# Vendored design-tokens snapshot

These JSON files are a **committed snapshot** of the upstream `design-tokens`
repository, vendored so quanta's codegen has a deterministic, in-repo input.
The golden test diffs the committed `src/css/*` against `codegen(this snapshot)`,
so it stays meaningful and reproducible everywhere — no external checkout needed.

**Do not hand-edit these files.** They are owned by upstream. To adopt upstream
changes, run `yarn tokens:read` (copies the upstream `tokens/` here), then
`yarn tokens:emit`, and commit the JSON + regenerated CSS diff together.

## Current snapshot

- upstream: `higgsfield-ai/design-tokens`
- commit: `bbc545a213603fe54323243b0e78fc2071b6f030`
- 2026-06-18 21:22:30 +0500 Merge pull request #21 from higgsfield-ai/auto/tokens-20260618-160025
