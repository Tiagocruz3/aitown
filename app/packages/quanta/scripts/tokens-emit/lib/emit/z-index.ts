/**
 * Z-Index emitter — two pure functions: ParsedTokens → CSS string.
 *
 *   primitivesZIndex → primitives/z-index.css
 *     :root {
 *       --hf-z-index-{base,dropdown,sticky,overlay,modal,popover,toast,tooltip}: <integer>
 *     }
 *
 *   tailwindZIndex → tailwind/z-index.css
 *     @theme {
 *       --z-index-{name}: var(--hf-z-index-{name})
 *     }
 *
 * Why semantic names (not numeric): magic numbers (`z-index: 9999`) are a
 * perennial source of stacking-order bugs. Semantic keys communicate intent
 * (`z-modal` means "modal layer") and gate against ad-hoc escalation.
 *
 * Why no theme layer: no axis to resolve today (z-index doesn't change
 * with theme / viewport / density / brand). Same logic as spacing / breakpoint.
 *
 * Why no reset of Tailwind defaults: Tailwind v4 z-index defaults are a
 * finite set (`z-0, z-10, …, z-50, z-auto`), low collision surface, and
 * useful for one-off interop with non-DS code. Our semantic names coexist.
 *
 * See z-index-design.md.
 */

import type { ParsedTokens } from '../types.ts'
import { HEADER } from './shared.ts'

// Ordered by ascending stacking position — matches semantic meaning.
// Output order is meaningful; do NOT sort alphabetically.
const Z_INDEX_KEYS = [
  'base',
  'dropdown',
  'sticky',
  'overlay',
  'modal',
  'popover',
  'toast',
  'tooltip',
] as const

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesZIndex(tokens: ParsedTokens): string {
  const { zIndex } = tokens
  const lines: string[] = [HEADER, ':root {']

  for (const name of Z_INDEX_KEYS)
    lines.push(`  --hf-z-index-${name}: ${zIndex[name]};`)

  lines.push('}', '')
  return lines.join('\n')
}

export function tailwindZIndex(_tokens: ParsedTokens): string {
  // Output.emit signature requires ParsedTokens; values flow through
  // primitive var refs, so the parameter is intentionally unused here.
  const lines: string[] = [HEADER, '@theme {']

  for (const name of Z_INDEX_KEYS)
    lines.push(`  --z-index-q-${name}: var(--hf-z-index-${name});`)

  lines.push('}', '')
  return lines.join('\n')
}
