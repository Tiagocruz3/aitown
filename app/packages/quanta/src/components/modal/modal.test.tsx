import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Modal, modal } from './index.ts'

describe('modal() class-builder', () => {
  it('defaults to the md size', () => {
    expect(modal()).toBe('q-modal q-modal-size-md')
  })

  it('applies size and extra classes', () => {
    expect(modal({ size: 'lg' }, 'custom')).toBe('q-modal q-modal-size-lg custom')
  })
})

describe('<Modal> composition', () => {
  it('renders the Base UI dialog with quanta parts', () => {
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <Modal.Header title="Modal title" />
          <Modal.Body>Body content</Modal.Body>
          <Modal.Footer caption="Footer caption" actions={<button type="button">Confirm</button>} />
        </Modal.Content>
      </Modal.Root>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Modal title' })
    expect(dialog).toHaveClass('q-modal', 'q-modal-size-md')
    expect(screen.getByText('Body content')).toHaveClass('q-modal-workspace', 'q-modal-workspace-padded')
    expect(screen.getByText('Footer caption')).toHaveClass('q-modal-caption')
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('q-close')
  })

  it('renders the back / search / tabs header variants', () => {
    const back = render(
      <Modal.Root defaultOpen>
        <Modal.Content aria-label="Back"><Modal.Header variant="back" title="Step 2" /></Modal.Content>
      </Modal.Root>,
    )
    expect(back.container.ownerDocument.querySelector('.q-modal-header-lead')).not.toBeNull()
    expect(back.getByRole('button', { name: 'Back' })).toHaveClass('q-close')
    back.unmount()

    const search = render(
      <Modal.Root defaultOpen>
        <Modal.Content aria-label="Search"><Modal.Header variant="search" searchProps={{ placeholder: 'Find…' }} /></Modal.Content>
      </Modal.Root>,
    )
    expect(search.getByPlaceholderText('Find…')).toHaveClass('q-modal-search-input')
    search.unmount()

    const tabs = render(
      <Modal.Root defaultOpen>
        <Modal.Content aria-label="Tabs"><Modal.Header variant="tabs" tabs={<div data-testid="pill">tabs</div>} /></Modal.Content>
      </Modal.Root>,
    )
    expect(tabs.getByTestId('pill')).toBeInTheDocument()
  })

  it('wraps plain body content in a single window, but keeps explicit Workspaces', () => {
    const single = render(
      <Modal.Root defaultOpen>
        <Modal.Content aria-label="Single"><Modal.Body>Plain</Modal.Body></Modal.Content>
      </Modal.Root>,
    )
    // auto-wrapped: exactly one workspace window
    expect(single.container.ownerDocument.querySelectorAll('.q-modal-workspace')).toHaveLength(1)
    expect(single.getByText('Plain')).toHaveClass('q-modal-workspace')
    single.unmount()

    const split = render(
      <Modal.Root defaultOpen>
        <Modal.Content size="xl" aria-label="Split">
          <Modal.Body>
            <Modal.Workspace className="w-40 flex-none">Nav</Modal.Workspace>
            <Modal.Workspace>Content</Modal.Workspace>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>,
    )
    // two explicit windows, not auto-wrapped into one
    expect(split.container.ownerDocument.querySelectorAll('.q-modal-workspace')).toHaveLength(2)
    expect(split.getByText('Nav')).toHaveClass('q-modal-workspace')
    expect(split.getByText('Content')).toHaveClass('q-modal-workspace')
  })

  it('applies the size preset to the popup', () => {
    render(
      <Modal.Root defaultOpen>
        <Modal.Content size="lg" aria-label="Large modal">
          <Modal.Body />
        </Modal.Content>
      </Modal.Root>,
    )
    expect(screen.getByRole('dialog', { name: 'Large modal' })).toHaveClass('q-modal-size-lg')
  })

  it('renders a header `end` slot just before the close button', () => {
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <Modal.Header title="With actions" end={<button type="button">Settings</button>} />
        </Modal.Content>
      </Modal.Root>,
    )
    const header = document.querySelector('.q-modal-header') as HTMLElement
    const settings = screen.getByRole('button', { name: 'Settings' })
    const close = screen.getByRole('button', { name: 'Close' })
    expect(header).toContainElement(settings)
    // `end` content precedes the close affordance in DOM order
    expect(settings.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders the default header unchanged when no `end` is passed (back-compat)', () => {
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <Modal.Header title="Plain header" />
        </Modal.Content>
      </Modal.Root>,
    )
    const header = document.querySelector('.q-modal-header') as HTMLElement
    // start(none) + title + spacer-or-none + close: only the title and the close button render
    expect(screen.getByText('Plain header')).toHaveClass('q-modal-title')
    expect(header.querySelectorAll('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('omits the close button when closeButton is false', () => {
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <Modal.Header title="No close" closeButton={false} />
        </Modal.Content>
      </Modal.Root>,
    )
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('closes when the close button is pressed', async () => {
    const user = userEvent.setup()
    render(
      <Modal.Root defaultOpen>
        <Modal.Content>
          <Modal.Header title="Dismissable" />
          <Modal.Body>Body</Modal.Body>
        </Modal.Content>
      </Modal.Root>,
    )
    expect(screen.getByRole('dialog', { name: 'Dismissable' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Dismissable' })).not.toBeInTheDocument(),
    )
  })
})

describe('<Modal> flat mode', () => {
  it('builds the full dialog from props', () => {
    render(
      <Modal
        defaultOpen
        size="sm"
        title="Flat title"
        description="A short description"
        caption="Caption"
        actions={<button type="button">Save</button>}
      >
        Flat body
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Flat title', description: 'A short description' })
    expect(dialog).toHaveClass('q-modal', 'q-modal-size-sm')
    expect(screen.getByText('Flat body')).toHaveClass('q-modal-workspace')
    expect(screen.getByText('Caption')).toHaveClass('q-modal-caption')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('omits the footer when neither caption nor actions is given', () => {
    const { container } = render(
      <Modal defaultOpen title="No footer">Body</Modal>,
    )
    expect(container.ownerDocument.querySelector('.q-modal-footer')).toBeNull()
  })

  it('names the dialog via aria-label when there is no title', () => {
    render(<Modal defaultOpen aria-label="Settings">Body</Modal>)
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('omits the header for a body-only sheet (no title, no close)', () => {
    const { container } = render(
      <Modal defaultOpen aria-label="Sheet" closeButton={false}>Body</Modal>,
    )
    expect(container.ownerDocument.querySelector('.q-modal-header')).toBeNull()
  })

  it('opens from a trigger element', async () => {
    const user = userEvent.setup()
    render(
      <Modal title="Triggered" trigger={<button type="button">Open</button>}>
        Body
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByRole('dialog', { name: 'Triggered' })).toBeInTheDocument()
  })
})
