import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../src/components/button/index.ts'
import { Kbd, KbdSequence } from '../src/components/kbd/index.ts'

const meta: Meta<typeof Kbd> = {
  title: 'Components/Kbd',
  component: Kbd,
  args: { children: 'K' },
}

export default meta
type Story = StoryObj<typeof Kbd>

/** A single interactive pill (edit the key via the `children` control). */
export const Playground: Story = {
  render: args => <Kbd {...args} />,
}

/** Single keys + combos in one pill — the Figma `_Shortcut` (node 1157:4028). */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {['⌘', '⇧', '⌥', '⌃', '↩', '⌫', 'A', 'Esc', 'Tab', 'Space'].map(k => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {['⌘ A', '⌘ C', '⌘ V', '⌘ ⇧ Z', '⌘ K', 'ESC'].map(k => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </div>
    </div>
  ),
}

/** Rich — sequences (joined by a separator) and inline-in-prose usage. */
export const RichVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <KbdSequence keys={['⌘', 'K']} />
        <KbdSequence keys={['⌘', '⇧', 'P']} />
        <KbdSequence keys={['Ctrl', 'C']} />
        <KbdSequence keys={['G', 'I']} separator="then" />
      </div>
      <p className="max-w-md text-q-text-primary text-q-body-md-regular">
        Press <KbdSequence keys={['⌘', 'K']} /> to open the command palette, then{' '}
        <Kbd>Esc</Kbd> to close it.
      </p>

      {/* Kbd is a primitive composed INTO other components — e.g. a Button's end slot. */}
      {/* dark-surface button variants — the Kbd is themed white-on-dark */}
      <div className="flex items-center gap-3">
        <Button variant="tertiary" size="sm" end={<Kbd>⌘K</Kbd>}>Command</Button>
        <Button variant="outline" size="sm" end={<Kbd>⌘S</Kbd>}>Save</Button>
      </div>
    </div>
  ),
}
