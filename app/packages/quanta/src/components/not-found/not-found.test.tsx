import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NotFound } from './index.ts'

describe('<NotFound>', () => {
  it('renders icon, title and subtitle slots with their token classes', () => {
    render(
      <NotFound
        icon={<span data-testid="icon">x</span>}
        title="No matches"
        subtitle="Refine your query"
      />,
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('No matches')).toHaveClass('q-not-found-title')
    expect(screen.getByText('Refine your query')).toHaveClass('q-not-found-subtitle')
  })

  it('wraps the icon in the glass tile', () => {
    render(<NotFound icon={<span data-testid="i">i</span>} title="T" />)
    const tile = screen.getByTestId('i').closest('.q-not-found-icon')
    expect(tile).toBeInTheDocument()
  })

  it('omits the text column entirely when neither title nor subtitle is given', () => {
    const { container } = render(<NotFound icon={<span>i</span>} />)
    expect(container.querySelector('.q-not-found-text')).not.toBeInTheDocument()
  })

  it('omits the icon tile when no icon is given', () => {
    const { container } = render(<NotFound title="Only title" />)
    expect(container.querySelector('.q-not-found-icon')).not.toBeInTheDocument()
    expect(screen.getByText('Only title')).toBeInTheDocument()
  })

  it('accepts ReactNode title / subtitle (not just strings)', () => {
    render(
      <NotFound
        title={<strong data-testid="rich-title">Rich</strong>}
        subtitle={<em data-testid="rich-sub">sub</em>}
      />,
    )
    expect(screen.getByTestId('rich-title')).toBeInTheDocument()
    expect(screen.getByTestId('rich-sub')).toBeInTheDocument()
  })

  it('forwards className and native div props onto the root', () => {
    const { container } = render(<NotFound className="is-custom" id="empty" title="T" />)
    const root = container.querySelector('.q-not-found')!
    expect(root).toHaveClass('is-custom')
    expect(root).toHaveAttribute('id', 'empty')
  })

  it('defaults to the md size and plain variant', () => {
    const { container } = render(<NotFound title="T" />)
    const root = container.querySelector('.q-not-found')!
    expect(root).toHaveClass('q-not-found-md', 'q-not-found-plain')
  })

  it('applies the requested size and variant classes', () => {
    const { container } = render(<NotFound title="T" size="lg" variant="card" />)
    const root = container.querySelector('.q-not-found')!
    expect(root).toHaveClass('q-not-found-lg', 'q-not-found-card')
    expect(root).not.toHaveClass('q-not-found-md', 'q-not-found-plain')
  })

  it('renders the actions slot in its own row', () => {
    render(<NotFound title="T" actions={<button type="button">Clear filters</button>} />)
    const cta = screen.getByRole('button', { name: 'Clear filters' })
    expect(cta.closest('.q-not-found-actions')).toBeInTheDocument()
  })

  it('omits the actions row when no actions are given (back-compat)', () => {
    const { container } = render(<NotFound icon={<span>i</span>} title="T" subtitle="S" />)
    expect(container.querySelector('.q-not-found-actions')).not.toBeInTheDocument()
    // default host element is still a <div>, byte-for-byte with the old markup
    expect(container.querySelector('.q-not-found')!.tagName).toBe('DIV')
  })

  it('swaps the host element via render, keeping the surface classes', () => {
    render(<NotFound render={<button type="button" data-testid="dz" />} variant="outline" title="Drop files" />)
    const dz = screen.getByTestId('dz')
    expect(dz.tagName).toBe('BUTTON')
    expect(dz).toHaveClass('q-not-found', 'q-not-found-outline')
    expect(screen.getByText('Drop files')).toHaveClass('q-not-found-title')
  })
})
