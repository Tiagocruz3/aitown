import type { Meta, StoryObj } from '@storybook/react-vite'
import type { SVGProps } from 'react'
import { Loader } from '../src/components/loader/index.ts'
import { Textarea } from '../src/components/textarea/index.ts'

/** Figma placeholder glyph (form-circle) for the affix slots. */
function CircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

/** Pixel-matched to the Figma TextArea (node 2134:76). */
const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  decorators: [Story => <div className="w-[280px] p-6"><Story /></div>],
  args: {
    label: 'Title',
    placeholder: 'Add description',
    description: 'We\'ll never share this with anyone else',
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    rows: { control: 'number' },
  },
}
export default meta
type Story = StoryObj<typeof Textarea>

/** Playground — a single interactive Textarea wired to Storybook controls. */
export const Playground: Story = {}

/** The Figma TextArea state matrix: placeholder · filled · focus · error · disabled. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Textarea label="Title" placeholder="Add description" description="We'll never share this with anyone else" />
      <Textarea label="Title" defaultValue="John" description="We'll never share this with anyone else" />
      <Textarea label="Title" autoFocus placeholder="" description="We'll never share this with anyone else" />
      <Textarea label="Title" defaultValue="Mary387" error="Please enter only letters" />
      <Textarea label="Title" placeholder="Add description" description="We'll never share this with anyone else" disabled />
    </div>
  ),
}

/**
 * Rich variants — the start / end affix slots in use: a leading icon, and a
 * trailing quanta Loader as a live "saving…" indicator; plus a taller field.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Textarea label="Bio" required start={<CircleIcon />} placeholder="Type bio here…" description="Shown on your public profile" />
      {/* the end slot composes another quanta component — a Loader spinner (16px fits the 20px affix) */}
      <Textarea
        label="Notes"
        rows={4}
        end={<Loader variant="circle" size="xs" color="neutral" aria-label="Saving" />}
        defaultValue="Draft autosaving…"
        description="Saving as you type"
      />
      <Textarea
        label="Feedback"
        rows={6}
        defaultValue="The new editor is great, but autosave occasionally drops the last paragraph when I switch tabs quickly."
        description="Thanks for helping us improve"
      />
    </div>
  ),
}
