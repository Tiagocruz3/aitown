/**
 * Breakpoint emitter — two pure functions: ParsedTokens → CSS string.
 *
 *   primitivesBreakpoint → primitives/breakpoint.css
 *     :root {
 *       --hf-breakpoint-mobile/tablet/desktop/wide   atomic rem values
 *     }
 *
 *   tailwindBreakpoint → tailwind/breakpoint.css
 *     @theme {
 *       --breakpoint-tablet/desktop/wide: <literal rem>
 *     }
 *
 * Why literal rem in tailwindBreakpoint (NOT `var(--hf-breakpoint-*)`):
 * Tailwind v4 reads `--breakpoint-*` from @theme to synthesize responsive
 * variants (`tablet:`, `desktop:`, `wide:`), emitting them as
 * `@media (width >= <value>) { ... }`. CSS spec disallows `var()` inside
 * `@media` feature values — using a var ref produces
 * `@media (width >= var(--hf-breakpoint-tablet))`, which browsers ignore
 * (the variant silently never activates). Substituting the literal at
 * codegen time is the only working path. The same constraint forces
 * theme/typography.css to hardcode `768px` / `1280px` from breakpoint.json.
 *
 * The `--hf-breakpoint-*` primitives stay available for JS reads and
 * non-Tailwind CSS use; only the Tailwind variant binding loses the
 * var-chain (by CSS necessity, not by choice).
 *
 * Why no theme layer: same logic as spacing — breakpoints have no axis
 * to resolve today (single `global` mode upstream). If brand-specific
 * breakpoints ship later, theme/breakpoint.css slots in non-breakingly.
 *
 * Why skip `mobile` in Tailwind: `mobile = 320px` → @media (min-width: 20rem)
 * is always-on (every supported device exceeds 320px). A `mobile:` variant
 * is redundant with the unprefixed utility. Mobile remains the implicit
 * mobile-first baseline; `--hf-breakpoint-mobile` stays in primitives for
 * documentation / JS reads.
 *
 * See breakpoint-design.md.
 */

import type { ParsedTokens } from '../types.ts'
import { HEADER, rem } from './shared.ts'

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

/** Ordered list of breakpoint names — drives stable output. */
const ALL_BREAKPOINTS = ['mobile', 'tablet', 'desktop', 'wide'] as const

/** Names exposed to Tailwind as responsive variants. `mobile` is always-on → skipped. */
const TAILWIND_BREAKPOINTS = ['tablet', 'desktop', 'wide'] as const

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesBreakpoint(tokens: ParsedTokens): string {
  const { breakpoints } = tokens
  const lines: string[] = [HEADER, ':root {']

  for (const name of ALL_BREAKPOINTS)
    lines.push(`  --hf-breakpoint-${name}: ${rem(breakpoints[name])};`)

  lines.push('}', '')
  return lines.join('\n')
}

export function tailwindBreakpoint(tokens: ParsedTokens): string {
  const { breakpoints } = tokens
  const lines: string[] = [HEADER, '@theme {']

  // q-prefixed → variants `q-tablet:`/`q-desktop:`/`q-wide:`. quanta shares one
  // Tailwind build with the host + legacy @higgsfield/ui; the `q-` keeps these
  // additive and prevents an unprefixed `--breakpoint-*` from landing in the
  // shared namespace (and from name-clashing a host breakpoint). The host's
  // default `sm/md/lg/xl/2xl` stay untouched. Literal rem (not var) is required:
  // `var()` is illegal inside `@media` feature values.
  for (const name of TAILWIND_BREAKPOINTS)
    lines.push(`  --breakpoint-q-${name}: ${rem(breakpoints[name])};`)

  lines.push('}', '')
  return lines.join('\n')
}
