import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Command } from './index.ts'

function setup(onSelect = vi.fn()) {
  render(
    <Command label="Test menu">
      <Command.Input placeholder="Search" />
      <Command.List>
        <Command.Empty>Nothing found.</Command.Empty>
        <Command.Group heading="Files">
          <Command.Item title="New File" subtitle="Create a blank file" onSelect={() => onSelect('new')} />
          <Command.Item title="Open File" onSelect={() => onSelect('open')} />
        </Command.Group>
        <Command.Group heading="Settings">
          <Command.Item title="Toggle Theme" end="⌘T" onSelect={() => onSelect('theme')} />
        </Command.Group>
      </Command.List>
    </Command>,
  )
  return { onSelect }
}

const item = (label: string) => screen.getByText(label).closest('[data-command-item]')!

describe('<Command>', () => {
  it('renders a combobox and every item', () => {
    setup()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('New File')).toBeVisible()
    expect(screen.getByText('Toggle Theme')).toBeVisible()
  })

  it('fuzzy-filters items and hides groups with no matches', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('combobox'), 'theme')
    expect(screen.getByText('Toggle Theme')).toBeVisible()
    expect(item('New File')).not.toBeVisible()
    expect(screen.getByText('Files').closest('[role="group"]')).not.toBeVisible()
  })

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('combobox'), 'zzzzz')
    expect(screen.getByText('Nothing found.')).toBeInTheDocument()
  })

  it('highlights the first item and moves with ArrowDown', async () => {
    const user = userEvent.setup()
    setup()
    expect(item('New File')).toHaveAttribute('data-active')
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}')
    expect(item('Open File')).toHaveAttribute('data-active')
    expect(item('New File')).not.toHaveAttribute('data-active')
  })

  it('composes items from start / title / subtitle / end slots', () => {
    render(
      <Command label="Slots">
        <Command.Input />
        <Command.List>
          <Command.Item start={<span data-testid="ico" />} title="Deploy" subtitle="ship it" end="⌘D" />
        </Command.List>
      </Command>,
    )
    const row = screen.getByText('Deploy').closest('[data-command-item]')!
    expect(screen.getByText('Deploy')).toHaveClass('q-command-item-title')
    expect(screen.getByText('ship it')).toHaveClass('q-command-item-subtitle')
    expect(screen.getByText('⌘D')).toHaveClass('q-command-item-end')
    expect(row.querySelector('.q-command-item-start')).toContainElement(screen.getByTestId('ico'))
  })

  it('detail pane reflects the active item and updates on navigation', async () => {
    const user = userEvent.setup()
    render(
      <Command label="Detail">
        <Command.Input />
        <Command.Body>
          <Command.List>
            <Command.Item title="Alpha" detail={<p>Alpha details</p>} />
            <Command.Item title="Beta" detail={<p>Beta details</p>} />
          </Command.List>
          <Command.Detail />
        </Command.Body>
      </Command>,
    )
    expect(await screen.findByText('Alpha details')).toBeInTheDocument()
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByText('Beta details')).toBeInTheDocument()
    expect(screen.queryByText('Alpha details')).not.toBeInTheDocument()
  })

  it('hides the detail pane when the active item has no detail', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Command label="Mixed">
        <Command.Input />
        <Command.Body>
          <Command.List>
            <Command.Item title="WithDetail" detail={<p>Has detail</p>} />
            <Command.Item title="Plain" />
          </Command.List>
          <Command.Detail />
        </Command.Body>
      </Command>,
    )
    expect(await screen.findByText('Has detail')).toBeInTheDocument()
    expect(container.querySelector('.q-command-detail')).toBeInTheDocument()
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}') // → "Plain" (no detail)
    await waitFor(() => expect(container.querySelector('.q-command-detail')).not.toBeInTheDocument())
  })

  it('footer action label tracks the active item', async () => {
    const user = userEvent.setup()
    render(
      <Command label="Footer label">
        <Command.Input />
        <Command.List>
          <Command.Item title="One" action="Run one" />
          <Command.Item title="Two" action="Run two" />
        </Command.List>
        <Command.Footer><Command.Action fallback="Pick"><span data-testid="kbd">↵</span></Command.Action></Command.Footer>
      </Command>,
    )
    expect(await screen.findByText('Run one')).toBeInTheDocument()
    screen.getByRole('combobox').focus()
    await user.keyboard('{ArrowDown}')
    expect(await screen.findByText('Run two')).toBeInTheDocument()
    expect(screen.queryByText('Run one')).not.toBeInTheDocument()
  })

  it('footer action runs the active item', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <Command label="Footer">
        <Command.Input />
        <Command.List><Command.Item title="Run" onSelect={onSelect} /></Command.List>
        <Command.Footer><Command.Action>Go</Command.Action></Command.Footer>
      </Command>,
    )
    await user.click(screen.getByRole('button', { name: 'Go' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('selects via Enter (active item) and via click', async () => {
    const user = userEvent.setup()
    const { onSelect } = setup()
    screen.getByRole('combobox').focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('new')
    await user.click(screen.getByText('Toggle Theme'))
    expect(onSelect).toHaveBeenCalledWith('theme')
  })

  it('Command.Shortcut composes the canonical Kbd (renders a <kbd> pill)', () => {
    render(<Command.Shortcut>⌘K</Command.Shortcut>)
    const k = screen.getByText('⌘K')
    expect(k.tagName).toBe('KBD')
    // the Kbd pill styling (Figma _Shortcut), not the old q-command-shortcut
    expect(k).toHaveClass('rounded-q-100', 'bg-q-overlay-hover', 'text-q-caption-sm-medium')
  })
})
