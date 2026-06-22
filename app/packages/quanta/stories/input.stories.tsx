import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SVGProps } from 'react'
import { Input } from '../src/components/input/index.ts'
import { Kbd } from '../src/components/kbd/index.ts'

/** Pixel-matched to the Figma TextField (node 342:1354). */
const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  decorators: [Story => <div className="w-[280px] p-6"><Story /></div>],
  args: {
    label: 'Title',
    placeholder: 'John',
    description: 'We\'ll never share this with anyone else',
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    prefix: { control: false },
    suffix: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof Input>

/** Figma placeholder glyph (form-circle) for prefix/suffix slots. */
function CircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Playground — a single interactive Input wired to Storybook controls. */
export const Playground: Story = {
  args: { prefix: <CircleIcon /> },
}

/** The Figma TextField state matrix: placeholder · filled · focus · error · disabled. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Input label="Title" placeholder="John" start={<CircleIcon />} description="We'll never share this with anyone else" />
      <Input label="Title" defaultValue="Mary" start={<CircleIcon />} description="We'll never share this with anyone else" />
      <Input label="Title" autoFocus placeholder="" start={<CircleIcon />} description="We'll never share this with anyone else" />
      <Input label="Title" defaultValue="Mary387" start={<CircleIcon />} error="Please enter only letters" />
      <Input label="Title" placeholder="John" start={<CircleIcon />} description="We'll never share this with anyone else" disabled />
    </div>
  ),
}

/** Rich variants — real-world form usage: required, icons, leading + trailing, plain (no label). */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Input label="Email" required placeholder="you@example.com" start={<CircleIcon />} description="We'll send a confirmation here" />
      {/* the end slot composes another quanta component — a Kbd shortcut pill */}
      <Input label="Search" placeholder="Search…" start={<CircleIcon />} end={<Kbd>⌘K</Kbd>} />
      <Input label="Amount" defaultValue="1000" end={<CircleIcon />} description="USD" />
      <Input aria-label="No label" placeholder="No label, just a field" />
    </div>
  ),
}
