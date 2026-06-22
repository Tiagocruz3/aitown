import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import {
  Radio,
  type RadioColor,
  RadioGroup,
  RadioLabel,
  type RadioSize,
} from '../src/components/radio/index.ts'

const meta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  args: { color: 'brand', size: 'md' },
  argTypes: {
    color: { control: 'select', options: ['brand', 'white', 'neutral', 'success', 'error', 'warning', 'info'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
}
export default meta
type Story = StoryObj<typeof Radio>

// Figma ships brand + white; the slot palette adds the status colours.
const FIGMA_COLORS = ['brand', 'white'] satisfies RadioColor[]
const SLOT_COLORS = ['brand', 'white', 'neutral', 'success', 'error', 'warning', 'info'] satisfies RadioColor[]
const SIZES = ['sm', 'md', 'lg'] satisfies RadioSize[]
const STATES = ['unchecked', 'hover', 'checked', 'checked_focused', 'disabled'] as const

/** A single Radio frozen in a given visual state (uses the story hover/focus hooks). */
function RadioState({ color, size, state }: { color: RadioColor, size: RadioSize, state: (typeof STATES)[number] }) {
  const checked = state === 'checked' || state === 'checked_focused' || state === 'disabled'
  const disabled = state === 'disabled'
  const className = state === 'hover'
    ? 'q-radio-story-hover'
    : state === 'checked_focused'
      ? 'q-radio-story-focus'
      : undefined
  return (
    <RadioGroup defaultValue={checked ? 'on' : 'off'} disabled={disabled}>
      <Radio value="on" color={color} size={size} className={className} aria-label={`${color} ${size} ${state}`} />
    </RadioGroup>
  )
}

/** Playground — an interactive group wired to the Storybook controls. */
export const Playground: Story = {
  render: args => (
    <RadioGroup defaultValue="on" className="flex-row">
      <Radio {...args} value="on" aria-label="Selected" />
      <Radio {...args} value="off" aria-label="Unselected" />
    </RadioGroup>
  ),
}

/**
 * Variants — the Figma state matrix (brand + white, every size × state), the
 * full slot-colour palette, and the labelled layouts (direction left/right,
 * size sm/md).
 */
export const Variants: Story = {
  render: () => (
    <div className="inline-flex flex-col gap-8 bg-q-background-primary p-6">
      {FIGMA_COLORS.map(color => (
        <div key={color} className="flex flex-col gap-3">
          <span className="text-q-caption-sm-regular text-q-text-tertiary">{color}</span>
          {SIZES.map(size => (
            <div key={size} className="flex items-center gap-6">
              {STATES.map(state => <RadioState key={state} color={color} size={size} state={state} />)}
            </div>
          ))}
        </div>
      ))}

      <div className="flex flex-col gap-3 border-t border-q-border-subtle pt-6">
        <span className="text-q-caption-sm-regular text-q-text-tertiary">slot colours</span>
        <div className="flex items-center gap-6">
          {SLOT_COLORS.map(color => (
            <RadioGroup key={color} defaultValue="on">
              <Radio value="on" color={color} aria-label={color} />
            </RadioGroup>
          ))}
        </div>
      </div>

      <div className="grid max-w-screen-sm grid-cols-2 gap-6 border-t border-q-border-subtle pt-6">
        <RadioGroup defaultValue="a">
          <RadioLabel value="a" size="sm" label="Left · sm" description="Description" />
        </RadioGroup>
        <RadioGroup defaultValue="a">
          <RadioLabel value="a" direction="right" size="sm" label="Right · sm" description="Description" />
        </RadioGroup>
        <RadioGroup defaultValue="a">
          <RadioLabel value="a" size="md" label="Left · md" description="Description" />
        </RadioGroup>
        <RadioGroup defaultValue="a">
          <RadioLabel value="a" direction="right" size="md" label="Right · md" description="Description" />
        </RadioGroup>
      </div>
    </div>
  ),
}

/**
 * Rich variants — real labelled groups: a shipping picker whose labels compose
 * a quanta Badge, and a right-aligned settings group with a long wrapping
 * description.
 */
export const RichVariants: Story = {
  render: () => {
    const [ship, setShip] = useState('express')
    return (
      <div className="grid max-w-screen-md grid-cols-2 gap-8 bg-q-background-primary p-6">
        <RadioGroup value={ship} onValueChange={setShip} className="w-[320px]">
          <RadioLabel value="standard" size="md" label="Standard" description="Ships in 3–5 business days." />
          <RadioLabel
            value="express"
            size="md"
            label={<span className="flex items-center gap-2">Express <Badge variant="lime" className="shrink-0">Popular</Badge></span>}
            description="Ships next business day."
          />
          <RadioLabel
            value="overnight"
            size="md"
            label={<span className="flex items-center gap-2">Overnight <Badge variant="blue" className="shrink-0">Fastest</Badge></span>}
            description="Delivered by 9am tomorrow."
          />
          <RadioLabel value="pickup" size="md" label="Store pickup" description="Ready in 2 hours." />
        </RadioGroup>

        <RadioGroup defaultValue="all" className="w-[320px]">
          <RadioLabel value="all" direction="right" label="Everyone" />
          <RadioLabel value="team" direction="right" label="Only my team" />
          <RadioLabel
            value="custom"
            direction="right"
            label="Custom audience"
            description="Restrict visibility to specific members, with export, billing history, and audit logs scoped to the people you select."
          />
        </RadioGroup>
      </div>
    )
  },
}
