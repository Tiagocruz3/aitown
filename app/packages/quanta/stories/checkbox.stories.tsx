import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Checkbox,
  CheckboxLabel,
  type CheckboxColor,
  type CheckboxSize,
} from '../src/components/checkbox/index.ts'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: {
    color: 'brand',
    size: 'md',
  },
  argTypes: {
    color: {
      control: 'inline-radio',
      options: ['brand', 'white'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

// Figma node 481:795: two colors (brand/white) × three sizes × seven states.
const COLORS = ['brand', 'white'] satisfies CheckboxColor[]
const SIZES = ['sm', 'md', 'lg'] satisfies CheckboxSize[]
const STATES = [
  'unchecked',
  'hover',
  'checked',
  'checked_focused',
  'disabled',
  'indeterminate',
  'indeterminate_disabled',
] as const

function CheckboxState({
  color,
  size,
  state,
}: {
  color: CheckboxColor
  size: CheckboxSize
  state: (typeof STATES)[number]
}) {
  const isChecked = state === 'checked' || state === 'checked_focused' || state === 'disabled'
  const isIndeterminate = state === 'indeterminate' || state === 'indeterminate_disabled'
  const isDisabled = state === 'disabled' || state === 'indeterminate_disabled'
  // Hover/focus are pseudo-states; force them with helper classes for the showcase.
  const className = state === 'hover'
    ? 'q-checkbox-story-hover'
    : state === 'checked_focused'
      ? 'q-checkbox-story-focus'
      : undefined

  return (
    <Checkbox
      aria-label={`${color} ${size} ${state}`}
      color={color}
      size={size}
      defaultChecked={isChecked}
      indeterminate={isIndeterminate}
      disabled={isDisabled}
      className={className}
    />
  )
}

/** The full state grid for one color — 3 sizes (rows) × 7 states (cols). */
function StateGrid({ color }: { color: CheckboxColor }) {
  return (
    <div className="flex flex-col gap-2">
      {SIZES.map(size => (
        <div key={`${color}-${size}`} className="grid grid-cols-7 items-center gap-3">
          {STATES.map(state => (
            <CheckboxState key={`${color}-${size}-${state}`} color={color} size={size} state={state} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Playground — a single interactive Checkbox wired to Storybook controls. */
export const Playground: Story = {
  render: args => <Checkbox {...args} aria-label="Playground checkbox" />,
}

/**
 * Variants — the Figma state matrix (brand + white, every size × state) plus
 * the labelled layouts (direction left/right, size sm/md).
 */
export const Variants: Story = {
  render: () => (
    <div className="inline-flex flex-col gap-6 bg-q-background-primary p-6">
      {COLORS.map(color => (
        <div key={color} className="flex flex-col gap-2">
          <span className="text-q-caption-sm-regular text-q-text-tertiary">{color}</span>
          <StateGrid color={color} />
        </div>
      ))}
      <div className="grid max-w-screen-sm grid-cols-2 gap-6 border-t border-q-border-subtle pt-6">
        <CheckboxLabel size="sm" description="Description" checkboxProps={{ defaultChecked: true }} />
        <CheckboxLabel direction="right" size="sm" description="Description" checkboxProps={{ defaultChecked: true }} />
        <CheckboxLabel size="md" description="Description" checkboxProps={{ defaultChecked: true }} />
        <CheckboxLabel direction="right" size="md" description="Description" checkboxProps={{ defaultChecked: true }} />
      </div>
    </div>
  ),
}

/**
 * Rich variants — real-world labelled usage: states with copy, the white
 * color, right-aligned controls, and long wrapping descriptions.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="grid max-w-screen-md grid-cols-2 gap-x-8 gap-y-4 bg-q-background-primary p-6">
      <CheckboxLabel description="Default, not selected" checkboxProps={{ defaultChecked: false }}>
        Unchecked
      </CheckboxLabel>
      <CheckboxLabel description="Selected option" checkboxProps={{ defaultChecked: true }}>
        Checked
      </CheckboxLabel>
      <CheckboxLabel description="Some children selected" checkboxProps={{ indeterminate: true }}>
        Indeterminate
      </CheckboxLabel>
      <CheckboxLabel description="Cannot be changed" checkboxProps={{ defaultChecked: true, disabled: true }}>
        Checked &amp; disabled
      </CheckboxLabel>
      <CheckboxLabel size="md" color="white" description="White accent" checkboxProps={{ defaultChecked: true }}>
        White color
      </CheckboxLabel>
      <CheckboxLabel
        direction="right"
        size="md"
        description="Visible to other members of your workspace."
        checkboxProps={{ defaultChecked: true }}
      >
        Share usage analytics
      </CheckboxLabel>
      <CheckboxLabel
        description="By enabling this, generated content may be reviewed by our team to improve model quality. This applies to every project in the workspace and can be changed later."
        checkboxProps={{ defaultChecked: false }}
      >
        Allow my prompts to be used for model training and quality review
      </CheckboxLabel>
      <CheckboxLabel
        direction="right"
        description="Includes export, billing history, and audit logs across all connected organizations."
        checkboxProps={{ defaultChecked: true }}
      >
        Grant administrator access to organization-wide data
      </CheckboxLabel>
    </div>
  ),
}
