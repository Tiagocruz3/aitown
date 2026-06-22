/**
 * Token source for `tokens:read` — where to pull the upstream design tokens
 * from before vendoring them into the snapshot.
 *
 * Selected by `TOKENS_READ_SOURCE` (or a CLI arg) of the form `<scheme>://<path>`.
 * Only two schemes are supported:
 *
 *   fs://<path>    local filesystem — the path is the root that contains a
 *                  `tokens/` dir. Implemented.
 *   git://<path>   a git repository — not implemented yet (throws).
 *
 * Any other scheme, or a value without `://`, is rejected.
 *
 * This is ONLY for refreshing the snapshot. Codegen (`tokens:emit`) always reads
 * the local snapshot — see scripts/tokens-emit/lib/reader.ts.
 */

import { copyFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SOURCE_ENV = 'TOKENS_READ_SOURCE'

/** source.ts is at scripts/tokens-read/, so the package root is two up. */
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Default upstream when neither a CLI arg nor TOKENS_READ_SOURCE is given. */
export const DEFAULT_SOURCE = `fs://${join(PACKAGE_ROOT, '..', '..', '..', 'design-tokens')}`

export const SUPPORTED_SCHEMES = ['fs', 'git'] as const
export type SourceScheme = typeof SUPPORTED_SCHEMES[number]

export interface TokenSource {
  scheme: SourceScheme
  /** For fs: the root dir that contains `tokens/`. For git: the repo location. */
  location: string
}

/**
 * Parse a `TOKENS_READ_SOURCE` value (`"<scheme>://<path>"`). Throws on an
 * unknown scheme, a missing `://`, or an empty path.
 */
export function parseSource(raw: string): TokenSource {
  const sep = raw.indexOf('://')
  if (sep === -1) {
    throw new Error(
      `Invalid ${SOURCE_ENV} "${raw}": expected "<scheme>://<path>" (e.g. fs:///abs/path or git://host/repo).`,
    )
  }
  const scheme = raw.slice(0, sep)
  const location = raw.slice(sep + 3).trim()
  if (!(SUPPORTED_SCHEMES as readonly string[]).includes(scheme)) {
    throw new Error(
      `Unsupported ${SOURCE_ENV} scheme "${scheme}://". Supported: ${SUPPORTED_SCHEMES.map(s => `${s}://`).join(', ')}.`,
    )
  }
  if (location === '') {
    throw new Error(`Invalid ${SOURCE_ENV} "${raw}": missing path after "${scheme}://".`)
  }
  return { scheme: scheme as SourceScheme, location }
}

/**
 * Resolve the source from (in order) a CLI arg, the env var, then the default
 * upstream. A bare arg path (no `://`) is treated as `fs://<path>`.
 */
export function resolveSource(env: NodeJS.ProcessEnv = process.env, argv?: string): TokenSource {
  const arg = argv?.trim()
  if (arg) {
    return parseSource(arg.includes('://') ? arg : `fs://${arg}`)
  }
  const fromEnv = env[SOURCE_ENV]?.trim()
  return parseSource(fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_SOURCE)
}

/**
 * Copy every `tokens/*.json` from `source` into `destTokensDir`, returning the
 * file names copied. `git://` is recognised but not implemented yet.
 */
export function fetchTokens(source: TokenSource, destTokensDir: string): string[] {
  if (source.scheme === 'git') {
    throw new Error(
      `${SOURCE_ENV} scheme "git://" is not implemented yet (location: ${source.location}). Use fs:// for now.`,
    )
  }
  const srcDir = join(source.location, 'tokens')
  const files = readdirSync(srcDir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    throw new Error(`No *.json found in ${srcDir}`)
  }
  for (const file of files) {
    copyFileSync(join(srcDir, file), join(destTokensDir, file))
  }
  return files
}
