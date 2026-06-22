import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import { Card } from '../src/components/card/index.ts'
import { Slider } from '../src/components/slider/index.ts'

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  args: { 'aria-label': 'Size', 'mode': 'stepped', 'steps': 3, 'defaultValue': 0 },
  argTypes: {
    mode: { control: 'radio', options: ['stepped', 'continuous'] },
    steps: { control: { type: 'number', min: 2, max: 8 } },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Slider>

/** Playground — a single Slider wired to the Storybook controls. */
export const Playground: Story = {
  render: args => (
    <div className="bg-q-background-primary p-6">
      <Slider {...args} />
    </div>
  ),
}

function Field({ label, value, children }: { label: string, value?: string, children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-q-caption-sm-medium text-q-text-secondary">{label}</span>
        {value != null ? <span className="text-q-caption-sm-regular text-q-text-tertiary tabular-nums">{value}</span> : null}
      </div>
      {children}
    </div>
  )
}

/**
 * Variants — stepped (variable notch counts), continuous free drag, continuous
 * with snap + ticks, a negative range, and the disabled state.
 */
export const Variants: Story = {
  render: function VariantsStory() {
    const [vol, setVol] = useState(35)
    const [bright, setBright] = useState(50)
    const [tone, setTone] = useState(0)
    return (
      <div className="flex w-[320px] flex-col gap-6 bg-q-background-primary p-6">
        <Field label="Stepped — 2 / 3 / 5 / 7 notches">
          <div className="flex flex-col gap-3">
            {[2, 3, 5, 7].map(n => (
              <Slider key={n} aria-label={`${n}-step`} steps={n} defaultValue={Math.floor(n / 2)} className="w-full" />
            ))}
          </div>
        </Field>
        <Field label="Continuous — free drag" value={`${vol.toFixed(0)} / 100`}>
          <Slider mode="continuous" aria-label="Volume" min={0} max={100} value={vol} onChange={setVol} className="w-full" />
        </Field>
        <Field label="Continuous — snap 5 + ticks" value={`${bright}`}>
          <Slider mode="continuous" aria-label="Brightness" min={0} max={100} step={5} value={bright} onChange={setBright} showTicks steps={11} className="w-full" />
        </Field>
        <Field label="Continuous — negative range" value={tone >= 0 ? `+${tone}` : `${tone}`}>
          <Slider mode="continuous" aria-label="Tone" min={-50} max={50} step={1} value={tone} onChange={setTone} className="w-full" />
        </Field>
        <Field label="Disabled">
          <Slider aria-label="Disabled" steps={3} defaultValue={1} disabled className="w-full" />
        </Field>
      </div>
    )
  },
}

/**
 * Rich variants — Sliders composed into a quanta Card settings panel, each row
 * pairing a Slider with a live value readout (a Badge for the stepped size, the
 * percentage / signed value for the continuous ones).
 */
export const RichVariants: Story = {
  render: function RichVariantsStory() {
    const [size, setSize] = useState(1)
    const [volume, setVolume] = useState(60)
    const [tone, setTone] = useState(0)
    const sizeLabel = ['Small', 'Medium', 'Large'][size]
    return (
      <Card className="w-[360px]">
        <Card.Header title="Display settings" description="Tune the canvas to your taste" />
        <Card.Body>
          <div className="flex flex-col gap-6">
            <Field label="Card size">
              <div className="flex items-center gap-3">
                <Slider aria-label="Card size" steps={3} value={size} onChange={setSize} className="w-full" />
                <Badge variant="lime" className="shrink-0">{sizeLabel}</Badge>
              </div>
            </Field>
            <Field label="Volume" value={`${volume.toFixed(0)}%`}>
              <Slider mode="continuous" aria-label="Volume" min={0} max={100} value={volume} onChange={setVolume} className="w-full" />
            </Field>
            <Field label="Tone" value={tone >= 0 ? `+${tone}` : `${tone}`}>
              <Slider mode="continuous" aria-label="Tone" min={-12} max={12} step={1} value={tone} onChange={setTone} showTicks steps={25} className="w-full" />
            </Field>
          </div>
        </Card.Body>
      </Card>
    )
  },
}
