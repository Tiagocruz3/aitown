import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, type BadgeSize, type BadgeVariant } from '../src/components/badge/index.ts'

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  args: {
    text: 'Tag',
    variant: 'blue',
    size: 'xs',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['blue', 'lime', 'pink', 'purple', 'nBrand', 'nBlue'],
    },
    size: { control: 'inline-radio', options: ['xs', 'sm'] },
    text: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

// Figma node 526:456 — skewed caps (Blue/Lime/Pink/Purple) + compact "new" (NBrand/NBlue), sizes xs/sm.
const SKEW_VARIANTS = ['blue', 'lime', 'pink', 'purple'] satisfies BadgeVariant[]
const COMPACT_VARIANTS = ['nBrand', 'nBlue'] satisfies BadgeVariant[]
const SIZES = ['xs', 'sm'] satisfies BadgeSize[]
// The texts the Figma component documents for the skewed caps.
const SKEW_TEXTS = ['New', 'Unlimited', 'Exclusive']

/** Playground — a single interactive Badge wired to Storybook controls. */
export const Playground: Story = {
  render: args => <Badge {...args} />,
}

/** Variants — every Figma variant, in both sizes: skewed caps + compact "new". */
export const Variants: Story = {
  render: () => (
    <div className="inline-flex flex-col gap-8 bg-q-background-primary p-6">
      {SIZES.map(size => (
        <div key={size} className="flex flex-col gap-4">
          <span className="text-q-caption-sm-regular text-q-text-tertiary">{size}</span>
          <div className="flex flex-wrap items-center gap-6">
            {SKEW_VARIANTS.map(variant => <Badge key={variant} variant={variant} size={size} text="Tag" />)}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {COMPACT_VARIANTS.map(variant => <Badge key={variant} variant={variant} size={size} />)}
          </div>
        </div>
      ))}
    </div>
  ),
}

/**
 * Rich variants — the skewed caps across the texts the design documents
 * (New / Unlimited / Exclusive), one row per variant, shown at both sizes,
 * plus the compact markers.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="inline-flex flex-col gap-8 bg-q-background-primary p-6">
      {SIZES.map(size => (
        <div key={size} className="flex flex-col gap-4">
          <span className="text-q-caption-sm-regular text-q-text-tertiary">{size}</span>
          {SKEW_VARIANTS.map(variant => (
            <div key={variant} className="flex items-center gap-6">
              <span className="w-16 text-q-caption-sm-regular text-q-text-tertiary">{variant}</span>
              {SKEW_TEXTS.map(text => <Badge key={text} variant={variant} size={size} text={text} />)}
            </div>
          ))}
          <div className="flex items-center gap-6">
            <span className="w-16 text-q-caption-sm-regular text-q-text-tertiary">compact</span>
            {COMPACT_VARIANTS.map(variant => <Badge key={variant} variant={variant} size={size} />)}
          </div>
        </div>
      ))}
    </div>
  ),
}
