import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Checkbox, CheckboxLabel, checkbox } from './index.ts'

describe('checkbox() class-builder', () => {
  it('defaults to brand + md', () => {
    expect(checkbox()).toBe('q-checkbox q-checkbox-brand q-checkbox-md')
  })

  it('applies color + size', () => {
    expect(checkbox({ color: 'white', size: 'lg' })).toBe('q-checkbox q-checkbox-white q-checkbox-lg')
  })

  it('merges extra classes and ignores falsy values', () => {
    expect(checkbox({ color: 'white', size: 'sm' }, 'is-custom', false)).toBe(
      'q-checkbox q-checkbox-white q-checkbox-sm is-custom',
    )
  })
})

describe('<Checkbox>', () => {
  it('renders a Base UI checkbox with Figma classes', () => {
    render(<Checkbox aria-label="Accept" defaultChecked color="white" size="sm" />)

    const control = screen.getByRole('checkbox', { name: 'Accept' })
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(control).toHaveClass('q-checkbox', 'q-checkbox-white', 'q-checkbox-sm')
  })

  it('renders an indeterminate state', () => {
    render(<Checkbox aria-label="Partially selected" indeterminate />)

    const control = screen.getByRole('checkbox', { name: 'Partially selected' })
    expect(control).toHaveAttribute('aria-checked', 'mixed')
    expect(control).toHaveAttribute('data-indeterminate')
  })

  it('merges caller classes', () => {
    render(<Checkbox aria-label="Custom" className="is-custom" />)
    expect(screen.getByRole('checkbox', { name: 'Custom' })).toHaveClass('q-checkbox', 'is-custom')
  })
})

describe('<CheckboxLabel>', () => {
  it('renders the label, description, and checkbox', () => {
    render(<CheckboxLabel label="Use feature" description="Description" />)

    expect(screen.getByText('Use feature')).toHaveClass('q-checkbox-label-title')
    expect(screen.getByText('Description')).toHaveClass('q-checkbox-label-description')
    expect(screen.getByRole('checkbox', { name: /Use feature/ })).toHaveClass('q-checkbox')
  })

  it('supports right-aligned checkbox and medium label typography', () => {
    render(<CheckboxLabel direction="right" size="md" label="Use feature" />)
    expect(screen.getByText('Use feature').closest('.q-checkbox-label')).toHaveClass(
      'q-checkbox-label-right',
      'q-checkbox-label-md',
    )
  })
})
