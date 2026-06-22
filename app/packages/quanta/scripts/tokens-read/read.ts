/**
 * tokens:read — refresh the vendored token snapshot (<package>/tokens) from an
 * upstream source. Also rewrites tokens/README.md with the source revision for
 * provenance. Run `tokens:emit` afterwards to regenerate src/css.
 *
 * Usage:
 *   yarn tokens:read                       # upstream defaults to ../../../design-tokens
 *   yarn tokens:read /path/to/design-tokens
 *   yarn tokens:read fs:///abs/path
 *   TOKENS_READ_SOURCE=fs:///abs/path yarn tokens:read
 *   (git:// is recognised but not implemented yet)
 *
 * Then run `yarn tokens:emit` and commit the JSON and regenerated CSS together.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { fetchTokens, resolveSource } from './source.ts'

/** read.ts is at scripts/tokens-read/, so the package root is two up. */
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SNAPSHOT_DIR = join(PACKAGE_ROOT, 'tokens')

// Load TOKENS_READ_SOURCE from the package's .env (if present). Codegen needs no
// env, so only this script loads it — no `with-env` wrapper.
loadEnv({ path: join(PACKAGE_ROOT, '.env') })

function sourceRevision(location: string): string {
  try {
    const sha = execFileSync('git', ['-C', location, 'rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim()
    const desc = execFileSync('git', ['-C', location, 'log', '-1', '--format=%ci %s'], { encoding: 'utf-8' }).trim()
    return `- commit: \`${sha}\`\n- ${desc}`
  }
  catch {
    return '- commit: (source is not a git checkout — revision unknown)'
  }
}

function main(): void {
  const source = resolveSource(process.env, process.argv[2])
  const files = fetchTokens(source, SNAPSHOT_DIR)

  const readme = readFileSync(join(SNAPSHOT_DIR, 'README.md'), 'utf-8')
  const updated = readme.replace(
    /## Current snapshot[\s\S]*$/,
    `## Current snapshot\n\n- upstream: \`higgsfield-ai/design-tokens\`\n${sourceRevision(source.location)}\n`,
  )
  writeFileSync(join(SNAPSHOT_DIR, 'README.md'), updated)

  console.log(`Read ${files.length} token files from ${join(source.location, 'tokens')}\nRun \`yarn tokens:emit\` and commit the JSON + regenerated CSS together.`)
}

main()
