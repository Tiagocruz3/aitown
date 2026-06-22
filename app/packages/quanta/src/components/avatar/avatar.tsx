'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Avatar as Primitive } from '@base-ui/react/avatar'
import { Dot, type DotColor, type DotSize } from '../dot/index.ts'
import { cx } from '../utils/cx.ts'

/**
 * Avatar — circular presence pinned to the Figma "Avatar" component
 * (node 1405:5456). Renders, in priority order, a photo, a custom fallback, or
 * mono-cased initials on a palette-coloured disk; an optional dashed variant is
 * the empty / "add" placeholder.
 *
 * Composable parts (every part is a replaceable node with a default):
 *   • `fallback` — the disk CONTENT slot (defaults to initials from `alt`); pass
 *     any node to override.
 *   • `badge` — the rim slot (defaults to the presence `<Dot>` derived from
 *     `status`); pass any node — a count `<Badge>`, a verified check, a custom
 *     `<Dot>` — to replace it. `status` stays as the convenience default.
 *   • `render` (via Base UI Avatar.Root) swaps the host element.
 */

export type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy'
export type AvatarColor =
  | 'neutral'
  | 'orange'
  | 'mint'
  | 'blue'
  | 'pink'
  | 'purple'
  | 'brown'
  | 'yellow'
export type AvatarVariant = 'filled' | 'dashed'

const SIZE_BOX = {
  '2xs': 'size-5', // 20px
  'xs': 'size-6', // 24px
  'sm': 'size-8', // 32px
  'md': 'size-10', // 40px
  'lg': 'size-12', // 48px
  'xl': 'size-14', // 56px
} satisfies Record<AvatarSize, string>

// Filled-disk initials ramp — pinned to the Figma "type=text" variants.
const SIZE_TEXT = {
  '2xs': 'text-q-mono-xs-semi-bold', // 10px
  'xs': 'text-q-mono-xs-semi-bold', // 10px
  'sm': 'text-q-mono-sm-semi-bold', // 12px
  'md': 'text-q-mono-lg-semi-bold', // 16px
  'lg': 'text-q-mono-lg-semi-bold', // 16px
  'xl': 'text-q-mono-lg-semi-bold', // 16px
} satisfies Record<AvatarSize, string>

// Dashed-placeholder ramp — Figma's "type=pending" variants use a distinct,
// smaller type scale than the filled disks (md 12 vs 16, lg 14 vs 16, etc.).
const SIZE_TEXT_DASHED = {
  '2xs': 'text-q-mono-xs-semi-bold', // 10px
  'xs': 'text-q-mono-sm-semi-bold', // 12px
  'sm': 'text-q-mono-sm-semi-bold', // 12px
  'md': 'text-q-mono-sm-semi-bold', // 12px
  'lg': 'text-q-mono-md-semi-bold', // 14px
  'xl': 'text-q-mono-lg-semi-bold', // 16px
} satisfies Record<AvatarSize, string>

// Pending ramp stroke weight — Figma uses thin (1px) below md, medium (1.5px) at md+.
const DASHED_THIN: Record<AvatarSize, boolean> = {
  '2xs': true,
  'xs': true,
  'sm': true,
  'md': false,
  'lg': false,
  'xl': false,
}

const COLOR_BG = {
  orange: 'bg-q-palette-orange-bg',
  mint: 'bg-q-palette-mint-bg',
  blue: 'bg-q-palette-blue-bg',
  pink: 'bg-q-palette-pink-bg',
  purple: 'bg-q-palette-purple-bg',
  brown: 'bg-q-palette-brown-bg',
  yellow: 'bg-q-brand-yellow',
  neutral: 'bg-q-background-elevated-start',
} satisfies Record<AvatarColor, string>

const COLOR_FG = {
  orange: 'text-q-text-primary',
  mint: 'text-q-palette-mint-text',
  blue: 'text-q-palette-blue-text',
  pink: 'text-q-text-primary',
  purple: 'text-q-text-primary',
  brown: 'text-q-palette-brown-text',
  yellow: 'text-q-text-inverse',
  neutral: 'text-q-text-primary',
} satisfies Record<AvatarColor, string>

/** Presence colour the Figma dot uses for each avatar status. */
const STATUS_DOT_COLOR = {
  online: 'green',
  away: 'yellow',
  busy: 'red',
  offline: 'grey',
} satisfies Record<AvatarStatus, DotColor>

/** Dot scale the design pairs with each avatar size. */
const STATUS_DOT_SIZE = {
  '2xs': 'xs',
  'xs': 'xs',
  'sm': 'sm',
  'md': 'md',
  'lg': 'md',
  'xl': 'md',
} satisfies Record<AvatarSize, DotSize>

const AUTO: AvatarColor[] = ['orange', 'mint', 'blue', 'pink', 'purple', 'brown', 'yellow']

type AvatarImageProps =
  Omit<ComponentProps<typeof Primitive.Image>, 'alt' | 'children' | 'className' | 'src'> & {
    className?: string
  }

export type AvatarProps = Omit<ComponentProps<typeof Primitive.Root>, 'children'> & {
  size?: AvatarSize
  src?: string
  alt?: string
  fallback?: ReactNode
  color?: AvatarColor
  status?: AvatarStatus
  /**
   * Rim slot. Defaults to the presence `<Dot>` for `status`; pass any node
   * (a `<Badge>`, a verified icon, a custom `<Dot>`) to replace it.
   */
  badge?: ReactNode
  variant?: AvatarVariant
  imageProps?: AvatarImageProps
}

export function Avatar({
  size = 'md',
  src,
  alt,
  fallback,
  color,
  status,
  badge,
  variant = 'filled',
  imageProps,
  className,
  ...props
}: AvatarProps) {
  const dashed = variant === 'dashed'
  const avatarColor: AvatarColor = color ?? (src ? 'neutral' : autoColor(alt))
  const {
    className: imageClassName,
    decoding = 'async',
    loading = 'lazy',
    ...restImageProps
  } = imageProps ?? {}

  return (
    <Primitive.Root
      className={state => cx(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-visible rounded-full',
        SIZE_BOX[size],
        (dashed ? SIZE_TEXT_DASHED : SIZE_TEXT)[size],
        dashed
          ? 'text-q-text-primary'
          : cx(COLOR_BG[avatarColor], COLOR_FG[avatarColor]),
        typeof className === 'function' ? className(state) : className,
      )}
      {...props}
    >
      {dashed
        ? (
            <svg className="q-avatar-dash absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden="true">
              <circle className={cx('q-avatar-dash-circle', DASHED_THIN[size] && 'q-avatar-dash-thin')} cx="50" cy="50" r="47" />
            </svg>
          )
        : null}

      {src && !dashed
        ? (
            <Primitive.Image
              src={src}
              alt={alt ?? ''}
              loading={loading}
              decoding={decoding}
              className={cx('pointer-events-none absolute inset-0 size-full rounded-full object-cover', imageClassName)}
              {...restImageProps}
            />
          )
        : null}

      <Primitive.Fallback className="flex size-full items-center justify-center overflow-hidden rounded-full">
        {fallback ?? initials(alt, size)}
      </Primitive.Fallback>

      {/* Rim slot: a custom `badge` wins; otherwise the default presence Dot. */}
      {badge != null
        ? <span className="q-avatar-status">{badge}</span>
        : status != null
          ? (
              <Dot
                label={status}
                color={STATUS_DOT_COLOR[status]}
                size={STATUS_DOT_SIZE[size]}
                className="q-avatar-status"
              />
            )
          : null}
    </Primitive.Root>
  )
}

function initials(name: string | undefined, size: AvatarSize): string {
  if (!name)
    return ''
  if (size === 'xs' || size === '2xs')
    return name.trim()[0]?.toUpperCase() ?? ''
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function autoColor(name?: string): AvatarColor {
  if (!name)
    return 'neutral'
  let h = 0
  for (let i = 0; i < name.length; i++)
    h = (Math.imul(h, 31) + name.charCodeAt(i)) >>> 0
  return AUTO[h % AUTO.length]
}
