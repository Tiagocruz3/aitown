/**
 * Golden test — real upstream → real codegen → diff against committed CSS.
 *
 * Where `lib/emit/*.test.ts` lock the byte-output of emit functions against
 * the local `mkTokens()` fixture (structural invariants), this test runs
 * the full pipeline against the production upstream and diffs every
 * generated file against the version currently in `src/css/`.
 *
 * What it catches that fixture-driven snapshots can't:
 *   - Designer changes a color value in `tokens/color-primitives.json`
 *     → committed CSS no longer matches → fail with "out of sync"
 *   - Semantic alias quietly re-routes from one valid primitive to another
 *     (`{grey.050}` → `{grey.100}`) — both resolve, validator passes,
 *     fixture snapshot passes, but real CSS bytes change → caught here
 *   - Developer changes `tokens/*.json` but forgets `yarn tokens:emit`
 *     → committed `src/css/` drifts from what pipeline would emit → fail
 *
 * Workflow on fail:
 *   1. Run `yarn tokens:emit` to regenerate `src/css/`
 *   2. `git diff src/css/` shows the actual visual change
 *   3. If intentional (designer sign-off, refactor accepted) → commit
 *   4. If unintentional → revert upstream change
 *
 * The committed `src/css/*` files are the golden baseline. No parallel
 * `__golden__/` directory — the artefact this package ships is itself
 * the audit trail.
 *
 * Codegen reads the vendored snapshot at <package>/tokens (always present), so
 * this test always runs — no external checkout, no skip in the common case.
 */

import type { ParsedTokens } from './lib/types.ts'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { outputs } from './lib/outputs.ts'
import { parse } from './lib/parser.ts'
import { SNAPSHOT_ROOT, snapshotReader } from './lib/reader.ts'
import { validate } from './lib/validator.ts'

const QUANTA_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SNAPSHOT_AVAILABLE = existsSync(join(SNAPSHOT_ROOT, 'tokens'))

describe.skipIf(!SNAPSHOT_AVAILABLE)('Output stability — golden (vendored snapshot)', () => {
  let parsed: ParsedTokens

  beforeAll(async () => {
    const raw = await snapshotReader().read()
    parsed = parse(raw)
    const result = validate(parsed)
    if (!result.ok) {
      throw new Error(`Snapshot tokens fail validation:\n${result.errors.map(e => `  ${e}`).join('\n')}`)
    }
  })

  for (const { path, emit } of outputs) {
    it(path, () => {
      const expected = emit(parsed)
      const actual = readFileSync(join(QUANTA_ROOT, path), 'utf-8')
      expect(
        actual,
        `${path} is out of sync with current upstream tokens. Run \`yarn tokens:emit\` and review the diff before committing.`,
      ).toBe(expected)
    })
  }
})
