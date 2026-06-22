import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Button } from '../src/components/button/index.ts'
import { NotFound } from '../src/components/not-found/index.ts'
import { HeartIcon, ImageIcon, SearchIcon } from '../src/components/menu/icons.tsx'

const meta: Meta<typeof NotFound> = {
  title: 'Components/NotFound',
  component: NotFound,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof NotFound>

/** A surface to show the empty state on (mirrors a menu/panel container). */
function Surface({ children }: { children: ReactNode }) {
  return (
    <div className="w-[280px] rounded-[20px] border border-q-border-subtle bg-q-background-glass p-2 backdrop-blur-[40px]">
      {children}
    </div>
  )
}

/** Playground — a single empty state wired to the Storybook controls. */
export const Playground: Story = {
  args: {
    icon: <SearchIcon />,
    title: 'No results found',
    subtitle: 'Try a different search term',
    size: 'md',
    variant: 'plain',
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['plain', 'card', 'outline'] },
    icon: { control: false },
    actions: { control: false },
  },
  render: args => <Surface><NotFound {...args} /></Surface>,
}

/**
 * Variants — the size scale (sm / md / lg, where the tile, icon and typography
 * all scale together) and the surface treatments (plain drops into an existing
 * surface, card is a self-contained glass panel, outline is a dashed drop-zone).
 * The glassy icon tile is identical in every case.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        {(['sm', 'md', 'lg'] as const).map(size => (
          <Surface key={size}>
            <NotFound size={size} icon={<SearchIcon />} title="No results found" subtitle="Try a different search term" />
          </Surface>
        ))}
      </div>
      <div className="flex items-start gap-4">
        <Surface>
          <NotFound variant="plain" icon={<SearchIcon />} title="Plain" subtitle="On an existing surface" />
        </Surface>
        <div className="w-[280px]">
          <NotFound variant="card" icon={<ImageIcon />} title="Card" subtitle="Self-contained glass panel" />
        </div>
        <div className="w-[280px]">
          <NotFound variant="outline" icon={<ImageIcon />} title="Outline" subtitle="Drag files here to upload" />
        </div>
      </div>
    </div>
  ),
}

/**
 * Rich variants — empty states composing other quanta components: a Button CTA
 * in the `actions` slot, a dashed drop-zone whose whole surface is a `<button>`
 * (via `render`), and a state built from rich custom title / subtitle nodes.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {/* the `actions` slot composes a real quanta Button */}
      <Surface>
        <NotFound
          icon={<SearchIcon />}
          title="No results found"
          subtitle="No items match your filters"
          actions={<Button variant="secondary" size="sm">Clear filters</Button>}
        />
      </Surface>

      {/* `render` makes the whole outline drop-zone a clickable <button> */}
      <div className="w-[280px]">
        <NotFound
          render={<button type="button" />}
          variant="outline"
          icon={<ImageIcon />}
          title="Upload an image"
          subtitle="Click to browse, or drag a file here"
        />
      </div>

      {/* rich custom nodes + a pair of action Buttons */}
      <Surface>
        <NotFound
          icon={<HeartIcon />}
          title={<span className="text-q-text-primary">No favorites yet</span>}
          subtitle={(
            <span>
              Tap the
              {' '}
              <HeartIcon className="inline size-3 align-text-bottom" />
              {' '}
              on any item to save it
            </span>
          )}
          actions={(
            <>
              <Button variant="tertiary" size="sm">Browse</Button>
              <Button variant="primary" size="sm">Explore</Button>
            </>
          )}
        />
      </Surface>
    </div>
  ),
}
