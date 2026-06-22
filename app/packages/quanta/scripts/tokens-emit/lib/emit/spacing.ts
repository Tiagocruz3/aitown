/**
 * Spacing emitter — two pure functions: ParsedTokens → CSS string.
 *
 *   primitivesSpacing → primitives/spacing.css
 *     :root {
 *       --hf-space-{N}: {N/16}rem    atomic rem-converted values
 *     }
 *
 *   tailwindSpacing → tailwind/spacing.css
 *     @theme {
 *       --spacing: initial;          disable Tailwind's dynamic scale
 *       --spacing-0: 0;              preserve p-0/m-0/gap-0 semantics
 *       --spacing-{N}: var(--hf-space-{N})    named-key Tailwind binding
 *     }
 *
 * Why no theme layer: spacing has no axis to resolve today (no
 * data-theme variants, no viewport modes, no density/brand). The layer
 * placement rule allows skipping theme when nothing contextual happens.
 *
 * Why named keys (--spacing-1, --spacing-2, …) AND `--spacing: initial`:
 * Tailwind v4 ships a default `--spacing: 0.25rem` in its preflight that
 * makes `p-N` work as `calc(var(--spacing) * N)` for arbitrary integer N
 * (including off-scale `p-9`, `p-11`, …). Defining named keys is
 * ADDITIVE — it doesn't disable the dynamic scale. To actually enforce
 * curation, we must reset the base with `--spacing: initial`, which
 * makes Tailwind stop generating dynamic utilities and fall back to the
 * named bindings below. The synthesized `--spacing-0: 0` keeps `p-0`
 * working since the dynamic `calc(...) * 0` path is now gone.
 *
 * Plain @theme, not @theme inline: spacing has no opacity-modifier
 * code path (p-4/50 isn't a thing), so we keep var() intact for
 * runtime override flexibility — consumers can override `--hf-space-N`
 * and Tailwind utilities re-resolve through the chain.
 *
 * See spacing-design.md.
 */

import type { ParsedTokens } from '../types.ts'
import { HEADER, rem, sortedKeys } from './shared.ts'

const CATEGORY = 'space'

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesSpacing(tokens: ParsedTokens): string {
  const { spacing } = tokens
  const lines: string[] = [HEADER, ':root {']

  for (const k of sortedKeys(spacing))
    lines.push(`  --hf-${CATEGORY}-${k}: ${rem(spacing[k])};`)

  lines.push('}', '')
  return lines.join('\n')
}

export function tailwindSpacing(tokens: ParsedTokens): string {
  const { spacing } = tokens
  const lines: string[] = [HEADER, '@theme {']

  // q-prefixed named keys → `p-q-100`/`gap-q-200`/`size-q-400` etc. quanta
  // shares ONE Tailwind build with the host app + legacy @higgsfield/ui, so we
  // must NOT touch the shared `--spacing` namespace: we DON'T reset the base
  // (`--spacing: initial` would delete the host's dynamic `p-4`/`gap-2` scale
  // build-wide) and we keep every key under the `q-` prefix so quanta's scale
  // is purely additive and collision-free. quanta components mostly reference
  // exact values via `var(--hf-space-*)`; these utilities are for the few
  // class-name call-sites.
  for (const k of sortedKeys(spacing))
    lines.push(`  --spacing-q-${k}: var(--hf-${CATEGORY}-${k});`)

  lines.push('}', '')
  return lines.join('\n')
}
