/**
 * Typography emitter — three pure functions: ParsedTokens → CSS string.
 *
 *   primitivesTypography → primitives/typography.css
 *     :root {
 *       --hf-type-family-{primary,secondary,mono}-base   raw Figma strings (no fallback)
 *       --hf-type-weight-*                                atomic numbers
 *       --hf-type-letter-spacing-*                        atomic rem values
 *     }
 *
 *   themeTypography → theme/typography.css
 *     :where(:root) {
 *       --hf-type-family-*           base + fallback stack (opinionated resolution)
 *       --hf-type-size-*             mobile-baseline values (rem)
 *       --hf-type-line-height-*      mobile-baseline values (rem)
 *     }
 *     @media (min-width: <tablet>px)  { :where(:root) { sizes/line-heights that differ } }
 *     @media (min-width: <desktop>px) { :where(:root) { sizes/line-heights that differ } }
 *
 *   tailwindTypography → tailwind/typography.css
 *     @utility text-{role}-{size}-{weight} { five properties referencing
 *                                            primitives + theme vars }
 *
 * Units: font-size, line-height, letter-spacing are all emitted in `rem`
 * (uniform with the spacing category, accessibility-friendly, matches
 * Tailwind v4 convention). Upstream stores raw px-equivalent numbers;
 * emitter divides by 16.
 *
 * Layer split rationale: primitives holds context-free atomic data.
 * Viewport-axis (@media) and family-fallback (opinion) are contextual
 * resolutions — they live in theme. See typography-design.md.
 */

import type { ParsedTokens, ResponsiveSize, TypographyPrimitives, TypographyRole } from '../types.ts'
import { HEADER, rem, sortedKeys } from './shared.ts'

const CATEGORY = 'type'

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

const FAMILY_FALLBACK: Record<string, string> = {
  primary: 'system-ui, sans-serif',
  secondary: 'system-ui, sans-serif',
  mono: 'ui-monospace, monospace',
}

function hfVar(suffix: string): string {
  return `--hf-${CATEGORY}-${suffix}`
}

// ────────────────────────────────────────────────────────────────────
// Public emitters
// ────────────────────────────────────────────────────────────────────

export function primitivesTypography(tokens: ParsedTokens): string {
  const { primitives } = tokens.typography
  const lines: string[] = [HEADER, ':root {']

  // family base — raw Figma strings, no fallback
  for (const k of sortedKeys(primitives.family))
    lines.push(`  ${hfVar(`family-${k}-base`)}: "${primitives.family[k]}";`)
  lines.push('')

  // weight — atomic numbers
  for (const k of sortedKeys(primitives.weight))
    lines.push(`  ${hfVar(`weight-${k}`)}: ${primitives.weight[k]};`)
  lines.push('')

  // letter-spacing — atomic rem values
  for (const k of sortedKeys(primitives.letterSpacing))
    lines.push(`  ${hfVar(`letter-spacing-${k}`)}: ${rem(primitives.letterSpacing[k])};`)

  lines.push('}', '')

  return lines.join('\n')
}

export function themeTypography(tokens: ParsedTokens): string {
  const { primitives } = tokens.typography
  const { breakpoints } = tokens
  const lines: string[] = [HEADER, ':where(:root) {']

  // family with fallback stack — opinion lives here
  for (const k of sortedKeys(primitives.family)) {
    const fallback = FAMILY_FALLBACK[k] ?? 'sans-serif'
    lines.push(`  ${hfVar(`family-${k}`)}: var(${hfVar(`family-${k}-base`)}), ${fallback};`)
  }
  lines.push('')

  // size — mobile baseline (rem)
  for (const k of sortedKeys(primitives.size))
    lines.push(`  ${hfVar(`size-${k}`)}: ${rem(primitives.size[k].mobile)};`)
  lines.push('')

  // line-height — mobile baseline (rem)
  for (const k of sortedKeys(primitives.lineHeight))
    lines.push(`  ${hfVar(`line-height-${k}`)}: ${rem(primitives.lineHeight[k].mobile)};`)

  lines.push('}', '')

  // tablet @media — only where tablet ≠ mobile
  const tabletBlock = emitMediaOverrides(primitives, breakpoints.tablet, 'tablet', 'mobile')
  if (tabletBlock)
    lines.push(tabletBlock)

  // desktop @media — only where desktop ≠ tablet
  const desktopBlock = emitMediaOverrides(primitives, breakpoints.desktop, 'desktop', 'tablet')
  if (desktopBlock)
    lines.push(desktopBlock)

  return lines.join('\n')
}

function emitMediaOverrides(
  primitives: TypographyPrimitives,
  minPx: number,
  to: keyof ResponsiveSize,
  from: keyof ResponsiveSize,
): string {
  const block: string[] = []

  function collect(field: 'size' | 'lineHeight', prefix: string): void {
    const map = primitives[field]
    for (const k of sortedKeys(map)) {
      const v = map[k]
      if (v[to] !== v[from])
        block.push(`    ${hfVar(`${prefix}-${k}`)}: ${rem(v[to])};`)
    }
  }

  collect('size', 'size')
  collect('lineHeight', 'line-height')

  if (block.length === 0)
    return ''

  return [
    `@media (min-width: ${minPx}px) {`,
    '  :where(:root) {',
    ...block,
    '  }',
    '}',
    '',
  ].join('\n')
}

export function tailwindTypography(tokens: ParsedTokens): string {
  const { roles } = tokens.typography.semantic
  const sorted = [...roles].sort(compareRoles)
  const lines: string[] = [HEADER]

  for (const r of sorted) {
    const cls = `text-q-${r.role}-${r.size}-${r.weight}`
    const c = r.composite
    lines.push(
      `@utility ${cls} {`,
      `  font-family:    var(${hfVar(`family-${c.family}`)});`,
      `  font-size:      var(${hfVar(`size-${c.size}`)});`,
      `  font-weight:    var(${hfVar(`weight-${c.weight}`)});`,
      `  line-height:    var(${hfVar(`line-height-${c.lineHeight}`)});`,
      `  letter-spacing: var(${hfVar(`letter-spacing-${c.letterSpacing}`)});`,
      '}',
      '',
    )
  }

  return lines.join('\n')
}

function compareRoles(a: TypographyRole, b: TypographyRole): number {
  return cmp(a.role, b.role) || cmp(a.size, b.size) || cmp(a.weight, b.weight)
}

function cmp(a: string, b: string): number {
  if (a < b)
    return -1
  if (a > b)
    return 1
  return 0
}
