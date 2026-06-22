import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Nested themes stories — scope overrides via descendant `data-theme`.
 *
 * Quanta's theme blocks are wrapped in `:where(...)` so specificity stays
 * at (0,0,0). That means a descendant with `data-theme="X"` restarts the
 * cascade for its subtree without specificity wars or `!important`.
 */

interface Props {
  outer: 'default-light' | 'default-dark'
  middle: 'default-light' | 'default-dark'
  inner: 'default-light' | 'default-dark'
}

function Nest({ outer, middle, inner }: Props) {
  return (
    <section className="text-q-text-primary space-y-2">
      <header className="text-q-text-secondary text-q-caption-sm-regular">
        Each level re-anchors the CSS variable cascade. No JS, no specificity
        wars — the
        {' '}
        <code>:where()</code>
        {' '}
        wrapper keeps every block at specificity (0,0,0).
      </header>

      <div
        data-theme={outer}
        className="bg-q-background-primary text-q-text-primary border border-q-border-subtle rounded p-4"
      >
        <p className="text-q-body-md-semi-bold">
          Outer · data-theme=
          {outer}
        </p>
        <div
          data-theme={middle}
          className="bg-q-background-primary text-q-text-primary border border-q-border-subtle mt-3 rounded p-4"
        >
          <p className="text-q-body-md-semi-bold">
            Middle · data-theme=
            {middle}
          </p>
          <div
            data-theme={inner}
            className="bg-q-background-primary text-q-text-primary border border-q-border-subtle mt-3 rounded p-4"
          >
            <p className="text-q-body-md-semi-bold">
              Inner · data-theme=
              {inner}
            </p>
            <p className="text-q-text-secondary text-q-caption-sm-regular mt-1">
              Every nested level inherits its own theme's tokens.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

const meta: Meta<typeof Nest> = {
  title: 'Tokens/Nested themes',
  component: Nest,
  args: {
    outer: 'default-light',
    middle: 'default-dark',
    inner: 'default-light',
  },
  argTypes: {
    outer: { control: 'select', options: ['default-light', 'default-dark'] },
    middle: { control: 'select', options: ['default-light', 'default-dark'] },
    inner: { control: 'select', options: ['default-light', 'default-dark'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates `data-theme` scope overrides. Restart the cascade inside any subtree by adding the attribute — descendants inherit fresh tokens.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Nest>

export const Default: Story = {}

export const LightToDarkToLight: Story = {
  args: { outer: 'default-light', middle: 'default-dark', inner: 'default-light' },
}

export const DarkToLightToDark: Story = {
  args: { outer: 'default-dark', middle: 'default-light', inner: 'default-dark' },
}

export const AllDark: Story = {
  args: { outer: 'default-dark', middle: 'default-dark', inner: 'default-dark' },
}

export const AllLight: Story = {
  args: { outer: 'default-light', middle: 'default-light', inner: 'default-light' },
}
