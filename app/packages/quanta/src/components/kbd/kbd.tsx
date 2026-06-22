'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Children } from 'react'
import { cx } from '../utils/cx.ts'

/**
 * Kbd — a keyboard-shortcut pill, pinned to the Figma `_Shortcut` (node
 * 1157:4028): a single 20px-tall chip holding optional ⌘ / ⇧ glyphs and the
 * key, on a translucent white-5% surface with a subtle hairline.
 *
 *   h 20 · px 4 · gap 2 · radius 4 · caption-sm-medium 12 · text-primary
 *   surface transparent/dark/05 (white-5%) · border border/subtle
 *
 * Figma ships ONE size — there are no size variants. Compose a combo inside one
 * pill (`<Kbd>⌘ K</Kbd>`), or use `KbdSequence` for separate keys joined by a
 * separator. Tokens only: surface `bg-q-overlay-hover` (the theme-adaptive
 * white-5% / black-5% mirror of Figma's `transparent/dark/05`), border the
 * nearest token to Figma's 0.5px (`border-q-thin border-q-border-subtle`),
 * radius `rounded-q-100`, type `text-q-caption-sm-medium`.
 */

export type KbdProps = ComponentProps<'kbd'>

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cx(
        'inline-flex h-5 shrink-0 items-center justify-center gap-0.5 rounded-q-100 px-1 align-middle',
        'border-q-thin border-q-border-subtle bg-q-overlay-hover text-q-text-primary text-q-caption-sm-medium',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

/**
 * KbdSequence — lays out several keys, joined by a separator (default "+").
 * Pass a `keys` array (strings wrap in `<Kbd>`, nodes pass through) or `<Kbd>`
 * children. The separator is aria-hidden so the `<kbd>` semantics stay clean.
 */

export type KbdSequenceProps = Omit<ComponentProps<'span'>, 'children'> & {
  /** Separator rendered between keys. Default "+". Set to null to omit. */
  separator?: ReactNode
  /** Keys to render. Strings are wrapped in `<Kbd>`; ReactNodes pass through. */
  keys?: ReactNode[]
  children?: ReactNode
}

export function KbdSequence({
  separator = '+',
  keys,
  className,
  children,
  ...props
}: KbdSequenceProps) {
  const items: ReactNode[] = keys
    ? keys.map((k, i) =>
        typeof k === 'string' || typeof k === 'number'
          ? <Kbd key={i}>{k}</Kbd>
          : k,
      )
    : Children.toArray(children)

  return (
    <span
      className={cx('inline-flex items-center gap-1 align-middle', className)}
      {...props}
    >
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {item}
          {separator != null && i < items.length - 1
            ? (
                <span aria-hidden className="text-q-text-tertiary text-q-caption-sm-regular">
                  {separator}
                </span>
              )
            : null}
        </span>
      ))}
    </span>
  )
}
