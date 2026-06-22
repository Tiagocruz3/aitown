import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import { Button, button } from '../src/components/button/index.ts'
import { Dropdown } from '../src/components/dropdown/index.ts'
import { KbdSequence } from '../src/components/kbd/index.ts'
import {
  CloseIcon,
  FolderIcon,
  HeartIcon,
  ImageIcon,
  SearchIcon,
  SparklesIcon,
  SunburstIcon,
} from '../src/components/menu/icons.tsx'

const meta: Meta = {
  title: 'Components/Dropdown',
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj

function Trigger({ children = 'Open menu' }: { children?: ReactNode }) {
  return (
    <Dropdown.Trigger className={button({ variant: 'secondary', size: 'sm' })}>
      {children}
    </Dropdown.Trigger>
  )
}

function Stage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[34rem] items-start justify-center gap-6 pt-6">{children}</div>
}

/* ── Playground — the Figma default Dropdown (node 236:3155): plain rows, a
 *    selected row (trailing check) and a submenu. ─────────────────────────── */
function PlaygroundDemo() {
  return (
    <Dropdown.Root selectionMode="single" defaultSelected={['openai']}>
      <Trigger>Open menu</Trigger>
      <Dropdown.Content>
        <Dropdown.Item title="Auto" />
        <Dropdown.Item title="Use multiple models" />
        <Dropdown.Item title="New chat" />
        <Dropdown.Item value="openai" title="OpenAI" selectable />
        <Dropdown.Item title="Anthropic" />
        <Dropdown.Item title="Google">
          <Dropdown.Item title="Gemini Flash" />
          <Dropdown.Item title="Gemini Pro" />
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  )
}
export const Playground: Story = { render: () => <Stage><PlaygroundDemo /></Stage> }

/* ── Variants — the Figma _MenuItem trailing types (node 236:3238): plain
 *    action, disabled, shortcut, submenu, switch, checkbox, check, danger. ── */
function VariantsDemo() {
  return (
    <Dropdown.Root defaultSelected={['hd', 'ref']}>
      <Trigger>Variants</Trigger>
      <Dropdown.Content>
        <Dropdown.GroupItem heading="Actions">
          <Dropdown.Item title="New chat" start={<SparklesIcon />} />
          <Dropdown.Item title="Disabled" start={<ImageIcon />} disabled />
        </Dropdown.GroupItem>
        <Dropdown.Separator />
        <Dropdown.GroupItem heading="Shortcut & submenu">
          <Dropdown.Item title="Search" start={<SearchIcon />} subtitle={<KbdSequence keys={['⌘', 'K']} />} />
          <Dropdown.Item title="Models" start={<SunburstIcon />}>
            <Dropdown.Item title="Auto" />
            <Dropdown.Item title="OpenAI" />
          </Dropdown.Item>
        </Dropdown.GroupItem>
        <Dropdown.Separator />
        <Dropdown.GroupItem heading="Selection">
          <Dropdown.Item value="hd" title="HD preview" selectable indicator="switch" />
          <Dropdown.Item value="ref" title="Include reference" selectable indicator="checkbox" />
          <Dropdown.Item value="autoplay" title="Autoplay" selectable indicator="check" />
        </Dropdown.GroupItem>
        <Dropdown.Separator />
        <Dropdown.Item
          title={<span className="text-q-text-danger">Delete</span>}
          start={<CloseIcon className="text-q-icon-error" />}
        />
      </Dropdown.Content>
    </Dropdown.Root>
  )
}
export const Variants: Story = { render: () => <Stage><VariantsDemo /></Stage> }

/* ══ RichVariants — the two product menus, recreated by CUSTOMIZING Item ══════
 * Models (node 1050:147) and Folders (node 998:6110). Both are dense (2px row
 * rhythm via the `--q-menu-gap` override); Folders is the solid `secondary`
 * surface; counts use Item's `end` slot; the footer is a composed `q-menu-footer`
 * row. No bespoke Footer/Large/Input parts — just Item + tokens. */

// Dense (2px) row rhythm for the product menus; the surface stays the default
// q-menu-content glass (--hf-color-background-glass = Figma background/glass
// #23262abf), shared by both Models and Folders.
const DENSE = { '--q-menu-gap': 'var(--hf-space-050)' } as CSSProperties

/** 36px glass media tile (Figma _MenuItemLarge mediaSlot) — token-based. */
function ModelMedia({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-clip border-q-thin border-q-border-subtle bg-q-background-glass text-q-icon-secondary"
      style={{
        width: 'calc(var(--hf-space-800) + var(--hf-space-100))',
        height: 'calc(var(--hf-space-800) + var(--hf-space-100))',
        borderRadius: 'var(--hf-space-200)',
        boxShadow: 'inset 0 var(--hf-space-050) var(--hf-space-150) 0 var(--hf-color-transparent-light-15)',
      }}
    >
      {children}
    </span>
  )
}

/** 10px meta chip (Figma chipsRow nav-item) — token-based. */
function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-q-caption-xs-regular text-q-text-on-overlay-secondary"
      style={{
        backgroundColor: 'var(--hf-color-transparent-light-05)',
        borderRadius: 'var(--hf-space-100)',
        padding: 'var(--hf-space-050) var(--hf-space-100)',
      }}
    >
      {children}
    </span>
  )
}

function ModelTitle({ name, badge }: { name: string, badge?: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-q-caption-sm-medium text-q-text-primary">{name}</span>
      {badge}
    </span>
  )
}

const CHIPS = <span className="flex gap-1"><MetaChip>720p</MetaChip><MetaChip>4s-15s</MetaChip></span>

function ModelsDemo() {
  return (
    <Dropdown.Root selectionMode="single" defaultSelected={['seedance']}>
      <Trigger>Models</Trigger>
      <Dropdown.Content withSearch searchPlaceholder="Search" className="w-[400px]" style={DENSE}>
        <Dropdown.GroupItem heading="Featured models">
          <Dropdown.Item value="seedance" selectable start={<ModelMedia><SunburstIcon /></ModelMedia>} title={<ModelTitle name="Seedance 2.0" badge={<Badge variant="lime" text="new" />} />} subtitle={CHIPS} />
          <Dropdown.Item value="seedance-fast" selectable start={<ModelMedia><SunburstIcon /></ModelMedia>} title={<ModelTitle name="Seedance 2.0 Fast" badge={<Badge variant="lime" text="new" />} />} subtitle={CHIPS} />
          <Dropdown.Item value="kling" selectable start={<ModelMedia><ImageIcon /></ModelMedia>} title={<ModelTitle name="Kling 3" badge={<Badge variant="purple" text="Exclusive" />} />} subtitle={CHIPS} />
          <Dropdown.Item value="kling-mc" selectable start={<ModelMedia><ImageIcon /></ModelMedia>} title={<ModelTitle name="Kling 3.0 Motion Control" />} subtitle={CHIPS} />
          <Dropdown.Item value="happyhorse" selectable start={<ModelMedia><SparklesIcon /></ModelMedia>} title={<ModelTitle name="HappyHorse" badge={<Badge variant="lime" text="new" />} />} subtitle={CHIPS} />
        </Dropdown.GroupItem>
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

function Count({ children }: { children: ReactNode }) {
  return <span className="text-q-caption-sm-regular text-q-text-secondary">{children}</span>
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden width="20" height="20">
      <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FoldersDemo() {
  return (
    <Dropdown.Root defaultSelected={['untitled', 'untitled-2']}>
      <Trigger>Folders</Trigger>
      <Dropdown.Content withSearch searchPlaceholder="Search" className="w-[280px]" style={DENSE}>
        <Dropdown.Item value="liked" title="Liked" start={<HeartIcon />} end={<Count>18</Count>} selectable indicator="checkbox" />
        <Dropdown.GroupItem heading="Private folders">
          <Dropdown.Item title="New folder" start={<PlusIcon />} />
          <Dropdown.Item value="untitled" title="Untitled" start={<FolderIcon />} selectable indicator="checkbox" />
          <Dropdown.Item value="untitled-2" title="Untitled" start={<FolderIcon />} end={<Count>2</Count>} selectable indicator="checkbox" />
          <Dropdown.Item value="from-images" title="new folder from images and" start={<FolderIcon />} end={<Count>2</Count>} selectable indicator="checkbox" />
          <Dropdown.Item value="special" title="*&^" start={<FolderIcon />} end={<Count>1</Count>} selectable indicator="checkbox" />
        </Dropdown.GroupItem>
        <Dropdown.Separator />
        <div className="q-menu-footer">
          <span>Selected: 2 folders</span>
          <Button variant="secondary" size="sm">Add</Button>
        </div>
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

export const RichVariants: Story = {
  render: () => <Stage><ModelsDemo /><FoldersDemo /></Stage>,
}
