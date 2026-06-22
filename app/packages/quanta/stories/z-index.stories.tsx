import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Z-index stories.
 *
 * 8 semantic keys ordered by stacking position (base → tooltip).
 * Coexists with Tailwind's numeric `z-N` defaults — same values,
 * different vocabulary. Semantic names (`z-q-modal`) are the canonical
 * design-system choice.
 */

const LAYERS = [
  { class: 'z-q-base', value: 0, color: 'bg-q-cool-100' },
  { class: 'z-q-dropdown', value: 10, color: 'bg-q-cool-150' },
  { class: 'z-q-sticky', value: 20, color: 'bg-q-cool-200' },
  { class: 'z-q-overlay', value: 30, color: 'bg-q-cool-250' },
  { class: 'z-q-modal', value: 40, color: 'bg-q-cool-300' },
  { class: 'z-q-popover', value: 50, color: 'bg-q-cool-350' },
  { class: 'z-q-toast', value: 60, color: 'bg-q-cool-400' },
  { class: 'z-q-tooltip', value: 70, color: 'bg-q-brand-primary' },
] as const

function Stack() {
  return (
    <section className="text-q-text-primary isolate space-y-3">
      <div
        className="relative overflow-hidden rounded border border-q-border-subtle bg-q-background-primary"
        style={{ height: '14rem' }}
      >
        {LAYERS.map((layer, i) => (
          <div
            key={layer.class}
            className={`${layer.class} ${layer.color} text-q-mono-sm-regular absolute rounded px-3 py-2 text-q-text-inverse shadow-md`}
            style={{
              top: `${i * 18}px`,
              left: `${i * 32}px`,
              width: '200px',
            }}
          >
            <code>{layer.class}</code>
            <span className="ml-2 text-q-text-inverse/70">
              z=
              {layer.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

const meta: Meta<typeof Stack> = {
  title: 'Tokens/Z-index',
  component: Stack,
  parameters: {
    docs: {
      description: {
        component:
          'Eight semantic z-index tokens (base / dropdown / sticky / overlay / modal / popover / toast / tooltip). Magic-number-free stacking.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Stack>

export const Default: Story = {}
