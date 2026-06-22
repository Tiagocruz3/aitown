import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { Button } from '../src/components/button/index.ts'
import { Loader } from '../src/components/loader/index.ts'

/**
 * Loader — slot-tinted indeterminate indicator with four motifs: dots blinking
 * around a circle, a spinning ring, twinkling sparkles, and an accent gloss
 * sweep. Colour comes from the slot system, so it follows light/dark and any
 * `defineTheme()` brand.
 */
const meta: Meta<typeof Loader> = {
  title: 'Components/Loader',
  component: Loader,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof Loader>

const VARIANTS = ['dots', 'circle', 'stars', 'shine'] as const
const SIZES = ['xxs', 'xs', 'sm', 'md', 'lg'] as const
const COLORS = ['brand', 'neutral', 'success', 'error', 'warning', 'info'] as const

function Cell({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid h-14 place-items-center">{children}</div>
      <span className="text-q-caption-xs-regular text-q-text-tertiary">{label}</span>
    </div>
  )
}

export const Playground: Story = {
  args: { variant: 'circle', size: 'md', color: 'brand', animated: true },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: SIZES },
    color: { control: 'inline-radio', options: COLORS },
    animated: { control: 'boolean' },
  },
  render: args => <Loader {...args} />,
}

/** Every motif across all five sizes (xxs / xs / sm / md / lg), plus slot colours. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <div
        className="grid items-center gap-x-6 gap-y-5"
        style={{ gridTemplateColumns: `auto repeat(${SIZES.length}, 4rem)` }}
      >
        {/* Header row: size labels. */}
        <span />
        {SIZES.map(size => (
          <span key={size} className="text-center text-q-caption-xs-regular text-q-text-tertiary">{size}</span>
        ))}
        {/* One row per motif. */}
        {VARIANTS.map(variant => (
          <Fragment key={variant}>
            <span className="text-q-caption-sm-medium text-q-text-secondary">{variant}</span>
            {SIZES.map(size => (
              <div key={size} className="grid h-12 place-items-center">
                {/* shine's track is background-tertiary (= canvas) — outline it so the tile reads. */}
                <Loader variant={variant} size={size} aria-label={`${variant} ${size}`} className={variant === 'shine' ? 'border border-q-border-subtle' : undefined} />
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      {/* Slot colours (shown on the square dots). */}
      <div className="flex items-end gap-6">
        {COLORS.map(color => <Cell key={color} label={color}><Loader variant="dots" size="lg" color={color} /></Cell>)}
      </div>
    </div>
  ),
}

/**
 * In context — a busy button (spinner), a generating "AI" card (stars), a
 * loading media tile (shine), and a centered page loader (dots).
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-stretch gap-4">
      {/* loading button — Loader composes into Button's `start` slot */}
      <Button variant="secondary" disabled start={<Loader variant="circle" size="sm" color="neutral" aria-label="Saving" />}>
        Saving…
      </Button>

      <div className="flex w-56 flex-col items-center justify-center gap-3 rounded-2xl border border-q-border-subtle bg-q-background-glass p-6 text-center backdrop-blur-[40px]">
        <Loader variant="stars" size="lg" />
        <span className="text-q-body-sm-medium text-q-text-primary">Generating…</span>
        <span className="text-q-caption-sm-regular text-q-text-tertiary">Conjuring your scene</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Loader key={i} variant="shine" size="lg" className="size-[72px] border border-q-border-subtle" aria-label="Loading image" />)}
      </div>

      <div className="grid w-40 place-items-center rounded-2xl bg-q-background-secondary p-6">
        <Loader variant="dots" size="lg" />
      </div>
    </div>
  ),
}
