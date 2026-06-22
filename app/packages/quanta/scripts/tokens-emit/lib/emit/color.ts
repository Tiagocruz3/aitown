/**
 * Color emitter — three pure functions: ParsedTokens → CSS string.
 *
 *   primitivesColor  →  primitives/color.css   :root { --hf-color-*: <literal>; ... }
 *   themeColor       →  theme/color.css        :where(:root), :where([data-theme="default-light"]) { ... }
 *                                              :where([data-theme="default-dark"]) { ... }
 *   tailwindColor    →  tailwind/color.css     @theme inline { --color-*: var(--hf-color-*); ... }
 *
 * Naming is centralized in lib/naming.ts. This file knows only about the
 * CSS structure (selectors, blocks, ordering) for the color category.
 */

import type { ParsedTokens } from '../types.ts'
import { aliasToVar, isAlias, primitiveVar, semanticVar, tailwindAlias } from '../naming.ts'
import { HEADER } from './shared.ts'

const CATEGORY = 'color'

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function comparePaths(a: string[], b: string[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? ''
    const bv = b[i] ?? ''
    if (av !== bv)
      return av < bv ? -1 : 1
  }
  return 0
}

function semanticValueToCss(value: string): string {
  if (!value)
    throw new Error('semanticValueToCss: empty value')
  return isAlias(value) ? `var(${aliasToVar(value)})` : value
}

/**
 * Semantic tokens to actually emit, excluding any whose flattened `--hf-color-*`
 * name collides with a primitive of the same name.
 *
 * `aliasToVar` collapses `color-primitives.*` and `color-semantic.*` onto one
 * `--hf-color-*` namespace, so a semantic group that mirrors a primitive group
 * (today: `transparent.{light,dark}.NN`, a per-theme pass-through to the
 * identically-named primitive) would re-declare `--hf-color-transparent-*` as a
 * self-referential / mutually-cyclic alias (`--X: var(--X)`), which is invalid
 * at computed-value time and CLOBBERS the real primitive value — silently
 * breaking every token that references it (e.g. `border-default`). The
 * primitive already provides the correct value at `:root`, and theme-aware
 * consumers (border-*, etc.) do their own light/dark flip referencing the
 * primitive, so dropping these pass-throughs is the fix, not a regression.
 */
function emittableSemantics(tokens: ParsedTokens) {
  const primitiveNames = new Set(tokens.color.primitives.map(p => primitiveVar(CATEGORY, p)))
  return tokens.color.semantic.filter(s => !primitiveNames.has(semanticVar(CATEGORY, s)))
}

/**
 * Emit lines for a sorted list of path-keyed items, inserting a blank line
 * between namespace groups (where namespace = path[0]). E.g. semantic groups
 * `background-*` / `border-*` / `icon-*` get visually separated; primitive
 * color families `blue` / `grey` / `red` get the same treatment.
 *
 * Items must be pre-sorted so same-namespace entries are contiguous.
 */
function groupedLines<T extends { path: string[] }>(
  items: T[],
  toLine: (item: T) => string,
): string[] {
  const out: string[] = []
  let prevNamespace: string | null = null
  for (const item of items) {
    const ns = item.path[0] ?? ''
    if (prevNamespace !== null && ns !== prevNamespace)
      out.push('')
    out.push(toLine(item))
    prevNamespace = ns
  }
  return out
}

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesColor(tokens: ParsedTokens): string {
  const sorted = [...tokens.color.primitives].sort((a, b) => comparePaths(a.path, b.path))
  const lines = [HEADER, ':root {']
  lines.push(...groupedLines(sorted, p => `  ${primitiveVar(CATEGORY, p)}: ${p.value};`))
  lines.push('}', '')
  return lines.join('\n')
}

export function themeColor(tokens: ParsedTokens): string {
  const sorted = [...emittableSemantics(tokens)].sort((a, b) => comparePaths(a.path, b.path))
  const lines = [HEADER]

  // Wrapped in @layer quanta-theme so runtime-injected themes (defineTheme,
  // bootstrap) — which stay unlayered — always beat these baked rules in the
  // cascade, regardless of DOM source order. Without this, the cascade tie
  // between :where(:root) here and :where([data-theme="ai-ocean"]) injected
  // by bootstrap would be broken by source order: in Vite dev the bundler
  // injects this stylesheet AFTER the bootstrap <style>, so the default-light
  // rules would briefly win at first paint until React re-injects, producing
  // a white flash. Layer-vs-unlayered comparison happens before source order.
  lines.push('@layer quanta-theme {', '')

  lines.push('  :where(:root),', '  :where([data-theme="default-light"]) {', '    color-scheme: light;', '')
  lines.push(...groupedLines(sorted, s => `    ${semanticVar(CATEGORY, s)}: ${semanticValueToCss(s.light)};`))
  lines.push('  }', '')

  lines.push('  :where([data-theme="default-dark"]) {', '    color-scheme: dark;', '')
  lines.push(...groupedLines(sorted, s => `    ${semanticVar(CATEGORY, s)}: ${semanticValueToCss(s.dark)};`))
  lines.push('  }', '')

  lines.push('}', '')

  return lines.join('\n')
}

export function tailwindColor(tokens: ParsedTokens): string {
  const primitives = [...tokens.color.primitives].sort((a, b) => comparePaths(a.path, b.path))
  const semantic = [...emittableSemantics(tokens)].sort((a, b) => comparePaths(a.path, b.path))

  // Two separate @theme inline blocks — Tailwind v4 merges multiple @theme
  // declarations, so the result is functionally identical to one combined
  // block. Splitting keeps primitives vs. semantic visually distinct.
  //
  // Semantic block first — it's the public API surface (`bg-surface-default`,
  // `text-text-primary`); primitives are the underlying scale, shown below.
  //
  // Within each block, namespace groups (background-*, border-*, icon-*, …
  // for semantic; blue/grey/red/… for primitives) are separated by blank lines.
  const lines = [HEADER, '/* semantic → Tailwind */', '@theme inline {']
  lines.push(...groupedLines(semantic, s => `  ${tailwindAlias(CATEGORY, ['q', ...s.path])}: var(${semanticVar(CATEGORY, s)});`))
  lines.push('}', '')

  lines.push('/* primitives → Tailwind */', '@theme inline {')
  lines.push(...groupedLines(primitives, p => `  ${tailwindAlias(CATEGORY, ['q', ...p.path])}: var(${primitiveVar(CATEGORY, p)});`))
  lines.push('}', '')

  return lines.join('\n')
}
