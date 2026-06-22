import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Typography stories — composite utilities `text-q-{role}-{size}-{weight}`.
 *
 * Resize the canvas across 768px / 1280px to verify the @media-driven
 * responsive cascade flips font-size live without re-render.
 */

type Role = 'display' | 'headline' | 'title' | 'body' | 'label' | 'caption' | 'mono'
type Size = 'lg' | 'md' | 'sm'
type Weight = 'black' | 'bold' | 'semi-bold' | 'medium' | 'regular'

const ROLES: Role[] = ['display', 'headline', 'title', 'body', 'label', 'caption', 'mono']
const SIZES: Size[] = ['lg', 'md', 'sm']

// Caption + body + mono use `regular` instead of `bold`. Bold is reserved for
// display/headline/title/label. Build the cross-product but skip combinations
// the codegen didn't emit — verified against tailwind/typography.css.
const VARIANTS: string[] = (() => {
  const out: string[] = []
  for (const role of ROLES) {
    const weights = role === 'body' || role === 'mono'
      ? (['black', 'medium', 'regular', 'semi-bold'] as Weight[])
      : role === 'caption'
        ? (['black', 'medium', 'regular', 'semi-bold'] as Weight[])
        : (['black', 'bold', 'medium', 'semi-bold'] as Weight[])
    const sizes = role === 'caption' ? (['sm'] as Size[]) : SIZES
    for (const size of sizes) {
      for (const weight of weights) {
        out.push(`text-q-${role}-${size}-${weight}`)
      }
    }
  }
  return out
})()

const SAMPLE = 'The quick brown fox jumps over the lazy dog'

interface Props {
  /** Filter rows by role. Leave empty to show everything. */
  role: Role | 'all'
  /** Filter rows by size. */
  size: Size | 'all'
}

function Specimen({ role, size }: Props) {
  const filtered = VARIANTS.filter((cls) => {
    if (role !== 'all' && !cls.startsWith(`text-q-${role}-`))
      return false
    if (size !== 'all' && !cls.includes(`-${size}-`))
      return false
    return true
  })

  return (
    <section className="text-q-text-primary space-y-3">
      {filtered.map(cls => (
        <div key={cls} className="border-b border-q-border-subtle pb-2">
          <code className="text-q-text-tertiary text-q-caption-sm-regular">{cls}</code>
          <div className={cls}>{SAMPLE}</div>
        </div>
      ))}
    </section>
  )
}

const meta: Meta<typeof Specimen> = {
  title: 'Tokens/Typography',
  component: Specimen,
  args: { role: 'all', size: 'all' },
  argTypes: {
    role: { control: 'select', options: ['all', ...ROLES] },
    size: { control: 'select', options: ['all', ...SIZES] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Composite-only typography utilities. Each combines font-family, size, line-height, letter-spacing, and weight. Resize the window to see responsive cascade.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Specimen>

export const All: Story = {}
export const Display: Story = { args: { role: 'display' } }
export const Headline: Story = { args: { role: 'headline' } }
export const Title: Story = { args: { role: 'title' } }
export const Body: Story = { args: { role: 'body' } }
export const Label: Story = { args: { role: 'label' } }
export const Caption: Story = { args: { role: 'caption' } }
export const Mono: Story = { args: { role: 'mono' } }
