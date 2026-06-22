import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Dot } from '../src/components/dot/index.ts'
import { Kbd } from '../src/components/kbd/index.ts'
import { Tag } from '../src/components/tag/index.ts'
import type { SlotColor } from '../src/components/utils/slot.ts'

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  args: { color: 'neutral', children: 'Label' },
  argTypes: {
    color: { control: 'select', options: ['brand', 'neutral', 'success', 'error', 'warning', 'info'] },
    children: { control: 'text' },
    start: { control: false },
    end: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof Tag>

const COLORS: SlotColor[] = ['brand', 'neutral', 'success', 'error', 'warning', 'info']

/** Playground — a single Tag wired to the Storybook controls. */
export const Playground: Story = {
  render: args => <Tag {...args} />,
}

/** Variants — the slot-colour palette, plain and removable. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {COLORS.map(color => <Tag key={color} color={color}>{color}</Tag>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {COLORS.map(color => <Tag key={color} color={color} onRemove={() => {}}>{color}</Tag>)}
      </div>
    </div>
  ),
}

/**
 * Rich variants — the start / end slots composing other quanta components: a
 * Dot status, an Avatar person tag, a trailing count Badge, and a Kbd shortcut.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {/* start slot → a Dot status marker */}
      <Tag color="success" start={<Dot color="green" />}>Online</Tag>
      <Tag color="error" start={<Dot color="red" />} onRemove={() => {}}>Failed</Tag>

      {/* start slot → an Avatar (person / owner tag) */}
      <Tag start={<Avatar size="xs" alt="Ada Lovelace" />} onRemove={() => {}}>Ada Lovelace</Tag>

      {/* end slot → a trailing count Badge */}
      <Tag color="brand" end={<Badge variant="lime">3</Badge>}>Mentions</Tag>

      {/* end slot → a Kbd shortcut hint */}
      <Tag color="info" end={<Kbd>⌘F</Kbd>}>Filter</Tag>
    </div>
  ),
}
