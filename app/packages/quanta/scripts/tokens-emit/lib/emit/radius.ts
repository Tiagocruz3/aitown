/**
 * Radius emitter — two pure functions: ParsedTokens → CSS string.
 *
 *   primitivesRadius → primitives/radius.css
 *     :root {
 *       --hf-radius-{0,050,100,150,200,250,300,400,500,600}: <rem>
 *       --hf-radius-full: 9999px
 *     }
 *
 *   tailwindRadius → tailwind/radius.css
 *     @theme {
 *       --radius-q-{name}: var(--hf-radius-{name})   → `rounded-q-{name}` utilities
 *     }
 *
 * Why `rem` for the numeric scale (not `px` like border-width): corner radius
 * is a sizing artifact, not a hairline — scaling it with the user's root
 * font-size keeps proportions intact under text-zoom. Spacing uses the same
 * `rem()` convention. (Border-width is the exception — borders must stay on the
 * pixel grid.)
 *
 * Why `full` is special-cased to px (NOT passed through `rem()`): `full = 9999`
 * is a "pill / fully-rounded" sentinel, not a real dimension. `rem(9999)` would
 * emit `624.9375rem` — functional but absurd. Any non-numeric (sentinel) key is
 * emitted as a raw px value. Locked in radius.test.ts.
 *
 * Why no theme layer: radius doesn't vary by theme/viewport/density — same as
 * spacing / z-index / border-width.
 *
 * Why no reset of Tailwind's built-in `--radius-*`: the `q-` infix means
 * `rounded-q-200` never collides with Tailwind's `rounded-lg`/`rounded-xl`.
 * The numeric defaults remain as an escape hatch; named `rounded-q-*` is the
 * canonical DS choice. (Same coexistence stance as border-width / z-index.)
 */

import type { ParsedTokens } from '../types.ts'
import { HEADER, rem, sortedKeys } from './shared.ts'

/** Render one radius value: numeric keys → rem; sentinel keys (`full`) → px. */
function radiusValue(key: string, px: number): string {
  return /^\d+$/.test(key) ? rem(px) : `${px}px`
}

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesRadius(tokens: ParsedTokens): string {
  const { radius } = tokens
  const lines: string[] = [HEADER, ':root {']

  for (const name of sortedKeys(radius))
    lines.push(`  --hf-radius-${name}: ${radiusValue(name, radius[name])};`)

  lines.push('}', '')
  return lines.join('\n')
}

export function tailwindRadius(tokens: ParsedTokens): string {
  const { radius } = tokens
  const lines: string[] = [HEADER, '@theme {']

  for (const name of sortedKeys(radius))
    lines.push(`  --radius-q-${name}: var(--hf-radius-${name});`)

  lines.push('}', '')
  return lines.join('\n')
}
