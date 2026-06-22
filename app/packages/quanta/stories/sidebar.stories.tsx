import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode, SVGProps } from 'react'
import { useState } from 'react'
import { Avatar } from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Dot } from '../src/components/dot/index.ts'
import { Kbd } from '../src/components/kbd/index.ts'
import { Sidebar } from '../src/components/sidebar/index.ts'
import { Tag } from '../src/components/tag/index.ts'

const meta: Meta<typeof Sidebar.Root> = {
  title: 'Components/Sidebar',
  component: Sidebar.Root,
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="flex h-screen items-start gap-6 bg-q-background-primary p-6"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof Sidebar.Root>

/* ── Inline icons (content — supplied by the consumer; quanta ships no set) ──── */
function makeIcon(d: string) {
  return (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d={d} />
    </svg>
  )
}
const Home = makeIcon('M3.5 8.5L10 3l6.5 5.5M5 7.5V16h10V7.5')
const Search = makeIcon('M9 15a6 6 0 100-12 6 6 0 000 12zM17 17l-3.5-3.5')
const Heart = makeIcon('M10 16s-6-4-6-8a3 3 0 016-1 3 3 0 016 1c0 4-6 8-6 8z')
const Feed = makeIcon('M4 4h12v12H4zM7 8h6M7 11h6')
const Diamond = makeIcon('M3 7l3-4h8l3 4-7 9z')
const Plus = makeIcon('M10 4v12M4 10h12')
const Sort = makeIcon('M5 6h10M6.5 10h7M8 14h4')
const Pin = makeIcon('M12 3l5 5-3 1-3.5 3.5-1-1L4 18m9-15l-2 5')
const Collapse = makeIcon('M3.5 4.5h13v11h-13zM8 4.5v11')
const Settings = makeIcon('M10 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM10 2.5v2M10 15.5v2M4 6l1.5 1.5M14.5 12.5L16 14M2.5 10h2M15.5 10h2')
const Games = makeIcon('M6.5 7.5h7a4 4 0 010 8h-7a4 4 0 010-8zM7 10v3M5.5 11.5h3M13 10.5h.01M15 12.5h.01')
const Files = makeIcon('M3.5 5.5h5l1.5 2h6.5v7h-13z')
const Bell = makeIcon('M6 8a4 4 0 018 0c0 4 1.5 5 1.5 5h-11S6 12 6 8zM8.5 16a1.5 1.5 0 003 0')

/** Logo mark (placeholder) for the workspace switcher. */
function LogoMark() {
  return <span className="grid size-full place-items-center rounded-q-200 bg-q-brand-primary text-q-text-inverse text-q-label-xs-semi-bold">◆</span>
}

/** A clickable section-header action (search / sort). */
function ActionBtn({ label, active, onClick, children }: { label: string, active?: boolean, onClick: () => void, children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 ${active ? 'text-q-icon-primary' : 'text-q-icon-secondary'} hover:text-q-icon-primary`}
    >
      {children}
    </button>
  )
}

const PROJECTS = [
  { name: 'The Long Pasture', count: '', pinned: true },
  { name: 'Pixel Forge', count: '18' },
  { name: 'Blue Horizon', count: '484' },
  { name: 'Nova', count: '156' },
  { name: 'Motion Studio', count: '44' },
  { name: 'Nova Collective', count: '91' },
  { name: 'Alpha', count: '449' },
  { name: 'Quantum Works', count: '1 234' },
]

/* ── A full Cinema-Studio sidebar with working collapse / search / sort ─────── */
function CinemaStudio({ collapsed: initialCollapsed = false }: { collapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [active, setActive] = useState('Home')
  // Pins are scoped to THIS section's data — sorting pinned-first here keeps
  // them in the Projects group, never global.
  const [pinned, setPinned] = useState<Set<string>>(() => new Set(PROJECTS.filter(p => p.pinned).map(p => p.name)))
  const togglePin = (name: string, next: boolean) =>
    setPinned(s => { const n = new Set(s); next ? n.add(name) : n.delete(name); return n })

  const filtered = PROJECTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  // Pinned items sit at the top of the section in their original order and are
  // NOT sortable — the A–Z sort only reorders the unpinned items below them.
  const pinnedProjects = filtered.filter(p => pinned.has(p.name))
  const rest = filtered.filter(p => !pinned.has(p.name))
  const sortedRest = sortAsc ? [...rest].sort((a, b) => a.name.localeCompare(b.name)) : rest
  const projects = [...pinnedProjects, ...sortedRest]

  return (
    <Sidebar.Root collapsed={collapsed} aria-label="Workspace">
      <Sidebar.Header
        logo={<LogoMark />}
        title="Cinema Studio"
        chevron
        // the switcher doubles as expand/collapse so the rail is reachable in either state
        switcherProps={{ onClick: () => setCollapsed(c => !c) }}
        actions={<Sidebar.Toggle aria-label="Collapse sidebar" onClick={() => setCollapsed(true)}><Collapse /></Sidebar.Toggle>}
      />
      <Sidebar.Body>
        <Sidebar.Section>
          <Sidebar.Item start={<Home />} selected={active === 'Home'} onClick={() => setActive('Home')}>Home</Sidebar.Item>
          <Sidebar.Item start={<Avatar size="xs" alt="My Generations" />} selected={active === 'gen'} onClick={() => setActive('gen')}>My Generations</Sidebar.Item>
          <Sidebar.Item start={<Avatar size="xs" alt="My Elements" />} selected={active === 'el'} onClick={() => setActive('el')}>My Elements</Sidebar.Item>
          <Sidebar.Item start={<Heart />} selected={active === 'fav'} onClick={() => setActive('fav')}>My Favorites</Sidebar.Item>
          <Sidebar.Item start={<Feed />} selected={active === 'feed'} onClick={() => setActive('feed')}>Community Feed</Sidebar.Item>
        </Sidebar.Section>

        <Sidebar.Section
          title="Projects"
          actions={(
            <>
              <ActionBtn label="Search projects" active={searching} onClick={() => { setSearching(s => !s); setQuery('') }}><Search /></ActionBtn>
              <ActionBtn label="Sort A–Z" active={sortAsc} onClick={() => setSortAsc(s => !s)}><Sort /></ActionBtn>
            </>
          )}
        >
          {searching && <Sidebar.Search autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects" />}
          <Sidebar.Item size="sm" start={<Plus />}>New project</Sidebar.Item>
          {projects.map(p => (
            <Sidebar.Item
              key={p.name}
              start={<Avatar size="xs" alt={p.name} />}
              meta={p.count || undefined}
              pinned={pinned.has(p.name)}
              onPinChange={next => togglePin(p.name, next)}
              selected={active === p.name}
              onClick={() => setActive(p.name)}
            >
              {p.name}
            </Sidebar.Item>
          ))}
          {projects.length === 0 && <div className="px-2 py-1 text-q-caption-sm-regular text-q-text-tertiary">No projects</div>}
        </Sidebar.Section>
      </Sidebar.Body>

      <Sidebar.Footer>
        <Sidebar.FooterItem variant="promo" start={<Diamond />} end={<Badge variant="pink">50% OFF</Badge>}>Pricing</Sidebar.FooterItem>
        <Sidebar.FooterItem start={<Avatar size="xs" alt="John" />} end={<><Plus /><Bell /></>}>John</Sidebar.FooterItem>
      </Sidebar.Footer>
    </Sidebar.Root>
  )
}

/** Playground — a full product sidebar. Collapse via the header toggle (or click
 * the workspace logo to expand); the Projects search + sort actions are live. */
export const Playground: Story = {
  render: () => <CinemaStudio />,
}

/** Variants — expanded + collapsed (toggle either), and the row / footer pieces. */
export const Variants: Story = {
  render: () => (
    <>
      <CinemaStudio />
      <CinemaStudio collapsed />
      <Sidebar.Root aria-label="Pieces" className="self-stretch">
        <Sidebar.Body>
          <Sidebar.Section title="Icon rows">
            <Sidebar.Item start={<Home />} selected>Selected</Sidebar.Item>
            <Sidebar.Item start={<Avatar size="xs" alt="A" />}>Avatar md</Sidebar.Item>
            <Sidebar.Item size="sm" start={<Plus />}>Default sm</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section title="Avatar + count rows">
            <Sidebar.Item start={<Avatar size="xs" alt="Blue Horizon" />} meta="484">With count</Sidebar.Item>
            <Sidebar.Item start={<Avatar size="xs" alt="Pixel Forge" />} selected end={<Pin />}>Selected</Sidebar.Item>
            <Sidebar.Item size="sm">Chat row (sm)</Sidebar.Item>
          </Sidebar.Section>
          <Sidebar.Section title="FooterItem">
            <Sidebar.FooterItem variant="promo" start={<Diamond />} end={<Badge variant="pink">50% OFF</Badge>}>Pricing</Sidebar.FooterItem>
            <Sidebar.FooterItem variant="login" start={<Avatar size="xs" alt="?" />}>Login</Sidebar.FooterItem>
            <Sidebar.FooterItem start={<Avatar size="xs" alt="John" />} end={<Plus />}>John</Sidebar.FooterItem>
          </Sidebar.Section>
        </Sidebar.Body>
      </Sidebar.Root>
    </>
  ),
}

/* ── Composite-slot showcase ────────────────────────────────────────────────
 * Proves the row slots take ANY node — not just a circular Avatar / 20px icon.
 * `start` here holds square rounded thumbnails, a letter tile, a Badge, and a
 * status Dot; the "no icon" section is label-only with quanta components in
 * `end`. Shown expanded + collapsed so you can see how each non-circle / absent
 * lead reduces into the icon circle. */
function CompositeItems({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Sidebar.Root collapsed={collapsed} aria-label="Composite items">
      <Sidebar.Header logo={<LogoMark />} title="Composite" chevron actions={<Sidebar.Toggle aria-label="Collapse"><Collapse /></Sidebar.Toggle>} />
      <Sidebar.Body>
        <Sidebar.Section title="Non-circle start">
          {/* square rounded thumbnails (project boards), not circular avatars */}
          <Sidebar.Item start={<span className="size-6 rounded-q-200 bg-q-brand-pink" />} meta="12">Pink board</Sidebar.Item>
          <Sidebar.Item start={<span className="size-6 rounded-q-200 bg-q-palette-blue-bg" />} meta="3">Blue board</Sidebar.Item>
          {/* a square letter tile (custom node) */}
          <Sidebar.Item start={<span className="grid size-6 place-items-center rounded-q-200 bg-q-background-secondary-strong text-q-label-xs-semi-bold text-q-text-secondary">A</span>}>Letter tile</Sidebar.Item>
          {/* a quanta Badge as the lead marker */}
          <Sidebar.Item start={<Badge variant="lime">3</Badge>}>Badge lead</Sidebar.Item>
          {/* a tiny status Dot (not a 24px icon) */}
          <Sidebar.Item start={<Dot color="green" />}>Status dot</Sidebar.Item>
        </Sidebar.Section>
        <Sidebar.Section title="No icon · trailing compose">
          <Sidebar.Item>Plain label</Sidebar.Item>
          <Sidebar.Item end={<Badge variant="nBlue">new</Badge>}>Trailing badge</Sidebar.Item>
          <Sidebar.Item end={<Kbd>⌘K</Kbd>}>Command</Sidebar.Item>
          <Sidebar.Item end={<Tag color="success">live</Tag>}>With tag</Sidebar.Item>
        </Sidebar.Section>
      </Sidebar.Body>
    </Sidebar.Root>
  )
}

/** Rich variants — the Figma "Semantic" line-up (full app rail + text-only chat
 * rail), plus a composite-slot showcase (non-circle / icon-less items) shown
 * expanded and collapsed. */
export const RichVariants: Story = {
  render: () => {
    const [chat, setChat] = useState('Aurora Labs')
    const chats = ['Pixel Forge', 'Aurora Labs', 'Blue Horizon', 'Nova', 'Motion Studio', 'Nova Collective', 'Alpha', 'Quantum Works']
    return (
      <>
        <CinemaStudio />
        <Sidebar.Root aria-label="Supercomputer">
          <Sidebar.Header logo={<LogoMark />} title="Supercomputer" chevron actions={<Sidebar.Toggle aria-label="Collapse"><Collapse /></Sidebar.Toggle>} />
          <Sidebar.Body>
            <Sidebar.Section>
              <Sidebar.Item start={<Plus />}>New task</Sidebar.Item>
              <Sidebar.Item start={<Search />}>Search</Sidebar.Item>
              <Sidebar.Item start={<Games />}>Games</Sidebar.Item>
              <Sidebar.Item start={<Settings />}>Settings</Sidebar.Item>
              <Sidebar.Item start={<Files />} selected>Marketplace</Sidebar.Item>
              <Sidebar.Item start={<Files />}>Files</Sidebar.Item>
            </Sidebar.Section>
            <Sidebar.Section title="Chats" actions={<Plus />}>
              {chats.map(name => (
                <Sidebar.Item key={name} size="sm" selected={chat === name} onClick={() => setChat(name)}>{name}</Sidebar.Item>
              ))}
            </Sidebar.Section>
          </Sidebar.Body>
          <Sidebar.Footer>
            <Sidebar.FooterItem variant="promo" start={<Diamond />} end={<Badge variant="pink">50% OFF</Badge>}>Pricing</Sidebar.FooterItem>
            <Sidebar.FooterItem variant="login" start={<Avatar size="xs" alt="?" />}>Login</Sidebar.FooterItem>
          </Sidebar.Footer>
        </Sidebar.Root>
        <CompositeItems />
        <CompositeItems collapsed />
      </>
    )
  },
}
