import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FolderIcon } from '../menu/icons.tsx'
import { NotFound } from '../not-found/index.ts'
import { Dropdown } from './index.ts'

function Basic() {
  return (
    <Dropdown.Root defaultOpen>
      <Dropdown.Trigger>Open</Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.GroupItem heading="Section">
          <Dropdown.Item title="Plain" />
        </Dropdown.GroupItem>
        <Dropdown.Separator />
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

describe('Dropdown containers', () => {
  it('renders content (defaultOpen) with the menu-content class', () => {
    render(<Basic />)
    expect(screen.getByRole('menu')).toHaveClass('q-menu-content')
  })

  it('renders a group heading via GroupItem', () => {
    render(<Basic />)
    expect(screen.getByText('Section')).toHaveClass('q-menu-group-label')
  })

  it('applies the size preset to the popup', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content size="large">
          <Dropdown.Item title="X" />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    expect(screen.getByRole('menu')).toHaveClass('q-menu-content-large')
  })
})

describe('Dropdown.Item template', () => {
  it('renders start, title and subtitle slots (any node)', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item
            start={<FolderIcon />}
            title={<span data-testid="title">Folder</span>}
            subtitle={<span data-testid="sub">12 items</span>}
          />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const item = screen.getByRole('menuitem', { name: /Folder/ })
    expect(item).toHaveClass('q-menu-item')
    expect(item.querySelector('.q-menu-item-icon')).toBeInTheDocument()
    expect(item.querySelector('.q-menu-item-description')).toBeInTheDocument()
    expect(screen.getByTestId('title')).toBeInTheDocument()
    expect(screen.getByTestId('sub')).toBeInTheDocument()
  })

  it('accepts the deprecated `subheader` alias (back-compat)', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item title="Folder" subheader={<span data-testid="legacy-sub">legacy</span>} />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    expect(screen.getByTestId('legacy-sub')).toBeInTheDocument()
  })

  it('wraps a string title in the title node', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item title="Action" />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    expect(
      screen.getByRole('menuitem', { name: 'Action' }).querySelector('.q-menu-item-title'),
    ).toHaveTextContent('Action')
  })

  it('closes the menu when a variant="none" item is selected', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <Dropdown.Root open={open} onOpenChange={setOpen}>
          <Dropdown.Trigger>Open</Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Item title="Action" />
          </Dropdown.Content>
        </Dropdown.Root>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('menuitem', { name: 'Action' }))
    expect(screen.queryByRole('menuitem', { name: 'Action' })).not.toBeInTheDocument()
  })
})

describe('Dropdown.Item selection', () => {
  it('non-selectable items show no indicator', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item title="Plain action" checked />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const item = screen.getByRole('menuitem', { name: /Plain action/ })
    expect(item.querySelector('.q-menu-item-trailing')).not.toBeInTheDocument()
    expect(item.querySelector('.q-checkbox')).not.toBeInTheDocument()
    expect(item.querySelector('.q-switch')).not.toBeInTheDocument()
  })

  it('selectable + indicator="checkbox" uses the real Checkbox and stays open on toggle', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [checked, setChecked] = useState(false)
      return (
        <Dropdown.Root defaultOpen>
          <Dropdown.Trigger>Open</Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Item
              title="Toggle"
              selectable
              indicator="checkbox"
              checked={checked}
              onCheckedChange={setChecked}
            />
          </Dropdown.Content>
        </Dropdown.Root>
      )
    }
    render(<Controlled />)
    const item = screen.getByRole('menuitemcheckbox', { name: /Toggle/ })
    expect(item.querySelector('.q-checkbox')).toBeInTheDocument()
    await user.click(item)
    expect(screen.getByRole('menuitemcheckbox', { name: /Toggle/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('selectable + indicator="switch" uses the real Switch', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item title="Switch" selectable indicator="switch" checked />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    expect(
      screen.getByRole('menuitemcheckbox', { name: /Switch/ }).querySelector('.q-switch'),
    ).toBeInTheDocument()
  })

  it('selectable with default indicator (check) shows a trailing check only when checked', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item title="Sel" selectable checked />
          <Dropdown.Item title="Unsel" selectable checked={false} />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const sel = screen.getByRole('menuitemcheckbox', { name: /Sel/ })
    const unsel = screen.getByRole('menuitemcheckbox', { name: /Unsel/ })
    expect(sel.querySelector('.q-menu-item-trailing svg')).toBeInTheDocument()
    expect(unsel.querySelector('.q-menu-item-trailing svg')).not.toBeInTheDocument()
  })
})

describe('Dropdown Root selection state', () => {
  it('manages selection internally via item value (no per-item state needed)', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item value="a" title="Alpha" selectable indicator="checkbox" />
          <Dropdown.Item value="b" title="Beta" selectable indicator="checkbox" />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const alpha = screen.getByRole('menuitemcheckbox', { name: /Alpha/ })
    expect(alpha).toHaveAttribute('aria-checked', 'false')
    await user.click(alpha)
    expect(screen.getByRole('menuitemcheckbox', { name: /Alpha/ })).toHaveAttribute('aria-checked', 'true')
    // independent (multiple mode default)
    expect(screen.getByRole('menuitemcheckbox', { name: /Beta/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('seeds from defaultSelected', () => {
    render(
      <Dropdown.Root defaultOpen defaultSelected={['b']}>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item value="a" title="Alpha" selectable />
          <Dropdown.Item value="b" title="Beta" selectable />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    expect(screen.getByRole('menuitemcheckbox', { name: /Alpha/ })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('menuitemcheckbox', { name: /Beta/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('fires onSelected with the next array on change (subscription)', async () => {
    const user = userEvent.setup()
    const onSelected = vi.fn()
    render(
      <Dropdown.Root defaultOpen onSelected={onSelected}>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item value="a" title="Alpha" selectable />
          <Dropdown.Item value="b" title="Beta" selectable />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    await user.click(screen.getByRole('menuitemcheckbox', { name: /Alpha/ }))
    expect(onSelected).toHaveBeenLastCalledWith(['a'])
    await user.click(screen.getByRole('menuitemcheckbox', { name: /Beta/ }))
    expect(onSelected).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('single selectionMode keeps only one selected', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen selectionMode="single">
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item value="a" title="Alpha" selectable />
          <Dropdown.Item value="b" title="Beta" selectable />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    await user.click(screen.getByRole('menuitemcheckbox', { name: /Alpha/ }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: /Beta/ }))
    expect(screen.getByRole('menuitemcheckbox', { name: /Alpha/ })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('menuitemcheckbox', { name: /Beta/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('supports controlled selected (+ onSelected)', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [selected, setSelected] = useState<string[]>([])
      return (
        <Dropdown.Root defaultOpen selected={selected} onSelected={setSelected}>
          <Dropdown.Trigger>Open</Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Item value="a" title="Alpha" selectable />
          </Dropdown.Content>
        </Dropdown.Root>
      )
    }
    render(<Controlled />)
    const alpha = screen.getByRole('menuitemcheckbox', { name: /Alpha/ })
    expect(alpha).toHaveAttribute('aria-checked', 'false')
    await user.click(alpha)
    expect(screen.getByRole('menuitemcheckbox', { name: /Alpha/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('per-item checked overrides Root state', async () => {
    const user = userEvent.setup()
    const onSelected = vi.fn()
    render(
      <Dropdown.Root defaultOpen onSelected={onSelected}>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item value="a" title="Manual" selectable checked onCheckedChange={() => {}} />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const item = screen.getByRole('menuitemcheckbox', { name: /Manual/ })
    expect(item).toHaveAttribute('aria-checked', 'true')
    await user.click(item)
    // Root state is untouched because the item is manually controlled.
    expect(onSelected).not.toHaveBeenCalled()
  })
})

describe('Dropdown submenu (children → submenu)', () => {
  it('renders a submenu trigger with the chevron', () => {
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Item title="More">
            <Dropdown.Item title="Nested" />
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const trigger = screen.getByRole('menuitem', { name: /More/ })
    expect(trigger).toHaveClass('q-menu-item')
    expect(trigger.querySelector('.q-menu-item-trailing svg')).toBeInTheDocument()
  })
})

describe('Dropdown search (withSearch)', () => {
  it('renders a search box and filters items live', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content withSearch>
          <Dropdown.Item title="Apple" />
          <Dropdown.Item title="Banana" />
          <Dropdown.Item title="Cherry" />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    const input = screen.getByPlaceholderText('Search')
    expect(input).toBeInTheDocument()
    await user.type(input, 'ban')
    expect(screen.getByRole('menuitem', { name: 'Banana' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Apple' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Cherry' })).not.toBeInTheDocument()
  })

  it('hides a group whose items all filter out', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content withSearch>
          <Dropdown.GroupItem heading="Fruit">
            <Dropdown.Item title="Apple" />
          </Dropdown.GroupItem>
          <Dropdown.GroupItem heading="Veg">
            <Dropdown.Item title="Carrot" />
          </Dropdown.GroupItem>
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    await user.type(screen.getByPlaceholderText('Search'), 'carrot')
    expect(screen.getByText('Veg')).toBeInTheDocument()
    expect(screen.queryByText('Fruit')).not.toBeInTheDocument()
  })

  it('filters rich items via the explicit value prop', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content withSearch>
          <Dropdown.Item value="seedance" title={<span>Seedance 2.0</span>} />
          <Dropdown.Item value="kling" title={<span>Kling 3.0</span>} />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    await user.type(screen.getByPlaceholderText('Search'), 'kling')
    expect(screen.getByText('Kling 3.0')).toBeInTheDocument()
    expect(screen.queryByText('Seedance 2.0')).not.toBeInTheDocument()
  })

  it('shows the default NotFound when a search matches nothing', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content withSearch>
          <Dropdown.Item title="Apple" />
          <Dropdown.Item title="Banana" />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    await user.type(screen.getByPlaceholderText('Search'), 'zzz')
    expect(screen.queryByRole('menuitem', { name: 'Apple' })).not.toBeInTheDocument()
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByText('Try a different search')).toBeInTheDocument()
  })

  it('renders a custom notFound node when provided', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown.Root defaultOpen>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content
          withSearch
          notFound={<NotFound title="Nothing here" subtitle="Add a model first" />}
        >
          <Dropdown.Item title="Apple" />
        </Dropdown.Content>
      </Dropdown.Root>,
    )
    await user.type(screen.getByPlaceholderText('Search'), 'zzz')
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Add a model first')).toBeInTheDocument()
  })
})
