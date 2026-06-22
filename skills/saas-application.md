# Skill: SaaS Application Design

Use this when the user asks for a SaaS app, dashboard, admin panel, CRM,
workspace, analytics product, project manager, generation console, content
studio, settings/billing area, internal tool, kanban/list/table app, or any
repeated-use operational product UI.

Before coding, read:

- `skills/quanta-design.md`
- `app/packages/quanta/ai/AGENTS.md`

If the app uses generation jobs, uploads, profile/workspace, or credits, also
read `skills/fnf-sdk.md` and `skills/fnf-react.md`.

## SaaS Design Principle

SaaS UI is a working surface, not a brochure. It should feel calm, dense,
predictable, and fast to scan. Avoid landing-page theatrics: oversized hero
sections, decorative card-heavy layouts, vague feature copy, and ornamental
gradients. The premium feeling comes from hierarchy, alignment, spacing,
responsive behavior, controls that match the workflow, and state handling.

Use Quanta for the visible system:

- Components from `@higgsfield/quanta/*`
- q-prefixed semantic utilities for color/type/border/z-index
- native Tailwind spacing for layout

## Non-Negotiables

1. **Build the actual app as the first screen.** Do not make a landing page for
   a dashboard/tool request.
2. **Use a real shell.** Most SaaS apps need a header, sidebar/nav, main work
   area, optional inspector/details panel, and clear scroll regions.
3. **Prefer dense but organized layouts.** The user should scan, compare, and
   act quickly.
4. **Every control has a reason.** Buttons are commands, tabs are modes/views,
   dropdowns are option sets, switches/checkboxes are booleans, sliders/inputs
   are numeric/text settings.
5. **State is part of the design.** Empty, loading, error, selected, disabled,
   pending, saved, syncing, and destructive states must be visible.
6. **No raw design values.** Use native spacing like `p-4/gap-3`; use q-token
   color/type like `bg-q-background-primary`, `text-q-body-md-regular`.
7. **No card soup.** Use cards for repeated items, modals, or truly framed
   tools. Do not wrap every section in a floating card.
8. **Text must fit.** Use `min-w-0`, `truncate`, responsive grid columns, and
   stable control dimensions.

## Shell Patterns

### Primary app shell

Use for CRMs, dashboards, studios, workspaces, and admin tools.

```tsx
<div className="min-h-dvh bg-q-background-primary text-q-text-primary">
  <header className="sticky top-0 z-q-sticky flex h-14 items-center justify-between border-b border-q-border-subtle bg-q-background-primary px-4 tablet:px-6">
    <div className="min-w-0">
      <h1 className="truncate text-q-title-md-semi-bold">Projects</h1>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm">Import</Button>
      <Button size="sm">New project</Button>
    </div>
  </header>

  <main className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 desktop:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="hidden min-h-0 border-r border-q-border-subtle p-3 desktop:block">
      ...
    </aside>
    <section className="min-h-0 overflow-auto p-4 tablet:p-6">
      ...
    </section>
  </main>
</div>
```

### Three-pane workspace

Use for editors, inboxes, review queues, media generators, note apps, and
resource managers.

```tsx
<main className="grid min-h-dvh bg-q-background-primary text-q-text-primary desktop:grid-cols-[280px_minmax(0,1fr)_340px]">
  <aside className="min-h-0 overflow-auto border-r border-q-border-subtle p-3">...</aside>
  <section className="min-h-0 overflow-auto p-4 tablet:p-6">...</section>
  <aside className="hidden min-h-0 overflow-auto border-l border-q-border-subtle p-4 desktop:block">...</aside>
</main>
```

On mobile, collapse the left/right panes into `Tabs`, `Dropdown`, or `Vault`
instead of squeezing three columns.

### Data table page

Use for records, billing, users, jobs, files, assets, tickets, and audit logs.

```tsx
<section className="grid gap-4">
  <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
    <div className="min-w-0">
      <h1 className="text-q-title-lg-semi-bold">Jobs</h1>
      <p className="mt-1 text-q-body-sm-regular text-q-text-secondary">Track queued, running, and completed generations.</p>
    </div>
    <Button size="sm">Create job</Button>
  </div>

  <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
    <Input className="tablet:max-w-xs" placeholder="Search jobs..." aria-label="Search jobs" />
    <Tabs.Root defaultValue="all" variant="segmented" className="w-full tablet:w-auto">
      ...
    </Tabs.Root>
  </div>

  <div className="overflow-hidden rounded-lg border border-q-border-subtle">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        ...
      </table>
    </div>
  </div>
</section>
```

Tables are allowed. For operational UIs, a clear table is often more premium
than decorative cards.

## Layout Rules

- Page padding: `p-4 tablet:p-6 desktop:p-8`
- Shell header height: usually `h-14` or `h-16`
- Sidebar width: `240px` to `320px`
- Inspector width: `320px` to `400px`
- Main content max width only when needed. Dashboards and tools often need the
  full available width.
- Use `min-h-0` on grid/flex children that contain scrollable regions.
- Use `overflow-auto` on the region that should scroll, not the whole document
  by accident.
- Use `border-q-border-subtle` for structural separators.
- Use `bg-q-background-secondary` only for nested surfaces or grouped controls.
- Keep repeated item/card radius modest, usually `rounded-lg` or less.

## Typography Rules

Use restrained hierarchy.

| Use | Utility |
|---|---|
| App/page title | `text-q-title-lg-semi-bold` or `text-q-headline-sm-semi-bold` |
| Panel title | `text-q-title-md-semi-bold` |
| Row/item title | `text-q-title-sm-semi-bold` or `text-q-label-lg-semi-bold` |
| Body | `text-q-body-md-regular` |
| Dense body | `text-q-body-sm-regular` |
| Metadata | `text-q-caption-sm-medium` |
| IDs/code | `text-q-mono-sm-regular` |

Avoid hero-scale type inside panels, cards, sidebars, tables, and toolbars.
Those surfaces need compact, scannable labels.

## Component Rules

| Need | Use |
|---|---|
| Primary command | `Button variant="primary"` |
| Secondary command | `Button variant="secondary"` or `outline` |
| Low-emphasis toolbar command | `Button variant="tertiary"` or `ghost` |
| Destructive command | `Button variant="danger"` or `dangerSoft` |
| View/mode switch | `Tabs` |
| Option menu/filter menu | `Dropdown` |
| Global quick action/search | `Command` |
| Boolean setting | `Switch` or `Checkbox` |
| Exclusive setting | `RadioGroup` / `RadioLabel` |
| Numeric setting | `Slider` plus value label or `Input` |
| Text setting | `Input` / `Textarea` |
| Side panel | `Vault` on mobile, sidebar/inspector on desktop |
| Dialog | `Modal` |
| Feedback | `Toaster`, `toast`, `Progress`, inline state block |
| Status | `Badge`, `Tag`, `Dot` |

Use lucide icons when icons are needed, but keep them inside Quanta controls.
Icon-only buttons must use `iconOnly` and an accessible label.

## Premium SaaS Patterns

### Navigation

- Keep primary navigation stable and predictable.
- Use concise labels: Dashboard, Projects, Jobs, Assets, Team, Billing,
  Settings.
- Highlight the current route with a selected state, not only hover.
- Put account/workspace controls in a top-right or bottom-sidebar area.
- Avoid nav with too many equal visual weights; group low-use routes.

### Toolbar

- Put search/filter/sort close to the list/table they affect.
- Keep destructive actions separated from creation actions.
- Preserve layout when filters change; controls should not jump around.
- Use `Dropdown` for filter groups and `Tabs` for high-level views.

### Lists and rows

- Rows need title, secondary metadata, status, and one obvious action path.
- Use hover to reveal secondary actions, but keep primary status visible.
- Use `min-w-0` and `truncate` for names, prompts, emails, ids, and filenames.
- Empty lists need a focused empty state with one next action.

### Dashboards

- Put decision metrics above exploration details.
- Do not fill the page with equal metric cards. Rank by importance.
- Charts need labels, units, time range, and empty/loading states.
- Avoid decorative charts that do not answer a real question.

### Settings and billing

- Use grouped sections with clear headings and short descriptions.
- Destructive settings require confirmation.
- Plan/credit values must use display units. Raw wallet credit-cents should not
  be shown.
- Save/cancel states must be clear: saving, saved, error, dirty.

### Generation apps

- Use a left/settings panel plus main preview/feed area on desktop.
- Keep prompt/settings controls close to the submit action.
- Show cost preview in display credits before submit when available.
- Show uploads as stateful items: uploading, ready, blocked, failed.
- Feed cards should show output, model, status, created time, and primary action.

## State Patterns

### Empty state

```tsx
<div className="grid min-h-80 place-items-center rounded-lg border border-q-border-subtle bg-q-background-secondary p-8 text-center">
  <div className="grid max-w-sm gap-3">
    <h2 className="text-q-title-md-semi-bold">No projects yet</h2>
    <p className="text-q-body-sm-regular text-q-text-secondary">Create your first project to organize jobs, assets, and approvals.</p>
    <div className="mt-2">
      <Button>Create project</Button>
    </div>
  </div>
</div>
```

### Inline error

```tsx
<div className="rounded-lg border border-q-border-error bg-q-state-error-bg p-4">
  <h3 className="text-q-title-sm-semi-bold text-q-state-error-fg">Could not load jobs</h3>
  <p className="mt-1 text-q-body-sm-regular text-q-state-error-fg-soft">Check your connection and try again.</p>
  <Button className="mt-3" variant="secondary" size="sm">Retry</Button>
</div>
```

### Loading

Use `Progress` for real progress and stable skeleton-like blocks for pending
lists. Keep the layout dimensions stable so loading does not cause jumps.

## Anti-Patterns

- Landing-page hero for an app/tool request.
- Giant centered headline above an otherwise empty dashboard.
- Decorative gradients/orbs/blobs in operational screens.
- Every section as a card.
- Cards nested inside cards.
- Huge typography inside dense panels.
- Table/list rows without selected, hover, loading, and empty states.
- Toolbar controls that resize or move when data changes.
- Text clipped because `min-w-0`/`truncate` is missing.
- Filters hidden in unlabeled icon buttons when they are central to the task.
- Raw colors, arbitrary sizes, and old numeric Quanta spacing classes.
- Product policy inside UI helpers that belongs in fnf/fnf-react or server code.

## Final Checklist

Before finishing a SaaS screen:

- Is the first screen the actual tool/dashboard/workspace?
- Is there a stable shell with clear navigation and actions?
- Can the user scan the main data in five seconds?
- Are search/filter/sort controls near the data they affect?
- Are empty/loading/error/selected/disabled states designed?
- Are controls chosen by semantics, not convenience?
- Are layout dimensions stable across state changes?
- Does mobile collapse panes into usable tabs/drawers instead of squeezing?
- Are Quanta components and q-token utilities used correctly?
- Is spacing native Tailwind, not old Quanta numeric spacing?
