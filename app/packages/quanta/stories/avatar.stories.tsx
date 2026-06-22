import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import {
  Avatar,
  type AvatarColor,
  type AvatarSize,
  type AvatarStatus,
} from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Dot } from '../src/components/dot/index.ts'

const SIZES: AvatarSize[] = ['xl', 'lg', 'md', 'sm', 'xs', '2xs']
const COLORS: AvatarColor[] = ['neutral', 'orange', 'mint', 'blue', 'pink', 'purple', 'brown', 'yellow']
const STATUSES: AvatarStatus[] = ['online', 'away', 'busy', 'offline']

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    color: { control: 'select', options: [undefined, ...COLORS] },
    status: { control: 'select', options: [undefined, ...STATUSES] },
    variant: { control: 'inline-radio', options: ['filled', 'dashed'] },
    alt: { control: 'text' },
    src: { control: 'text' },
    fallback: { control: false },
    imageProps: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof Avatar>

/** Eight reference columns — vivid brand colours, last one neutral/dark. */
const PEOPLE: Array<{ alt: string, color: AvatarColor }> = [
  { alt: 'Alice Turner', color: 'orange' },
  { alt: 'Ben Vance', color: 'mint' },
  { alt: 'Aria Zhang', color: 'blue' },
  { alt: 'Mia Adams', color: 'pink' },
  { alt: 'Kai Bryce', color: 'purple' },
  { alt: 'Dana Kane', color: 'brown' },
  { alt: 'Faye Brooks', color: 'yellow' },
  { alt: 'Ada Young', color: 'neutral' },
]

const IMG = 'https://i.pravatar.cc/160?img='

function AvatarCell({ children }: { children: ReactNode }) {
  return <div className="flex size-14 items-center justify-center">{children}</div>
}

function Row({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className="flex items-center gap-6">
      <span className="w-20 text-q-caption-sm-regular text-q-text-tertiary">{label}</span>
      {children}
    </div>
  )
}

/**
 * Playground — a single interactive Avatar wired to Storybook controls. Toggle
 * size / color / status / variant and swap in a photo via the `src` field.
 */
export const Playground: Story = {
  args: {
    size: 'xl',
    alt: 'Aria Zhang',
    color: 'blue',
    status: 'online',
    variant: 'filled',
  },
}

/**
 * Variants — the three avatar "types" (colored initials, photo, dashed
 * placeholder) plus the presence-status set, at the default md size.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Row label="Initials">
        {PEOPLE.map(p => (
          <Avatar key={p.alt} size="md" alt={p.alt} color={p.color} status="online" />
        ))}
      </Row>
      <Row label="Photo">
        {PEOPLE.map((p, i) => (
          <Avatar key={p.alt} size="md" src={`${IMG}${i + 11}`} alt={p.alt} status="online" />
        ))}
      </Row>
      <Row label="Dashed">
        {PEOPLE.map(p => (
          <Avatar key={p.alt} size="md" variant="dashed" alt="Add" />
        ))}
      </Row>
      <Row label="Status">
        {STATUSES.map(status => (
          <Avatar key={status} size="md" alt="Aria Zhang" color="blue" status={status} />
        ))}
      </Row>
    </div>
  ),
}

/**
 * RichVariants — the size ramp, and the rim `badge` slot composing OTHER quanta
 * components (a count Badge, a verified check, a custom animated Dot) in place
 * of the default presence dot. The `fallback` slot also takes any node.
 */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Row label="Sizes">
        {SIZES.map(size => (
          <AvatarCell key={size}>
            <Avatar size={size} alt="Aria Zhang" color="blue" status="online" />
          </AvatarCell>
        ))}
      </Row>
      <Row label="Badge slot">
        <Avatar size="lg" alt="Mia Adams" color="pink" badge={<Badge variant="nBrand" text="9+" />} />
        <Avatar size="lg" alt="Ben Vance" color="mint" badge={<CheckBadge />} />
        <Avatar size="lg" alt="Aria Zhang" color="blue" badge={<Dot color="green" size="md" animation="pulse" />} />
        <Avatar size="lg" alt="Ada Young" status="busy" />
      </Row>
      <Row label="Fallback">
        <Avatar size="lg" color="purple" fallback={<SparkleGlyph />} />
        <Avatar size="lg" color="orange" fallback="★" />
      </Row>
    </div>
  ),
}

/** A small verified check rendered on a brand disc — composed in the badge slot. */
function CheckBadge() {
  return (
    <span className="flex size-4 items-center justify-center rounded-full bg-q-brand-primary text-q-text-inverse">
      <svg viewBox="0 0 16 16" fill="none" className="size-3" aria-hidden>
        <path d="M4 8.5l2.5 2.5L12 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function SparkleGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-5" aria-hidden>
      <path d="M8 1l1.6 4.9L14.5 8l-4.9 1.6L8 15l-1.6-5.4L1.5 8l4.9-1.6z" />
    </svg>
  )
}
