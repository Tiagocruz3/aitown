/**
 * Border-Width emitter — two pure functions: ParsedTokens → CSS string.
 *
 *   primitivesBorderWidth → primitives/border-width.css
 *     :root {
 *       --hf-border-width-{none,thin,medium,thick}: <Npx>
 *     }
 *
 *   tailwindBorderWidth → tailwind/border-width.css
 *     @theme {
 *       --border-width-{thin,medium,thick}: var(--hf-border-width-{name})
 *     }
 *     (`none` deliberately skipped — see below.)
 *
 * Why `px` (not `rem`): borders are pixel-grid artifacts. A hairline must
 * stay hairline regardless of user font-size preference; scaling borders
 * with text-zoom produces visual mush at small sizes. Tailwind v4 default
 * `--border-width-*` uses px — same convention.
 *
 * Why `none` is skipped from Tailwind binding: Tailwind v4 ships a built-in
 * `border-none` utility that sets `border-style: none` (style, not width).
 * Emitting `--border-width-none: 0` would create a second utility under the
 * same name with different semantics — ambiguity we don't want to depend
 * on Tailwind's internal namespace ordering to disambiguate. The primitive
 * `--hf-border-width-none: 0` is still available for hand-written CSS;
 * consumers needing zero width use Tailwind's native `border-0`.
 *
 * Why no theme layer: no axis to resolve today. Same logic as spacing /
 * breakpoint / z-index.
 *
 * Why no reset of Tailwind defaults: numeric defaults (`border-2`,
 * `border-4`, `border-8`) are a finite set, low collision surface. Named
 * (`border-thin`/`medium`/`thick`) is the canonical DS choice; numeric
 * remains an escape hatch.
 *
 * See border-width-design.md.
 */

import type { ParsedTokens } from '../types.ts'
import { HEADER } from './shared.ts'

// Ordered ascending by width — matches semantic intuition.
const BORDER_WIDTH_KEYS = ['none', 'thin', 'medium', 'thick'] as const

// `none` skipped — collides with Tailwind's `border-none = border-style: none`.
const TAILWIND_BORDER_WIDTH_KEYS = ['thin', 'medium', 'thick'] as const

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesBorderWidth(tokens: ParsedTokens): string {
  const { borderWidth } = tokens
  const lines: string[] = [HEADER, ':root {']

  for (const name of BORDER_WIDTH_KEYS)
    lines.push(`  --hf-border-width-${name}: ${borderWidth[name]}px;`)

  lines.push('}', '')
  return lines.join('\n')
}

export function tailwindBorderWidth(_tokens: ParsedTokens): string {
  // Output.emit signature requires ParsedTokens; values flow through
  // primitive var refs, so the parameter is intentionally unused here.
  const lines: string[] = [HEADER, '@theme {']

  for (const name of TAILWIND_BORDER_WIDTH_KEYS)
    lines.push(`  --border-width-q-${name}: var(--hf-border-width-${name});`)

  lines.push('}', '')
  return lines.join('\n')
}
