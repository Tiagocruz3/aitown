import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CloseButton, closeButton } from './index.ts'

describe('<CloseButton>', () => {
  it('renders a button with the default cross glyph and accessible name', () => {
    render(<CloseButton />)
    const btn = screen.getByRole('button', { name: 'Close' })
    expect(btn).toHaveClass('q-close', 'q-close-md')
    expect(btn.querySelector('svg')).toBeInTheDocument()
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('applies the requested size class', () => {
    render(<CloseButton size="xl" />)
    expect(screen.getByRole('button')).toHaveClass('q-close-xl')
  })

  it('allows overriding the accessible label and children', () => {
    render(<CloseButton aria-label="Dismiss"><span data-testid="custom">x</span></CloseButton>)
    const btn = screen.getByRole('button', { name: 'Dismiss' })
    expect(screen.getByTestId('custom')).toBeInTheDocument()
    expect(btn.querySelector('svg')).not.toBeInTheDocument()
  })

  it('forwards className and native button props', () => {
    render(<CloseButton className="is-custom" disabled />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('is-custom')
    expect(btn).toBeDisabled()
  })

  it('closeButton() recipe builds the q-close class string for non-button elements', () => {
    expect(closeButton()).toBe('q-close q-close-md')
    expect(closeButton({ size: 'sm' }, 'extra')).toBe('q-close q-close-sm extra')
  })
})
