import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Card } from '../src/components/card/index.ts'
import { CloseButton } from '../src/components/close-button/index.ts'

/**
 * CloseButton — round dismiss control, pixel-matched to Figma node 2052:109.
 * Sizes 24/32/40/48 (`sm`/`md`/`lg`/`xl`). States: default (white-5% + secondary
 * icon), hover (stronger fill + primary icon), focus (lime ring). Tab to a button
 * to see the focus ring; hover for the brighter state.
 */
const meta: Meta<typeof CloseButton> = {
  title: 'Components/CloseButton',
  component: CloseButton,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof CloseButton>

/** A glass-ish surface to read the faint disc against (as in a modal header). */
function Surface({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-q-border-subtle bg-q-background-glass p-4 backdrop-blur-[40px]">
      {children}
    </div>
  )
}

export const Playground: Story = {
  args: { size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
  },
  render: args => (
    <Surface>
      <CloseButton {...args} />
    </Surface>
  ),
}

/** The four Figma sizes — 24 / 32 / 40 / 48. */
export const Variants: Story = {
  render: () => (
    <Surface>
      {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
        <div key={size} className="flex flex-col items-center gap-2">
          <CloseButton size={size} />
          <span className="text-q-caption-xs-regular text-q-text-tertiary">{size}</span>
        </div>
      ))}
    </Surface>
  ),
}

/**
 * In context — composed into a `Card.Header` as the trailing action (the canonical
 * placement), and overlaid on a media tile, the two most common usages.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Card elevation="raised" className="w-[360px]">
        <Card.Header title="Share project" description="Anyone with the link" actions={<CloseButton size="md" />} />
      </Card>

      <div className="relative size-40 overflow-hidden rounded-2xl bg-q-overlay-dim-soft">
        <CloseButton size="sm" className="absolute right-2 top-2" />
      </div>
    </div>
  ),
}
