'use client'

import type { ComponentProps, ReactNode, SVGProps } from 'react'
import { Checkbox as Primitive } from '@base-ui/react/checkbox'
import type { ClassValue } from '../utils/cx.ts'
import { cx } from '../utils/cx.ts'

/**
 * Glyphs traced 1:1 from the Figma checkbox vectors (node 481:795):
 * 20×20 viewBox, 2px stroke, round caps/joins, currentColor.
 */
function CheckGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 10.6 8.6 13.2 14.4 7.2" />
    </svg>
  )
}

function MinusGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 10h6" />
    </svg>
  )
}

export type CheckboxSize = 'sm' | 'md' | 'lg'
// Figma node 481:795 ships exactly two colors: brand (lime) and white.
export type CheckboxColor = 'brand' | 'white'
export type CheckboxLabelDirection = 'left' | 'right'
export type CheckboxLabelSize = 'sm' | 'md'

export interface CheckboxOptions {
  color?: CheckboxColor
  size?: CheckboxSize
}

const COLOR_CLASS = {
  brand: 'q-checkbox-brand',
  white: 'q-checkbox-white',
} satisfies Record<CheckboxColor, string>

const SIZE_CLASS = {
  sm: 'q-checkbox-sm',
  md: 'q-checkbox-md',
  lg: 'q-checkbox-lg',
} satisfies Record<CheckboxSize, string>

const LABEL_DIRECTION_CLASS = {
  left: 'q-checkbox-label-left',
  right: 'q-checkbox-label-right',
} satisfies Record<CheckboxLabelDirection, string>

const LABEL_SIZE_CLASS = {
  sm: 'q-checkbox-label-sm',
  md: 'q-checkbox-label-md',
} satisfies Record<CheckboxLabelSize, string>

export function checkbox(options: CheckboxOptions = {}, ...extra: ClassValue[]): string {
  const { color = 'brand', size = 'md' } = options
  return cx('q-checkbox', COLOR_CLASS[color], SIZE_CLASS[size], ...extra)
}

export type CheckboxProps = ComponentProps<typeof Primitive.Root> & CheckboxOptions

export function Checkbox({ color, size, className, indeterminate, ...props }: CheckboxProps) {
  return (
    <Primitive.Root
      indeterminate={indeterminate}
      className={state =>
        checkbox(
          { color, size },
          typeof className === 'function' ? className(state) : className,
        )}
      {...props}
    >
      <span className="q-checkbox-box">
        <Primitive.Indicator className="q-checkbox-indicator">
          {indeterminate ? <MinusGlyph /> : <CheckGlyph />}
        </Primitive.Indicator>
      </span>
    </Primitive.Root>
  )
}

export interface CheckboxLabelProps extends Omit<ComponentProps<'label'>, 'color'> {
  label?: ReactNode
  description?: ReactNode
  direction?: CheckboxLabelDirection
  size?: CheckboxLabelSize
  color?: CheckboxColor
  checkboxSize?: CheckboxSize
  checkboxProps?: Omit<CheckboxProps, 'color' | 'size'>
}

export function CheckboxLabel({
  label = 'Label',
  description,
  direction = 'left',
  size = 'sm',
  color,
  checkboxSize = size === 'md' ? 'md' : 'sm',
  checkboxProps,
  className,
  children,
  ...props
}: CheckboxLabelProps) {
  const checkboxNode = (
    <Checkbox
      color={color}
      size={checkboxSize}
      {...checkboxProps}
    />
  )
  const textNode = (
    <span className="q-checkbox-label-text">
      <span className="q-checkbox-label-title">{children ?? label}</span>
      {description ? <span className="q-checkbox-label-description">{description}</span> : null}
    </span>
  )

  return (
    <label
      className={cx(
        'q-checkbox-label',
        LABEL_DIRECTION_CLASS[direction],
        LABEL_SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      {direction === 'left' ? checkboxNode : textNode}
      {direction === 'left' ? textNode : checkboxNode}
    </label>
  )
}
