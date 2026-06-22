import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Breakpoint stories — Tailwind responsive variants.
 *
 * Three prefixes: `tablet:` (≥768px), `desktop:` (≥1280px), `wide:` (≥1920px).
 * `mobile:` is NOT emitted because it would be always-on at 320px —
 * mobile is the implicit base in mobile-first design.
 *
 * Resize the canvas (or use Storybook's Viewport addon) to see the
 * active row change.
 */

const ROWS = [
  {
    classes: 'bg-q-cool-200 q-tablet:bg-q-brand-primary q-desktop:bg-q-cool-200 q-wide:bg-q-cool-200',
    label: 'tablet: only',
    range: '≥ 768px and < 1280px',
  },
  {
    classes: 'bg-q-cool-200 q-tablet:bg-q-cool-200 q-desktop:bg-q-brand-primary q-wide:bg-q-cool-200',
    label: 'desktop: only',
    range: '≥ 1280px and < 1920px',
  },
  {
    classes: 'bg-q-cool-200 q-tablet:bg-q-cool-200 q-desktop:bg-q-cool-200 q-wide:bg-q-brand-primary',
    label: 'wide: only',
    range: '≥ 1920px',
  },
] as const

function Responsive() {
  return (
    <section className="text-q-text-primary space-y-3">
      <div className="space-y-2">
        {ROWS.map(row => (
          <div
            key={row.label}
            className={`${row.classes} text-q-body-sm-regular rounded p-3 text-q-text-primary`}
          >
            <code>{row.label}</code>
            <span className="text-q-text-tertiary text-q-caption-sm-regular ml-3">{row.range}</span>
          </div>
        ))}
      </div>

      <div className="bg-q-background-primary border border-q-border-subtle space-y-1 rounded p-3 text-q-caption-sm-regular">
        <p className="text-q-text-secondary">
          Mobile (base) ·
          <span className="block text-q-brand-primary q-tablet:hidden">visible: width &lt; 768</span>
        </p>
        <p className="text-q-text-secondary hidden q-tablet:block q-desktop:hidden">
          Tablet ·
          <span className="text-q-brand-primary">visible: 768 ≤ width &lt; 1280</span>
        </p>
        <p className="text-q-text-secondary hidden q-desktop:block q-wide:hidden">
          Desktop ·
          <span className="text-q-brand-primary">visible: 1280 ≤ width &lt; 1920</span>
        </p>
        <p className="text-q-text-secondary hidden q-wide:block">
          Wide ·
          <span className="text-q-brand-primary">visible: width ≥ 1920</span>
        </p>
      </div>
    </section>
  )
}

const meta: Meta<typeof Responsive> = {
  title: 'Tokens/Breakpoint',
  component: Responsive,
  parameters: {
    docs: {
      description: {
        component:
          'Three responsive variants — tablet:/desktop:/wide:. mobile: skipped (always-on at 320px in mobile-first design).',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Responsive>

export const Default: Story = {}
