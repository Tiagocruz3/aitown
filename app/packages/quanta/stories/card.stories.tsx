import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Button } from '../src/components/button/index.ts'
import { Card } from '../src/components/card/index.ts'
import { CloseButton } from '../src/components/close-button/index.ts'

/**
 * Card — the shared glass/solid surface (consolidates the recipe Modal / Vault /
 * Sonner / Dropdown / cmdk / NavigationMenu each build inline). Rendered over a
 * colourful backdrop so the glass + blur read.
 */
function PageBackdrop() {
  const tiles = ['bg-q-palette-orange-bg', 'bg-q-palette-mint-bg', 'bg-q-palette-blue-bg', 'bg-q-palette-pink-bg', 'bg-q-palette-purple-bg', 'bg-q-brand-yellow']
  return (
    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
      {Array.from({ length: 24 }).map((_, i) => <div key={i} className={tiles[(i * 5 + i % 6) % tiles.length]} />)}
    </div>
  )
}

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'fullscreen' },
  decorators: [Story => (
    <div className="relative min-h-screen overflow-hidden">
      <PageBackdrop />
      <div className="relative grid min-h-screen place-items-center p-10"><Story /></div>
    </div>
  )],
}
export default meta
type Story = StoryObj<typeof Card>

const LOREM = 'A reusable glass surface — background-glass + a 40px backdrop blur, a thin subtle border, and the inner-white sheen. Compose Header / Body / Footer, or drop in any content.'

/** A single glass card with header, body and footer. */
export const Playground: Story = {
  render: () => (
    <Card className="w-[26rem]">
      <Card.Header title="Share project" description="Anyone with the link can view" actions={<CloseButton size="sm" />} />
      <Card.Body><p className="text-q-body-md-regular text-q-text-secondary">{LOREM}</p></Card.Body>
      <Card.Footer actions={<Button variant="secondary" size="sm">Done</Button>} />
    </Card>
  ),
}

function Cell({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-q-caption-sm-medium text-q-text-on-overlay">{label}</span>
      {children}
    </div>
  )
}

/** Surface (glass · solid) × elevation (flat · raised). */
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <Cell label="glass · flat">
        <Card className="h-28 w-56" />
      </Cell>
      <Cell label="glass · raised">
        <Card elevation="raised" className="h-28 w-56" />
      </Cell>
      <Cell label="solid · flat">
        <Card surface="solid" className="h-28 w-56" />
      </Cell>
      <Cell label="solid · raised">
        <Card surface="solid" elevation="raised" className="h-28 w-56" />
      </Cell>
    </div>
  ),
}

/** Rich compositions — header+body+footer, body-only, and a nested card. */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <Card elevation="raised" className="w-[24rem]">
        <Card.Header title="Export" description="Render and download your video" actions={<CloseButton size="sm" />} />
        <Card.Body><p className="text-q-body-sm-regular text-q-text-secondary">{LOREM}</p></Card.Body>
        <Card.Footer actions={(
          <>
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm">Export</Button>
          </>
        )}
        />
      </Card>

      {/* render → a clickable <a> card; the whole surface is the link. */}
      <Card render={<a href="#" />} elevation="raised" className="block w-[18rem] no-underline">
        <Card.Body>
          <div className="flex flex-col gap-1">
            <span className="text-q-body-md-semi-bold text-q-text-primary">Link card</span>
            <span className="text-q-body-sm-regular text-q-text-secondary">render={'{'}&lt;a href/&gt;{'}'} — the whole card is the anchor.</span>
          </div>
        </Card.Body>
      </Card>

      <Card surface="solid" className="w-[20rem]">
        <Card.Header title="Settings" />
        <Card.Body>
          <Card surface="glass" elevation="raised" className="p-4">
            <span className="text-q-body-sm-regular text-q-text-secondary">A nested glass card on a solid card.</span>
          </Card>
        </Card.Body>
      </Card>
    </div>
  ),
}
