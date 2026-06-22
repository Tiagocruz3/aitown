'use client'

import type { ComponentProps } from 'react'
import { cx } from '../utils/cx.ts'

/**
 * Dot — a presence / status indicator pinned to the Figma "Status Dot"
 * component (node 1418:94): a solid palette-coloured circle wrapped in a
 * translucent glass ring (with a backdrop blur) so it reads against any
 * surface. Standalone and generic — Avatar composes it for its presence badge,
 * but it is not avatar-specific.
 *
 * Figma ramp (size → fill diameter / ring width). The diameter is the colored
 * fill; the glass ring sits OUTSIDE it (box-content), so the rendered box is
 * fill + 2·ring:
 *   md → 8px fill / 2px ring (→ 12px)   sm → 6px / 1.5px (→ 9px)   xs → 4px / 1.5px (→ 7px)
 *
 * Optional decorative motion via `animation` (see DotAnimation) — colour-derived
 * and reduced-motion-safe.
 */

export type DotColor = 'green' | 'yellow' | 'red' | 'grey'
export type DotSize = 'md' | 'sm' | 'xs'
/**
 * Opt-in decorative motion (disabled under `prefers-reduced-motion`):
 *   pulse — radar-style rings ripple out of the dot (a live / online beacon)
 *   glow  — a soft coloured halo breathes around the dot
 */
export type DotAnimation = 'pulse' | 'glow'

const SIZE_CLASS = {
  md: 'size-2', // 8px
  sm: 'size-1.5', // 6px
  xs: 'size-1', // 4px
} satisfies Record<DotSize, string>

const RING = {
  md: 'border-q-thick', // 2px
  sm: 'border-q-medium', // 1.5px
  xs: 'border-q-medium', // 1.5px
} satisfies Record<DotSize, string>

const FILL = {
  green: 'bg-q-palette-mint-bg',
  yellow: 'bg-q-brand-yellow',
  red: 'bg-q-palette-pink-bg',
  grey: 'bg-q-icon-secondary',
} satisfies Record<DotColor, string>

/**
 * Sets `color` to the fill so the animations (which use `currentColor` for their
 * rings / halo) inherit the dot's colour. Applied only when animating.
 */
const INK = {
  green: 'text-q-palette-mint-bg',
  yellow: 'text-q-brand-yellow',
  red: 'text-q-palette-pink-bg',
  grey: 'text-q-icon-secondary',
} satisfies Record<DotColor, string>

const ANIMATION = {
  pulse: 'q-dot-pulse',
  glow: 'q-dot-glow',
} satisfies Record<DotAnimation, string>

export type DotProps = ComponentProps<'span'> & {
  color?: DotColor
  size?: DotSize
  /** Decorative motion — `pulse` (ripple rings) or `glow` (breathing halo). */
  animation?: DotAnimation
  /** Accessible name; when set the dot is exposed as `role="img"`, otherwise it is hidden. */
  label?: string
}

export function Dot({
  color = 'green',
  size = 'md',
  animation,
  label,
  className,
  role,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}: DotProps) {
  const accessibleLabel = ariaLabel ?? label

  return (
    <span
      role={role ?? (accessibleLabel ? 'img' : undefined)}
      aria-label={accessibleLabel}
      aria-hidden={ariaHidden ?? (accessibleLabel ? undefined : true)}
      className={cx(
        'q-dot box-content block shrink-0 rounded-full border-q-background-glass',
        SIZE_CLASS[size],
        RING[size],
        FILL[color],
        animation && ANIMATION[animation],
        animation && INK[color],
        className,
      )}
      {...props}
    />
  )
}
