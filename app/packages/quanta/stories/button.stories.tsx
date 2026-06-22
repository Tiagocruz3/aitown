import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import { Button, type ButtonSize, type ButtonVariant } from '../src/components/button/index.ts'
import { KbdSequence } from '../src/components/kbd/index.ts'
import { CheckIcon, SparklesIcon } from '../src/components/menu/icons.tsx'

const DEFAULT_VARIANTS: ButtonVariant[] = [
  'primary', 'secondary', 'tertiary', 'outline', 'ghost', 'danger', 'dangerSoft', 'brandSoft',
]
const MARKETING_VARIANTS: ButtonVariant[] = [
  'marketingPrimary', 'marketingSecondary', 'marketingTertiary', 'marketingGhost',
]
const SPECIAL_VARIANTS: ButtonVariant[] = ['specialBrand', 'specialPink']
const SIZES: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
// Marketing buttons start at sm — there is no marketing xs in the design.
const MARKETING_SIZES: ButtonSize[] = ['sm', 'md', 'lg', 'xl']

const meta = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Button',
    iconOnly: false,
    size: 'md',
    variant: 'primary',
  },
  argTypes: {
    iconOnly: { control: 'boolean' },
    size: { control: 'select', options: SIZES },
    variant: {
      control: 'select',
      options: [...DEFAULT_VARIANTS, ...MARKETING_VARIANTS, ...SPECIAL_VARIANTS],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// hover/focus are live on the real q-button-*:hover / :focus-visible rules —
// interact with the canvas to see them. No simulated state classes here.

function Board({ children }: { children: ReactNode }) {
  return <div className="flex min-w-max flex-col gap-8">{children}</div>
}

function Section({ children, title }: { children: ReactNode, title: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-q-label-md-semi-bold text-q-text-primary">{title}</h3>
      {children}
    </section>
  )
}

function RowLabel({ children }: { children?: ReactNode }) {
  return <div className="w-44 shrink-0 text-q-caption-sm-medium text-q-text-secondary">{children}</div>
}

function HeaderCell({ children }: { children: ReactNode }) {
  return <div className="min-w-12 text-center text-q-caption-sm-medium text-q-text-secondary">{children}</div>
}

function TextContent({ label }: { label: string }) {
  return (
    <>
      <CheckIcon />
      {label}
      <CheckIcon />
    </>
  )
}

function SpecialContent() {
  return (
    <>
      <span className="q-button-special-label">generate</span>
      <span className="q-button-special-price">
        <SparklesIcon />
        <span className="q-button-special-price-old">12</span>
        <span>3</span>
      </span>
    </>
  )
}

/** Variant rows × size columns. `iconOnly`/`disabled` apply to the whole grid.
 * `sizes` defaults to the full ramp; pass a subset (e.g. marketing has no xs). */
function VariantMatrix({
  disabled = false,
  iconOnly = false,
  sizes = SIZES,
  variants,
}: {
  disabled?: boolean
  iconOnly?: boolean
  sizes?: ButtonSize[]
  variants: ButtonVariant[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <RowLabel />
        {sizes.map(size => <HeaderCell key={size}>{size.toUpperCase()}</HeaderCell>)}
      </div>
      {variants.map(variant => (
        <div key={variant} className="flex items-center gap-3">
          <RowLabel>{variant}</RowLabel>
          {sizes.map(size => (
            <Button
              key={size}
              aria-label={iconOnly ? `${variant} ${size}` : undefined}
              disabled={disabled}
              iconOnly={iconOnly}
              size={size}
              variant={variant}
            >
              {iconOnly ? <CheckIcon /> : <TextContent label={variant} />}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Special buttons own their geometry (size is ignored), so just one per variant. */
function SpecialRow({ disabled = false }: { disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-6">
      {SPECIAL_VARIANTS.map(variant => (
        <div key={variant} className="flex flex-col items-center gap-2">
          <Button disabled={disabled} variant={variant}>
            <SpecialContent />
          </Button>
          <span className="text-q-caption-sm-medium text-q-text-secondary">{variant}</span>
        </div>
      ))}
    </div>
  )
}

export const Playground: Story = {}

/** Every variant at the default md size — the quick visual catalog. */
export const Variants: Story = {
  render: () => (
    <Board>
      <Section title="Default">
        <div className="flex flex-wrap items-center gap-3">
          {DEFAULT_VARIANTS.map(variant => (
            <Button key={variant} variant={variant}><TextContent label={variant} /></Button>
          ))}
        </div>
      </Section>
      <Section title="Marketing">
        <div className="flex flex-wrap items-center gap-3">
          {MARKETING_VARIANTS.map(variant => (
            <Button key={variant} variant={variant}><TextContent label={variant} /></Button>
          ))}
        </div>
      </Section>
      <Section title="Special">
        <SpecialRow />
      </Section>
    </Board>
  ),
}

/** Rich reference — variant rows × size columns, plus icon-only and disabled,
 * across default / marketing / special. */
export const RichVariants: Story = {
  render: () => (
    <Board>
      <Section title="Default — sizes">
        <VariantMatrix variants={DEFAULT_VARIANTS} />
      </Section>
      <Section title="Default — icon-only">
        <VariantMatrix iconOnly variants={DEFAULT_VARIANTS} />
      </Section>
      <Section title="Default — disabled">
        <VariantMatrix disabled variants={DEFAULT_VARIANTS} />
      </Section>
      <Section title="Marketing — sizes">
        <VariantMatrix sizes={MARKETING_SIZES} variants={MARKETING_VARIANTS} />
      </Section>
      <Section title="Composition — start / end slots (compose other components)">
        <div className="flex flex-wrap items-center gap-3">
          <Button start={<SparklesIcon />}>Generate</Button>
          <Button variant="secondary" end={<Badge variant="nBrand" text="new" />}>Upgrade</Button>
          <Button variant="tertiary" start={<SparklesIcon />} end={<KbdSequence keys={['⌘', 'K']} />}>Command</Button>
          <Button variant="outline" iconOnly aria-label="Add" start={<SparklesIcon />} />
        </div>
      </Section>
      <Section title="Special">
        <SpecialRow />
      </Section>
    </Board>
  ),
}
