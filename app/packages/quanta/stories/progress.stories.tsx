import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Avatar } from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Button } from '../src/components/button/index.ts'
import { Card } from '../src/components/card/index.ts'
import { Progress, type ProgressColor, type ProgressSize } from '../src/components/progress/index.ts'

/**
 * Progress — animated indicator. Linear forms: continuous `bar` (determinate or
 * indeterminate), `line` segments, `dots` waypoints. Circular forms (`shape`):
 * a ring, a segmented ring, a dotted ring. Sizes xxs / xs / sm / md / lg. The
 * accent comes from the slot system (`color`); circular shapes take a center
 * label via `children`.
 */
const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  args: { value: 60, max: 100, variant: 'bar', shape: 'linear', steps: 4, size: 'md', color: 'brand' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['bar', 'line', 'dots'] },
    shape: { control: 'inline-radio', options: ['linear', 'circular'] },
    size: { control: 'inline-radio', options: ['xxs', 'xs', 'sm', 'md', 'lg'] },
    color: { control: 'select', options: ['brand', 'neutral', 'success', 'error', 'warning', 'info'] },
  },
  // w-fit so the dark surface hugs whatever width each story sizes itself to
  // (a single bar, the 640px matrix, the rich layouts) — no overflow past it.
  decorators: [Story => <div className="w-fit bg-q-background-primary p-8"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof Progress>

const COLORS: ProgressColor[] = ['brand', 'neutral', 'success', 'error', 'warning', 'info']
const SIZES: ProgressSize[] = ['xxs', 'xs', 'sm', 'md', 'lg']

/** Playground — a single Progress wired to the Storybook controls. */
export const Playground: Story = {
  render: args => <div className="w-[420px]"><Progress {...args} /></div>,
}

function Section({ heading, children }: { heading: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-q-label-sm-medium text-q-text-secondary">{heading}</span>
      {children}
    </div>
  )
}

/**
 * Variants — the three forms (bar / line / dots) in both shapes (linear +
 * circular), the size scale, the slot-colour palette, and an indeterminate bar
 * and ring.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex w-[640px] flex-col gap-10">
      <Section heading="bar · line · dots (linear)">
        <div className="flex flex-col gap-5">
          {[25, 60, 100].map(v => <Progress key={v} value={v} aria-label={`bar ${v}`} />)}
          <Progress variant="line" steps={5} value={60} aria-label="line" />
          <Progress variant="dots" steps={20} value={55} aria-label="dots" />
          <Progress aria-label="indeterminate" />
        </div>
      </Section>

      <Section heading="circular (ring · segmented · dotted)">
        <div className="flex items-center gap-6">
          {[25, 60, 100].map(v => (
            <Progress key={v} shape="circular" value={v} aria-label={`ring ${v}`}>
              <span className="text-q-caption-sm-medium text-q-text-primary">{v}</span>
            </Progress>
          ))}
          <Progress shape="circular" variant="line" steps={6} value={60} color="success" aria-label="segmented" />
          <Progress shape="circular" variant="dots" steps={12} value={50} color="warning" aria-label="dotted" />
          <Progress shape="circular" aria-label="spinning" color="info" />
        </div>
      </Section>

      <Section heading="sizes (xxs → lg)">
        {(['bar', 'line', 'dots'] as const).map(variant => (
          <div key={variant} className="flex flex-col gap-3">
            {SIZES.map(size => <Progress key={size} variant={variant} size={size} steps={4} value={62} aria-label={`${variant} ${size}`} />)}
          </div>
        ))}
      </Section>

      <Section heading="slot colours">
        <div className="flex flex-col gap-4">
          {COLORS.map(color => <Progress key={color} color={color} value={68} aria-label={color} />)}
        </div>
      </Section>
    </div>
  ),
}

/**
 * Rich variants — Progress composing (and composed by) other quanta components:
 * an Avatar inside a circular ring (the center `children` slot), a completion
 * ring badged "Done", and an upload Card with a bar plus a Button.
 */
export const RichVariants: Story = {
  render: () => {
    const [v, setV] = useState(0)
    useEffect(() => {
      const t = setInterval(() => setV(prev => (prev >= 100 ? 0 : prev + 4)), 250)
      return () => clearInterval(t)
    }, [])
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          {/* center `children` slot composes an Avatar — a profile-completion ring */}
          <div className="flex flex-col items-center gap-2">
            <Progress shape="circular" size="lg" value={72} color="brand" aria-label="Profile 72% complete">
              <Avatar size="md" alt="Ada Lovelace" />
            </Progress>
            <span className="text-q-caption-sm-regular text-q-text-tertiary">72% complete</span>
          </div>

          {/* center slot composes a Badge at 100% */}
          <div className="flex flex-col items-center gap-2">
            <Progress shape="circular" size="lg" value={100} color="success" aria-label="Done">
              <Badge variant="lime">Done</Badge>
            </Progress>
            <span className="text-q-caption-sm-regular text-q-text-tertiary">Verification</span>
          </div>
        </div>

        {/* Progress composed INTO a Card, alongside a Button */}
        <Card className="w-[360px]">
          <Card.Header title="Uploading render" description="scene-final-4k.mp4" />
          <Card.Body>
            <div className="flex flex-col gap-2">
              <Progress value={v} aria-label="Upload progress" />
              <span className="text-q-caption-sm-regular text-q-text-tertiary">{v}% · 18.4 MB / 25 MB</span>
            </div>
          </Card.Body>
          <Card.Footer actions={<Button variant="tertiary" size="sm">Cancel</Button>} />
        </Card>
      </div>
    )
  },
}
