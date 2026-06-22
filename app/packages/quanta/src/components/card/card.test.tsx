import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, card } from './index.ts'

describe('<Card>', () => {
  it('renders the glass surface by default', () => {
    const { container } = render(<Card>content</Card>)
    const root = container.firstElementChild!
    expect(root).toHaveClass('q-card')
    expect(root).not.toHaveClass('q-card-solid')
    expect(root).not.toHaveClass('q-card-raised')
  })

  it('applies surface + elevation variants', () => {
    const { container } = render(<Card surface="solid" elevation="raised">x</Card>)
    expect(container.firstElementChild).toHaveClass('q-card', 'q-card-solid', 'q-card-raised')
  })

  it('composes Header (title/description/actions), Body and Footer', () => {
    render(
      <Card>
        <Card.Header title="Share" description="Anyone with the link" actions={<button>Done</button>} />
        <Card.Body>Body text</Card.Body>
        <Card.Footer>Footer text</Card.Footer>
      </Card>,
    )
    expect(screen.getByText('Share')).toHaveClass('q-card-title')
    expect(screen.getByText('Anyone with the link')).toHaveClass('q-card-description')
    expect(screen.getByRole('button', { name: 'Done' }).closest('.q-card-actions')).toBeInTheDocument()
    expect(screen.getByText('Body text')).toHaveClass('q-card-body')
    expect(screen.getByText('Footer text')).toHaveClass('q-card-footer')
  })

  it('forwards className + native div props', () => {
    const { container } = render(<Card className="extra" data-testid="c" aria-label="panel">x</Card>)
    const root = container.firstElementChild!
    expect(root).toHaveClass('q-card', 'extra')
    expect(root).toHaveAttribute('aria-label', 'panel')
  })

  it('defaults the root to a <div> (back-compat)', () => {
    const { container } = render(<Card>x</Card>)
    expect(container.firstElementChild?.tagName).toBe('DIV')
  })

  it('swaps the host element via `render`, keeping the surface class', () => {
    render(<Card render={<a href="/p" />}>Open</Card>)
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveClass('q-card')
    expect(link).toHaveAttribute('href', '/p')
  })

  it('`card()` builds the surface class string for any element', () => {
    expect(card()).toBe('q-card')
    expect(card({ surface: 'solid', elevation: 'raised' })).toBe('q-card q-card-solid q-card-raised')
    expect(card({}, 'mt-4')).toBe('q-card mt-4')
  })
})
