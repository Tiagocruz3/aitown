import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Avatar } from '../src/components/avatar/index.ts'
import { Button } from '../src/components/button/index.ts'
import { Loader } from '../src/components/loader/index.ts'
import { type SonnerPosition, Toaster, toast } from '../src/components/sonner/index.ts'

/**
 * Sonner — imperative toasts on Base UI Toast. Mount one `<Toaster />`; fire
 * toasts from anywhere via `toast.success(...)`, `toast.promise(...)`, etc. The
 * `action` option takes the simple `{ label, onClick }` button OR any ReactNode
 * (e.g. a quanta Button), and `icon` takes any node.
 */
const meta: Meta = {
  title: 'Components/Sonner',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

function Stage({ children }: { children: ReactNode }) {
  return <div className="grid min-h-screen place-items-center gap-3 bg-q-background-primary p-10">{children}</div>
}

/** Playground — fire every toast type, plus an action, a promise, and dismiss. */
export const Playground: Story = {
  render: () => (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={() => toast('Event created', { description: 'Monday, 10:00 AM' })}>Default</Button>
        <Button variant="secondary" onClick={() => toast.success('Profile saved', { description: 'Your changes are live.' })}>Success</Button>
        <Button variant="secondary" onClick={() => toast.error('Upload failed', { description: 'The file is too large.' })}>Error</Button>
        <Button variant="secondary" onClick={() => toast.warning('Storage almost full', { description: '92% of 10 GB used.' })}>Warning</Button>
        <Button variant="secondary" onClick={() => toast.info('New version available', { description: 'Refresh to update.' })}>Info</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          onClick={() => toast('Message sent', { action: { label: 'Undo', onClick: () => toast('Undone') } })}
        >
          With action
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.promise(
            new Promise(resolve => setTimeout(resolve, 1800)),
            { loading: 'Publishing…', success: 'Published!', error: 'Failed to publish' },
          )}
        >
          Promise
        </Button>
        <Button variant="tertiary" onClick={() => toast.dismiss()}>Dismiss all</Button>
      </div>
      <Toaster />
    </Stage>
  ),
}

/* Fire a burst of toasts to show the stack. */
function fireBurst() {
  toast.success('Profile saved', { description: 'Your changes are live.' })
  toast('Event created', { description: 'Monday, 10:00 AM' })
  toast.warning('Storage almost full', { description: '92% of 10 GB used.' })
  toast.info('New version available', { description: 'Refresh to update.' })
}

/**
 * Variants — the six anchor positions and the stacking modes: collapse into a
 * glassy pile (hover to expand) or always-`expand`. `limit` caps the pile.
 */
export const Variants: Story = {
  render: () => {
    const [position, setPosition] = useState<SonnerPosition>('bottom-right')
    const [expand, setExpand] = useState(false)
    const POSITIONS: SonnerPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']
    return (
      <Stage>
        <div className="grid grid-cols-3 gap-2">
          {POSITIONS.map(p => (
            <Button key={p} variant={p === position ? 'primary' : 'secondary'} onClick={() => { setPosition(p); toast.success(p) }}>
              {p}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fireBurst}>Add 4 toasts</Button>
          <Button variant={expand ? 'primary' : 'secondary'} onClick={() => setExpand(e => !e)}>{expand ? 'Expanded' : 'Collapsed'}</Button>
          <Button variant="tertiary" onClick={() => toast.dismiss()}>Clear</Button>
        </div>
        <p className="text-q-caption-sm-regular text-q-text-tertiary">Hover the stack to expand · limit 3</p>
        <Toaster position={position} expand={expand} limit={3} gap={12} />
      </Stage>
    )
  },
}

/**
 * Rich variants — the slots composing other quanta components: a Button in the
 * `action` slot, two Buttons for multiple actions (only possible now that
 * `action` takes any node), an Avatar as the `icon`, and a Loader spinner.
 */
export const RichVariants: Story = {
  render: () => (
    <Stage>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          onClick={() => toast('Invitation sent', {
            description: 'Ada Lovelace will get an email.',
            icon: <Avatar size="sm" alt="Ada Lovelace" />,
            action: <Button size="sm" variant="secondary" onClick={() => toast.dismiss()}>View</Button>,
          })}
        >
          Avatar + Button action
        </Button>

        <Button
          variant="secondary"
          onClick={() => toast.error('Build failed', {
            description: 'Step “compile” exited with code 1.',
            duration: 0,
            action: (
              <>
                <Button size="sm" variant="tertiary" onClick={() => toast.dismiss()}>Logs</Button>
                <Button size="sm" variant="secondary" onClick={() => toast.dismiss()}>Retry</Button>
              </>
            ),
          })}
        >
          Two actions
        </Button>

        <Button
          variant="secondary"
          onClick={() => toast.loading('Deploying to production…', {
            description: 'This usually takes a minute.',
            icon: <Loader variant="circle" size="sm" color="neutral" aria-label="Deploying" />,
          })}
        >
          Loader icon
        </Button>

        <Button variant="tertiary" onClick={() => toast.dismiss()}>Clear</Button>
      </div>
      <Toaster position="bottom-right" limit={4} />
    </Stage>
  ),
}
