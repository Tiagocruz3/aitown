import type { ThemeTokens } from '@higgsfield/quanta/runtime'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { defineTheme, removeTheme } from '@higgsfield/quanta/runtime'
import { useEffect, useRef, useState } from 'react'

/**
 * Runtime theme stories — the escape hatch for dynamic / AI / preview themes.
 *
 * `defineTheme()` injects unlayered CSS for a new theme name; pinning it
 * via a controller (or directly setting `data-theme` on a wrapper)
 * activates the override. `removeTheme()` cleans the injected style tag
 * and the persisted localStorage entry.
 *
 * This story scopes the override to a wrapper `<div data-theme="...">`
 * (not `<html>`) so it doesn't fight Storybook's theme toolbar.
 */

const AI_THEME_NAME = 'ai-ocean'

const AI_TOKENS: ThemeTokens = {
  'background-primary': '#0c2461',
  'background-secondary': '#1e3799',
  'text-primary': '#dbeafe',
  'text-secondary': '#93c5fd',
  'border-subtle': '#3b82f6',
  'brand-primary': '#fbbf24',
}

interface Props {
  /** Render the theme as active (true) or hide the override (false). */
  active: boolean
}

function Playground({ active }: Props) {
  const [pinned, setPinned] = useState(active)
  const definedRef = useRef(false)

  // Sync external arg → internal state when the control toggles
  useEffect(() => {
    setPinned(active)
  }, [active])

  // Define theme once on mount (idempotent — defineTheme replaces existing tag)
  useEffect(() => {
    defineTheme(AI_THEME_NAME, AI_TOKENS)
    definedRef.current = true
    return () => {
      if (definedRef.current) {
        removeTheme(AI_THEME_NAME)
        definedRef.current = false
      }
    }
  }, [])

  return (
    <section className="text-q-text-primary space-y-4">
      <header className="text-q-text-secondary text-q-caption-sm-regular">
        Tokens are defined via
        {' '}
        <code>defineTheme()</code>
        {' '}
        and applied by setting
        {' '}
        <code>data-theme</code>
        {' '}
        on a wrapper. In real apps,
        {' '}
        <code>ThemeController.setOverride()</code>
        {' '}
        does this on
        {' '}
        <code>&lt;html&gt;</code>
        ; here we scope it to a single
        {' '}
        <code>&lt;div&gt;</code>
        {' '}
        so it coexists with the Storybook theme toolbar.
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPinned(true)}
          disabled={pinned}
          className="bg-q-brand-primary text-q-text-inverse text-q-body-sm-medium rounded px-4 py-2 disabled:opacity-50"
        >
          Pin "
          {AI_THEME_NAME}
          "
        </button>
        <button
          type="button"
          onClick={() => setPinned(false)}
          disabled={!pinned}
          className="border-q-border-subtle text-q-text-primary text-q-body-sm-medium rounded border px-4 py-2 disabled:opacity-50"
        >
          Unpin
        </button>
      </div>

      <div
        data-theme={pinned ? AI_THEME_NAME : undefined}
        className="bg-q-background-primary border-q-border-subtle rounded border p-5"
      >
        <p className="text-q-text-primary text-q-body-md-semi-bold">background-primary</p>
        <p className="text-q-text-secondary text-q-body-sm-regular mt-1">
          background-secondary text inside the override scope.
        </p>
        <div className="bg-q-background-secondary border-q-border-subtle mt-3 rounded border p-3">
          <p className="text-q-text-primary text-q-body-sm-regular">
            Nested surface — inherits the active theme via CSS variable cascade.
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="bg-q-brand-primary text-q-text-inverse text-q-body-sm-medium rounded px-3 py-1">
            brand-primary
          </span>
        </div>
      </div>
    </section>
  )
}

const meta: Meta<typeof Playground> = {
  title: 'Tokens/Runtime theme',
  component: Playground,
  args: { active: false },
  argTypes: {
    active: {
      control: 'boolean',
      description: 'Toggle whether the wrapper has `data-theme="ai-ocean"` applied.',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Demonstrates the dynamic-theme escape hatch via defineTheme + scoped override. The theme persists to localStorage by default but this story cleans up on unmount.',
      },
    },
  },
}

export default meta

type Story = StoryObj<typeof Playground>

export const Default: Story = {}
export const Pinned: Story = { args: { active: true } }
