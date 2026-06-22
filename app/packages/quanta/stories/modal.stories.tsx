import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode, SVGProps } from 'react'
import { useState } from 'react'
import { Button } from '../src/components/button/index.ts'
import { Modal } from '../src/components/modal/index.ts'
import { Tabs } from '../src/components/tabs/index.ts'

/**
 * Modal — Base UI Dialog skinned with quanta tokens, pixel-matched to the Figma
 * modal system (container 1976:1460, body 1974:1408, header types 2034:1777,
 * footer types 2031:1734, plus the Uploads / Elements compositions). Stories
 * render over a media-grid backdrop so the frosted-glass blur reads, and open
 * via a trigger so the enter/exit animation plays.
 */
const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <div className="relative min-h-screen overflow-hidden">
        <PageBackdrop />
        <div className="relative grid min-h-screen place-items-center p-6">
          <Story />
        </div>
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof Modal>

function PageBackdrop() {
  const tiles = ['bg-q-palette-orange-bg', 'bg-q-palette-mint-bg', 'bg-q-palette-blue-bg', 'bg-q-palette-pink-bg', 'bg-q-palette-purple-bg', 'bg-q-brand-yellow']
  return (
    <div className="absolute inset-0 grid grid-cols-5 grid-rows-4">
      {Array.from({ length: 20 }).map((_, i) => <div key={i} className={tiles[(i * 3 + (i % 5)) % tiles.length]} />)}
    </div>
  )
}

const BODY_TEXT
  = 'The modal is a frosted-glass panel over a dimmed backdrop — the glass blur is on the modal, not the overlay. The header, footer and side paddings are that glass; the body is a lighter inset “window”.'

/* ── Inline glyphs for the composition toolbars (quanta ships no icon set). ─── */
function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden width="18" height="18" {...props}>
      <path d="M3 5.5h14M6 10h8M8.5 14.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function ViewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden width="18" height="18" {...props}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden width="18" height="18" {...props}>
      <path d="M12.5 3.5l4 4-3 1-3.5 3.5-1-1L3 18m9.5-14.5L16.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Cancel + Confirm footer actions (Figma footer master). */
function ConfirmActions() {
  return (
    <>
      <Modal.Close render={<Button variant="tertiary">Cancel</Button>} />
      <Modal.Close render={<Button variant="secondary">Confirm</Button>} />
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * Playground — the modal master (default header + body + caption footer).
 * Configure the size from the Storybook controls.
 * ─────────────────────────────────────────────────────────────────────────── */
export const Playground: Story = {
  args: { size: 'md', title: 'Modal title' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    title: { control: 'text' },
  },
  render: ({ size, title }) => (
    <Modal.Root>
      <Modal.Trigger render={<Button>Open modal</Button>} />
      <Modal.Content size={size}>
        <Modal.Header title={title} />
        <Modal.Body>
          <div className="grid min-h-[16rem] place-items-center text-q-body-md-regular text-q-text-secondary">Контент — слот</div>
        </Modal.Body>
        <Modal.Footer caption="{caption}" actions={<ConfirmActions />} />
      </Modal.Content>
    </Modal.Root>
  ),
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * Variants — the header types (default / back / search / tabs), footer types
 * (caption + actions / actions / full), and size scale. Each button opens its
 * own modal so the real focus-trap, portal and animation run.
 * ─────────────────────────────────────────────────────────────────────────── */
/**
 * The `tabs` header slot takes any node — here the real quanta `Tabs` (pill
 * variant, whose active indicator is the white `button-primary` pill from
 * Figma). Pass `Tabs`, a custom segmented control, or anything else.
 */
function ModeTabs() {
  return (
    <Tabs.Root variant="pill" defaultValue="sketch">
      <Tabs.List aria-label="Modes">
        <Tabs.Tab value="sketch">Sketch to Video</Tabs.Tab>
        <Tabs.Tab value="draw">Draw to Video</Tabs.Tab>
        <Tabs.Tab value="edit">Draw to Edit</Tabs.Tab>
      </Tabs.List>
    </Tabs.Root>
  )
}

function VariantTrigger({ label, children }: { label: string, children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Modal.Root open={open} onOpenChange={setOpen}>
      <Modal.Trigger render={<Button variant="secondary">{label}</Button>} />
      {children(() => setOpen(false))}
    </Modal.Root>
  )
}

function VariantSection({ heading, children }: { heading: string, children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-q-caption-sm-medium text-q-text-tertiary uppercase tracking-wide">{heading}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <VariantSection heading="Header types">
        <VariantTrigger label="Default">
          {() => (
            <Modal.Content>
              <Modal.Header title="Modal title" />
              <Modal.Body><p className="text-q-body-md-regular text-q-text-secondary">{BODY_TEXT}</p></Modal.Body>
              <Modal.Footer caption="{caption}" actions={<ConfirmActions />} />
            </Modal.Content>
          )}
        </VariantTrigger>
        <VariantTrigger label="Back">
          {() => (
            <Modal.Content aria-label="Modal title">
              <Modal.Header variant="back" title="Modal title" />
              <Modal.Body><p className="text-q-body-md-regular text-q-text-secondary">{BODY_TEXT}</p></Modal.Body>
              <Modal.Footer actions={<ConfirmActions />} />
            </Modal.Content>
          )}
        </VariantTrigger>
        <VariantTrigger label="Search">
          {() => (
            <Modal.Content size="lg" aria-label="Search">
              <Modal.Header variant="search" searchProps={{ placeholder: 'Search' }} />
              <Modal.Body>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => <Card key={i} />)}
                </div>
              </Modal.Body>
            </Modal.Content>
          )}
        </VariantTrigger>
        <VariantTrigger label="Tabs">
          {() => (
            <Modal.Content size="lg" aria-label="Modes">
              {/* `end` slot — a trailing quanta Button sits just before the close ✕ */}
              <Modal.Header variant="tabs" tabs={<ModeTabs />} end={<Button variant="ghost" size="sm">Upgrade</Button>} />
              <Modal.Body><p className="text-q-body-md-regular text-q-text-secondary">{BODY_TEXT}</p></Modal.Body>
              <Modal.Footer caption="{caption}" actions={<Button variant="secondary">Confirm</Button>} />
            </Modal.Content>
          )}
        </VariantTrigger>
      </VariantSection>

      <VariantSection heading="Footer types">
        <VariantTrigger label="Caption + actions">
          {() => (
            <Modal.Content>
              <Modal.Header title="Modal title" />
              <Modal.Body><p className="text-q-body-md-regular text-q-text-secondary">{BODY_TEXT}</p></Modal.Body>
              <Modal.Footer caption="{caption}" actions={<ConfirmActions />} />
            </Modal.Content>
          )}
        </VariantTrigger>
        <VariantTrigger label="Actions only">
          {() => (
            <Modal.Content>
              <Modal.Header title="Modal title" />
              <Modal.Body><p className="text-q-body-md-regular text-q-text-secondary">{BODY_TEXT}</p></Modal.Body>
              <Modal.Footer actions={<ConfirmActions />} />
            </Modal.Content>
          )}
        </VariantTrigger>
        <VariantTrigger label="Full-width">
          {() => (
            <Modal.Content size="sm">
              <Modal.Header title="New folder" />
              <Modal.Body>
                <input placeholder="Folder name" className="w-full rounded-2xl bg-q-overlay-dim-soft px-3 py-2.5 text-q-body-sm-regular text-q-text-primary outline-none placeholder:text-q-text-on-overlay-secondary" />
              </Modal.Body>
              <Modal.Footer full actions={<Modal.Close render={<Button variant="secondary" className="w-full">Create</Button>} />} />
            </Modal.Content>
          )}
        </VariantTrigger>
      </VariantSection>

      <VariantSection heading="Sizes">
        {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map(s => (
          <VariantTrigger key={s} label={s}>
            {() => (
              <Modal.Content size={s}>
                <Modal.Header title={`Size: ${s}`} />
                <Modal.Body><p className="text-q-body-md-regular text-q-text-secondary">{BODY_TEXT}</p></Modal.Body>
                <Modal.Footer caption="{caption}" actions={<ConfirmActions />} />
              </Modal.Content>
            )}
          </VariantTrigger>
        ))}
      </VariantSection>
    </div>
  ),
}

/* ─────────────────────────────────────────────────────────────────────────── *
 * Rich variants — real compositions from Figma: the Uploads picker (tabs
 * header + toolbar + media grids, 1472:7171) and the Elements browser (left
 * sidebar + content + Link footer, 1472:7211).
 * ─────────────────────────────────────────────────────────────────────────── */
function Card({ className }: { className?: string }) {
  return <div className={`aspect-square rounded-2xl bg-q-overlay-dim-soft ${className ?? ''}`} />
}

/** Search pill + Filter / View controls (matches the Figma content toolbar). */
function Toolbar() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center gap-2 rounded-full bg-q-overlay-dim-soft px-2 py-2.5 text-q-text-on-overlay-secondary">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden width="20" height="20"><circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <span className="text-q-body-sm-regular">Search</span>
      </div>
      <Button variant="ghost"><span className="flex items-center gap-1.5"><FilterIcon />Filter</span></Button>
      <Button variant="ghost"><span className="flex items-center gap-1.5"><ViewIcon />View</span></Button>
    </div>
  )
}

function LabelledGrid({ cols, count }: { cols: string, count: number }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-q-body-sm-regular text-q-text-secondary">{'{label}'}</span>
      <div className={`grid gap-2 ${cols}`}>
        {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
      </div>
    </div>
  )
}

const UPLOAD_TABS = [
  { value: 'uploads', label: 'Uploads' },
  { value: 'elements', label: 'Elements' },
  { value: 'image', label: 'Image Generations' },
  { value: 'video', label: 'Video Generations' },
  { value: 'liked', label: 'Liked' },
]

export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Modal.Root>
        <Modal.Trigger render={<Button variant="secondary">Uploads</Button>} />
        <Modal.Content size="lg" aria-label="Uploads">
          <Modal.Header
            variant="tabs"
            tabs={(
              <Tabs.Root variant="pill" defaultValue={UPLOAD_TABS[0].value}>
                <Tabs.List aria-label="Library">
                  {UPLOAD_TABS.map(tab => <Tabs.Tab key={tab.value} value={tab.value}>{tab.label}</Tabs.Tab>)}
                </Tabs.List>
              </Tabs.Root>
            )}
          />
          <Modal.Body>
            <Modal.Workspace className="flex flex-col gap-4">
              <Toolbar />
              <LabelledGrid cols="grid-cols-5" count={2} />
              <LabelledGrid cols="grid-cols-5" count={6} />
            </Modal.Workspace>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      <Modal.Root>
        <Modal.Trigger render={<Button variant="secondary">Elements</Button>} />
        <Modal.Content size="xl" aria-label="My Elements" closeButton={false}>
          <Modal.Body>
            <div className="flex min-h-[28rem] gap-2">
              <Modal.Workspace className="flex w-[14rem] flex-none flex-col gap-3">
                <h2 className="text-q-body-md-semi-bold text-q-text-primary">My Elements</h2>
                <div className="flex flex-col gap-1">
                  <span className="px-2 text-q-caption-sm-medium text-q-text-tertiary">Pinned</span>
                  <button type="button" className="flex items-center gap-2 rounded-xl bg-q-overlay-dim-soft px-3 py-2 text-left text-q-body-sm-regular text-q-text-primary">
                    <PinIcon />
                    All Pinned
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="px-2 text-q-caption-sm-medium text-q-text-tertiary">Projects</span>
                  {[['Cully boys', '33 342'], ['Blue Horizon', '484']].map(([name, count]) => (
                    <button key={name} type="button" className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-q-body-sm-regular text-q-text-secondary">
                      <span className="size-6 flex-none rounded-full bg-q-overlay-dim-soft" />
                      <span className="min-w-0 flex-1 truncate text-q-text-primary">{name}</span>
                      <span className="text-q-caption-sm-regular text-q-text-tertiary">{count}</span>
                    </button>
                  ))}
                </div>
              </Modal.Workspace>
              <Modal.Workspace className="flex flex-col gap-4">
                <Toolbar />
                <LabelledGrid cols="grid-cols-5" count={2} />
                <LabelledGrid cols="grid-cols-5" count={6} />
              </Modal.Workspace>
            </div>
          </Modal.Body>
          <Modal.Footer caption="{caption}" actions={<Modal.Close render={<Button variant="tertiary">Link</Button>} />} />
        </Modal.Content>
      </Modal.Root>
    </div>
  ),
}
