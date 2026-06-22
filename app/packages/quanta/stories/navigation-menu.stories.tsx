import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps, SVGProps } from 'react'
import { Avatar } from '../src/components/avatar/index.ts'
import { Badge } from '../src/components/badge/index.ts'
import { Button } from '../src/components/button/index.ts'
import { NavigationMenu } from '../src/components/navigation-menu/index.ts'

const meta: Meta<typeof NavigationMenu.Root> = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu.Root,
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="min-h-[28rem] bg-q-background-primary"><Story /></div>],
}
export default meta
type Story = StoryObj<typeof NavigationMenu.Root>

/* ── Inline icons (content — supplied by the consumer) ─────────────────────── */
function makeIcon(d: string) {
  return (p: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d={d} />
    </svg>
  )
}
const Spark = makeIcon('M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z')
const Diamond = makeIcon('M2.5 6l2-3.5h7l2 3.5-5.5 7z')
const Search = makeIcon('M7.25 12.5a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5zM14 14l-3-3')
const FileIcon = makeIcon('M9 1.5H4.5A1.5 1.5 0 003 3v10a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 13V5.5zM9 1.5V5.5H13')
const ImageIcon = makeIcon('M2.5 3.5h11v9h-11zM5 7a1 1 0 100-2 1 1 0 000 2zM3 12l3.5-3.5 2 2L11 8l2 2')
const VideoIcon = makeIcon('M2.5 4h7v8h-7zM9.5 6.5l4-2v7l-4-2')
const Mic = makeIcon('M8 1.5a2 2 0 00-2 2v4a2 2 0 104 0v-4a2 2 0 00-2-2zM3.5 7.5a4.5 4.5 0 009 0M8 12v2.5M5.5 14.5h5')
const Wand = makeIcon('M11 2.5l2.5 2.5-8 8L3 13zM10 3.5l2 2')
const Layers = makeIcon('M8 1.5l6 3.25-6 3.25-6-3.25zM2 8l6 3.25L14 8M2 11l6 3.25L14 11')
const Globe = makeIcon('M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM1.5 8h13M8 1.5c1.8 1.9 1.8 11.1 0 13M8 1.5c-1.8 1.9-1.8 11.1 0 13')
/** Brand "H" monogram (content) for the logo button. */
const LogoMark = makeIcon('M4 2.5v11M12 2.5v11M4 8h8')

/** The shared bar content (logo + nav list + actions). */
function Header({ auth = false, ...rootProps }: { auth?: boolean } & ComponentProps<typeof NavigationMenu.Root>) {
  return (
    <NavigationMenu.Root {...rootProps}>
      <NavigationMenu.Logo>
        <Button as="a" href="#" iconOnly variant="ghost" aria-label="Higgsfield — home"><LogoMark /></Button>
      </NavigationMenu.Logo>

      <NavigationMenu.List>
        <NavigationMenu.Item label="Image" start={<ImageIcon />}>
          <NavigationMenu.Menu rows={4}>
            <NavigationMenu.Group heading="Features">
              <NavigationMenu.MenuItem start={<ImageIcon />} title="Create Image" subtitle="Generate AI images" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Cinematic Camera" subtitle="Image gen w/ camera" end={<Badge variant="nBrand">new</Badge>} href="#" />
              <NavigationMenu.MenuItem start={<VideoIcon />} title="Canvas" subtitle="Editable workspace" href="#" />
              <NavigationMenu.MenuItem start={<Layers />} title="Upscale" subtitle="Up to 4K detail" href="#" />
              <NavigationMenu.MenuItem start={<Wand />} title="Inpaint & Edit" subtitle="Brush to change" end={<Badge variant="nBrand">new</Badge>} href="#" />
            </NavigationMenu.Group>
            <NavigationMenu.Group heading="Models">
              <NavigationMenu.MenuItem start={<Spark />} title="Higgsfield Soul 2.0" subtitle="Next-gen realism" end={<Badge variant="nBlue">new</Badge>} href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Nano Banana 2" subtitle="Fast image model" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="FLUX.2" subtitle="High-detail editor" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="SDXL Turbo" subtitle="Real-time preview" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Recraft v3" subtitle="Vector & brand art" href="#" />
            </NavigationMenu.Group>
            <NavigationMenu.Group heading="Use cases">
              <NavigationMenu.MenuItem start={<Diamond />} title="Product shots" subtitle="E-commerce ready" href="#" />
              <NavigationMenu.MenuItem start={<ImageIcon />} title="Portraits" subtitle="Headshots & avatars" href="#" />
              <NavigationMenu.MenuItem start={<Wand />} title="Concept art" subtitle="Moodboards & ideation" href="#" />
              <NavigationMenu.MenuItem start={<FileIcon />} title="Thumbnails" subtitle="Click-worthy covers" href="#" />
            </NavigationMenu.Group>
          </NavigationMenu.Menu>
        </NavigationMenu.Item>
        <NavigationMenu.Item label="Video" start={<VideoIcon />}>
          <NavigationMenu.Menu rows={4}>
            <NavigationMenu.Group heading="Features">
              <NavigationMenu.MenuItem start={<VideoIcon />} title="Create Video" subtitle="Generate AI video" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Cinema Studio" subtitle="Cinematic shots" end={<Badge variant="nBrand">new</Badge>} href="#" />
              <NavigationMenu.MenuItem start={<Wand />} title="Edit Video" subtitle="Trim, effects, audio" href="#" />
              <NavigationMenu.MenuItem start={<Mic />} title="Lip Sync" subtitle="Match any voice" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Motion Brush" subtitle="Direct the movement" end={<Badge variant="nBrand">new</Badge>} href="#" />
            </NavigationMenu.Group>
            <NavigationMenu.Group heading="Models">
              <NavigationMenu.MenuItem start={<Spark />} title="Seedance 2.0" subtitle="Most advanced" end={<Badge variant="nBlue">new</Badge>} href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Kling 3.0" subtitle="Realistic motion" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Veo 3.1" subtitle="Generate w/ sound" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Runway Gen-4" subtitle="Director controls" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Hailuo 02" subtitle="Smooth & cinematic" href="#" />
            </NavigationMenu.Group>
            <NavigationMenu.Group heading="Use cases">
              <NavigationMenu.MenuItem start={<Diamond />} title="Ads" subtitle="Performance creative" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Music videos" subtitle="Beat-synced visuals" href="#" />
              <NavigationMenu.MenuItem start={<FileIcon />} title="Explainers" subtitle="Product & how-tos" href="#" />
              <NavigationMenu.MenuItem start={<Globe />} title="Social clips" subtitle="Reels, Shorts, TikTok" href="#" />
            </NavigationMenu.Group>
          </NavigationMenu.Menu>
        </NavigationMenu.Item>
        <NavigationMenu.Item label="Audio" start={<Spark />}>
          <NavigationMenu.Menu rows={4}>
            <NavigationMenu.Group heading="Features">
              <NavigationMenu.MenuItem start={<Mic />} title="Voiceover" subtitle="Natural speech" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Change Voice" subtitle="Swap any voice" href="#" />
              <NavigationMenu.MenuItem start={<Globe />} title="Translation" subtitle="Dub any language" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Sound FX" subtitle="Text to SFX" end={<Badge variant="nBrand">new</Badge>} href="#" />
            </NavigationMenu.Group>
            <NavigationMenu.Group heading="Models">
              <NavigationMenu.MenuItem start={<Spark />} title="Eleven v3" subtitle="Expressive TTS" href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="MiniMax 2.0 HD" subtitle="Studio quality" end={<Badge variant="nBlue">new</Badge>} href="#" />
              <NavigationMenu.MenuItem start={<Spark />} title="Suno v4" subtitle="Songs from a prompt" href="#" />
            </NavigationMenu.Group>
            <NavigationMenu.Group heading="Use cases">
              <NavigationMenu.MenuItem start={<Mic />} title="Podcasts" subtitle="Multi-speaker audio" href="#" />
              <NavigationMenu.MenuItem start={<Globe />} title="Dubbing" subtitle="Localize any video" href="#" />
              <NavigationMenu.MenuItem start={<FileIcon />} title="Audiobooks" subtitle="Long-form narration" href="#" />
            </NavigationMenu.Group>
          </NavigationMenu.Menu>
        </NavigationMenu.Item>
        <NavigationMenu.Separator />
        <NavigationMenu.Item label="Supercomputer" accent start={<Spark />} end={<Badge variant="nBrand">new</Badge>} href="#" />
        <NavigationMenu.Item label="MCP & CLI" end={<Badge variant="nBlue">new</Badge>} href="#" />
        <NavigationMenu.Item label="Plugins" end={<Badge variant="nBrand">new</Badge>} href="#" />
        <NavigationMenu.Item label="Collab" href="#" />
        <NavigationMenu.Item label="Canvas" href="#" />
      </NavigationMenu.List>

      <NavigationMenu.Actions>
        <NavigationMenu.ActionsGroup>
          <NavigationMenu.Action iconOnly aria-label="Search"><Search /></NavigationMenu.Action>
          <NavigationMenu.Action href="#">
            <Diamond />
            Pricing
            <Badge variant="pink">30% OFF</Badge>
          </NavigationMenu.Action>
          <NavigationMenu.Action href="#"><FileIcon />Assets</NavigationMenu.Action>
        </NavigationMenu.ActionsGroup>
        <NavigationMenu.Separator />
        {auth
          ? (
              <>
                <Button variant="ghost" size="sm">Login</Button>
                <Button variant="primary" size="sm">Sign up</Button>
              </>
            )
          : <Avatar size="sm" alt="Ada Young" status="online" />}
      </NavigationMenu.Actions>
    </NavigationMenu.Root>
  )
}

/** Playground — the default product header (hover "Image" to open its mega-menu). */
export const Playground: Story = {
  render: () => <Header />,
}

/** Variants — signed-in (avatar) vs logged-out (Login / Sign up) headers. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Header />
      <Header auth />
    </div>
  ),
}

/** Rich variants — the open mega-menu: the "Image" trigger's panel (Features /
 * Models columns of rich items with leading icons, NEW badges, subtitles) shown
 * by opening it via `defaultValue` on the real component. */
export const RichVariants: Story = {
  render: () => <Header defaultValue="Image" />,
}
