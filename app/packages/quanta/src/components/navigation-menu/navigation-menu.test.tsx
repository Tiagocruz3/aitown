import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { NavigationMenu } from './index.ts'

function setup() {
  render(
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item label="Products">
          <NavigationMenu.Menu rows={3}>
            <NavigationMenu.Group heading="Create">
              <NavigationMenu.MenuItem title="Image" subtitle="Text → image" href="/image" />
              <NavigationMenu.MenuItem title="Video" subtitle="Text → video" href="/video" />
            </NavigationMenu.Group>
            <NavigationMenu.MenuItem title="Pricing" subtitle="Plans & credits" href="/pricing" />
          </NavigationMenu.Menu>
        </NavigationMenu.Item>
        <NavigationMenu.Item label="Docs" href="/docs" />
      </NavigationMenu.List>
    </NavigationMenu.Root>,
  )
}

describe('<NavigationMenu>', () => {
  it('renders bar triggers and plain links', () => {
    setup()
    expect(screen.getByRole('button', { name: /products/i })).toBeInTheDocument()
    const docs = screen.getByRole('link', { name: 'Docs' })
    expect(docs).toHaveAttribute('href', '/docs')
  })

  it('opens the panel and reveals its (grouped + ungrouped) items', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /products/i }))
    await waitFor(() => expect(screen.getByText('Image')).toBeInTheDocument())
    expect(screen.getByText('Video')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    // grouped item heading + a real link with href
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /image/i })).toHaveAttribute('href', '/image')
  })

  it('applies the requested row count to the grid', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /products/i }))
    await waitFor(() => expect(document.querySelector('.q-nav-menu-grid')).toBeInTheDocument())
    expect(document.querySelector('.q-nav-menu-grid')).toHaveClass('q-nav-rows-3')
  })

  it('renders logo, item slots (start/end/accent) and the actions cluster', () => {
    const { container } = render(
      <NavigationMenu.Root>
        <NavigationMenu.Logo><span data-testid="logo" /></NavigationMenu.Logo>
        <NavigationMenu.List>
          <NavigationMenu.Item
            label="Supercomputer"
            accent
            start={<span data-testid="lead" />}
            end={<span data-testid="badge" />}
            href="/sc"
          />
        </NavigationMenu.List>
        <NavigationMenu.Actions>
          <NavigationMenu.Action iconOnly aria-label="Search"><span /></NavigationMenu.Action>
          <NavigationMenu.Action href="/pricing">Pricing</NavigationMenu.Action>
        </NavigationMenu.Actions>
      </NavigationMenu.Root>,
    )
    expect(screen.getByTestId('logo').closest('.q-nav-logo')).toBeInTheDocument()
    const sc = screen.getByRole('link', { name: /supercomputer/i })
    expect(sc).toHaveClass('q-nav-item', 'q-nav-item-accent')
    expect(screen.getByTestId('lead').closest('.q-nav-item-icon')).toBeInTheDocument()
    expect(screen.getByTestId('badge')).toBeInTheDocument()
    expect(container.querySelector('.q-nav-actions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toHaveClass('q-nav-action', 'q-nav-action-icon')
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing')
  })

  it('Action defaults to a <button> and renders an <a> from href (back-compat)', () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.Actions>
          <NavigationMenu.Action>Plain</NavigationMenu.Action>
          <NavigationMenu.Action href="/go">Linked</NavigationMenu.Action>
        </NavigationMenu.Actions>
      </NavigationMenu.Root>,
    )
    const plain = screen.getByRole('button', { name: 'Plain' })
    expect(plain.tagName).toBe('BUTTON')
    expect(plain).toHaveAttribute('type', 'button')
    expect(plain).toHaveClass('q-nav-action')
    const linked = screen.getByRole('link', { name: 'Linked' })
    expect(linked.tagName).toBe('A')
    expect(linked).toHaveAttribute('href', '/go')
    expect(linked).not.toHaveAttribute('type')
  })

  it('Action swaps its element via render, keeping the pill styling', () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.Actions>
          <NavigationMenu.Action render={<a href="/custom" data-testid="custom" />}>Custom</NavigationMenu.Action>
        </NavigationMenu.Actions>
      </NavigationMenu.Root>,
    )
    const custom = screen.getByTestId('custom')
    expect(custom.tagName).toBe('A')
    expect(custom).toHaveAttribute('href', '/custom')
    expect(custom).toHaveClass('q-nav-action')
    // a render-supplied element must not get the native button type
    expect(custom).not.toHaveAttribute('type')
  })
})
