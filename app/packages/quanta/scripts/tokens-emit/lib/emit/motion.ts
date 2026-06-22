/**
 * Motion emitter — two pure functions: ParsedTokens → CSS string.
 *
 *   primitivesMotion → primitives/motion.css
 *     :root {
 *       --hf-duration-{instant,fast,normal,slow,slower}: <N>ms
 *       --hf-ease-{in,out,in-out,linear}: cubic-bezier(…) | linear
 *     }
 *
 *   tailwindMotion → tailwind/motion.css
 *     @theme {
 *       --transition-duration-q-{name}: var(--hf-duration-{name})  → `duration-q-{name}`
 *       --ease-q-{name}:                var(--hf-ease-{name})       → `ease-q-{name}`
 *     }
 *
 * Tailwind v4 namespace gotcha (verified against the installed tailwindcss):
 *   - the `duration-*` utility resolves from the `--transition-duration-*`
 *     theme namespace — NOT `--duration-*` (which Tailwind ignores). So the
 *     duration bridge MUST be keyed `--transition-duration-q-*` to synthesize
 *     `duration-q-*` utilities.
 *   - the `ease-*` utility resolves from the `--ease-*` namespace, so
 *     `--ease-q-*` synthesizes `ease-q-*`.
 * The `q-` infix keeps both clear of Tailwind's built-in `--ease-{in,out,in-out}`
 * and `--default-transition-duration`.
 *
 * Why no theme layer: motion is global — it doesn't vary by theme/viewport.
 *
 * NOTE: the slot defaults (`--_duration`/`--_ease`) and the
 * `prefers-reduced-motion` reset are hand-authored companions (slot.css), not
 * codegen output — see quanta-core-plan.md §7.3–§7.5.
 */

import type { ParsedTokens } from '../types.ts'
import { HEADER } from './shared.ts'

// Ordered fastest→slowest — semantic order, not alphabetic. Must match
// EXPECTED_DURATION_KEYS in validator.ts.
const DURATION_KEYS = ['instant', 'fast', 'normal', 'slow', 'slower'] as const
// Must match EXPECTED_EASE_KEYS in validator.ts.
const EASE_KEYS = ['in', 'out', 'in-out', 'linear'] as const

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesMotion(tokens: ParsedTokens): string {
  const { duration, easing } = tokens.motion
  const lines: string[] = [HEADER, ':root {']

  for (const name of DURATION_KEYS)
    lines.push(`  --hf-duration-${name}: ${duration[name]}ms;`)
  for (const name of EASE_KEYS)
    lines.push(`  --hf-ease-${name}: ${easing[name]};`)

  lines.push('}', '')
  return lines.join('\n')
}

export function tailwindMotion(_tokens: ParsedTokens): string {
  // Output.emit signature requires ParsedTokens; values flow through
  // primitive var refs, so the parameter is intentionally unused here.
  const lines: string[] = [HEADER, '@theme {']

  for (const name of DURATION_KEYS)
    lines.push(`  --transition-duration-q-${name}: var(--hf-duration-${name});`)
  for (const name of EASE_KEYS)
    lines.push(`  --ease-q-${name}: var(--hf-ease-${name});`)

  lines.push('}', '')
  return lines.join('\n')
}
