import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import { Card } from '../src/components/card/index.ts'
import { Switch, SwitchLabel, type SwitchSize } from '../src/components/switch/index.ts'
import type { SlotColor } from '../src/components/utils/slot.ts'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  args: { checked: false, disabled: false, size: 'default' },
  argTypes: {
    color: { control: 'select', options: ['brand', 'neutral', 'success', 'error', 'warning', 'info'] },
    size: { control: 'select', options: ['small', 'medium', 'default'] },
  },
}
export default meta
type Story = StoryObj<typeof Switch>

const SIZES: SwitchSize[] = ['small', 'medium', 'default']
const COLORS: SlotColor[] = ['brand', 'neutral', 'success', 'error', 'warning', 'info']
const STATES = [
  { checked: true, disabled: false, label: 'Checked' },
  { checked: false, disabled: false, label: 'Unchecked' },
  { checked: true, disabled: true, label: 'Checked disabled' },
  { checked: false, disabled: true, label: 'Unchecked disabled' },
] satisfies Array<{ checked: boolean, disabled: boolean, label: string }>

function Row({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-12 items-center gap-3">{children}</div>
      <span className="text-q-body-md-regular text-q-text-secondary">{label}</span>
    </div>
  )
}

/** Playground — a single Switch wired to the Storybook controls. */
export const Playground: Story = {
  render: args => <Switch {...args} />,
}

/**
 * Variants — the three sizes × four states, the slot-colour palette, and the
 * labelled layouts (direction left/right, size sm/md).
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 bg-q-background-primary p-6">
      <div className="flex flex-col gap-6">
        {SIZES.map(size => (
          <section key={size} className="flex flex-col gap-3">
            <h3 className="text-q-label-md-medium text-q-text-secondary capitalize">{size}</h3>
            {STATES.map(state => (
              <Row key={`${size}-${state.label}`} label={state.label}>
                <Switch size={size} checked={state.checked} disabled={state.disabled} />
              </Row>
            ))}
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-q-border-subtle pt-6">
        <span className="text-q-caption-sm-regular text-q-text-tertiary">slot colours</span>
        {COLORS.map(color => (
          <Row key={color} label={color}>
            <Switch color={color} checked />
            <Switch color={color} />
          </Row>
        ))}
      </div>

      <div className="grid max-w-screen-sm grid-cols-2 gap-6 border-t border-q-border-subtle pt-6">
        <SwitchLabel size="sm" label="Left · sm" description="Description" switchProps={{ checked: true }} />
        <SwitchLabel direction="right" size="sm" label="Right · sm" description="Description" switchProps={{ checked: true }} />
        <SwitchLabel size="md" label="Left · md" description="Description" switchProps={{ checked: true }} />
        <SwitchLabel direction="right" size="md" label="Right · md" description="Description" switchProps={{ checked: true }} />
      </div>
    </div>
  ),
}

/**
 * Rich variants — a real settings group: SwitchLabel rows inside a Card, with a
 * title that composes a quanta Badge, right-aligned controls, and a disabled
 * (admin-locked) row.
 */
export const RichVariants: Story = {
  render: function RichVariantsStory() {
    const [values, setValues] = useState({ streaming: true, beta: false, compact: false, admin: true })
    const set = (k: keyof typeof values) => (v: boolean) => setValues(prev => ({ ...prev, [k]: v }))
    return (
      <Card className="w-[420px]">
        <Card.Header title="Preferences" description="Applies across this workspace" />
        <Card.Body>
          <div className="flex flex-col divide-y divide-q-border-subtle">
            <SwitchLabel
              direction="right"
              size="md"
              label="Model streaming"
              description="Stream tokens as they are generated."
              className="py-3"
              switchProps={{ checked: values.streaming, onCheckedChange: set('streaming') }}
            />
            <SwitchLabel
              direction="right"
              size="md"
              label={<span className="flex items-center gap-2">Beta features <Badge variant="lime">New</Badge></span>}
              description="Try experimental tools before release."
              color="success"
              className="py-3"
              switchProps={{ checked: values.beta, onCheckedChange: set('beta') }}
            />
            <SwitchLabel
              direction="right"
              size="md"
              label="Compact responses"
              description="Trim whitespace and shorten replies."
              className="py-3"
              switchProps={{ checked: values.compact, onCheckedChange: set('compact') }}
            />
            <SwitchLabel
              direction="right"
              size="md"
              label="Admin-locked setting"
              description="Managed by your workspace administrator."
              className="py-3"
              switchProps={{ checked: values.admin, disabled: true }}
            />
          </div>
        </Card.Body>
      </Card>
    )
  },
}
