/**
 * Pipeline entry — read → parse → validate → emit.
 *
 * Run:
 *   yarn workspace @higgsfield/quanta tokens:emit
 *
 * This file is intentionally thin. All real logic lives in `lib/`:
 *   lib/reader.ts     — reads the vendored snapshot (codegen's fixed input)
 *   lib/parser.ts     — how raw DTCG becomes typed
 *   lib/validator.ts  — what we require of the tokens
 *   lib/naming.ts     — string-name conventions (--hf-*, alias bridge)
 *   lib/emit/*.ts     — per-category CSS generators
 *   lib/outputs.ts    — registry of (path, emit-fn) pairs
 *
 * Codegen always reads <package>/tokens. Refreshing that snapshot from an
 * upstream source is `tokens:read`'s job (scripts/tokens-read).
 *
 * Adding a category does not touch emit.ts — only `lib/outputs.ts`.
 */

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { outputs } from './lib/outputs.ts'
import { parse } from './lib/parser.ts'
import { snapshotReader } from './lib/reader.ts'
import { validate } from './lib/validator.ts'

const QUANTA_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

async function emit(): Promise<void> {
  const start = Date.now()

  const raw = await snapshotReader().read()
  const result = parse(raw)

  const check = validate(result)
  if (!check.ok) {
    for (const err of check.errors) process.stderr.write(`  ✗ ${err}\n`)
    process.stderr.write('validation failed\n')
    process.exit(1)
  }

  for (const { path, emit } of outputs) {
    const content = emit(result)
    await writeFile(join(QUANTA_ROOT, path), content, 'utf-8')
    process.stdout.write(`  ✓ ${path}  (${content.length} bytes)\n`)
  }

  process.stdout.write(`Done in ${Date.now() - start}ms.\n`)
}

emit().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err)
  process.stderr.write(`✗ codegen failed:\n${msg}\n`)
  process.exit(1)
})
