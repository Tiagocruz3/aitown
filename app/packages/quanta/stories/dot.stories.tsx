import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from '../src/components/avatar/index.ts'
import { Dot, type DotColor, type DotSize } from '../src/components/dot/index.ts'

const meta: Meta<typeof Dot> = {
  title: 'Components/Dot',
  component: Dot,
  args: {
    color: 'green',
    size: 'md',
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['green', 'yellow', 'red', 'grey'],
    },
    size: {
      control: 'select',
      options: ['md', 'sm', 'xs'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Dot>

const COLORS: DotColor[] = ['green', 'yellow', 'red', 'grey']
const SIZES: DotSize[] = ['md', 'sm', 'xs']

export const Playground: Story = {
  render: args => <Dot {...args} />,
}

/** The 4 Figma presence colours at the default md size. */
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {COLORS.map(color => <Dot key={color} color={color} label={color} />)}
    </div>
  ),
}

/** Rich reference — the full colour × size matrix, plus the opt-in motion
 * (pulse / glow) across the size ramp. */
export const RichVariants: Story = {
  render: () => (
    <div className="inline-flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        {COLORS.map(color => (
          <div key={color} className="flex h-2 items-center gap-6">
            {SIZES.map(size => <Dot key={size} color={color} size={size} label={`${color} ${size}`} />)}
          </div>
        ))}
      </div>
      {(['pulse', 'glow'] as const).map(animation => (
        <div key={animation} className="flex items-center gap-10">
          {SIZES.map(size => <Dot key={size} size={size} animation={animation} label={`${animation} ${size}`} />)}
        </div>
      ))}

      {/* Dot is a primitive composed INTO other components — e.g. an Avatar's
          rim badge, or an inline presence marker beside a label. */}
      <div className="flex items-center gap-8">
        <Avatar size="lg" alt="Aria Zhang" color="blue" badge={<Dot color="green" size="md" animation="pulse" />} />
        <span className="flex items-center gap-2 text-q-body-sm-medium text-q-text-primary"><Dot color="green" />Online</span>
        <span className="flex items-center gap-2 text-q-body-sm-medium text-q-text-secondary"><Dot color="grey" />Offline</span>
      </div>
    </div>
  ),
}
