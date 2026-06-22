# Skill: Landing Page

Use this when the user asks for a landing page, homepage, marketing page,
product page, launch page, waitlist page, coming-soon page, feature page,
pricing page, or any conversion-focused page section such as a hero, features,
social proof, FAQ, pricing, or CTA.

Before coding, read:

- `skills/quanta-design.md`
- `app/packages/quanta/ai/AGENTS.md`

This skill is template-specific. It uses the real Quanta surface available in
this repo. Quanta does **not** provide `QuantaProvider`, `Section`, `Container`,
`Display`, `Text`, `Card`, `PricingCard`, or generic layout primitives. Compose
page structure with semantic HTML and Tailwind layout utilities, then use
Quanta tokens/components for the visual system.

## Non-Negotiables

1. **Use Quanta for the visible system.** Buttons, inputs, tabs, dropdowns,
   badges, tags, avatars, progress, modals, vaults, and toasts come from
   `@higgsfield/quanta/*`.
2. **Use native Tailwind spacing for layout.** Use `p-4`, `gap-6`, `mt-10`,
   `h-12`, `max-w-7xl`. Do not use `p-400`, `gap-200`, `px-400`, or raw
   q-spacing utilities in app code.
3. **Use q-prefixed semantic utilities for color/type.** Use
   `bg-q-background-primary`, `text-q-display-md-bold`,
   `text-q-text-secondary`, `border-q-border-subtle`, `z-q-sticky`.
4. **No raw colors or arbitrary design values.** Avoid `bg-red-500`, `#fff`,
   `text-[13px]`, `p-[17px]`, inline color styles, and invented `q-*` classes.
5. **Websites need visual assets.** A landing page hero must include a real
   product/app/object/person/state visual, generated bitmap, image asset, or
   immersive interactive/product preview. Do not use abstract gradient blobs,
   bokeh/orbs, or SVG hero decoration as the main visual.
6. **Hero content is not a card.** For landing pages, place headline and CTA in
   the hero layout directly. Do not put the main hero copy inside a floating
   card or a split card/media composition.
7. **First viewport must identify the thing.** For branded/product/venue/person
   pages, the brand/product/place/person is the H1 or the immediate dominant
   signal, not only tiny nav text.
8. **Leave a hint of the next section visible.** Hero height should feel full
   but not trap the viewport; avoid `min-h-screen` heroes that hide the page
   below on desktop and mobile.

## Real Quanta Imports

Use these imports when needed:

```tsx
import { Avatar } from '@higgsfield/quanta/avatar'
import { Badge } from '@higgsfield/quanta/badge'
import { Button } from '@higgsfield/quanta/button'
import { Chip } from '@higgsfield/quanta/chip'
import { Divider } from '@higgsfield/quanta/divider'
import { Dot } from '@higgsfield/quanta/dot'
import { Input } from '@higgsfield/quanta/input'
import { Kbd } from '@higgsfield/quanta/kbd'
import { NavigationMenu } from '@higgsfield/quanta/navigation-menu'
import { Progress } from '@higgsfield/quanta/progress'
import { Tabs } from '@higgsfield/quanta/tabs'
import { Tag } from '@higgsfield/quanta/tag'
import { Textarea } from '@higgsfield/quanta/textarea'
```

Use semantic HTML for layout:

- `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`
- `<ul>`/`<li>` for lists
- `<figure>`/`<figcaption>` for visuals
- `<details>`/`<summary>` for simple FAQ when no Quanta accordion exists

## Landing Page Workflow

1. **Pin the conversion goal.** Decide the one action: start trial, join
   waitlist, book demo, buy, download, contact, or explore product.
2. **Name the audience and promise.** Write one sentence: who this is for, what
   they get, and why it matters now.
3. **Choose the art direction.** Define a restrained visual point of view tied
   to the subject: editorial, cinematic, operational, playful, luxury, studio,
   technical, etc. Express it with Quanta tokens and one signature visual move.
4. **Derive the section order.** Use only the sections needed to answer the
   visitor's objections in order. Do not include every possible section.
5. **Build mobile-first.** Design the narrow view as a real composition, then
   enhance at `tablet:` and `desktop:`.
6. **Screenshot mentally or with tooling.** Check first viewport hierarchy,
   spacing, visual asset framing, text wrapping, and CTA repetition.

## Recommended Section System

Pick from this menu based on the brief; do not blindly include all sections.

| Visitor question | Section |
|---|---|
| What is this? | Hero with clear H1, value, CTA, product visual |
| Why trust it? | Social proof, customers, outcomes, testimonials, press |
| How does it help me? | Feature benefits, use cases, before/after |
| How does it work? | Workflow, steps, product screenshots, tabs |
| What can I compare? | Pricing, plans, integrations, comparison |
| What if I am unsure? | FAQ, objections, security/privacy notes |
| What should I do now? | Final CTA with same action language |

Strong default flow:

1. Header/nav
2. Hero with product visual
3. Proof row or credibility signal
4. Problem/benefit section
5. Feature deep dives or workflow
6. Social proof or outcomes
7. Pricing/waitlist/contact block when relevant
8. FAQ
9. Final CTA
10. Footer

## Hero Rules

The hero must answer "what is it and why should I care?" in five seconds.

- H1 should be the brand/product/person/place name or a literal offer/category.
  Put the value prop in the supporting copy, not as a vague slogan.
- Use one primary CTA and one optional secondary action.
- Use `Badge` or `Tag` for one meaningful status label, not multiple decorative
  pills.
- The visual should show the real product/state/output where possible:
  screenshot, generated result, dashboard preview, editor canvas, object photo,
  venue/person image, or a composed product mockup.
- Avoid generic dark blurred stock photos. If the image matters, let users see
  it clearly.

Good hero structure:

```tsx
import { Badge } from '@higgsfield/quanta/badge'
import { Button } from '@higgsfield/quanta/button'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-q-background-primary text-q-text-primary">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-8 tablet:px-6 tablet:pb-20 tablet:pt-12 desktop:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] desktop:items-center desktop:px-8">
        <div className="grid max-w-3xl gap-6">
          <Badge variant="nBrand">new</Badge>
          <div className="grid gap-4">
            <h1 className="text-q-display-md-bold tablet:text-q-display-lg-bold">
              Atlas Studio
            </h1>
            <p className="max-w-2xl text-q-body-lg-regular text-q-text-secondary">
              Plan, generate, and publish campaign visuals from one focused workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 tablet:flex-row">
            <Button size="lg">Start creating</Button>
            <Button variant="secondary" size="lg">See examples</Button>
          </div>
        </div>

        <figure className="min-w-0 overflow-hidden rounded-2xl border border-q-border-subtle bg-q-background-secondary">
          <img
            src="/landing/product-preview.webp"
            alt="Atlas Studio campaign workspace showing generated visuals and timeline"
            className="aspect-[4/3] w-full object-cover"
          />
        </figure>
      </div>
    </section>
  )
}
```

Adjust copy, sections, and asset path to the actual app. Keep the pattern:
semantic HTML, native spacing, q-prefixed tokens, Quanta actions.

## Visual Asset Rules

Prefer, in order:

1. Real user-provided product/place/person/object media.
2. Real screenshots from the app being described.
3. Generated bitmap image that shows the product/state/output clearly.
4. A composed UI/product preview built from Quanta-styled panels.

Do not use:

- Decorative gradient/SVG hero illustrations as the main asset.
- Dark, blurred, over-cropped, stock-like images when users need to inspect the
  real thing.
- Random floating orbs, bokeh blobs, or abstract glass shapes.

When using images:

- Add descriptive `alt`.
- Set stable dimensions with `aspect-*`, `max-h-*`, or container constraints.
- Use `object-cover` only when cropping is acceptable; use `object-contain`
  when the whole product/output must be visible.
- Ensure text never overlaps the image on small screens.

## Copy Rules

Landing copy is interface design.

- **Headline:** plain and specific. Name the product or literal offer.
- **Subhead:** one or two lines explaining who it is for and what changes.
- **CTA:** active verb, same label everywhere for the same action.
- **Features:** lead with benefits, then support with mechanism.
- **Social proof:** use concrete outcomes or recognizable roles.
- **FAQ:** answer objections directly, no filler.
- **Tone:** confident, simple, sentence case.

Avoid:

- "Transform your workflow" without specifics.
- Multiple competing CTA labels for one action.
- Vague adjectives stacked together.
- Copy that explains implementation instead of user value.

## Typography And Spacing

Use the type scale deliberately:

| Use | Utility |
|---|---|
| Hero H1 | `text-q-display-md-bold`, `tablet:text-q-display-lg-bold` |
| Section H2 | `text-q-headline-md-semi-bold` or `text-q-title-lg-semi-bold` |
| Eyebrow/status | `text-q-label-sm-semi-bold`, `Badge`, or `Tag` |
| Body | `text-q-body-md-regular` or `text-q-body-lg-regular` |
| Meta | `text-q-caption-sm-medium` |

Spacing defaults:

- Page side padding: `px-4 tablet:px-6 desktop:px-8`
- Section vertical padding: `py-14 tablet:py-20 desktop:py-24`
- Dense proof rows: `py-8 tablet:py-10`
- Section header gap: `gap-3` or `gap-4`
- Content grids: `gap-4 tablet:gap-6 desktop:gap-8`

## Premium Composition Rules

- One dominant element per viewport.
- Align to a clear grid; do not center every section by reflex.
- Repeat structure for cohesion, vary only when the content changes.
- Use asymmetry when it carries meaning; otherwise keep the page calm.
- Let whitespace separate ideas. Do not fill every open area with decoration.
- Keep buttons and nav targets at comfortable touch sizes.
- Ensure text wraps cleanly at mobile width.
- Show at least a sliver of the next section under the hero.

## Common Section Patterns

### Proof row

```tsx
<section className="border-y border-q-border-subtle bg-q-background-secondary">
  <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 tablet:grid-cols-3 tablet:px-6 desktop:px-8">
    {stats.map(stat => (
      <div key={stat.label} className="grid gap-1">
        <div className="text-q-title-lg-semi-bold">{stat.value}</div>
        <p className="text-q-body-sm-regular text-q-text-secondary">{stat.label}</p>
      </div>
    ))}
  </div>
</section>
```

### Feature grid

```tsx
<section className="bg-q-background-primary py-14 tablet:py-20">
  <div className="mx-auto grid max-w-7xl gap-8 px-4 tablet:px-6 desktop:px-8">
    <div className="max-w-2xl">
      <h2 className="text-q-headline-md-semi-bold">Everything stays in one flow.</h2>
      <p className="mt-3 text-q-body-md-regular text-q-text-secondary">
        Briefs, outputs, approvals, and publishing live together.
      </p>
    </div>
    <div className="grid gap-4 tablet:grid-cols-3">
      {features.map(feature => (
        <article key={feature.title} className="grid gap-3 rounded-lg border border-q-border-subtle bg-q-background-secondary p-5">
          <h3 className="text-q-title-sm-semi-bold">{feature.title}</h3>
          <p className="text-q-body-sm-regular text-q-text-secondary">{feature.body}</p>
        </article>
      ))}
    </div>
  </div>
</section>
```

### Waitlist form

```tsx
import { Button } from '@higgsfield/quanta/button'
import { Input } from '@higgsfield/quanta/input'

<form className="grid gap-3 tablet:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
  <Input
    label="Work email"
    type="email"
    placeholder="you@company.com"
    required
  />
  <Button className="self-end" size="lg">Join waitlist</Button>
</form>
```

## Anti-Patterns

- Hero as a generic centered headline, subhead, two buttons, and gradient blob.
- H1 that hides the product/brand name behind a vague tagline.
- Hero copy inside a card.
- Three equal feature cards by reflex when content calls for a story, demo, or
  comparison.
- Pricing cards for a product that has no pricing.
- Social proof invented without source/context.
- Too many badges/pills competing for attention.
- Full-page `min-h-screen` hero that hides the next section.
- Raw Tailwind colors, arbitrary sizes, and old Quanta spacing token classes.
- Direct use of non-Quanta `sonner`, `cmdk`, or `vaul` for landing UI.

## Final Checklist

Before finishing:

- Is the conversion goal obvious in the first viewport?
- Is the H1 the product/brand/person/place name or a literal offer/category?
- Does the hero include a real or generated visual that reveals the subject?
- Are CTA labels active, consistent, and repeated near the close?
- Does every section answer a real visitor question?
- Are all colors/type/borders semantic Quanta utilities?
- Is app layout spacing native Tailwind, not old numeric Quanta spacing?
- Are Quanta components used for actions/forms/status/feedback?
- Does mobile layout read as intentionally as desktop?
- Is there visible focus, sufficient contrast, and no text overlap?
