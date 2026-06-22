# Component authoring standard

The single rulebook for building & maintaining `@higgsfield/quanta` components.
Derived from the existing component set — this codifies the conventions already
proven in `button`, `switch`, `dot`, `divider`, etc. so every new component looks
and behaves like the others.

> Tokens are the single source of truth. Every visual value maps to a token.
> If no token exists for a value you need, **flag the gap — never inline a
> custom/arbitrary value.** See §5.

---

## 1. One file structure

Every component lives in `src/components/<name>/` with **exactly** these files:

```
<name>/
  <name>.tsx        component + types + (optional) recipe fn
  <name>.css        presentation OR scanner registration (see §3) — REQUIRED
  <name>.test.tsx   colocated tests (import from ./index.ts)
  index.ts          public barrel: export the component + its public types
```

- `index.ts` re-exports the component and **all public types**:
  ```ts
  export { Thing } from './thing.tsx'
  export type { ThingProps, ThingSize, ThingColor } from './thing.tsx'
  ```
- Tests import through the barrel (`from './index.ts'`), never the raw `.tsx`,
  so they exercise the same surface consumers use.
- A `.css` file is **mandatory even when there are no styles** — see §3 (the
  `@source` registration requirement). The only exception is a component that
  shares another component's stylesheet (e.g. `dropdown` uses `menu.css`); such
  sharing must be documented in a comment in both files.

---

## 2. One component shape

```tsx
'use client'

import type { ComponentProps, ReactNode } from 'react'
import type { ClassValue } from '../utils/cx.ts'
import { cx } from '../utils/cx.ts'

/** One-paragraph JSDoc: what it is, what Figma node it maps to, key behavior. */

export type ThingSize = 'sm' | 'md' | 'lg'
export type ThingProps = ComponentProps<'div'> & {
  size?: ThingSize
}

// Union → literal class strings. `satisfies Record<Union, string>` makes the
// union the single source of truth: adding a variant fails to compile until its
// class is registered here. Tailwind extracts these literals (see §3).
const SIZE_CLASS = {
  sm: '…',
  md: '…',
  lg: '…',
} satisfies Record<ThingSize, string>

export function Thing({ size = 'md', className, ...props }: ThingProps) {
  return <div className={cx('q-thing', SIZE_CLASS[size], className)} {...props} />
}
```

Rules:
1. **`'use client'`** at the top of every component `.tsx`.
2. **`ComponentProps<'element'>`** (or `ComponentProps<typeof Primitive.Root>`
   for Base UI wrappers) as the props base, intersected with the component's
   own options. Always accept and forward `className` + `...props`.
3. **Maps are named `SIZE_CLASS` / `VARIANT_CLASS` / `COLOR_CLASS`** and typed
   with **`satisfies Record<Union, string>`** (compile-time exhaustiveness).
   Never `const X: Record<…>` (weaker — allows missing keys to slip).
4. **`cx(...)`** is the only class joiner. The composite component class comes
   first, then maps, then the caller `className` **last** (so callers win).
5. **`ClassValue`** is imported from `../utils/cx.ts` — never redefined locally.
6. Default every optional prop in the destructure (`size = 'md'`).

### 2a. Recipe functions (optional, for composable styling)

Components whose class string is useful on other elements expose a lowercase
recipe fn returning the class string (`button()`, `badge()`, `chip()`,
`checkbox()`, `radio()`, `modal()`):

```ts
export function thing(options: ThingOptions = {}, ...extra: ClassValue[]): string {
  const { size = 'md' } = options
  return cx('q-thing', SIZE_CLASS[size], ...extra)
}
```

Provide one when consumers may need to style a non-default element (e.g.
`<Trigger className={button({ variant: 'secondary' })}>`). Skip it for
leaf/structural components.

### 2b. Base UI wrappers

When wrapping a Base UI primitive (switch, checkbox, radio, toggle, slider,
dropdown), let Base UI own behavior + a11y + state data-attributes; quanta only
paints. `className` may be a `string | (state) => string` — resolve it:

```ts
className={state => cx('q-thing', SIZE_CLASS[size],
  typeof className === 'function' ? className(state) : className)}
```

Slot-colored components spread `slotStyle(color)` into `style` (§4).

---

## 3. One styling architecture (two sanctioned modes)

**Why a `.css` is always required:** quanta is consumed as a **symlinked
workspace package**, and Tailwind's automatic content detection **skips
`node_modules`**. So the literal class strings in a component's `.tsx` are NOT
discovered unless the colocated `.css` registers them with
`@source "./<name>.tsx";`. Every `.css` is then `@import`-ed once in
`src/css/tailwind/components.css` (the aggregator) so it lands in the bundle.
**Forgetting either step is a latent prod bug: the component renders unstyled in
the app even though it looks fine in Storybook** (Storybook scans `../stories`).

Pick the mode that fits:

**Mode A — `@utility` (stateful / complex / themed components):**
emit one composite `q-<name>` class; author the real rules in the `.css` via
`@utility q-<name> { … }`. Used by button, switch, checkbox, radio, chip,
badge, input, kbd, modal, avatar, tabs, menu, slider.

```css
@source "./thing.tsx";
@utility q-thing { /* token-based declarations only */ }
```

**Mode B — registration-only (simple presentational components):**
compose emitted utilities inline in the `.tsx`; the `.css` contains *only* the
`@source` line + a header comment explaining why. Used by dot, divider, tag,
toggle.

```css
/* Header comment: composes emitted utilities; this file registers the scanner. */
@source "./thing.tsx";
```

After creating any `.css`, add its `@import` to
`src/css/tailwind/components.css`.

---

## 4. Tokens are the single source of truth

Authoritative reference: `ai/AGENTS.md` (§"The `q-` namespace"). In brief:

- **Color / type / z-index / border-width / component classes → `q-`-prefixed**
  (`bg-q-background-primary`, `text-q-body-md-regular`, `border-q-thin`,
  `z-q-modal`, `q-button-primary`).
- **Spacing / sizing / breakpoints → native, unprefixed** (`p-4`, `gap-2`,
  `size-2`, `h-10`, `tablet:flex`). These are structural primitives shared with
  legacy `@higgsfield/ui`; the native Tailwind scale is active in the real build
  because consumers import `tailwindcss` before quanta. ✔ verified: `size-2`
  renders 8px.
- **Composite typography only** (`text-q-headline-md-semi-bold`), never
  `text-2xl font-bold`.
- **Slot colors** for tintable components: take a `color?: SlotColor` prop,
  spread `slotStyle(color)` into `style`, paint surfaces with `q-slot-*`
  utilities (`q-slot-bg-10`, `q-slot-text`, `q-slot-ring-40`). The slot vars
  must reference `--hf-color-*` runtime primitives — see `utils/slot.ts`.

### 5. No custom / arbitrary values — flag the gap

- ❌ `w-[184px]`, `p-[17px]`, `style={{ padding: '17px' }}`, `#d1fe17`, `rgb(...)`.
- ✔ If a value isn't on a token scale, it's either (a) a genuine fixed Figma
  **component dimension** with no token — encode it as a documented CSS custom
  property default inside the component's `@utility` rule (precedent:
  `--q-menu-min-width` in `menu.css`, `--q-slider-width` in `slider.css`), keep
  it overridable by the caller; or (b) a real **token gap** — surface it to the
  design-tokens owner; do not inline.
- `style={{ … }}` is allowed **only** for wiring dynamic values that can't be a
  class: `slotStyle(color)` spreads, Base UI positioner vars
  (`--transform-origin`), or a measured fill `width: ${pct}%`.

---

## 6. Performance & correctness conventions

- **Static maps are module-level consts** (`SIZE_CLASS` etc.) — defined once,
  not rebuilt per render.
- **No `tailwind-merge`** — `cx` is a plain filter+join; rely on caller-last
  ordering for overrides (§2.4). Keep class lists static where possible so
  Tailwind can extract them.
- **Memoize only derived objects passed via context** (e.g. the dropdown
  selection context uses `useMemo`); don't over-memoize leaf render paths.
- **Lift expensive/shared state into context once**, expose a minimal surface
  (see `Dropdown.Root`'s controlled/uncontrolled selection model).
- **Reduced motion**: any animation must degrade under
  `@media (prefers-reduced-motion: reduce)` (precedent: modal.css, menu.css,
  dot.css).
- **Accessibility is Base UI's job when wrapping it**; for hand-rolled elements,
  set the right role/aria and forward refs implicitly via `...props`.

---

## 7. Verification gate (run before declaring done)

From `packages/quanta/`:

```bash
yarn typecheck                 # tsc — must be clean
yarn vitest run                # full suite — must be green
# spot-check the component renders correctly (Storybook), and that any new
# class survives the SYMLINKED build (the .css @source + components.css import).
```

A component is not "done" until: structure matches §1, it has a registered
`.css` (§3), zero arbitrary values (§5), colocated tests pass, and it renders
correctly in Storybook.
