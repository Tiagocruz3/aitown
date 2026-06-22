import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Avatar } from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Button } from '../src/components/button/index.ts'
import { SwitchLabel } from '../src/components/switch/index.ts'
import { type VaultSide, Vault } from '../src/components/vault/index.ts'

/**
 * Vault — swipeable edge-docked drawer on Base UI Drawer. Drag the handle (or
 * swipe) to dismiss; pick the docking edge with `side`. Composition mirrors
 * Modal: Root / Trigger / Content / Header (title · start · end) / Body / Footer.
 */
/** Colourful page behind the drawer so the glass + dim scrim read (not a black void). */
function PageBackdrop() {
  const tiles = ['bg-q-palette-orange-bg', 'bg-q-palette-mint-bg', 'bg-q-palette-blue-bg', 'bg-q-palette-pink-bg', 'bg-q-palette-purple-bg', 'bg-q-brand-yellow']
  return (
    <div className="absolute inset-0 grid grid-cols-5 grid-rows-4">
      {Array.from({ length: 20 }).map((_, i) => <div key={i} className={tiles[(i * 3 + (i % 5)) % tiles.length]} />)}
    </div>
  )
}

const meta: Meta = {
  title: 'Components/Vault',
  parameters: { layout: 'fullscreen' },
  decorators: [Story => (
    <div className="relative min-h-screen overflow-hidden">
      <PageBackdrop />
      <div className="relative grid min-h-screen place-items-center p-10"><Story /></div>
    </div>
  )],
}
export default meta
type Story = StoryObj

const LOREM = 'Drag the handle down to dismiss, or tap the scrim. Base UI drives the physics; quanta paints the sheet with design tokens.'

/** Playground — a bottom sheet with title, body and a caption + action footer. */
export const Playground: Story = {
  render: () => (
    <Vault.Root side="bottom">
      <Vault.Trigger render={<Button>Open bottom sheet</Button>} />
      <Vault.Content>
        <Vault.Header title="Share" />
        <Vault.Body>
          <p className="text-q-body-md-regular text-q-text-secondary">{LOREM}</p>
        </Vault.Body>
        <Vault.Footer
          caption="Anyone with the link"
          actions={<Vault.Close render={<Button variant="secondary">Done</Button>} />}
        />
      </Vault.Content>
    </Vault.Root>
  ),
}

/**
 * Variants — the four docking edges (bottom / top / left / right), plus a
 * snap-point sheet (opens at 35%, drag to 70% / full).
 */
export const Variants: Story = {
  render: function VariantsStory() {
    // Keep `side` stable across close — resetting it mid-exit flashes the wrong edge.
    const [open, setOpen] = useState(false)
    const [side, setSide] = useState<VaultSide>('bottom')
    const SIDES: VaultSide[] = ['bottom', 'top', 'left', 'right']
    return (
      <div className="flex flex-wrap gap-3">
        {SIDES.map(s => <Button key={s} variant="secondary" onClick={() => { setSide(s); setOpen(true) }}>{s}</Button>)}

        <Vault.Root side={side} open={open} onOpenChange={setOpen}>
          <Vault.Content>
            <Vault.Header title={`${side} drawer`} />
            <Vault.Body><p className="text-q-body-md-regular text-q-text-secondary">{LOREM}</p></Vault.Body>
            <Vault.Footer actions={<Vault.Close render={<Button variant="secondary">Close</Button>} />} />
          </Vault.Content>
        </Vault.Root>

        <Vault.Root side="bottom" snapPoints={[0.35, 0.7, 1]} defaultSnapPoint={0.35}>
          <Vault.Trigger render={<Button>snap points</Button>} />
          <Vault.Content>
            <Vault.Header title="Now playing" />
            <Vault.Body>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <p key={i} className="text-q-body-sm-regular text-q-text-secondary">{`${i + 1}. ${LOREM}`}</p>
                ))}
              </div>
            </Vault.Body>
          </Vault.Content>
        </Vault.Root>
      </div>
    )
  },
}

/**
 * Rich variants — the header / footer slots composing other quanta components:
 * an Avatar in the header `start`, a Badge in the header `end`, SwitchLabel rows
 * in the body, and a full-width Button via the footer `full` prop.
 */
export const RichVariants: Story = {
  render: function RichVariantsStory() {
    const [notify, setNotify] = useState(true)
    const [beta, setBeta] = useState(false)
    return (
      <Vault.Root side="bottom">
        <Vault.Trigger render={<Button>Open account sheet</Button>} />
        <Vault.Content>
          <Vault.Header
            title="Ada Lovelace"
            start={<Avatar size="sm" alt="Ada Lovelace" />}
            end={<Badge variant="lime">Pro</Badge>}
          />
          <Vault.Body>
            <div className="flex flex-col divide-y divide-q-border-subtle">
              <SwitchLabel
                direction="right"
                size="md"
                label="Email notifications"
                description="Product updates and tips."
                className="py-3"
                switchProps={{ checked: notify, onCheckedChange: setNotify }}
              />
              <SwitchLabel
                direction="right"
                size="md"
                label="Beta features"
                description="Try things before release."
                color="success"
                className="py-3"
                switchProps={{ checked: beta, onCheckedChange: setBeta }}
              />
            </div>
          </Vault.Body>
          <Vault.Footer full actions={<Vault.Close render={<Button variant="secondary" className="w-full">Manage plan</Button>} />} />
        </Vault.Content>
      </Vault.Root>
    )
  },
}
