import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './index.ts'

describe('<Sidebar>', () => {
  it('renders the rail with header, body sections and footer', () => {
    const { container } = render(
      <Sidebar.Root aria-label="Main">
        <Sidebar.Header title="Cinema Studio" chevron />
        <Sidebar.Body>
          <Sidebar.Section>
            <Sidebar.Item selected>Home</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
        <Sidebar.Footer>
          <Sidebar.FooterItem variant="login">Login</Sidebar.FooterItem>
        </Sidebar.Footer>
      </Sidebar.Root>,
    )
    expect(container.querySelector('.q-sidebar')).toBeInTheDocument()
    expect(screen.getByText('Cinema Studio')).toHaveClass('q-sidebar-switcher-name')
    expect(container.querySelector('.q-sidebar-body')).toBeInTheDocument()
    expect(container.querySelector('.q-sidebar-footer')).toBeInTheDocument()
  })

  it('marks the selected item with the selected class + aria-current', () => {
    render(<Sidebar.Item selected>Home</Sidebar.Item>)
    const item = screen.getByRole('button', { name: 'Home' })
    expect(item).toHaveClass('q-sidebar-row', 'q-sidebar-item', 'q-sidebar-selected')
    expect(item).toHaveAttribute('aria-current', 'page')
  })

  it('renders an Item as a link when href is set', () => {
    render(<Sidebar.Item href="/home">Home</Sidebar.Item>)
    const link = screen.getByRole('link', { name: 'Home' })
    expect(link).toHaveAttribute('href', '/home')
    expect(link).toHaveClass('q-sidebar-item')
  })

  it('applies the sm size class', () => {
    render(<Sidebar.Item size="sm">Chat</Sidebar.Item>)
    expect(screen.getByRole('button')).toHaveClass('q-sidebar-item-sm')
  })

  it('renders the start slot, label and meta count', () => {
    render(<Sidebar.Item start={<span data-testid="av" />} meta="484">Blue Horizon</Sidebar.Item>)
    expect(screen.getByTestId('av').closest('.q-sidebar-icon')).toBeInTheDocument()
    expect(screen.getByText('Blue Horizon')).toHaveClass('q-sidebar-label')
    expect(screen.getByText('484')).toHaveClass('q-sidebar-meta')
  })

  it('renders start / meta / end in order, with the host swappable via render', () => {
    render(
      <Sidebar.Item
        start={<span data-testid="s" />}
        meta="9"
        end={<span data-testid="e" />}
        render={<a href="/x" data-testid="link" />}
      >
        Item
      </Sidebar.Item>,
    )
    const root = screen.getByTestId('link')
    expect(root.tagName).toBe('A')
    expect(root).toHaveClass('q-sidebar-item')
    const s = screen.getByTestId('s'); const e = screen.getByTestId('e')
    expect(s.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders no pin button without onPinChange (back-compat)', () => {
    render(<Sidebar.Item>Plain</Sidebar.Item>)
    // the Item is the bare button/link, no pin-row wrapper
    expect(document.querySelector('.q-sidebar-pinrow')).toBeNull()
    expect(screen.queryByRole('button', { name: /pin/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveClass('q-sidebar-item')
  })

  it('renders a pin toggle as a sibling (not nested) and fires onPinChange', async () => {
    const user = userEvent.setup()
    const onPinChange = vi.fn()
    render(<Sidebar.Item onPinChange={onPinChange}>Project</Sidebar.Item>)
    const row = screen.getByRole('button', { name: 'Project' })
    const pin = screen.getByRole('button', { name: 'Pin' })
    // pin is a sibling of the row link, NOT a descendant (valid HTML)
    expect(row).not.toContainElement(pin)
    expect(pin).toHaveAttribute('aria-pressed', 'false')
    await user.click(pin)
    expect(onPinChange).toHaveBeenCalledWith(true)
  })

  it('reflects the pinned state (filled, unpin label, aria-pressed)', () => {
    const onPinChange = vi.fn()
    render(<Sidebar.Item pinned onPinChange={onPinChange}>Project</Sidebar.Item>)
    const pin = screen.getByRole('button', { name: 'Unpin' })
    expect(pin).toHaveAttribute('aria-pressed', 'true')
    expect(pin).toHaveAttribute('data-pinned')
    expect(pin.closest('.q-sidebar-pinrow')).toHaveClass('q-sidebar-pinned')
  })

  it('applies footer variant classes (promo / login)', () => {
    const { rerender } = render(<Sidebar.FooterItem variant="promo">Pricing</Sidebar.FooterItem>)
    expect(screen.getByRole('button')).toHaveClass('q-sidebar-footeritem-promo')
    rerender(<Sidebar.FooterItem variant="login">Login</Sidebar.FooterItem>)
    expect(screen.getByRole('button')).toHaveClass('q-sidebar-footeritem-login')
  })

  it('renders a section header from title + actions', () => {
    const { container } = render(
      <Sidebar.Section title="Projects" actions={<span data-testid="add" />}>
        <Sidebar.Item>Alpha</Sidebar.Item>
      </Sidebar.Section>,
    )
    expect(screen.getByText('Projects')).toHaveClass('q-sidebar-section-title')
    expect(container.querySelector('.q-sidebar-section-actions')).toContainElement(screen.getByTestId('add'))
  })

  it('renders the header trailing actions slot', () => {
    render(<Sidebar.Header title="WS" actions={<button type="button">Collapse</button>} />)
    expect(screen.getByText('WS')).toHaveClass('q-sidebar-switcher-name')
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument()
  })

  it('keeps the legacy header `action` alias (back-compat)', () => {
    render(<Sidebar.Header title="WS" action={<button type="button">Legacy</button>} />)
    expect(screen.getByRole('button', { name: 'Legacy' })).toBeInTheDocument()
  })

  it('collapses to an icon strip', () => {
    const { container } = render(
      <Sidebar.Root collapsed>
        <Sidebar.Body><Sidebar.Item>Home</Sidebar.Item></Sidebar.Body>
      </Sidebar.Root>,
    )
    const root = container.querySelector('.q-sidebar')!
    expect(root).toHaveClass('q-sidebar-collapsed')
    expect(root).toHaveAttribute('data-collapsed', '')
  })
})
