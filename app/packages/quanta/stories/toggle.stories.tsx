import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../src/components/badge/index.ts'
import { Kbd } from '../src/components/kbd/index.ts'
import { CheckIcon, ImageIcon, SunburstIcon } from '../src/components/menu/icons.tsx'
import { Toggle } from '../src/components/toggle/index.ts'
import type { SlotColor } from '../src/components/utils/slot.ts'

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  args: { color: 'brand', size: 'md', children: 'Toggle' },
  argTypes: {
    color: { control: 'select', options: ['brand', 'neutral', 'success', 'error', 'warning', 'info'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    children: { control: 'text' },
    defaultPressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
    start: { control: false },
    end: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof Toggle>

const COLORS: SlotColor[] = ['brand', 'neutral', 'success', 'error', 'warning', 'info']
const SIZES = ['sm', 'md', 'lg'] as const

/** Playground — a single Toggle wired to the Storybook controls. */
export const Playground: Story = {
  render: args => <Toggle {...args} />,
}

/** Variants — states (off / pressed / disabled), the size scale, and slot colours. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Toggle>Off</Toggle>
        <Toggle defaultPressed>Pressed</Toggle>
        <Toggle disabled>Disabled</Toggle>
        <Toggle defaultPressed disabled>Pressed disabled</Toggle>
        <Toggle defaultPressed aria-label="Icon only"><CheckIcon /></Toggle>
      </div>
      <div className="flex items-center gap-3">
        {SIZES.map(size => <Toggle key={size} size={size} defaultPressed>{size}</Toggle>)}
      </div>
      <div className="flex items-center gap-3">
        {COLORS.map(color => <Toggle key={color} color={color} defaultPressed>{color}</Toggle>)}
      </div>
    </div>
  ),
}

/**
 * Rich variants — the start / end slots composing other quanta components: a
 * leading icon, a trailing count Badge, and a Kbd shortcut hint.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {/* a filter toolbar — icon in `start`, a count Badge in `end` */}
      <div className="flex items-center gap-2">
        <Toggle defaultPressed start={<SunburstIcon />} end={<Badge variant="lime">12</Badge>}>Featured</Toggle>
        <Toggle start={<ImageIcon />} end={<Badge variant="nBlue">5</Badge>}>Images</Toggle>
        <Toggle start={<CheckIcon />}>Done</Toggle>
      </div>

      {/* a formatting control with a Kbd shortcut hint in `end` */}
      <div className="flex items-center gap-2">
        <Toggle defaultPressed end={<Kbd>⌘B</Kbd>}>Bold</Toggle>
        <Toggle end={<Kbd>⌘I</Kbd>}>Italic</Toggle>
      </div>
    </div>
  ),
}
