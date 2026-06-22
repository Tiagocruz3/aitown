# Skill: Small App Design

Use this when the user asks for a small focused app or tool: todo list, notes
app, habit tracker, timer, calculator, converter, planner, recipe box, budget
tracker, simple AI generator, prompt tool, image utility, media picker, quiz,
flashcards, checklist, form + result page, or any single-purpose app that
should feel simple, beautiful, and complete.

Before coding, read:

- `skills/quanta-design.md`
- `app/packages/quanta/ai/AGENTS.md`

If the app uses generation jobs, uploads, profile/workspace, or credits, also
read `skills/fnf-sdk.md` and `skills/fnf-react.md`.

## Small App Principle

A small app should feel like a finished object, not a thin demo. It needs one
clear purpose, a tight layout, satisfying controls, and full states. Do not
turn it into a SaaS dashboard, and do not make a marketing landing page first.
The first screen should be the app itself.

Premium small apps are usually:

- focused around one workflow
- quiet and compact
- visually balanced
- mobile-first
- fast to understand without instructions
- generous enough to feel designed, not cramped

## Non-Negotiables

1. **Build the actual tool first.** No landing hero unless the user explicitly
   asks for a marketing page.
2. **One primary workflow.** The screen should have one obvious main action.
3. **Use Quanta controls.** Buttons, inputs, tabs, dropdowns, switches, tags,
   progress, modals, vaults, and toasts come from `@higgsfield/quanta/*`.
4. **Use native Tailwind spacing for layout.** `p-4`, `gap-3`, `mt-6`, `h-10`,
   `max-w-3xl`. Do not use `p-400`, `gap-200`, `px-400`.
5. **Use q-prefixed semantic styling.** `bg-q-background-primary`,
   `text-q-title-md-semi-bold`, `text-q-text-secondary`,
   `border-q-border-subtle`.
6. **No raw colors, arbitrary text sizes, or custom pixel spacing.**
7. **Design all states.** Empty, loading, error, success, selected, disabled,
   and saved states must be part of the UI.
8. **Text must fit on mobile.** Use `min-w-0`, `truncate`, wrapping, and stable
   control sizes.

## Choose The Right Shape

Pick one shape from the app's workflow. Do not mix every pattern.

| App type | Best layout |
|---|---|
| Calculator/converter/generator | Centered tool panel + result preview |
| Notes/todos/checklists | Two-pane on desktop, single list/detail stack on mobile |
| Habit/timer/tracker | Compact dashboard with today's action dominant |
| Quiz/flashcards | Focused single-card flow with progress and actions |
| Budget/planner | Form/list hybrid with summary strip |
| Image/media utility | Input/upload area + preview/result area |
| Settings-style small tool | Narrow form with grouped sections |

## Layout Recipes

### Centered tool

Use for calculators, converters, prompt tools, waitlist forms, single AI tools,
and form-result flows.

```tsx
<main className="min-h-dvh bg-q-background-primary px-4 py-6 text-q-text-primary tablet:py-10">
  <section className="mx-auto grid w-full max-w-3xl gap-5">
    <header className="grid gap-2">
      <Tag color="brand">Quick tool</Tag>
      <div className="grid gap-2">
        <h1 className="text-q-title-lg-semi-bold">Image prompt cleaner</h1>
        <p className="max-w-2xl text-q-body-md-regular text-q-text-secondary">
          Rewrite rough prompts into clean, production-ready image directions.
        </p>
      </div>
    </header>

    <div className="grid gap-4 rounded-lg border border-q-border-subtle bg-q-background-secondary p-4 tablet:p-5">
      <Textarea label="Prompt" rows={6} />
      <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
        <p className="text-q-caption-sm-medium text-q-text-secondary">0 credits. Runs locally.</p>
        <Button>Clean prompt</Button>
      </div>
    </div>
  </section>
</main>
```

### Two-pane small app

Use for notes, todos, files, recipes, bookmarks, contacts, saved prompts, and
small collections.

```tsx
<main className="grid min-h-dvh bg-q-background-primary text-q-text-primary desktop:grid-cols-[300px_minmax(0,1fr)]">
  <aside className="min-h-0 border-b border-q-border-subtle p-3 desktop:border-b-0 desktop:border-r">
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-q-title-md-semi-bold">Notes</h1>
      <Button size="xs">New</Button>
    </div>
    <div className="mt-3">
      <Input placeholder="Search..." aria-label="Search notes" />
    </div>
    <ul className="mt-3 grid gap-1">...</ul>
  </aside>

  <section className="min-h-0 overflow-auto p-4 tablet:p-6">
    ...
  </section>
</main>
```

On mobile, keep the list first and open details below, or use `Tabs` for
List/Detail. Do not squeeze both panes side by side on small screens.

### Compact daily tracker

Use for habits, mood, workouts, expenses, streaks, timers, and simple progress
apps.

```tsx
<main className="min-h-dvh bg-q-background-primary p-4 text-q-text-primary tablet:p-6">
  <section className="mx-auto grid max-w-5xl gap-4">
    <header className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
      <div>
        <h1 className="text-q-title-lg-semi-bold">Today</h1>
        <p className="mt-1 text-q-body-sm-regular text-q-text-secondary">Three habits left for your daily streak.</p>
      </div>
      <Button size="sm">Add habit</Button>
    </header>

    <div className="grid gap-4 tablet:grid-cols-[minmax(0,1fr)_280px]">
      <div className="grid gap-2">...</div>
      <aside className="rounded-lg border border-q-border-subtle bg-q-background-secondary p-4">...</aside>
    </div>
  </section>
</main>
```

## Visual Style Rules

- Use one main surface and one nested surface. Avoid five different panel
  treatments.
- Use borders and subtle background changes, not heavy shadows.
- Use accent color sparingly: primary action, selected state, progress, or one
  status.
- Keep radii modest: `rounded-lg` is usually enough.
- Avoid full-screen empty black space. Give small tools a centered width and
  purposeful vertical rhythm.
- Use icons only where they clarify scanning; do not decorate every heading.
- Use `Tag`, `Badge`, or `Dot` for compact state labels.

## Typography Rules

Small apps need compact but readable type.

| Use | Utility |
|---|---|
| App title | `text-q-title-lg-semi-bold` |
| Panel title | `text-q-title-md-semi-bold` |
| Item title | `text-q-title-sm-semi-bold` or `text-q-label-lg-semi-bold` |
| Body | `text-q-body-md-regular` |
| Dense body | `text-q-body-sm-regular` |
| Meta/help | `text-q-caption-sm-medium` |
| Code/ids | `text-q-mono-sm-regular` |

Do not use hero-scale typography unless the app is intentionally a focused
single-state experience like a timer or game score.

## Interaction Rules

- Put the primary action close to the input/result it affects.
- Keep actions stable in place after submit; do not move buttons around.
- Disable submit only when the user clearly knows why, or show validation text.
- Use `toast` for transient success/failure, but use inline errors for form
  problems.
- Use `Modal` for destructive confirmation or focused editing.
- Use `Vault` for mobile filters/settings panels.
- Use `Tabs` for two or three top-level modes, not for every tiny option.
- Use `Dropdown` for compact option sets.

## State Patterns

### Empty state

```tsx
<div className="grid min-h-72 place-items-center rounded-lg border border-q-border-subtle bg-q-background-secondary p-6 text-center">
  <div className="grid max-w-sm gap-3">
    <h2 className="text-q-title-md-semi-bold">Nothing here yet</h2>
    <p className="text-q-body-sm-regular text-q-text-secondary">Create your first item to start building the list.</p>
    <div className="mt-1">
      <Button size="sm">Create item</Button>
    </div>
  </div>
</div>
```

### Result state

```tsx
<section className="grid gap-3 rounded-lg border border-q-border-subtle bg-q-background-secondary p-4">
  <div className="flex items-center justify-between gap-3">
    <h2 className="min-w-0 truncate text-q-title-sm-semi-bold">Result</h2>
    <Tag color="success">Ready</Tag>
  </div>
  <div className="rounded-md border border-q-border-subtle bg-q-background-primary p-3 text-q-body-sm-regular">
    ...
  </div>
</section>
```

### Error state

```tsx
<div className="rounded-lg border border-q-border-error bg-q-state-error-bg p-4">
  <p className="text-q-body-sm-regular text-q-state-error-fg">Could not save. Try again.</p>
  <Button className="mt-3" variant="secondary" size="sm">Retry</Button>
</div>
```

## Small App Anti-Patterns

- Turning a simple tool into a SaaS dashboard with five nav items.
- Making a landing page before the actual app.
- Giant centered copy with no working controls.
- Empty sidebars or inspectors that exist only for symmetry.
- Multiple competing primary buttons.
- Cards inside cards for a tiny form.
- A whole screen of one-line labels with no hierarchy.
- Raw Tailwind colors, arbitrary pixel values, old Quanta spacing classes.
- Text overflow in list rows because `min-w-0`/`truncate` is missing.
- No empty/loading/error states.

## Final Checklist

Before finishing:

- Is the actual app usable in the first viewport?
- Is there one obvious primary action?
- Is the layout the simplest shape that fits the workflow?
- Does mobile feel intentionally designed?
- Are inputs/results/actions grouped by proximity?
- Are empty/loading/error/success states included?
- Does text fit in every row/button/panel?
- Are Quanta components used for controls and feedback?
- Are colors/type q-prefixed semantic utilities?
- Is spacing native Tailwind, not old Quanta numeric spacing?
