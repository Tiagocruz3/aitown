import type { Meta, StoryObj } from '@storybook/react-vite'
import { useCallback, useState } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import { Chip, type ChipColor, type ChipSize } from '../src/components/chip/index.ts'
import { CheckIcon, SparklesIcon } from '../src/components/menu/icons.tsx'

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  args: {
    children: 'Chip',
    color: 'brand',
    selected: false,
    size: 'sm',
  },
  argTypes: {
    color: { control: 'select', options: ['brand', 'neutral', 'success', 'error', 'warning', 'info'] },
    size: { control: 'inline-radio', options: ['xxs', 'xs', 'sm', 'md'] },
  },
}

export default meta
type Story = StoryObj<typeof Chip>

const COLORS = ['brand', 'neutral', 'success', 'error', 'warning', 'info'] satisfies ChipColor[]
const SIZES = ['xxs', 'xs', 'sm', 'md'] satisfies ChipSize[]

function SelectableChip({ color }: { color: ChipColor }) {
  const [selected, setSelected] = useState(color === 'brand')
  const toggle = useCallback(() => setSelected(v => !v), [])
  return <Chip color={color} selected={selected} onClick={toggle}>{color}</Chip>
}

/** A single interactive chip wired to controls. */
export const Playground: Story = {
  render: args => <Chip {...args} />,
}

/** Colors × states (default / selected / disabled), plus the size ramp. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {COLORS.map(color => <Chip key={color} color={color}>{color}</Chip>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {COLORS.map(color => <SelectableChip key={color} color={color} />)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {COLORS.map(color => <Chip key={color} color={color} disabled>{color}</Chip>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {SIZES.map(size => <Chip key={size} size={size} selected>{size}</Chip>)}
      </div>
    </div>
  ),
}

/** Rich — start / end slots composing OTHER quanta components (icon + count Badge). */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {COLORS.map(color => <Chip key={color} color={color} selected start={<CheckIcon />}>{color}</Chip>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Chip start={<SparklesIcon />}>Effects</Chip>
        <Chip selected start={<SparklesIcon />} end={<Badge variant="nBrand" text="new" />}>Models</Chip>
        <Chip color="info" end={<Badge variant="nBlue" text="12" />}>Updates</Chip>
        <Chip size="md" selected start={<CheckIcon />} end={<Badge variant="nBrand" text="3" />}>Selected</Chip>
      </div>
    </div>
  ),
}
