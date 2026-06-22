import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Color stories — visual reference for quanta's semantic color tokens.
 *
 * The toolbar at the top of the canvas switches `data-theme` between
 * `default-light` and `default-dark`. Every swatch on this page rebinds
 * automatically because they reference semantic `bg-*` / `text-*` /
 * `border-*` utilities, not raw palette colors.
 */

interface SwatchSpec {
  name: string
  bgClass?: string
  textClass: string
}

interface PaletteProps {
  /** Tokens to render. Use the controls to flip a section in/out. */
  group: 'backgrounds' | 'text' | 'borders' | 'brand' | 'state'
}

const GROUPS: Record<PaletteProps['group'], SwatchSpec[]> = {
  backgrounds: [
    { name: 'background-primary', bgClass: 'bg-q-background-primary', textClass: 'text-q-text-primary' },
    { name: 'background-secondary', bgClass: 'bg-q-background-secondary', textClass: 'text-q-text-primary' },
    { name: 'background-tertiary', bgClass: 'bg-q-background-tertiary', textClass: 'text-q-text-primary' },
    { name: 'background-inverse', bgClass: 'bg-q-background-inverse', textClass: 'text-q-text-inverse' },
    { name: 'background-glass', bgClass: 'bg-q-background-glass', textClass: 'text-q-text-primary' },
  ],
  text: [
    { name: 'text-primary', textClass: 'text-q-text-primary' },
    { name: 'text-secondary', textClass: 'text-q-text-secondary' },
    { name: 'text-tertiary', textClass: 'text-q-text-tertiary' },
    { name: 'text-inverse', bgClass: 'bg-q-background-inverse', textClass: 'text-q-text-inverse' },
  ],
  borders: [
    { name: 'border-default', bgClass: 'bg-q-background-secondary', textClass: 'text-q-text-primary border-q-border-default border-2' },
    { name: 'border-subtle', bgClass: 'bg-q-background-secondary', textClass: 'text-q-text-primary border-q-border-subtle border-2' },
    { name: 'border-strong', bgClass: 'bg-q-background-secondary', textClass: 'text-q-text-primary border-q-border-strong border-2' },
    { name: 'border-focus', bgClass: 'bg-q-background-secondary', textClass: 'text-q-text-primary border-q-border-focus border-2' },
  ],
  brand: [
    { name: 'brand-primary', bgClass: 'bg-q-brand-primary', textClass: 'text-q-text-inverse' },
  ],
  state: [
    { name: 'state-error-bg', bgClass: 'bg-q-state-error-bg', textClass: 'text-q-state-error-fg' },
    { name: 'state-success-bg', bgClass: 'bg-q-state-success-bg', textClass: 'text-q-state-success-fg' },
    { name: 'state-warning-bg', bgClass: 'bg-q-state-warning-bg', textClass: 'text-q-state-warning-fg' },
  ],
}

function Palette({ group }: PaletteProps) {
  const swatches = GROUPS[group]
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {swatches.map(swatch => (
        <div
          key={swatch.name}
          className={`p-4 rounded-md ${swatch.bgClass ?? ''} ${swatch.textClass}`}
        >
          <code className="text-q-body-sm-medium">{swatch.name}</code>
        </div>
      ))}
    </section>
  )
}

const meta: Meta<typeof Palette> = {
  title: 'Tokens/Color',
  component: Palette,
  args: {
    group: 'backgrounds',
  },
  argTypes: {
    group: {
      control: 'select',
      options: ['backgrounds', 'text', 'borders', 'brand', 'state'],
      description: 'Which semantic role group to render.',
    },
  },
}

export default meta

type Story = StoryObj<typeof Palette>

export const Backgrounds: Story = {
  args: { group: 'backgrounds' },
}

export const Text: Story = {
  args: { group: 'text' },
}

export const Borders: Story = {
  args: { group: 'borders' },
}

export const Brand: Story = {
  args: { group: 'brand' },
}

export const State: Story = {
  args: { group: 'state' },
}
