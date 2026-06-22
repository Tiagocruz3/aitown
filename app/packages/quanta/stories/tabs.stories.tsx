import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Badge } from '../src/components/badge/index.ts'
import { Dot } from '../src/components/dot/index.ts'
import { SunburstIcon } from '../src/components/menu/icons.tsx'
import { Tabs } from '../src/components/tabs/index.ts'
import type { TabsShape, TabsTone } from '../src/components/tabs/tabs.tsx'

const meta: Meta = {
  title: 'Components/Tabs',
  parameters: {
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj

const MEDIA_TABS = [
  { value: 'create', label: 'Create Video' },
  { value: 'edit', label: 'Edit Video' },
  { value: 'motion', label: 'Motion Control' },
]

const SEGMENT_TABS = [
  { value: 'create', label: 'Create' },
  { value: 'edit', label: 'Edit' },
  { value: 'motion', label: 'Motion' },
]

const PILL_TABS = [
  { value: 'sketch', label: 'Sketch to Video' },
  { value: 'draw', label: 'Draw to Video' },
  { value: 'edit', label: 'Draw to Edit' },
]

const TONES = ['glass', 'solid', 'brandSoft', 'brand'] satisfies TabsTone[]

function Section({ children, title }: { children: ReactNode, title: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-q-label-sm-semi-bold text-q-text-primary">{title}</h3>
      {children}
    </section>
  )
}

function UnderlineTabs({ accent = false }: { accent?: boolean }) {
  return (
    <Tabs.Root
      defaultValue="create"
      tone={accent ? 'accent' : 'default'}
      className="max-w-sm"
    >
      <Tabs.List aria-label={accent ? 'Accent underline tabs' : 'Underline tabs'}>
        {MEDIA_TABS.map(tab => (
          <Tabs.Tab key={tab.value} value={tab.value}>
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panel value="create">Create content</Tabs.Panel>
      <Tabs.Panel value="edit">Edit content</Tabs.Panel>
      <Tabs.Panel value="motion">Motion content</Tabs.Panel>
    </Tabs.Root>
  )
}

function PillTabs() {
  return (
    <Tabs.Root variant="pill" defaultValue="sketch">
      <Tabs.List aria-label="Pill tabs">
        {PILL_TABS.map(tab => (
          <Tabs.Tab key={tab.value} value={tab.value}>
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}

function SegmentedTabs({
  defaultValue = 'create',
  shape = 'rounded',
  tone = 'glass',
}: {
  defaultValue?: string
  shape?: TabsShape
  tone?: TabsTone
}) {
  return (
    <Tabs.Root
      variant="segmented"
      shape={shape}
      tone={tone}
      defaultValue={defaultValue}
    >
      <Tabs.List aria-label={`${shape} segmented tabs`} className='w-full'>
        {SEGMENT_TABS.map(tab => (
          <Tabs.Tab
            key={tab.value}
            value={tab.value}
            iconOnly={shape === 'icon'}
            aria-label={shape === 'icon' ? tab.label : undefined}
          >
            <SunburstIcon />
            {shape === 'icon' ? null : tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}

const SOFT_TABS = [
  { value: 'mcp', label: 'MCP in Claude' },
  { value: 'super', label: 'Supercomputer' },
  { value: 'models', label: 'Models' },
]

function SoftTabs() {
  return (
    <Tabs.Root variant="soft" defaultValue="mcp">
      <Tabs.List aria-label="Soft pill tabs">
        {SOFT_TABS.map(tab => (
          <Tabs.Tab key={tab.value} value={tab.value} icon={<SunburstIcon />}>
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}

/** Interactive underline tabs with panels — the default Tabs. */
export const Playground: Story = {
  render: () => <UnderlineTabs />,
}

/** One of every variant / shape (Figma nodes 1639:4745 · 1747:351 · 1747:350). */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Section title="Underline"><UnderlineTabs /></Section>
      <Section title="Underline · accent"><UnderlineTabs accent /></Section>
      <Section title="Pill · text tabs"><PillTabs /></Section>
      <Section title="Soft pill"><SoftTabs /></Section>
      <Section title="Segmented · round"><SegmentedTabs /></Section>
      <Section title="Segmented · pill"><SegmentedTabs shape="pill" /></Section>
      <Section title="Segmented · icon-only"><SegmentedTabs shape="icon" /></Section>
    </div>
  ),
}

/** Tones, states, and in-context usage. */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Section title="Segment tones (glass · solid · brand-soft · brand)">
        <div className="grid grid-cols-2 gap-8">
          {TONES.map(tone => <SegmentedTabs key={tone} tone={tone} />)}
        </div>
      </Section>

      <Section title="Underline states">
        <Tabs.Root defaultValue="active" className="max-w-sm">
          <Tabs.List aria-label="Underline tab states">
            <Tabs.Tab value="inactive">Inactive</Tabs.Tab>
            <Tabs.Tab value="active">Active</Tabs.Tab>
            <Tabs.Tab value="hover" className="q-tabs-story-hover">Hover</Tabs.Tab>
            <Tabs.Tab value="disabled" disabled>Disabled</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </Section>

      <Section title="Segment states">
        <Tabs.Root variant="segmented" defaultValue="active">
          <Tabs.List aria-label="Segment states">
            <Tabs.Tab value="inactive"><SunburstIcon />Inactive</Tabs.Tab>
            <Tabs.Tab value="active"><SunburstIcon />Active</Tabs.Tab>
            <Tabs.Tab value="hover" className="q-tabs-story-hover"><SunburstIcon />Hover</Tabs.Tab>
            <Tabs.Tab value="disabled" disabled><SunburstIcon />Disabled</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </Section>

      <Section title="In a card / section">
        <div className="rounded-3xl bg-q-background-secondary p-3">
          <SegmentedTabs />
          <div className="mt-3 flex min-h-24 items-center justify-center rounded-2xl border border-q-border-subtle text-q-caption-sm-medium text-q-text-primary">
            Panel content
          </div>
        </div>
      </Section>

      <Section title="Equal width (fill a fixed track)">
        <Tabs.Root variant="segmented" defaultValue="create" className="w-full max-w-sm">
          <Tabs.List fullWidth aria-label="Equal width segmented tabs">
            {SEGMENT_TABS.map(tab => (
              <Tabs.Tab key={tab.value} value={tab.value}><SunburstIcon />{tab.label}</Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </Section>

      <Section title="Slots composing other components (Dot · Badge)">
        <Tabs.Root defaultValue="inbox" className="max-w-md">
          <Tabs.List aria-label="Tabs with composed slots">
            {/* `end` slot holds a quanta Badge count; `start` holds a Dot status */}
            <Tabs.Tab value="inbox" end={<Badge variant="lime">3</Badge>}>Inbox</Tabs.Tab>
            <Tabs.Tab value="live" start={<Dot color="green" />}>Live</Tabs.Tab>
            <Tabs.Tab value="archived">Archived</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </Section>

      <Section title="Soft pill — with panels">
        <Tabs.Root variant="soft" defaultValue="mcp" className="max-w-sm">
          <Tabs.List aria-label="Soft tabs with panels">
            {SOFT_TABS.map(tab => (
              <Tabs.Tab key={tab.value} value={tab.value} start={<SunburstIcon />}>{tab.label}</Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Panel value="mcp">Connect Claude to your tools with the Model Context Protocol.</Tabs.Panel>
          <Tabs.Panel value="super">Spin up on-demand GPU clusters for heavy inference workloads.</Tabs.Panel>
          <Tabs.Panel value="models">Browse and switch between available foundation models.</Tabs.Panel>
        </Tabs.Root>
      </Section>
    </div>
  ),
}
