import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, SunburstIcon } from './icons.tsx'

describe('dropdown icons', () => {
  it('renders an svg for the chevron and forwards className', () => {
    const { container } = render(<ChevronRightIcon className="menu-item-icon" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('menu-item-icon')
  })

  it('renders an svg for the check', () => {
    const { container } = render(<CheckIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an svg for the left chevron', () => {
    const { container } = render(<ChevronLeftIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an svg for the sparkles', () => {
    const { container } = render(<SparklesIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an svg for the sunburst', () => {
    const { container } = render(<SunburstIcon />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
