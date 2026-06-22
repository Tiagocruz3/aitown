import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode, SVGProps } from 'react'
import { useState } from 'react'
import { Avatar } from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Button } from '../src/components/button/index.ts'
import { Chip } from '../src/components/chip/index.ts'
import { Command } from '../src/components/cmdk/index.ts'
import { Dot } from '../src/components/dot/index.ts'
import { Kbd, KbdSequence } from '../src/components/kbd/index.ts'
import { Tag } from '../src/components/tag/index.ts'

/**
 * Command (cmdk) — a fuzzy, keyboard-driven command palette. Items compose from
 * ReactNode slots: `start` / `title` / `subtitle` / `end` (+ `detail` / `action`
 * for the two-pane layout). Groups auto-divide (no orphan dividers when
 * filtering). Press `⌘K` for the Dialog.
 */
const meta: Meta = {
  title: 'Components/Command',
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="grid min-h-screen place-items-center bg-q-background-primary p-10"><Story /></div>],
}
export default meta
type Story = StoryObj

function Icon({ d, ...p }: { d: string } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-5" {...p}><path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
const ICONS = {
  file: 'M5 3h7l3 3v11H5V3z',
  search: 'M9 3a6 6 0 104.5 10.5L17 17',
  user: 'M10 10a3 3 0 100-6 3 3 0 000 6zM4 16a6 6 0 0112 0',
  gear: 'M10 13a3 3 0 100-6 3 3 0 000 6zM10 2v2M10 16v2M2 10h2M16 10h2',
  trash: 'M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11',
  theme: 'M10 2a8 8 0 100 16 5 5 0 010-10 8 8 0 000-6z',
  diamond: 'M10 2l8 8-8 8-8-8 8-8z',
  home: 'M3 9l7-5.5L17 9v7a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1V9z',
  plus: 'M10 4v12M4 10h12',
  book: 'M10 5v12M10 5a3 3 0 00-3-3H3v11h4a3 3 0 013 3 3 3 0 013-3h4V2h-4a3 3 0 00-3 3z',
  clock: 'M10 5.5V10l3 2M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15z',
  globe: 'M10 2.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM2.5 10h15M10 2.5c2.2 2 2.2 13 0 15M10 2.5c-2.2 2-2.2 13 0 15',
  arrowUpRight: 'M7 13l6-6M7.5 7H13v5.5',
}

function PaletteBody({ onRun }: { onRun?: () => void }) {
  const [page, setPage] = useState<'root' | 'theme'>('root')
  return (
    <>
      <Command.Input placeholder="Type a command or search…" autoFocus />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        {page === 'root' && (
          <>
            <Command.Group heading="Suggestions">
              <Command.Item start={<Icon d={ICONS.file} />} title="New file" end="⌘N" onSelect={onRun} />
              <Command.Item start={<Icon d={ICONS.search} />} title="Search files" keywords="find lookup" onSelect={onRun} />
              <Command.Item start={<Icon d={ICONS.user} />} title="Profile" subtitle="Open your account settings" onSelect={onRun} />
            </Command.Group>
            <Command.Group heading="Settings">
              <Command.Item start={<Icon d={ICONS.theme} />} title="Change theme…" end="⌘T" onSelect={() => setPage('theme')} />
              <Command.Item start={<Icon d={ICONS.gear} />} title="Preferences" end="⌘," onSelect={onRun} />
              <Command.Item start={<Icon d={ICONS.trash} />} title="Delete workspace" subtitle="Permanently removes everything" disabled />
            </Command.Group>
          </>
        )}

        {page === 'theme' && (
          <Command.Group heading="Theme">
            {['System', 'Light', 'Dark'].map(t => (
              <Command.Item key={t} title={t} onSelect={() => setPage('root')} />
            ))}
          </Command.Group>
        )}
      </Command.List>
    </>
  )
}

/** Playground — the inline (embedded) palette: icon / shortcut / subtitle /
 *  disabled items, with a nested "Change theme…" sub-page. */
export const Playground: Story = {
  render: () => (
    <div className="overflow-hidden rounded-2xl border-q-thin border-q-border-subtle bg-q-background-secondary">
      <Command label="Command menu"><PaletteBody /></Command>
    </div>
  ),
}

/** Variants — the ⌘K Dialog surface (frosted palette, global hotkey, focus trap,
 *  no page scrim); the alternative to the inline embed in Playground. */
export const Variants: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <div className="flex flex-col items-center gap-3">
        <Button onClick={() => setOpen(true)}>Open command menu</Button>
        <p className="text-q-caption-sm-regular text-q-text-tertiary">…or press ⌘K / Ctrl+K</p>
        <Command.Dialog open={open} onOpenChange={setOpen} shortcut="mod+k" label="Command menu">
          <PaletteBody onRun={() => setOpen(false)} />
        </Command.Dialog>
      </div>
    )
  },
}

/* A thin inline row of tags/chips for a subtitle slot. */
function MetaRow({ children }: { children: ReactNode }) {
  return <span className="flex items-center gap-1">{children}</span>
}

/* A field in the detail panel's metadata grid. */
function Meta({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-q-caption-sm-regular text-q-text-tertiary">{label}</dt>
      <dd className="text-q-body-sm-medium text-q-text-primary">{value}</dd>
    </div>
  )
}

function ProjectDetail({ title, by, status, created, edited, opened }: {
  title: string, by: string, status: string, created: string, edited: string, opened: string
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="aspect-video w-full rounded-xl bg-q-palette-purple-bg" />
      <h3 className="text-q-headline-sm-bold text-q-text-primary">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Meta label="Created by" value={by} />
        <Meta label="Status" value={status} />
        <Meta label="Created" value={created} />
        <Meta label="Last edited" value={edited} />
        <Meta label="Last opened" value={opened} />
      </dl>
    </div>
  )
}

/**
 * RichVariants — two rich compositions:
 *   1. item slots composing other quanta components (Avatar / Dot / Badge / Tag /
 *      Chip / KbdSequence);
 *   2. the two-pane layout (Command.Body + Detail + Footer + Action) with a
 *      detail panel that reflects the active item and an Enter-to-confirm footer.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-10">
      <div className="w-[28rem] overflow-hidden rounded-2xl border-q-thin border-q-border-subtle bg-q-background-secondary">
        <Command label="Rich items">
          <Command.Input placeholder="Search people, actions, projects…" autoFocus />
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            <Command.Group heading="People">
              <Command.Item
                start={<Avatar size="sm" color="blue" status="online" fallback="AZ" />}
                title="Azamat Zhamankulov"
                subtitle="azamat@higgsfield.ai"
                end={<Badge variant="lime" text="You" />}
                keywords="owner me"
                onSelect={() => {}}
              />
              <Command.Item
                start={<Avatar size="sm" color="pink" status="away" fallback="MK" />}
                title="Maria Kim"
                subtitle="maria@higgsfield.ai"
                end={<span className="text-q-caption-sm-regular text-q-text-tertiary">Admin</span>}
                onSelect={() => {}}
              />
              <Command.Item
                start={<Avatar size="sm" variant="dashed" />}
                title="Invite teammate…"
                subtitle="Send an email invite"
                onSelect={() => {}}
              />
            </Command.Group>

            <Command.Group heading="Quick actions">
              <Command.Item start={<Icon d={ICONS.file} />} title="New file" end={<KbdSequence keys={['⌘', 'N']} />} onSelect={() => {}} />
              <Command.Item start={<Icon d={ICONS.search} />} title="Search everywhere" keywords="find" end={<KbdSequence keys={['⌘', 'K']} />} onSelect={() => {}} />
            </Command.Group>

            <Command.Group heading="Projects">
              <Command.Item
                start={<Dot color="green" size="md" animation="pulse" />}
                title="Marketing site"
                subtitle="Live · edited 2m ago"
                end={<Badge variant="nBrand" text="Pro" />}
                onSelect={() => {}}
              />
              <Command.Item
                start={<Dot color="yellow" size="md" />}
                title="Mobile app"
                subtitle={<MetaRow><Tag color="warning">staging</Tag><Tag>v2.1</Tag></MetaRow>}
                onSelect={() => {}}
              />
              <Command.Item
                start={<Icon d={ICONS.file} />}
                title="Brand assets"
                subtitle={<MetaRow><Chip size="xxs" color="brand">PNG</Chip><Chip size="xxs" color="brand">SVG</Chip></MetaRow>}
                end={<Badge variant="pink" text="beta" />}
                onSelect={() => {}}
              />
            </Command.Group>
          </Command.List>
        </Command>
      </div>

      <div className="h-[34rem] w-[56rem] overflow-hidden rounded-2xl border-q-thin border-q-border-subtle bg-q-background-secondary">
        <Command className="h-full" label="Project switcher">
          <Command.Input placeholder="Search…" autoFocus />
          <Command.Body>
            <Command.List>
              <Command.Empty>No results found.</Command.Empty>
              <Command.Group heading="Recent projects">
                <Command.Item
                  start={<Icon d={ICONS.diamond} />}
                  title="Higgs Video Form"
                  action="Open project"
                  onSelect={() => {}}
                  detail={<ProjectDetail title="Higgs Video Form" by="Daulet Nurzhanov" status="Private" created="20 hours ago" edited="18 hours ago" opened="52 seconds ago" />}
                />
                <Command.Item
                  start={<Icon d={ICONS.diamond} />}
                  title="Cinematic Trailer"
                  action="Open project"
                  onSelect={() => {}}
                  detail={<ProjectDetail title="Cinematic Trailer" by="Maria Kim" status="Shared" created="3 days ago" edited="yesterday" opened="2 hours ago" />}
                />
              </Command.Group>
              <Command.Group heading="Navigate to">
                <Command.Item start={<Icon d={ICONS.home} />} title="Dashboard" action="Open dashboard" onSelect={() => {}} />
                <Command.Item start={<Icon d={ICONS.book} />} title="Documentation" keywords="docs help" action="Open docs" end={<Icon d={ICONS.arrowUpRight} className="size-4" />} onSelect={() => {}} />
              </Command.Group>
            </Command.List>
            <Command.Detail />
          </Command.Body>
          <Command.Footer>
            <span className="size-6 rounded-lg bg-q-background-inverse" aria-hidden />
            <Command.Action fallback="Select"><Kbd>↵</Kbd></Command.Action>
          </Command.Footer>
        </Command>
      </div>
    </div>
  ),
}
