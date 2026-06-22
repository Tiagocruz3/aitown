/**
 * Snapshot reader — codegen's input.
 *
 * `tokens:emit` ALWAYS reads the vendored snapshot at <package>/tokens (see
 * tokens/README.md), so CSS generation is deterministic and in-repo. Pulling a
 * different source INTO the snapshot is a separate concern owned by
 * `tokens:read` (scripts/tokens-read) — codegen never reads upstream directly.
 *
 * Contract: a Reader exposes `read(): Promise<RawTokens>`. Downstream (parser,
 * validator, emitters) doesn't care where the bytes came from.
 */

import type { RawTokenCollection, RawTokens } from './types.ts'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** reader.ts is at scripts/tokens-emit/lib/, so the package root is three up. */
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

export interface Reader {
  read: () => Promise<RawTokens>
}

export class FsReader implements Reader {
  constructor(private readonly rootPath: string) {}

  async read(): Promise<RawTokens> {
    const [
      colorPrimitives,
      colorSemantic,
      typePrimitives,
      typeScales,
      typeSemantic,
      breakpoint,
      space,
      zIndex,
      borderWidth,
      radius,
      motion,
    ] = await Promise.all([
      this.readJson('tokens/color-primitives.json'),
      this.readJson('tokens/color-semantic.json'),
      this.readJson('tokens/type-primitives.json'),
      this.readJson('tokens/type-scales.json'),
      this.readJson('tokens/type-semantic.json'),
      this.readJson('tokens/breakpoint.json'),
      this.readJson('tokens/space.json'),
      this.readJson('tokens/z-index.json'),
      this.readJson('tokens/border-width.json'),
      this.readJson('tokens/radius.json'),
      this.readJson('tokens/motion.json'),
    ])
    return {
      colorPrimitives,
      colorSemantic,
      typePrimitives,
      typeScales,
      typeSemantic,
      breakpoint,
      space,
      zIndex,
      borderWidth,
      radius,
      motion,
    }
  }

  private async readJson(relative: string): Promise<RawTokenCollection> {
    const fullPath = join(this.rootPath, relative)
    const text = await readFile(fullPath, 'utf-8')
    return JSON.parse(text) as RawTokenCollection
  }
}

/** Path to the vendored snapshot's `tokens/` dir — codegen's fixed input. */
export const SNAPSHOT_ROOT = PACKAGE_ROOT

/** The fixed codegen input: the vendored snapshot at <package>/tokens. */
export function snapshotReader(): Reader {
  return new FsReader(SNAPSHOT_ROOT)
}
