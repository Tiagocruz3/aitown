'use client'

import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../utils/cx.ts'

/**
 * Divider — a presentational separator matching the Figma divider (node
 * 834:1556): an "etched" 2px stroke (1px darker line over 1px lighter line)
 * emulating the SVG with tokenized border colors. Renders a semantic `<hr>`;
 * when a label is supplied it switches to `<div role="separator">` with two
 * etched rules flanking the text (an `<hr>` cannot contain children).
 *
 * Usage:
 *   <Divider />                           // horizontal etched rule
 *   <Divider orientation="vertical" />    // self-stretches inside a flex row
 *   <Divider>or</Divider>                 // labelled — text-q-text-tertiary caption
 */

export type DividerOrientation = 'horizontal' | 'vertical'

export type DividerProps = Omit<ComponentProps<'hr'>, 'children'> & {
  orientation?: DividerOrientation
  /** Optional inline label rendered between two rules (horizontal only). */
  children?: ReactNode
}

export function Divider({
  orientation = 'horizontal',
  className,
  children,
  ...props
}: DividerProps) {
  // Labelled — needs to contain text, so we can't use <hr>.
  if (children != null && orientation === 'horizontal') {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cx('flex w-full items-center gap-2 align-middle', className)}
        {...(props as ComponentProps<'div'>)}
      >
        <span className="q-divider h-0 flex-1" aria-hidden />
        <span className="text-q-text-tertiary text-q-caption-sm-medium">{children}</span>
        <span className="q-divider h-0 flex-1" aria-hidden />
      </div>
    )
  }

  if (orientation === 'vertical') {
    return (
      <hr
        aria-orientation="vertical"
        className={cx('q-divider-vertical m-0 inline-block h-auto w-0 self-stretch', className)}
        {...props}
      />
    )
  }

  return (
    <hr
      className={cx('q-divider m-0 block w-full', className)}
      {...props}
    />
  )
}
