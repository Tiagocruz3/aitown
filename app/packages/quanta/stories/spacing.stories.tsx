import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Spacing stories — visualises the curated `--hf-space-*` scale.
 *
 * 14 named keys, rem-based, 4px grid. Off-scale keys (`p-9`, `p-11`)
 * intentionally don't compile because `tailwind/spacing.css` resets
 * `--spacing: initial` before declaring curated values.
 */

interface Row {
  key: string
  px: number
}

const ROWS: Row[] = [
  { key: '1', px: 4 },
  { key: '2', px: 8 },
  { key: '3', px: 12 },
  { key: '4', px: 16 },
  { key: '5', px: 20 },
  { key: '6', px: 24 },
  { key: '7', px: 28 },
  { key: '8', px: 32 },
  { key: '10', px: 40 },
  { key: '12', px: 48 },
  { key: '14', px: 56 },
  { key: '16', px: 64 },
  { key: '20', px: 80 },
  { key: '24', px: 96 },
]

interface Props {
  /** Visualise utility for the chosen axis. */
  utility: 'p' | 'm' | 'gap' | 'w' | 'h'
}

function Scale({ utility }: Props) {
  return (
    <section className="text-q-text-primary space-y-1 text-q-body-sm-regular">
      <header className="text-q-text-secondary mb-3 text-q-caption-sm-regular">
        Visualising
        {' '}
        <code>
          {utility}
          -*
        </code>
        . Off-scale keys (e.g.
        {' '}
        <code>
          {utility}
          -9
        </code>
        ) don't compile —
        {' '}
        <code>--spacing: initial</code>
        {' '}
        resets the dynamic default.
      </header>
      {ROWS.map(({ key, px }) => (
        <div key={key} className="flex items-center gap-3">
          <code className="w-16 text-q-text-secondary text-q-mono-sm-regular">
            {utility}
            -
            {key}
          </code>
          <div className="bg-q-background-primary border border-q-border-subtle rounded">
            <div
              className="bg-q-brand-primary/30 h-3 rounded-sm"
              style={{ width: `${px}px` }}
            />
          </div>
          <span className="text-q-text-tertiary text-q-caption-sm-regular">
            {px}
            px ·
            {' '}
            {(px / 16).toString()}
            rem
          </span>
        </div>
      ))}
    </section>
  )
}

const meta: Meta<typeof Scale> = {
  title: 'Tokens/Spacing',
  component: Scale,
  args: { utility: 'p' },
  argTypes: {
    utility: {
      control: 'select',
      options: ['p', 'm', 'gap', 'w', 'h'],
      description: 'Tailwind utility prefix to label the rows.',
    },
  },
}

export default meta

type Story = StoryObj<typeof Scale>

export const Padding: Story = { args: { utility: 'p' } }
export const Margin: Story = { args: { utility: 'm' } }
export const Gap: Story = { args: { utility: 'gap' } }
export const Width: Story = { args: { utility: 'w' } }
export const Height: Story = { args: { utility: 'h' } }
