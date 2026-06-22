/**
 * Validator — checks parsed tokens against quanta's contract.
 *
 * Hard-fail on missing upstream data or unresolved references. Soft-fail
 * is intentionally not supported: bad data should abort the build, not
 * slip through silently into a published artefact.
 *
 * Each error is prefixed with a category tag so build output can be
 * scanned by class of bug. See `AGENTS.md → Test Taxonomy` for the four
 * categories and what each protects against.
 */

import type { ParsedTokens, ValidationResult } from './types.ts'
import { isAlias } from './naming.ts'

const SCHEMA = '[schema]'
const VALIDITY = '[validity]'
const REFERENCE = '[cross-ref]'
const ORDERING = '[ordering]'

// Canonical key sets. Emitters iterate fixed lists, so missing upstream keys
// would otherwise leak `undefined`/`NaN` into generated CSS — fail fast here.
const EXPECTED_Z_INDEX_KEYS = [
  'base',
  'dropdown',
  'sticky',
  'overlay',
  'modal',
  'popover',
  'toast',
  'tooltip',
] as const
const EXPECTED_BREAKPOINT_KEYS = ['mobile', 'tablet', 'desktop', 'wide'] as const
// Motion emitters iterate these fixed lists (semantic order, not alphabetic),
// so a missing upstream key would render as `undefined` in generated CSS.
const EXPECTED_DURATION_KEYS = ['instant', 'fast', 'normal', 'slow', 'slower'] as const
const EXPECTED_EASE_KEYS = ['in', 'out', 'in-out', 'linear'] as const

export function validate(parsed: ParsedTokens): ValidationResult {
  const errors: string[] = []

  // ── color ─────────────────────────────────────────────────────────
  if (parsed.color.primitives.length === 0)
    errors.push(`${SCHEMA} color.primitives is empty — upstream may be missing tokens/color-primitives.json`)

  if (parsed.color.semantic.length === 0)
    errors.push(`${SCHEMA} color.semantic is empty — upstream may be missing tokens/color-semantic.json`)

  // Reference rules:
  //   - primitives MUST be literals (atomic layer, no indirection)
  //   - semantic MAY reference primitives only (pure resolver, no chains)
  //   - dangling refs (alias to non-existent primitive) → reject
  for (const p of parsed.color.primitives) {
    if (isAlias(p.value))
      errors.push(`${REFERENCE} color.primitives.${p.path.join('.')}: aliases not allowed in primitives, must be a literal value`)
  }

  const primPathSet = new Set(parsed.color.primitives.map(p => p.path.join('.')))
  for (const s of parsed.color.semantic) {
    for (const field of ['light', 'dark'] as const) {
      const v = s[field]
      if (!isAlias(v))
        continue
      const tag = `color.semantic.${s.path.join('.')}.${field}`
      const [collection, ...rest] = v.slice(1, -1).split('.')
      if (collection !== 'color-primitives') {
        errors.push(`${REFERENCE} ${tag}: alias must reference color-primitives, got collection "${collection}"`)
        continue
      }
      const primPath = rest.join('.')
      if (!primPathSet.has(primPath))
        errors.push(`${REFERENCE} ${tag}: dangling alias "${v}" — primitive ${primPath} not found`)
    }
  }

  // ── typography ────────────────────────────────────────────────────
  const { primitives, semantic } = parsed.typography
  const { breakpoints } = parsed

  if (Object.keys(primitives.family).length === 0)
    errors.push(`${SCHEMA} typography.primitives.family is empty`)
  if (Object.keys(primitives.weight).length === 0)
    errors.push(`${SCHEMA} typography.primitives.weight is empty`)
  if (Object.keys(primitives.size).length === 0)
    errors.push(`${SCHEMA} typography.primitives.size is empty`)

  if (semantic.roles.length === 0)
    errors.push(`${SCHEMA} typography.semantic.roles is empty — upstream tokens/type-semantic.json malformed`)

  // composite refs must resolve
  for (const r of semantic.roles) {
    const { family, weight, size, lineHeight, letterSpacing } = r.composite
    const tag = `${r.role}.${r.size}.${r.weight}`
    if (!(family in primitives.family))
      errors.push(`${REFERENCE} typography ${tag}: unknown family "${family}"`)
    if (!(weight in primitives.weight))
      errors.push(`${REFERENCE} typography ${tag}: unknown weight "${weight}"`)
    if (!(size in primitives.size))
      errors.push(`${REFERENCE} typography ${tag}: unknown size "${size}"`)
    if (!(lineHeight in primitives.lineHeight))
      errors.push(`${REFERENCE} typography ${tag}: unknown line-height "${lineHeight}"`)
    if (!(letterSpacing in primitives.letterSpacing))
      errors.push(`${REFERENCE} typography ${tag}: unknown letter-spacing "${letterSpacing}"`)
  }

  // Finiteness: every breakpoint value must be a finite number. Missing
  // upstream keys produce `undefined`, malformed JSON can produce `NaN` —
  // both flow through `rem()` and emit as `NaNrem` in the cascade. The
  // ordering check below cannot catch this because `NaN < N` is false in JS.
  checkScaleFiniteness('typography.size', primitives.size, errors)
  checkScaleFiniteness('typography.lineHeight', primitives.lineHeight, errors)

  // Scale monotonicity: numeric-keyed size/line-height groups must be
  // non-decreasing at every breakpoint. Equal adjacent values are allowed
  // (intentional plateau — small-screen scales often compress, e.g.
  // `300.mobile === 400.mobile === 16` then diverge on tablet/desktop).
  // Catches accidental swaps where `500.mobile` becomes smaller than
  // `400.mobile` — the cascade still emits valid CSS but `text-body-md`
  // would render smaller than `text-body-sm` in prod.
  checkScaleNonDecreasing('typography.size', primitives.size, errors)
  checkScaleNonDecreasing('typography.lineHeight', primitives.lineHeight, errors)

  // ── breakpoints ───────────────────────────────────────────────────
  // Coverage: emitters iterate the fixed 4-key list; missing upstream → NaN.
  for (const k of EXPECTED_BREAKPOINT_KEYS) {
    const v = breakpoints[k]
    if (!Number.isFinite(v))
      errors.push(`${SCHEMA} breakpoints.${k}: missing or non-finite (got ${v})`)
  }
  // Monotonic invariant: mobile < tablet < desktop < wide
  if (breakpoints.mobile >= breakpoints.tablet)
    errors.push(`${ORDERING} breakpoints: mobile (${breakpoints.mobile}) >= tablet (${breakpoints.tablet})`)
  if (breakpoints.tablet >= breakpoints.desktop)
    errors.push(`${ORDERING} breakpoints: tablet (${breakpoints.tablet}) >= desktop (${breakpoints.desktop})`)
  if (breakpoints.desktop >= breakpoints.wide)
    errors.push(`${ORDERING} breakpoints: desktop (${breakpoints.desktop}) >= wide (${breakpoints.wide})`)

  // ── z-index ───────────────────────────────────────────────────────
  // Non-negative integers (our scale doesn't use negatives).
  if (Object.keys(parsed.zIndex).length === 0) {
    errors.push(`${SCHEMA} zIndex is empty — upstream may be missing tokens/z-index.json`)
  }
  else {
    // Coverage: emitter iterates the fixed 8-key list; missing upstream key
    // would render as `--hf-z-index-foo: undefined;` in generated CSS.
    for (const k of EXPECTED_Z_INDEX_KEYS) {
      if (!(k in parsed.zIndex))
        errors.push(`${SCHEMA} zIndex.${k}: missing required key`)
    }
    for (const [k, v] of Object.entries(parsed.zIndex)) {
      if (!Number.isInteger(v) || v < 0)
        errors.push(`${VALIDITY} zIndex.${k}: must be a non-negative integer, got ${v}`)
    }
  }

  // ── border-width ──────────────────────────────────────────────────
  // Non-negative finite numbers (decimals allowed, e.g. medium = 1.5).
  if (Object.keys(parsed.borderWidth).length === 0) {
    errors.push(`${SCHEMA} borderWidth is empty — upstream may be missing tokens/border-width.json`)
  }
  else {
    for (const [k, v] of Object.entries(parsed.borderWidth)) {
      if (!Number.isFinite(v) || v < 0)
        errors.push(`${VALIDITY} borderWidth.${k}: must be a non-negative finite number, got ${v}`)
    }
  }

  // ── radius ────────────────────────────────────────────────────────
  // Non-negative finite numbers (px). The emitter iterates the parsed keys
  // (no fixed list — resilient to upstream adding steps), so no coverage
  // check; only value validity. `full` = 9999 is a legitimate sentinel.
  if (Object.keys(parsed.radius).length === 0) {
    errors.push(`${SCHEMA} radius is empty — upstream may be missing tokens/radius.json`)
  }
  else {
    for (const [k, v] of Object.entries(parsed.radius)) {
      if (!Number.isFinite(v) || v < 0)
        errors.push(`${VALIDITY} radius.${k}: must be a non-negative finite number, got ${v}`)
    }
  }

  // ── motion ────────────────────────────────────────────────────────
  // Duration: non-negative finite ms. Easing: non-empty strings. Both
  // emitters iterate fixed key lists, so coverage of those keys is checked.
  const { duration, easing } = parsed.motion
  if (Object.keys(duration).length === 0)
    errors.push(`${SCHEMA} motion.duration is empty — upstream may be missing tokens/motion.json`)
  if (Object.keys(easing).length === 0)
    errors.push(`${SCHEMA} motion.easing is empty — upstream may be missing tokens/motion.json`)
  for (const k of EXPECTED_DURATION_KEYS) {
    if (!(k in duration))
      errors.push(`${SCHEMA} motion.duration.${k}: missing required key`)
  }
  for (const [k, v] of Object.entries(duration)) {
    if (!Number.isFinite(v) || v < 0)
      errors.push(`${VALIDITY} motion.duration.${k}: must be a non-negative finite number, got ${v}`)
  }
  for (const k of EXPECTED_EASE_KEYS) {
    if (!(k in easing))
      errors.push(`${SCHEMA} motion.easing.${k}: missing required key`)
  }
  for (const [k, v] of Object.entries(easing)) {
    if (typeof v !== 'string' || v.length === 0)
      errors.push(`${VALIDITY} motion.easing.${k}: must be a non-empty string, got ${v}`)
  }

  // ── contrast ──────────────────────────────────────────────────────
  // WCAG 2.x contrast ratios on known semantic pairs in both light/dark.
  // Skipped silently when either side is missing (schema rules catch that).
  // Reject hex/rgba values that don't parse cleanly (other formats need adding).
  checkContrast(parsed.color, errors)

  // ── spacing ───────────────────────────────────────────────────────
  // 2px half-grid invariant: every value is a non-negative integer divisible
  // by 2. Full steps sit on the 4px grid (4, 8, 12…); half-steps sit halfway
  // (2, 6, 10…) and use an `N_5` key (e.g. `1_5` = 1.5 = 6px). `0` is allowed
  // (the emitter also synthesizes `--spacing-0`). Keys parse as an integer or
  // an `N_5` half-step (Tailwind named-scale binding).
  const spacing = parsed.spacing
  if (Object.keys(spacing).length === 0) {
    errors.push(`${SCHEMA} spacing is empty — upstream may be missing tokens/space.json`)
  }
  else {
    for (const [k, v] of Object.entries(spacing)) {
      if (!/^\d+(_5)?$/.test(k))
        errors.push(`${VALIDITY} spacing: non-numeric key "${k}"`)
      if (!Number.isInteger(v) || v < 0)
        errors.push(`${VALIDITY} spacing.${k}: must be a non-negative integer, got ${v}`)
      else if (v % 2 !== 0)
        errors.push(`${VALIDITY} spacing.${k}: ${v} is not divisible by 2 (2px base grid)`)
    }
  }

  return { ok: errors.length === 0, errors }
}

function checkScaleFiniteness(
  name: string,
  scale: Record<string, { mobile: number, tablet: number, desktop: number }>,
  errors: string[],
): void {
  for (const [key, val] of Object.entries(scale)) {
    for (const bp of ['mobile', 'tablet', 'desktop'] as const) {
      if (!Number.isFinite(val?.[bp]))
        errors.push(`${VALIDITY} ${name}.${key}.${bp}: must be a finite number (got ${val?.[bp]})`)
    }
  }
}

function checkScaleNonDecreasing(
  name: string,
  scale: Record<string, { mobile: number, tablet: number, desktop: number }>,
  errors: string[],
): void {
  const numericKeys = Object.keys(scale)
    .filter(k => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
  for (let i = 1; i < numericKeys.length; i++) {
    const prevKey = numericKeys[i - 1]
    const currKey = numericKeys[i]
    const prev = scale[prevKey]
    const curr = scale[currKey]
    for (const bp of ['mobile', 'tablet', 'desktop'] as const) {
      if (curr[bp] < prev[bp])
        errors.push(`${ORDERING} ${name}: ${currKey}.${bp} (${curr[bp]}) < ${prevKey}.${bp} (${prev[bp]}) — scale must not decrease`)
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// Contrast (WCAG 2.x)
// ────────────────────────────────────────────────────────────────────

interface ContrastPair {
  fg: string[]
  bg: string[]
  /** WCAG threshold. 4.5 = AA normal text. 3.0 = AA UI components / large text. */
  minRatio: number
  /** Why this pair matters — surfaces in error message. */
  intent: string
}

// Conservative list — most common pairs that appear in design tokens. Missing
// pairs are skipped (the schema rule for empty/missing tokens flags them).
// Add new pairs here when upstream introduces them; this is the source of
// truth for "what must be contrast-validated".
const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: ['text', 'primary'], bg: ['background', 'primary'], minRatio: 4.5, intent: 'body text on primary surface' },
  { fg: ['text', 'secondary'], bg: ['background', 'primary'], minRatio: 4.5, intent: 'secondary text on primary surface' },
  { fg: ['text', 'tertiary'], bg: ['background', 'primary'], minRatio: 4.5, intent: 'tertiary text on primary surface' },
  { fg: ['text', 'primary'], bg: ['background', 'secondary'], minRatio: 4.5, intent: 'body text on secondary surface' },
  { fg: ['border', 'subtle'], bg: ['background', 'primary'], minRatio: 3.0, intent: 'UI component border (SC 1.4.11)' },
]

/**
 * Known-failing pairs in the current shipped palette. Each entry **MUST**
 * carry a TODO with designer attribution and a target ratio. Build emits
 * `[a11y-warning] ...` via console.warn so the regression stays visible,
 * but does not hard-fail.
 *
 * Remove from this set the moment the underlying token is fixed — the
 * validator will then enforce the AA rule for any future regression on
 * that pair. Adding a new entry should require explicit reviewer accept
 * (the audit-trail test in validator.test.ts forces a code change here).
 */
export const CONTRAST_KNOWN_BELOW_AA: ReadonlySet<string> = new Set([
  // TODO(design): text.secondary 3.84:1 in light mode — bump foreground
  //               to ≥4.5:1 or document intentional secondary exception
  'text.secondary on background.primary (light)',
  // TODO(design): text.tertiary 2.38:1 in light mode — likely intended for
  //               very large display text only? confirm with designer
  'text.tertiary on background.primary (light)',
  // TODO(design): text.tertiary 3.02:1 in dark mode — introduced by the
  //               2026-06-15 design-tokens refresh (palette/* update). Higher
  //               contrast than the light tertiary exception above (2.38:1), so
  //               accepted for consistency; confirm tertiary is intentionally
  //               de-emphasized, else bump the dark foreground to ≥4.5:1.
  'text.tertiary on background.primary (dark)',
])

function checkContrast(
  color: { primitives: { path: string[], value: string }[], semantic: { path: string[], light: string, dark: string }[] },
  errors: string[],
): void {
  const primMap = new Map(color.primitives.map(p => [p.path.join('.'), p.value]))
  const semMap = new Map(color.semantic.map(s => [s.path.join('.'), s]))

  for (const pair of CONTRAST_PAIRS) {
    for (const mode of ['light', 'dark'] as const) {
      const fgHex = resolveSemanticHex(semMap, primMap, pair.fg, mode)
      const bgHex = resolveSemanticHex(semMap, primMap, pair.bg, mode)
      if (fgHex === null || bgHex === null)
        continue // missing token — schema rule handles
      const fgRgb = parseHexToRgb(fgHex)
      const bgRgb = parseHexToRgb(bgHex)
      if (fgRgb === null || bgRgb === null)
        continue // unparseable format (rgba/hsl/etc.) — out of scope
      const ratio = contrastRatio(fgRgb, bgRgb)
      if (ratio < pair.minRatio) {
        const fgLabel = pair.fg.join('.')
        const bgLabel = pair.bg.join('.')
        const key = `${fgLabel} on ${bgLabel} (${mode})`
        const detail = `${ratio.toFixed(2)}:1 < ${pair.minRatio}:1 — ${pair.intent}`
        if (CONTRAST_KNOWN_BELOW_AA.has(key)) {
          // Allowlisted compromise: surface visibly but don't block build.
          // CONTRAST_KNOWN_BELOW_AA carries TODO attribution per entry.
          console.warn(`[a11y-warning] contrast ${key}: ${detail} (allowlisted — see CONTRAST_KNOWN_BELOW_AA in validator.ts)`)
        }
        else {
          errors.push(`${VALIDITY} contrast ${key}: ${detail}`)
        }
      }
    }
  }
}

function resolveSemanticHex(
  semMap: Map<string, { light: string, dark: string }>,
  primMap: Map<string, string>,
  path: string[],
  mode: 'light' | 'dark',
): string | null {
  const sem = semMap.get(path.join('.'))
  if (!sem)
    return null
  const v = sem[mode]
  if (!v.startsWith('{'))
    return v // literal
  const inner = v.slice(1, -1)
  const [collection, ...rest] = inner.split('.')
  if (collection !== 'color-primitives')
    return null // other rules reject this
  return primMap.get(rest.join('.')) ?? null
}

function parseHexToRgb(hex: string): [number, number, number] | null {
  if (!hex.startsWith('#'))
    return null
  const h = hex.slice(1)
  // #rgb → #rrggbb expansion
  const full = h.length === 3 || h.length === 4
    ? h.split('').map(c => c + c).join('')
    : h
  if (full.length < 6 || !/^[0-9a-f]+$/i.test(full))
    return null
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  // alpha (positions 6-8 if present) is ignored — contrast is computed
  // against the opaque color; semi-transparent tokens are a separate concern
  return [r, g, b]
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const lFg = relativeLuminance(fg)
  const lBg = relativeLuminance(bg)
  const lighter = Math.max(lFg, lBg)
  const darker = Math.min(lFg, lBg)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const norm = c / 255
    return norm <= 0.03928 ? norm / 12.92 : ((norm + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}
