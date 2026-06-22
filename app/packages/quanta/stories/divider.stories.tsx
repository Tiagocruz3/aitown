import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../src/components/badge/index.ts'
import { Chip } from '../src/components/chip/index.ts'
import { Divider } from '../src/components/divider/index.ts'

const meta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
  args: {
    orientation: 'horizontal',
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    children: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Divider>

/** Playground — the etched divider; add a label via the `children` control. */
export const Playground: Story = {
  render: args => (
    <div className="w-96 bg-q-background-primary p-6">
      <Divider {...args}>{args.children}</Divider>
    </div>
  ),
}

/** Variants — horizontal, labelled, and vertical (stretching in a flex row). */
export const Variants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-6 bg-q-background-primary p-6">
      <Divider />
      <Divider>or</Divider>
      <div className="flex items-center gap-4">
        <span className="text-q-body-md-regular text-q-text-primary">Left</span>
        <Divider orientation="vertical" className="h-5" />
        <span className="text-q-body-md-regular text-q-text-primary">Right</span>
      </div>
    </div>
  ),
}

/** Rich variants — real-world usage: a settings list and a horizontal toolbar. */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 bg-q-background-primary p-6">
      <div className="flex w-80 flex-col rounded-2xl bg-q-background-secondary p-2">
        {['Profile', 'Notifications', 'Billing', 'Security'].map((item, i, arr) => (
          <div key={item}>
            <div className="px-3 py-2 text-q-body-md-regular text-q-text-primary">{item}</div>
            {i < arr.length - 1 ? <Divider /> : null}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-q-background-secondary px-3 py-2">
        <span className="text-q-label-sm-medium text-q-text-secondary">Edit</span>
        <Divider orientation="vertical" className="h-4" />
        <span className="text-q-label-sm-medium text-q-text-secondary">Duplicate</span>
        <Divider orientation="vertical" className="h-4" />
        <span className="text-q-label-sm-medium text-q-text-secondary">Delete</span>
      </div>

      {/* The label slot is any ReactNode — compose other quanta components. */}
      <div className="flex w-96 flex-col gap-6">
        <Divider>continue with</Divider>
        <Divider><Badge variant="nBrand" text="new" /></Divider>
        <Divider><Chip size="xs">Filters</Chip></Divider>
      </div>
    </div>
  ),
}
