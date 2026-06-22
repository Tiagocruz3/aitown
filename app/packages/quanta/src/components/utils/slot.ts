import type { CSSProperties } from 'react'

/**
 * The slot color system's TS half (the CSS half is src/css/tailwind/slot.css).
 *
 * A component takes a single semantic `color` prop and spreads `slotStyle(color)`
 * inline, which sets the private `--_c*` custom properties. The `q-slot-*`
 * utilities then derive every surface from them.
 *
 * CONTRACT: every value references an `--hf-color-*` runtime primitive (emitted
 * per data-theme in src/css/theme/color.css), so light/dark is automatic. NEVER
 * use a `--color-q-*` name here — those are @theme inline-only and have no
 * runtime value, so the slot would render unstyled.
 *
 * Resilience: each saturated `--_c` carries a nested var() fallback to
 * `brand-primary` (always set by managed themes, the documented default) so a
 * partial `defineTheme()` override degrades gracefully instead of rendering
 * transparent. See quanta-core-plan.md §5.4 / §5.4.1.
 */

export type SlotColor = 'brand' | 'neutral' | 'success' | 'error' | 'warning' | 'info'

/** Guaranteed-present token used as the universal degrade target. */
const FALLBACK = 'var(--hf-color-brand-primary)'

type SlotVars = {
  '--_c': string
  '--_c-fg': string
  /** Only set when it must differ from `--_c` (the utility defaults it to `--_c`). */
  '--_c-bg'?: string
  /** Only set when it must differ from `--_c` (the utility defaults it to `--_c`). */
  '--_c-border'?: string
}

/** color → the four `--_c*` properties (all sourced from `--hf-color-*`). */
export const SLOT: Record<SlotColor, SlotVars> = {
  brand: {
    '--_c': 'var(--hf-color-brand-primary)',
    '--_c-fg': 'var(--hf-color-text-inverse)',
  },
  neutral: {
    '--_c': `var(--hf-color-text-primary, ${FALLBACK})`,
    '--_c-bg': `var(--hf-color-background-secondary-strong, ${FALLBACK})`,
    '--_c-fg': 'var(--hf-color-text-primary)',
    '--_c-border': `var(--hf-color-border-strong, ${FALLBACK})`,
  },
  success: {
    '--_c': `var(--hf-color-state-success-fg, ${FALLBACK})`,
    '--_c-fg': 'var(--hf-color-text-inverse)',
  },
  error: {
    '--_c': `var(--hf-color-state-error-fg, ${FALLBACK})`,
    '--_c-fg': 'var(--hf-color-text-inverse)',
  },
  warning: {
    '--_c': `var(--hf-color-state-warning-fg, ${FALLBACK})`,
    '--_c-fg': 'var(--hf-color-text-inverse)',
  },
  info: {
    '--_c': `var(--hf-color-state-info-fg, ${FALLBACK})`,
    '--_c-fg': 'var(--hf-color-text-inverse)',
  },
}

/**
 * Inline style object that wires a `color` prop into the slot custom properties.
 * Spread it into a component's `style`, then style surfaces with `q-slot-*`.
 *
 *   style={{ ...slotStyle(color), ...style }}
 */
export function slotStyle(color: SlotColor): CSSProperties {
  return SLOT[color] as CSSProperties
}
