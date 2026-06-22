# Quanta Core Upgrade Plan — the Base UI + tokens + slot component model

> **Audience:** engineers (human and AI) working inside `packages/quanta`. This plan
> describes how to evolve the **quanta CORE** — its CSS infrastructure, token
> codegen, conventions, build/exports, runtime, and tests — so that the package can
> host a repeatable, theme-aware component model. It is **not** a plan to build 76
> components. It is the plan to make the core ready and to document the repeatable
> recipe, validated by the existing Switch proof-of-concept.

## 1. Vision

A "quanta component" composes three independent concerns, glued together by Base
UI's `render` / `className` composition props:

```text
  a quanta component
= Base UI primitive (@base-ui/react)   ─▶ behavior, focus mgmt, a11y, floating/portal
+ quanta tokens (q-* utilities)         ─▶ skin  (color / type / z-index / border-width / radius / motion)
+ slot system (--_c single-color prop)  ─▶ per-component theming  (ported from mdigitalcn/uikit)
  ── composed via Base UI's render / className props ──
```

Concretely: a thin quanta wrapper takes a Base UI primitive (which owns role,
keyboard, focus, form integration, portaling), paints its **state data-attributes**
(`data-checked`, `data-disabled`, `data-highlighted`, …) with **`q-*` token
utilities**, and exposes **one semantic `color` prop** that sets a single private
CSS custom property `--_c` (plus a small contract of siblings). Every interior
surface — fill, foreground, border, focus ring, soft tints — derives from `--_c`
via the **slot utilities**, so changing one prop re-skins the whole control with no
per-color class tables. Themes flow automatically because `--_c` chains through the
`--hf-color-*` runtime primitives that the existing theme runtime emits per
`data-theme`.

The Switch POC (`src/components/switch/switch.tsx`) already proves all three legs
together. This plan turns that POC into a documented, shipped, repeatable core.

---

## 2. Current state (accurate snapshot)

### 2.1 What quanta is today

quanta (`@higgsfield/quanta`, `private: true`) is a Tailwind v4 design-token +
theme-runtime package that **ships TypeScript/CSS source directly — there is no
build step** (`tsconfig.json` has `noEmit: true`; no `dist`, no tsup/esbuild/rollup).
Consumers' bundlers transpile on demand. Key facts from the codebase:

- **Exports** (`package.json` `exports`):
  - `./tailwind.css` → `src/css/tailwind/index.css` (the shipped Tailwind bundle)
  - `./theme.css`, `./primitives.css` → non-Tailwind CSS entry points
  - `./runtime` → `src/runtime/index.ts`
  - `./*` → `src/components/*/index.ts` (**wildcard** — new components need **no**
    `package.json` edit; `import { X } from '@higgsfield/quanta/foo'` resolves to
    `src/components/foo/index.ts`)
  - `sideEffects: ["**/*.css"]`, `"type": "module"`, per-component `'use client'`.

- **Token codegen** (`scripts/tokens-emit/`): reads a vendored DTCG snapshot under
  `packages/quanta/tokens/*.json` and emits CSS into `src/css/` in three layers:
  - **Layer 1 — primitives** (`src/css/primitives/*.css`): literal `--hf-color-*`,
    `--hf-z-index-*`, `--hf-border-width-*`, … on `:root`.
  - **Layer 2 — theme** (`src/css/theme/*.css`): semantic `--hf-color-*` assignments
    keyed by `data-theme`, in `@layer quanta-theme` with `:where()` (zero
    specificity).
  - **Layer 3 — Tailwind bridge** (`src/css/tailwind/*.css`): blocks that alias
    `--hf-*` → `--color-q-*` / `--z-index-q-*` / `--border-width-q-*` so Tailwind
    generates `q-`-prefixed utilities. **Only `color.css` uses `@theme inline`**
    (needed for opacity-modifier `color-mix` synthesis — verified at `color.css`
    lines 9 and 109); **`z-index.css` (line 8), `border-width.css` (line 8), and the
    spacing emitter use plain `@theme`** (the spacing emitter explicitly documents
    choosing plain `@theme` over `@theme inline`, `emit/spacing.ts` lines 30–33, to
    keep `var()` intact for runtime override flexibility). Consequence:
    `--z-index-q-*` / `--border-width-q-*` / spacing q-vars **are** emitted to
    `:root`; only **color** q-vars are inlined-and-omitted. This does not weaken the
    slot invariant below — slots only ever reference *color* tokens, which genuinely
    are `@theme inline`. `src/css/tailwind/index.css` is the manifest that `@import`s
    every category file plus `components.css`.
  - The pipeline is **golden-gated**: `scripts/tokens-emit/golden.test.ts` iterates
    `scripts/tokens-emit/lib/outputs.ts` (14 registered output files), re-emits, and
    diffs against the committed `src/css/`. The committed files are the baseline.
    **Only codegen outputs are gated** — hand-authored CSS (`button.css`, `menu.css`,
    `slot.css`, `components.css`) is **not** gated. **Validator coupling:**
    `golden.test.ts` also runs `validate(parsed)` in `beforeAll` and **throws the
    whole suite** if validation fails — so adding a new category that the validator
    rejects fails **all** output assertions, not just the new file (see §7.1 step 6).

- **The `q-` namespace rule** (`ai/AGENTS.md`): design-semantic utilities are
  `q-`-prefixed (`bg-q-*`, `text-q-*`, `z-q-*`, `border-q-*`, component utilities
  `q-button-*` / `q-menu-*` / `q-focus-ring*`) so they coexist with the **legacy
  `@higgsfield/ui`** design system in **one shared Tailwind build**. Spacing and
  breakpoints stay native (no prefix). This is a permanent convention.

- **Runtime** (`src/runtime/`): `bootstrapScript()` injects pre-paint to set
  `data-theme` + `color-scheme` (anti-FOUC); `ThemeController` manages
  `{brand}-{mode}`; `defineTheme()` / `setOverride()` inject **unlayered**
  `:where([data-theme="name"])` blocks (which beat `@layer quanta-theme` per the
  Cascade Layers spec). CSP `styleNonce` is threaded throughout. SSR-safe via
  `readInitialThemeState()`.

- **Components today** (`src/components/`):
  - `button/` — `button.tsx` is a literal class-string builder (`button()` returns
    `q-button q-button-primary q-button-md …`), styled by `button.css` `@utility`
    rules; `asChild` uses **radix-ui** `Slot.Root`.
  - `dropdown/` — wraps **radix-ui** `DropdownMenu`; styled by `menu/menu.css`.
    `dropdown-item.tsx` hand-rolls `keepMenuOpen()` (calls `event.preventDefault()`
    to stop Radix close-on-select) and a **provisional** `MenuSwitch` (hardcoded
    `h-4 w-7`, `size-3` knob, `translate-x-[14px]/[2px]`, `bg-q-brand-primary`).
  - `switch/` — the **POC**, wraps **`@base-ui/react/switch`** (`Switch.Root` +
    `Switch.Thumb`), styled purely via Base UI state data-attributes and the slot
    system.
  - `utils/cx.ts` — a minimal class joiner (filters falsy, joins with space). **No
    `tailwind-merge`**, no conflict resolution.
  - Dependencies: both `radix-ui: ^1.3.3` **and** `@base-ui/react: ^1.5.0` are plain
    `dependencies`; only `react`/`react-dom` are `peerDependencies`. (Installed
    version verified exactly `1.5.0`; package name `@base-ui/react` is current —
    renamed from `@base-ui-components/react`.) **Caveat for the single-instance
    invariant the slot/portal work relies on:** `@base-ui/react` is a 1.x line that
    has historically shipped breaking changes between minors, so the caret range
    `^1.5.0` can allow a transitive bump that duplicates the instance (and thus the
    real `FloatingTree` export). To guarantee a single hoisted/deduped copy, **pin
    `@base-ui/react` to an exact version (drop the caret) or add a workspace-level
    resolution/override** — see D5 and the Risks table.

### 2.2 The POC that exists (uncommitted)

The Switch POC proves the full model:

- `src/components/switch/switch.tsx` — wraps `Switch.Root` + `Switch.Thumb`; exposes
  one `color` prop (`'brand' | 'success' | 'error' | 'warning' | 'info'`); a `SLOT`
  record maps each color to `{ '--_c': …, '--_c-fg': … }`; the record is spread into
  `style` inline (line 44); `className` is the **function form** `(state) => cx(…)`
  with the caller's `className` resolved against `state` before merge (line 57). The
  checked track is `data-checked:bg-slot`, the thumb is `bg-slot-fg`, and the focus
  ring is `focus-visible:ring-slot-40` — all derive from `--_c`.
- `src/css/tailwind/slot.css` — the slot `@utility` defs: `bg-slot`, `bg-slot-fg`,
  `bg-slot-10`, `bg-slot-20`, `text-slot`, `text-slot-fg`, `border-slot`, `ring-slot`,
  `ring-slot-40`. **Bare names, no `q-` prefix.** Slot values read `--_c` /
  `--_c-fg` / `--_c-border` (component-inline), and ultimately `--hf-color-*` (NOT
  `--color-q-*`, which are `@theme inline`-only and have no runtime value).
- `stories/switch.stories.tsx` — demonstrates the `color` loop.
- `slot.css` is imported **only** by `.storybook/preview.css` (line 13), **not** by
  the shipped `src/css/tailwind/index.css`. Promotion is deliberately deferred.

### 2.3 What's missing (the gap this plan closes)

1. **Slot system is POC-only and bare-named.** It is not in the shipped bundle, its
   names violate the `q-` rule, the `--_c` contract is undocumented, and only a
   minimal tint set exists.
2. **Slot color contract is incomplete.** Only 5 colors, only `--_c`/`--_c-fg`. No
   `neutral`; no `--_c-bg` (so filled surfaces have no home); no incomplete-theme
   guard; `bg-slot` reads `--_c` whereas uikit reads `--_c-bg`.
3. **Radius and motion tokens are not emitted.** `tokens/radius.json` and
   `tokens/motion.json` are vendored and ready, but `@import "./radius.css"` and
   `@import "./motion.css"` are commented out in `index.css` (lines 24, 33). The POC
   Switch hardcodes `rounded-full` and `duration-150` as a result.
4. **Two primitive libraries coexist.** Radix (Dropdown + Button `asChild`) and Base
   UI (Switch). The `keepMenuOpen()` hack and the provisional `MenuSwitch` exist
   only because of Radix; Base UI offers native replacements.
5. **No documented authoring recipe**, no `@source inline()` for slot classes in
   Storybook (slot-composed classes will be tree-shaken there), no Base UI
   integration conventions (portal container, z-index mapping, app isolation setup).

### 2.4 Token data-flow & ownership boundary (do not break this)

Tokens are **Figma-driven**. The full pipeline:

```text
Figma Foundations file (FNi3lHYTuK2XBGvbcnGpdJ)
  │  designer edits Variables, runs the "Design Tokens Exporter" plugin → 11 DTCG JSONs
  ▼
design-tokens repo  (higgsfield-ai/design-tokens, at ../../../design-tokens)
  ├─ tokens/*.json        ← THE source of truth (11 collections, hand-committed from Figma export)
  └─ dist/                ← that repo's OWN CI build (tokens.css + tailwind.preset.*); quanta does NOT use this
  │
  │  quanta `yarn tokens:read`  (fs:// copyFileSync of every upstream tokens/*.json)
  ▼
packages/quanta/tokens/*.json   ← VENDORED SNAPSHOT  ("do not hand-edit"; clobbered on every read)
  │
  │  quanta `yarn tokens:emit`  (quanta's OWN codegen → q-prefixed, 3-layer, golden-gated CSS)
  ▼
packages/quanta/src/css/**   →  consumed by fnf-web
```

**The contract line is `packages/quanta/tokens/*.json`.** Everything *above* it belongs
to designers / the design-tokens repo; everything *below* it belongs to quanta. quanta is
an **independent consumer** of the same source-of-truth JSON — it deliberately re-implements
the transform (its `q-` prefix, 3-layer split, `@theme inline`, theme runtime) rather than
consuming the upstream `dist/` Tailwind preset. `tokens:read` does a plain
`copyFileSync` of every upstream `tokens/*.json` over the snapshot (`scripts/tokens-read/source.ts`
→ `fetchTokens`), so any snapshot file whose name matches an upstream collection is
**silently overwritten**. The 11 file names are fixed by the Figma collections.

**What we can do here WITHOUT breaking the flow** (everything below the contract line):

| Action | Safe? | Why |
|---|---|---|
| Add emitters for **radius / motion** (Phase 0) | ✅ Safe | `radius.json` + `motion.json` already arrive from Figma (present in both upstream and the snapshot). We add a *transform*, not a token. |
| **Slot system** (`q-slot-*`, the `--_c` contract) | ✅ Safe | Pure quanta-side composition over the generated `--hf-color-*` vars. Adds **zero** new token values; hand-authored CSS is not in the snapshot and not touched by `tokens:read`. |
| **Base UI components / runtime / exports / stories / tests** | ✅ Safe | No token involvement at all. |
| Change quanta's **q- aliasing / layering / naming** | ✅ Safe | That is quanta's transform layer, below the line. |
| **Hand-edit `packages/quanta/tokens/*.json`** | ❌ Breaks | Clobbered by the next `tokens:read`. Never edit the snapshot by hand. |
| **Invent token *values* not in Figma** — e.g. `shadow`, a `--scaling` ramp | ❌ Not a token | No `shadow.json` / sizing-multiplier collection exists upstream. To *tokenize* them the path is Figma → exporter → design-tokens repo → `tokens:read` → emit. (A quanta-local hand-authored constant is allowed but is **not** a design token and will diverge.) This is exactly why the plan **defers shadow + `--scaling`** (D8). |
| Consume the upstream **`dist/`** instead of `tokens/` | ⚠️ Avoid | Discards quanta's q-/layering/runtime transform; changes the established contract. |

> **The snapshot is currently STALE.** Upstream already differs from the vendored snapshot:
> `radius.json` (upstream added a `250 = 10px` step), `type-primitives.json`, `type-scales.json`,
> and `type-semantic.json` all differ; the other 7 are identical. A `tokens:read` + `tokens:emit`
> is therefore **pending** and will change generated CSS (radius **and** typography). Implication
> for Phase 0a: build/test the radius emitter against the **live upstream shape** (run `tokens:read`
> to sync first, accepting that it also pulls the typography deltas — coordinate that as one
> reviewed snapshot bump), not against today's stale `radius.json`. The golden baseline must
> reflect current Figma, not the older snapshot.

---

## 3. Architecture & layering

### 3.1 The composition model

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  quanta wrapper component  (src/components/<name>/<name>.tsx, 'use client')     │
│                                                                                 │
│   props:  …Base UI props  +  color: 'brand'|'neutral'|'success'|'error'|…       │
│                                                                                 │
│   ┌──────────────────────────┐   sets inline ───▶  style={{ ...SLOT[color] }}   │
│   │  SLOT record (per comp)  │                      --_c / --_c-bg / --_c-fg /  │
│   │  color → 4 CSS vars       │                      --_c-border  (private)      │
│   └──────────────────────────┘                                                  │
│              │ values are var(--hf-color-*)  (runtime, theme-keyed)             │
│              ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐ │
│   │ Base UI primitive  <Primitive.Root render/className=(state)=>cx(...)>     │ │
│   │   • behavior, role, keyboard, focus, form, floating/portal                │ │
│   │   • emits STATE as data-* attrs: data-checked / data-disabled / …         │ │
│   │                                                                            │ │
│   │   className composes:                                                      │ │
│   │     base layout         (native spacing: h-5 w-9 p-0.5 …)                  │ │
│   │   + q-* token utilities (bg-q-overlay-hover, text-q-text-primary, z-q-*)   │ │
│   │   + q-slot-* utilities  (q-slot-bg, q-slot-bg-fg, q-slot-ring-40, …)       │ │
│   │       └─ read --_c…, derive tints via color-mix(in oklch, …)              │ │
│   │   + state selectors     (data-checked:q-slot-bg, data-disabled:opacity-50) │ │
│   └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼  resolves against the runtime cascade
┌──────────────────────────────────────────────────────────────────────────────┐
│  Theme runtime cascade  (already shipped, unchanged)                            │
│                                                                                 │
│   Layer 1  :root { --hf-color-blue-500: #0256fe; … }            (primitives)    │
│   Layer 2  @layer quanta-theme :where([data-theme="default-dark"]) {            │
│              --hf-color-state-error-fg: var(--hf-color-red-500); … }            │
│   Runtime  :where([data-theme="ai-ocean"]) { … }   (UNLAYERED → wins)           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 The cascade / namespace model

Three resolution chains coexist and never collide:

| Concern | Mechanism | DOM presence | Namespace |
|---|---|---|---|
| **Color token utilities** | `@theme inline` → `--color-q-*` → Tailwind utilities | `--color-q-*` have **no** runtime value (alias-only — inlined and omitted) | `q-` prefixed (`bg-q-*`, `text-q-*`) |
| **Non-color token utilities** | plain `@theme` → `--z-index-q-*` / `--border-width-q-*` / spacing → Tailwind utilities | these q-vars **are** emitted to `:root` (plain `@theme` keeps `var()` intact) | `q-` prefixed (`z-q-*`, `border-q-*`, `rounded-q-*`) |
| **Runtime theme** | codegen Layer 1/2 + runtime injects `--hf-color-*` | `--hf-color-*` **are** emitted to the DOM per `data-theme` | `--hf-*` (internal primitive) |
| **Slot** | component sets `--_c…` inline → `q-slot-*` utilities read them → derive from `--hf-color-*` | `--_c…` set inline on the component root | `q-slot-*` utility + `--_c` private var |

The key invariant: **slot values must reference `--hf-color-*`, never `--color-q-*`.**
`--color-q-*` exist **only** inside the `color.css` `@theme inline` block so Tailwind
can synthesize opacity modifiers (`color-mix`); they are not emitted to `:root` and
resolve to nothing at runtime. (This is a **color**-specific trap — the non-color
q-vars above *are* emitted, but slots never reference those.)

Why slot theming "just works" across managed and override themes: `q-slot-bg`
resolves `background-color: var(--_c-bg, var(--_c))`; `--_c` is e.g.
`var(--hf-color-state-error-fg)`; that token is reassigned per `data-theme` in
`src/css/theme/color.css`. Switching `data-theme` re-resolves the whole var() chain
with zero component or class changes. A `defineTheme()` override injects an unlayered
`:where([data-theme="…"])` block that wins, so slots re-tint instantly.

---

## 4. Decisions & rationale (condensed)

All decisions below are **resolved** — they are the plan. Rejected alternatives are
kept one-line for context.

| # | Topic | Decision | Why (vs rejected) |
|---|---|---|---|
| D1 | **Slot naming** | `q-slot-*` family: `q-slot-bg`, `q-slot-bg-fg`, `q-slot-bg-10/20`, `q-slot-text`, `q-slot-text-fg`, `q-slot-border`, `q-slot-ring`, `q-slot-ring-40` (+ future `q-slot-rounded`, `q-slot-duration`, `q-slot-ease`). | Keeps the whole sub-system contiguous & self-documenting; parallels the existing component-utility precedent (`q-button-*`, `q-menu-*`); satisfies the permanent `q-` rule and removes the legacy-collision tie entirely. Rejected: `bg-q-slot` (scatters one system across 4 namespaces, misframes slots as color roles); bare `bg-slot` (violates `q-` rule, relies on import order — highest risk). |
| D2 | **Slot shipping** | Hand-author one `src/css/tailwind/slot.css`; ship via a single `@import` in `src/css/tailwind/components.css` (alongside `menu.css`/`button.css`), **not** directly in `index.css`. No explicit `@layer`. Remove the standalone `slot.css` import from `.storybook/preview.css` and add `@source inline()` rules there. | Component presentation aggregates in one place. Hand-authored CSS is not golden-gated, so this is a one-line, low-risk change. |
| D3 | **Slot contract** | `--_c` (primary: text/stroke/fill/ring/checked-fill), `--_c-bg` (solid fill, **defaults to `--_c`**), `--_c-fg` (contrasting fg on a `--_c` surface), `--_c-border` (border, **defaults to `--_c`**). Defaulting baked into the **utility definitions** (`var(--_c-bg, var(--_c))`), not each component. Plus deferred `--_radius`, `--_duration`, `--_ease`. Documented as a package-level authoring API in `ai/AGENTS.md`. | Reconciles uikit (`bg-slot`=`--_c-bg`) with the POC (`bg-slot`=`--_c`) backward-compatibly; lets filled surfaces (badges, solid buttons) override the fill without breaking single-var components. |
| D4 | **Color prop set** | 6 canonical values: `brand \| neutral \| success \| error \| warning \| info`; **`brand` default**. Each maps to a 4-property record sourced exclusively from `--hf-color-*`. Soft tints via `color-mix(in oklch, var(--_c) N%, transparent)`. Per-property `var()` fallbacks guard incomplete `defineTheme()` overrides. | Every value is backed by confirmed theme-keyed tokens. Rejected: keep 5/2-prop POC (no neutral, leaves `--_c-bg` divergence); full uikit 8-value parity (`secondary`/`accent` have no `--hf-color-*` role — would violate "never invent roles"). |
| D5 | **Base UI dependency** | Plain `dependency` (keep `@base-ui/react` where it is). Only `react`/`react-dom` stay peers. **Pin the version exactly (no caret) or add a workspace resolution/override** so exactly one copy is hoisted/deduped. | Matches the existing `radix-ui` plain-dep precedent (verified: both `radix-ui ^1.3.3` and `@base-ui/react ^1.5.0` are plain deps; only `react`/`react-dom` are peers); quanta is private + source-shipped. The single-instance guarantee that avoids duplicate `FloatingTree`/portal-context bugs comes from **one pinned/deduped workspace version**, not from the plain-vs-peer choice itself (a plain dep can still resolve to two copies; a peer can be deduped). Plain-vs-peer is the secondary, consumer-ergonomics call. Rejected: peer (forces consumer install). |
| D6 | **Base UI app setup** | quanta does **not** ship `isolation: isolate` / `body { position: relative }`. Document it as a one-time consumer-app responsibility (`ai/AGENTS.md` + `README.md`). Rely on Base UI default `container={document.body}` for portals. | Scope: quanta ships tokens + components, never owns `<html>`/`<body>`; app layouts already apply `isolate` at container roots. |
| D7 | **Z-index** | Apply a `z-q-*` utility on the **positioned subpart's** `className` inside each portal wrapper: the **Positioner** for anchored popups (`z-q-popover` on Popover, `z-q-tooltip` on Tooltip, `z-q-toast` on Toast, `z-q-dropdown`/`z-q-popover` on Menu), and the **Popup/Backdrop** for non-anchored Dialog (`z-q-modal` on `Dialog.Popup`, `z-q-overlay` on `Dialog.Backdrop`) — **Dialog has no Positioner part** (verified: `dialog/index.parts.d.ts` exports Backdrop, Close, Description, Popup, Portal, Root, Viewport, Title, Trigger — and base-ui.com confirms Dialog is centered, not anchor-positioned). Expose a `container` prop on every portal wrapper, forwarding to Base UI Portal `container` (mirrors the existing `Dropdown.Content` `container`). | Base UI sets no inline z-index; the positioned element is where stacking must sit (Positioner for anchored parts, Popup/Backdrop for Dialog). |
| D8 | **Token prerequisites** | Emit **radius + motion now** via codegen (both JSONs vendored). **Defer shadow** (no `tokens/shadow.json`) and **`--scaling`** (no sizing-token model). Add `q-slot-rounded`/`q-slot-duration`/`q-slot-ease` to `slot.css` alongside color slots; keep **token emit (golden-gated, safe)** decoupled from **slot promotion (hand-authored, gated by component readiness)**. | Radius/motion are ready and unblock components in parallel; shadow/scaling have no codebase basis. |
| D9 | **Dropdown migration** | **Hard cutover** radix → `@base-ui/react/menu`; retire `radix-ui` entirely (also migrate Button `asChild` off radix `Slot`). Delete `keepMenuOpen()` (→ native `closeOnClick`) and `MenuSwitch` (→ the real quanta Switch). | Suite is tiny (1 dropdown + Button Slot); carrying two primitive libs permanently doubles a11y/SSR/test surface. Rejected: coexistence (keeps both libs, both hacks, the Storybook radix warning, indefinitely). |
| D10 | **cx() / merge** | Keep `cx()`, no `tailwind-merge`. Keep base classes minimal; rely on state-selector specificity. Revisit only if a real conflict appears. | Each wrapper owns a single composite base class + state-attribute utilities. |

---

## 5. The slot system spec

### 5.1 The custom-property contract

A component sets these **private** inline custom properties (leading-underscore is
the CSS convention for "private") from a single semantic `color` prop. Only `--_c`
is required; the rest default through the utilities.

| Var | Meaning | Default if unset |
|---|---|---|
| `--_c` | Primary color — text / stroke / fill / ring / checked-fill | (required; if absent, tints render transparent and fg falls back to white) |
| `--_c-bg` | Solid background fill | `var(--_c)` (in the utility) |
| `--_c-fg` | Contrasting foreground on a `--_c`/`--_c-bg` surface (thumb, label) | `oklch(100% 0 0)` (white) in the utility — **every canonical color must set it explicitly** |
| `--_c-border` | Border stroke color | `var(--_c)` (in the utility) |
| `--_radius` | Component corner radius (Phase: motion/radius) | `var(--hf-radius-*)` per component |
| `--_duration` | Transition duration | `var(--hf-duration-normal)` (global `:root` default) |
| `--_ease` | Transition timing function | `var(--hf-ease-out)` (global `:root` default) |

### 5.2 The full slot utility surface (`src/css/tailwind/slot.css`)

Final shipped form, `q-slot-*` named, with `--_c-bg`/`--_c-border` defaulting baked
into the utilities (this is the reconciliation that keeps the POC's single-var path
working):

```css
/* src/css/tailwind/slot.css — hand-authored, NOT codegen, NOT golden-gated.
 *
 * Component-INTERNAL styling primitives. Authored ONLY inside component .tsx,
 * never in app code (they are not consumer-facing q-* tokens). The real privacy
 * boundary is the --_c* custom properties.
 *
 * CONTRACT: --_c values MUST reference --hf-color-* runtime primitives (emitted
 * per data-theme), NEVER --color-q-* (those are @theme inline-only, no runtime
 * value). Copying a bg-q-* token name into a SLOT map silently breaks theming.
 */

/* Solid fills — bg reads --_c-bg, defaulting to --_c (uikit-aligned). */
@utility q-slot-bg    { background-color: var(--_c-bg, var(--_c)); }
@utility q-slot-bg-fg { background-color: var(--_c-fg, oklch(100% 0 0)); }

/* Soft tints — always derived from --_c (the saturated color), never --_c-bg. */
@utility q-slot-bg-10 { background-color: color-mix(in oklch, var(--_c) 10%, transparent); }
@utility q-slot-bg-20 { background-color: color-mix(in oklch, var(--_c) 20%, transparent); }

/* Foreground / text */
@utility q-slot-text    { color: var(--_c); }
@utility q-slot-text-fg { color: var(--_c-fg, oklch(100% 0 0)); }

/* Border — defaults to --_c when --_c-border unset. */
@utility q-slot-border { border-color: var(--_c-border, var(--_c)); }

/* Focus ring */
@utility q-slot-ring    { --tw-ring-color: var(--_c); }
@utility q-slot-ring-40 { --tw-ring-color: color-mix(in oklch, var(--_c) 40%, transparent); }

/* ── Shape / motion slots — add WITH the radius/motion token emit (Phase 2). ── */
@utility q-slot-rounded  { border-radius: var(--_radius); }
@utility q-slot-duration { transition-duration: var(--_duration); }
@utility q-slot-ease     { transition-timing-function: var(--_ease); }
```

**Supported tint ratios (decide up front to avoid per-component drift):** keep the
minimal set `10` / `20` for backgrounds and `40` for rings. Do **not** eagerly port
uikit's full `5/30/50/80/90` ladder; add a ratio only when a component needs it, in
this one file.

### 5.3 The chosen naming

`q-slot-{property}[-{role|ratio}]`. The prop accepts semantic English values
(`brand`/`neutral`/`success`/…); the CSS utilities carry the `q-slot-` prefix so they
are namespaced for the shared build with legacy `@higgsfield/ui`. (Verified: legacy
`@higgsfield/ui` uses the Tailwind `@slot` **at-rule** for functional utilities in
`packages/ui/src/shared/theme/variant.css` / `utility.css` — it does **not** mint
`slot`-named *utilities* today, but the `q-slot-` prefix removes the tie regardless.)

### 5.4 The color-prop → `--hf-color-*` mapping table

Every value below is a confirmed theme-keyed token in `src/css/theme/color.css`
(light + dark), so light/dark is automatic. Each record sets **all four** properties.
The `var()` fallback chains guard incomplete `defineTheme()` overrides — a partial
override degrades to a guaranteed-present token instead of rendering unstyled.

| `color` | `--_c` (primary) | `--_c-bg` (fill) | `--_c-fg` (on fill) | `--_c-border` |
|---|---|---|---|---|
| `brand` (default) | `--hf-color-brand-primary` | = `--_c` | `--hf-color-text-inverse` | = `--_c` |
| `neutral` | `--hf-color-text-primary` | `--hf-color-background-secondary-strong` | `--hf-color-text-primary` | `--hf-color-border-strong` |
| `success` | `--hf-color-state-success-fg` | = `--_c` | `--hf-color-text-inverse` | = `--_c` |
| `error` | `--hf-color-state-error-fg` | = `--_c` | `--hf-color-text-inverse` | = `--_c` |
| `warning` | `--hf-color-state-warning-fg` | = `--_c` | `--hf-color-text-inverse` | = `--_c` |
| `info` | `--hf-color-state-info-fg` | = `--_c` | `--hf-color-text-inverse` | = `--_c` |

Notes derived from the actual `--hf-color-*` inventory:

- **State families** (`error`/`success`/`warning`/`info`) each have `-bg`, `-fg`,
  `-fg-soft`. **`-glow` exists for error/success/warning but NOT for info** — so
  `glow` cannot be part of the universal contract; a glow is a per-component opt-in
  (e.g. source it from `state-*-fg-soft`), documented as non-universal.
- **`neutral`** has no dedicated semantic token; the mapping above (text-primary /
  background-secondary-strong / text-primary / border-strong) is an editorial choice
  to give monochrome chips/toggles a home without inventing roles — **review with
  design before freezing.**
- **`text-inverse`** is theme-keyed and is exactly what the POC already uses for
  saturated fills — the correct `--_c-fg` for the five saturated colors.

### 5.4.1 The override / `defineTheme` fallback guard

`define-theme.ts` validates token key/value **syntax** only, never **key coverage**,
and the runtime silently falls through when a key is omitted. Because slot records are
**component-authored** (not theme-authored), bake the resilience into the `SLOT`
record via nested `var()` fallbacks to a guaranteed-present token (`brand-primary` is
always set by managed themes and is the documented default):

```ts
const SLOT: Record<SlotColor, SlotVars> = {
  // …
  error: {
    '--_c': 'var(--hf-color-state-error-fg, var(--hf-color-brand-primary))',
    '--_c-fg': 'var(--hf-color-text-inverse)',
  },
  // …
}
```

This turns "incomplete override" into a deterministic graceful degrade with zero
runtime validation code. (Caveat: if BOTH the override key and the fallback key are
absent from a theme, resolution still falls through to `:root` primitives or the
property's initial value — fallbacks reduce, not eliminate, incomplete-theme
breakage.)

### 5.5 How it ships

- **File:** `src/css/tailwind/slot.css` (hand-authored; not in `outputs.ts`, so not
  golden-gated).
- **Import site (bundle):** add **one line** to `src/css/tailwind/components.css`:
  ```css
  @import "../../components/menu/menu.css";
  @import "../../components/button/button.css";
  @import "./slot.css";   /* ← slot system (component-internal styling primitives) */
  ```
- **Storybook:** remove the standalone `@import '../src/css/tailwind/slot.css';` from
  `.storybook/preview.css` (it would now double-define via the bundle), and add
  `@source inline()` rules so template-literal slot classes aren't tree-shaken. List
  **exactly** the utilities defined in §5.2 — do not brace-expand into names that
  have no `@utility` (Tailwind v4 silently emits nothing for undefined candidates, so
  an over-broad list won't break the build, but it implies utilities that don't exist
  and will confuse the next author):
  ```css
  @source inline("q-slot-bg{,-fg,-10,-20}");
  @source inline("q-slot-text{,-fg}");
  @source inline("q-slot-ring{,-40}");
  @source inline("q-slot-border");
  @source inline("q-slot-{rounded,duration,ease}");
  ```
  (The leading-empty-alternative form `{,-fg}` is valid brace expansion and works.)
  **Namespace caveat:** the existing `preview.css` `@source inline` lists use **bare,
  un-prefixed** names (e.g. `text-{display,…}`, `{bg,text,border}-background-{…}`,
  `border-{thin,medium,thick}`, `z-{base,…}`) even though the actually-emitted
  utilities are `q-`-prefixed — that is a **pre-existing repo inconsistency** (the
  bare lists look stale vs the real `q-`-prefixed bundle), not something this plan
  introduces. Write the new `q-slot-*` lines **prefixed** to match the real
  utilities; do **not** copy the neighboring bare pattern. Auditing/cleaning the
  pre-existing bare lists is out of scope for this plan.
- **Promotion = Phase 1.** Promoting `slot.css` into the bundle (the `@import` into
  `components.css` + the `q-slot-*` rename) **is** Phase 1 — it is unconditional, not
  a separate later conditional gate. The only thing decoupled from it is the
  radius/motion **token emit** (Phase 0), which is golden-gated and can land **before**
  Phase 1. Phase 1's acceptance ("Switch renders skinned in the app bundle") is the
  same event as promotion.

---

## 6. Base UI integration spec

### 6.1 Install (dependency, not peer)

Keep `@base-ui/react` in `dependencies` (already there), alongside the existing
`radix-ui` plain dep (which is removed in Phase 4). Keep only `react`/`react-dom` as
`peerDependencies`. This matches the verified `radix-ui ^1.3.3` precedent and imposes
no consumer install burden.

The single-instance guarantee that avoids duplicate `FloatingTree`/portal-context
bugs comes from a **single hoisted/deduped copy enforced by one pinned workspace
version**, not from the plain-vs-peer choice itself: a plain (non-peer) dependency
under a non-deduped resolution can still end up as two `@base-ui/react` copies, and
conversely a peer can be deduped. So **pin `@base-ui/react` exactly (no caret) or add
a workspace resolution/override** to make the single-instance invariant real;
plain-vs-peer is a secondary, consumer-ergonomics decision. (Base UI's own
`package.json` sets `sideEffects: false`, which is fine here — it is JS-only with no
CSS side effects — and is orthogonal to the hoisting/dedupe property.)

### 6.2 Import-path convention

Always import from the component subpath, never a star import from the main entry:

```ts
import { Switch as Primitive } from '@base-ui/react/switch'
import { Menu as Primitive }   from '@base-ui/react/menu'
import { Dialog as Primitive }  from '@base-ui/react/dialog'
```

The non-component helpers live at their own **kebab-case** subpaths — import the
named export from the subpath, do **not** invent `@base-ui/react/useRender`:

```ts
import { useRender } from '@base-ui/react/use-render'   // verified export map entry "./use-render"
import { mergeProps } from '@base-ui/react/merge-props'  // verified export map entry "./merge-props"
```

Each primitive is a multi-part composite, but **the part set differs per primitive**:
anchored popups (Menu/Popover/Tooltip/Toast) export a `Positioner`, whereas
**Dialog does not** (it exposes `Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`,
`Title`, `Description`, `Close`, `Viewport` — no `Positioner`, because it is centered,
not anchored). Always check the primitive's `index.parts.d.ts` before assuming a
subpart exists. Each subpart forwards refs.

### 6.3 The render / className / cx composition recipe

State-driven styling uses Base UI's **state data-attributes** (`data-checked`,
`data-unchecked`, `data-disabled`, `data-highlighted`, `data-open`, …) targeted via
Tailwind attribute variants — **never** a `className` variant prop on the primitive,
and **never** Radix's `data-state` (Base UI uses discrete attributes).

`className` may be a string **or** a `(state) => string` function. The **gotcha**
(already handled in the POC, `switch.tsx` line 57): resolve the caller's `className`
against `state` **before** merging, all inside `cx()`:

```tsx
<Primitive.Root
  style={{ ...SLOT[color], ...style } as CSSProperties}
  className={state => cx(
    'relative inline-flex … rounded-full p-0.5 transition-colors outline-none',
    'data-unchecked:bg-q-overlay-hover',
    'data-checked:q-slot-bg',                  // slot-driven fill
    'focus-visible:ring-2 focus-visible:q-slot-ring-40',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    typeof className === 'function' ? className(state) : className,  // ← the gotcha
  )}
  {...props}
/>
```

The recipe relies on Base UI's documented merge semantics: external props passed via
`render` are merged with the internal props — `className` strings and `style`
properties are **joined**, while other external props **overwrite** the internal ones.

For **triggers**, reuse `button()` via Base UI's `render` prop so a trigger looks like
a quanta Button without an extra DOM node. Because `Menu.Trigger` (like `Menu.Item`
and `Switch.Root`) is a **`NonNativeButton` primitive** that defaults
`nativeButton={false}`, when `render` replaces it with a real `<button>` you must pass
`nativeButton` so Base UI treats the replaced element as a native button for event /
`disabled` handling (otherwise you can get subtle a11y / disabled-handling bugs):

```tsx
<Menu.Trigger
  nativeButton
  render={<button className={button({ variant: 'secondary', size: 'md' })} />}
>
  Open
</Menu.Trigger>
```

Keep `cx()` (no `tailwind-merge`): each wrapper owns one minimal composite base class
plus state-attribute utilities; rely on state-selector specificity. Revisit
`tailwind-merge` only if a real property/state conflict appears.

### 6.4 Portal container convention

Every portal-based wrapper exposes a `container` prop forwarded to the Base UI Portal
`container` (default `document.body`). This **mirrors the existing `Dropdown.Content`
`container` prop**. Type the wrapper's `container` to match Base UI's Portal
`container` type, which is `HTMLElement | ShadowRoot | RefObject` — **not**
`document.body`-only and **not** the broader `Element`:

```tsx
type PortalContainer =
  | HTMLElement
  | ShadowRoot
  | React.RefObject<HTMLElement | ShadowRoot | null>
  | null

export function Content({ container, className, ...props }: { container?: PortalContainer; … }) {
  return (
    <Primitive.Portal container={container}>
      <Primitive.Positioner className="z-q-popover">
        <Primitive.Popup className={cx('q-menu-content', className)} {...props} />
      </Primitive.Positioner>
    </Primitive.Portal>
  )
}
```

**Discoverability note:** `Dialog.Portal` re-declares `container` explicitly, but
`Menu.Portal` *inherits* it from `FloatingPortal.Props` (`MenuPortalProps` only adds
`keepMounted` — verified). The prop exists on both, but on Menu it is the less
obvious inherited prop; the type above matches `FloatingPortal.Props` for both.

### 6.5 Z-index mapping to `z-q-*`

Base UI sets **no** inline z-index. Apply a `z-q-*` utility on the **positioned
subpart**: for anchored popups that is the **Positioner** (the actual positioned
element — not only the Popup, whose stacking the Positioner can defeat); for
**Dialog**, which has **no Positioner part**, it is the **Popup** (and the
**Backdrop** for the overlay). Mapping (tokens already exist in
`src/css/tailwind/z-index.css`):

| Wrapper | Class target & utility | Backdrop class |
|---|---|---|
| Dialog | **`Dialog.Popup` → `z-q-modal`** (no Positioner part) | **`Dialog.Backdrop` → `z-q-overlay`** |
| Popover | `Positioner` → `z-q-popover` | `Backdrop` → `z-q-overlay` |
| Menu / Dropdown | `Positioner` → `z-q-dropdown` or `z-q-popover` | — |
| Tooltip | `Positioner` → `z-q-tooltip` | — |
| Toast | `Positioner` → `z-q-toast` | — |

(Popover, Tooltip, Toast, and Menu each export a `Positioner`, so those rows target
it; Dialog and any future Drawer do not, so they target Popup/Backdrop.)

### 6.6 Global app setup (isolation / position) — and where it lives

Base UI recommends `isolation: isolate` on the app root and `body { position:
relative }` for correct stacking/anchoring. **quanta does not ship this** (it never
owns `<html>`/`<body>`; the app already applies Tailwind `isolate` at container
roots). Document it as a **required one-time consumer setup** in `ai/AGENTS.md` +
`README.md`. Portals default to `document.body`, so basic usage works without it, but
without an `isolate` root a high local z-index elsewhere can still cover a
popover/modal — that is why the note is required, not optional.

### 6.7 SSR / `'use client'` / CSP

- Each quanta wrapper declares `'use client'` at the top (per-component, not a package
  fence). Base UI **component modules already declare `'use client'` themselves**
  (757 files carry the directive in v1.5.0 — verified in both the CJS and `esm/`
  builds, e.g. `switch/root/SwitchRoot.js`, `menu/root/MenuRoot.js`; the barrel
  `index.js` does not, but the component modules do). Each quanta wrapper should
  **still** declare `'use client'` — not because Base UI omits it, but because the
  wrapper adds its own client-only logic (the `SLOT`/`style` spread, the
  function-`className`). Base UI state is exposed as HTML data-attributes, so the
  rendered markup is SSR-safe.
- CSP: the runtime already threads `styleNonce`. Base UI components that inject inline
  `<style>` (some Positioner transitions) should be wired through Base UI's
  `CSPProvider(nonce)` with the **same** nonce the app passes to quanta's
  bootstrap/`styleNonce`. This is **consumer wiring**, not a quanta runtime change —
  document it.
- Known runtime gap to track (not blocking): `color-scheme` is set by `bootstrap` but
  not updated by `ThemeController.setPref()`, so native Base UI form-control appearance
  may not adapt on a runtime theme toggle until the controller sets `colorScheme` on
  managed-theme changes. Tracked as a separate runtime fix (see Risks).

---

## 7. Token prerequisites (radius + motion now; shadow + scaling deferred)

Both `tokens/radius.json` and `tokens/motion.json` are **already vendored** in DTCG
format. Emit them through the existing codegen so they are golden-gated. This is a
**parallel** workstream that unblocks — never blocks — component work.

### 7.1 The codegen recipe (per category)

The pipeline is mechanical; each new collection touches the same files:

1. **`scripts/tokens-emit/lib/emit/<category>.ts`** — two (radius) or two (motion) pure
   `(tokens: ParsedTokens) => string` functions following the `border-width.ts`
   shape: one `primitives*` (emits `:root { --hf-* }`), one `tailwind*` (emits
   `@theme { --<cat>-q-*: var(--hf-*) }`). Use the `HEADER` from `emit/shared.ts`.
2. **`scripts/tokens-emit/lib/outputs.ts`** — register the new output files (import the
   emit fns, append `{ path, emit }` entries). `emit.ts` and `golden.test.ts` iterate
   this list, so registration auto-gates the files.
3. **`scripts/tokens-emit/lib/reader.ts`** — add the JSON to the `Promise.all` and the
   returned object.
4. **`scripts/tokens-emit/lib/types.ts`** — add the raw collection to `RawTokens` and
   the parsed shape to `ParsedTokens`.
5. **`scripts/tokens-emit/lib/parser.ts`** — add a `parse<Category>()` walker; wire it
   into `parse()`.
   - **Parser shape caveat (required reading):** the existing number-parsers
     (`parseSpacing` / `parseZIndex` / `parseBorderWidth`) **hard-throw unless
     `node.$value` is `typeof 'number'`**, and the shared `DtcgNode` type in
     `parser.ts` types `$value` as `string | Record<string,string>` (**no number**).
     Those parsers work only because each casts the raw input to its own local
     `{ $value?: number }` shape and bypasses the generic walker. So they are
     **bespoke per-category, not a shared generic.** Radius should **copy that
     bespoke pattern** (local `{ $value?: number }` cast + `typeof number` guard),
     not the generic `walkPrimitives`/`DtcgNode` path. Motion needs a **new walker**
     because `duration` is a number and `easing` is a string — neither matches the
     existing number-only guards nor the `DtcgNode` `$value: string | Record` shape.
6. **`scripts/tokens-emit/lib/validator.ts`** — **required check, not optional:**
   before running the golden test, confirm whether `validate(parsed)` will **reject
   or pass-through** the new collection. `golden.test.ts` runs `validate(parsed)` in
   `beforeAll` and a validation throw fails **all** output assertions globally — not
   just the new category's file. Extend the validator (or confirm it tolerates the
   new collection) before relying on the golden suite.
7. **`scripts/tokens-emit/lib/emit/<category>.test.ts`** — per-category test that locks
   the byte output (run before the full pipeline to catch wiring mistakes).
8. **`src/css/tailwind/index.css`** — uncomment the `@import "./<category>.css"`.
9. Run `yarn tokens:emit`, review `git diff src/css/`, commit if intentional.

### 7.2 Radius emit

`tokens/radius.json` is `$type: dimension` (px), keyed `0, 050=2, 100=4, 150=6,
200=8, 300=12, 400=16, 500=20, 600=24, full=9999`. The **numeric keys** follow the
**same px→rem pattern** as spacing/border-width (the `rem()` helper in `shared.ts`
does `n/16 + 'rem'`; radius is typically `rem`) — but "same pattern" means *copy the
bespoke parser*, not *reuse a shared function* (see §7.1 step 5: the number-parsers
are per-category, each with its own local `{ $value?: number }` cast + `typeof
number` guard; radius should follow `parseBorderWidth`/`parseZIndex`, not the generic
`walkPrimitives` path).

- **`full=9999` is a sentinel and must be special-cased — do NOT pass it through
  `rem()`.** `rem(9999)` emits `624.9375rem`, which is functional ("effectively
  fully rounded") but brittle and surprising, and is not how a `full` radius is
  conventionally tokenized. Emit it as a large **px** value (e.g. `9999px`) or
  `calc(infinity * 1px)`. Spacing/border-width have **no** comparable sentinel, so the
  "structurally identical" parallel breaks for this one key. **Lock the chosen
  representation in `emit/radius.test.ts`** so the golden pins it.

- **Outputs:** `src/css/primitives/radius.css` (`:root { --hf-radius-* }`) and
  `src/css/tailwind/radius.css` (`@theme { --radius-q-*: var(--hf-radius-*) }` →
  `rounded-q-*` utilities). No theme layer (no axis to resolve, same as spacing/
  border-width/z-index).
- **Naming:** follow `--<cat>-q-<name>` (`--radius-q-100`, `--radius-q-full`). The
  private slot var stays `--_radius`.
- **Unblocks:** removes the POC Switch `rounded-full` hardcode; enables `q-slot-rounded`
  (reads `--_radius`).
- **Collision note:** as with border-width/spacing, decide whether to coexist with or
  reset Tailwind's built-in `--radius-*`; document the choice in the emitter header.

### 7.3 Motion emit

`tokens/motion.json` has `duration` (`$type: duration`, ms: `instant 0, fast 100,
normal 200, slow 300, slower 500`) and `easing` (`$type: cubicBezier`: `in`, `out`,
`in-out`, `linear`).

- **Outputs:** `src/css/primitives/motion.css` (`:root { --hf-duration-*: <N>ms;
  --hf-ease-*: cubic-bezier(...) }`) and `src/css/tailwind/motion.css`
  (`@theme { --duration-q-*: var(--hf-duration-*); --ease-q-*: var(--hf-ease-*) }`).
- **Verify the `@theme` → utility synthesis BEFORE Phase 0b — do not assume it works
  like color/z-index.** Tailwind v4 generates `duration-*` / `ease-*` utilities from
  **specific** `@theme` namespace prefixes, and historically duration came from
  `--transition-duration-*` (named `--ease-*`/`--duration-*` support varies by
  version). Confirm that Tailwind v4 actually emits `duration-q-*` / `ease-q-*` from
  the `@theme --duration-q-*` / `--ease-q-*` keys you choose; if it does not, **adjust
  the `@theme` key namespace in `motion.css` to the prefix Tailwind recognizes**, or
  **fall back to hand-authored `@utility` rules** (the same approach `slot.css` /
  `menu.css` use). The `q-` infix avoids collision with Tailwind's built-in named
  `--ease-*` / `--default-transition-duration` regardless.
- **Parser caveat:** the existing walkers target `dimension`/`number`/`{light,dark}`
  shapes; the motion walker is a **new** walker (it cannot reuse the number-only
  parsers — see §7.1 step 5) and must handle two distinct value kinds: duration as an
  `ms` string and easing as a raw `cubic-bezier()`/`linear` string.
- **Global slot defaults:** set `:root { --_duration: var(--hf-duration-normal);
  --_ease: var(--hf-ease-out); }` in `motion.css` (or a small base file) so
  `q-slot-duration`/`q-slot-ease` have a default.
- **Reduced-motion reset is NOT a token** — it won't come from codegen. Hand-author a
  `@media (prefers-reduced-motion: reduce)` reset in a small base/global CSS, paired
  with the motion emit. Easy to forget — call it out as an explicit step.
- **Gap vs uikit (document, don't block):** `motion.json` lacks `spring` easing and
  enter/exit duration composites. Components needing those use a hand-authored escape
  hatch until upstream adds them.

### 7.4 Slot radius/motion ride-along

Add `q-slot-rounded` (reads `--_radius`), `q-slot-duration` (reads `--_duration`),
`q-slot-ease` (reads `--_ease`) to `slot.css` **with** the token emit. Emitting the
underlying tokens (golden-gated) is decoupled from promoting `slot.css` (hand-authored,
gated by component readiness). Do not ship `q-slot-rounded/duration/ease` before the
radius/motion tokens land, or they reference undefined vars.

### 7.5 Out of scope

- **Shadow:** there is **no** `tokens/shadow.json` vendored — codegen has nothing to
  read. Leave the `@import "./shadow.css"` placeholder commented in `index.css`.
  Components needing elevation before then use existing color/overlay tokens or a
  temporary hand-authored shadow, flagged as tech debt — never silently hardcoded.
- **`--scaling`:** a uikit runtime-preset concept (`calc(size * var(--scaling))`).
  quanta has no sizing-token category (sizes are hardcoded in `button.css`/
  `switch.tsx`) and no preset format. Adding it would require a whole sizing-token
  model — a separate, later decision.

---

## 8. Component authoring recipe (the repeatable checklist)

### 8.1 File layout

```text
src/components/<name>/
  <name>.tsx        # 'use client'; wraps a Base UI primitive; the SLOT record + color prop
  <name>.css        # OPTIONAL — q-<name>-* @utility rules; FIRST LINE: @source "./<name>.tsx";
  index.ts          # exports the component AND its types/builders together (never split)
  <name>.test.tsx   # vitest component test (see 8.4)
```

Multi-part primitives export a namespace object from `index.ts`
(`export const Menu = { Root, Trigger, Content, Item, … }`).

### 8.2 Exports wiring

- **No `package.json` edit.** The wildcard `"./*": "./src/components/*/index.ts"`
  resolves `@higgsfield/quanta/<name>` to the new folder automatically. Creating the
  folder + `index.ts` is sufficient.
- If the component has a `.css`, add **one** `@import` line to
  `src/css/tailwind/components.css`.
- Keep `sideEffects: ["**/*.css"]` and per-component `'use client'`.
- **No build step** — do not introduce tsup/esbuild/rollup.

### 8.3 Tokens / slot usage rules

- **Layout/structure:** native spacing utilities (`h-5`, `w-9`, `p-0.5`, `gap-2`) —
  no `q-` prefix, no hardcoded `p-[17px]`.
- **Static color/type/z-index/radius/border-width:** `q-*` token utilities
  (`bg-q-overlay-hover`, `text-q-text-primary`, `z-q-popover`, `rounded-q-200`,
  `border-q-thin`, `text-q-body-md-regular`).
- **Theme-driven, color-prop-driven surfaces:** `q-slot-*` utilities reading `--_c…`.
- **`SLOT` record:** map every `color` value to **all four** properties from §5.4,
  with `var()` fallback guards. Set it inline via `style={{ ...SLOT[color], ...style }}`.
  **`--_c` values MUST be `--hf-color-*`, never `--color-q-*`.**
- **State:** target Base UI data-attributes (`data-checked:…`, `data-disabled:…`,
  `data-highlighted:…`) — never Radix `data-state`, never a `className` variant prop.
- **No hardcoded radius/motion** once tokens land — use `q-slot-rounded` / `rounded-q-*`
  and `q-slot-duration` / `q-slot-ease`.

### 8.4 Testing recipe (vitest `components` project, happy-dom, testing-library)

Reuse `src/test/setup-components.ts` polyfills (`hasPointerCapture`,
`setPointerCapture`, `releasePointerCapture`, `scrollIntoView`, `ResizeObserver`) —
they already cover Base UI floating/focus needs. Assert:

1. **Role:** `screen.getByRole('switch' | 'menu' | 'menuitem' | 'menuitemcheckbox' | …)`.
2. **Base UI state data-attributes:** `toHaveAttribute('data-checked', '')` /
   `data-unchecked` / `data-disabled` — **NOT** `data-state` (that's Radix).
3. **Keyboard:** `@testing-library/user-event`.
4. **Composition class present:** `toHaveClass('q-menu-content')` / the slot/`q-*` base.
5. **Optional inline contract:** `toHaveStyle('--_c: …')` for slot-driven components.

Golden test is unaffected (it gates only codegen outputs, not hand-authored `.css`).

### 8.5 Story recipe (incl. `@source inline`)

- Stories compose dynamic class combinations via loops/maps (e.g. a `color` loop).
- Tailwind cannot statically scan template literals, so **every dynamic class family
  must be listed in `.storybook/preview.css` via `@source inline()`** or it is
  tree-shaken in the Storybook canvas (a review-time-only regression). Add the
  `q-slot-*` rules from §5.5 and keep them in sync manually after any taxonomy change.
- **Write the new `q-slot-*` `@source inline` rules `q-`-prefixed.** The **existing**
  `preview.css` `@source inline` lists use **bare, un-prefixed** names (e.g.
  `text-{display,…}`, `{bg,text,border}-background-{…}`, `z-{base,…}`) even though
  the real emitted utilities are `q-`-prefixed (`text-q-accent-*`, `bg-q-*`, `z-q-*`).
  That neighboring bare pattern is a **pre-existing repo discrepancy** (the lists look
  stale vs the bundle) — **do not copy it.** The plan's new `q-slot-*` lines are
  correctly prefixed and consistent with the actual utilities; the bare lists are a
  separate `q-` audit outside this plan's scope.
- The story wrapper applies theme background/text; the toolbar drives `data-theme`.

### 8.6 A11y expectations

- Behavior, role, keyboard, focus management, and form integration come from the Base
  UI primitive — do not re-implement them.
- The `@storybook/addon-a11y` runs in the canvas; expect zero violations.
- Focus rings use `q-slot-ring-40` / `q-focus-ring*`; never remove `outline` without a
  visible replacement.
- For form controls, optionally support Base UI `Field.Root` wrapping (validation
  data-attributes) — opt-in, via context, no manual wiring.

---

## 9. Dropdown migration (radix → Base UI Menu)

**Hard cutover** (not coexistence). Radix is imported in exactly three source files:
`dropdown/dropdown.tsx`, `dropdown/dropdown-item.tsx` (`DropdownMenu`), and
`button/button.tsx` (`Slot`, line 4). Retiring radix means migrating all three.

### 9.1 Prop/subpart mapping (radix `DropdownMenu` → `@base-ui/react/menu`)

| Radix | Base UI |
|---|---|
| `Root` | `Menu.Root` |
| `Trigger` | `Menu.Trigger` |
| `Portal` | `Menu.Portal` |
| `Content` | `Menu.Positioner` + `Menu.Popup` (Base UI splits positioning from the popup surface; `q-menu-content` lands on **`Menu.Popup`**) |
| `Item` | `Menu.Item` |
| `Label` | `Menu.GroupLabel` |
| `Group` | `Menu.Group` |
| `Separator` | `Menu.Separator` |
| `Sub` | `Menu.SubmenuRoot` |
| `SubTrigger` | `Menu.SubmenuTrigger` |
| `SubContent` | `Menu.Positioner` + `Menu.Popup` |
| `CheckboxItem` | `Menu.CheckboxItem` (+ `Menu.CheckboxItemIndicator`) |
| `ItemIndicator` | `Menu.CheckboxItemIndicator` / `Menu.RadioItemIndicator` |

The **public `Dropdown.*` API stays identical** — only the wrapper internals change,
so no consumer changes.

### 9.2 Fate of `keepMenuOpen` and `MenuSwitch`

- **`keepMenuOpen()` is DELETED.** Base UI exposes a native `closeOnClick` prop:
  `Menu.Item` defaults `closeOnClick=true` (matches today's close-on-select) and
  `Menu.CheckboxItem` defaults `closeOnClick=false` (exactly the `keepMenuOpen`
  behavior, now native and accessible). The `event.preventDefault()` shim disappears.
- **`MenuSwitch` (the provisional hand-roll) is DELETED.** `SwitchItem` composes the
  **real quanta Switch** (the POC component) inside `Menu.CheckboxItem`'s trailing
  slot — themed via the slot system. This removes the hardcoded `h-4 w-7` /
  `translate-x-[14px]` placeholders.
- **The one genuinely non-mechanical step — how the menu item's checked state reaches
  the inner Switch.** Base UI's `Menu.CheckboxItem` does **not** expose its checked
  state via a child context; it exposes it through its **render/state callback** and
  via the **`data-checked` data-attribute**. So the wiring is: read the
  `CheckboxItem`'s checked state from its `render`/state callback (or `data-checked`)
  and pass it into the inner Switch's `checked` prop, with **the Switch made
  presentational / non-interactive** so the menu item owns the toggle (the Switch is a
  visual indicator, not an independent control — avoids a double-toggle and a nested
  interactive-control a11y issue). The `closeOnClick=false` default on `CheckboxItem`
  keeps the menu open on toggle.
- **Test detail to reconcile during the rewrite:** the current `dropdown.test.tsx`
  drives `SwitchItem` with `onCheckedChange`, but the current `SwitchItem` source
  actually takes `checked` / `onSelect` (it is a radix `CheckboxItem`) — a
  pre-existing test/source mismatch. Reconcile this when rewriting the test against
  the Base UI `CheckboxItem` API.

### 9.3 menu.css selectors & z-index

- `menu.css` already targets `data-highlighted` / `data-disabled`, which Base UI also
  emits — so `q-menu-item` / `q-menu-content` utilities largely carry over. Move
  `q-menu-content` onto `Menu.Popup`. **Re-verify** any Radix-only attribute (e.g.
  `data-state` on indicators) — those will silently stop matching; re-point to the
  Base UI attribute.
- Apply `z-q-popover` (or `z-q-dropdown`) on `Menu.Positioner` via `className`.

### 9.4 Tests

- Keep `getByRole('menu' | 'menuitem' | 'menuitemcheckbox')`.
- Rewrite `dropdown.test.tsx` assertions that read `data-state='checked'` on the old
  `MenuSwitch` (lines ~161, ~176) to Base UI's `data-checked`. Re-verify open/keyboard
  under happy-dom (polyfills already present).

### 9.5 Coexistence / cutover & retiring radix-ui

Cutover, not coexistence — the suite is tiny and Base UI is already installed/proven.
**Order matters** to avoid a broken build:

1. Migrate the Dropdown to Base UI Menu (behind the same `Dropdown.*` API).
2. Replace Button's radix `Slot` with the **stable** public composition:
   `useRender` (from `@base-ui/react/use-render`) + `mergeProps` (from
   `@base-ui/react/merge-props`), so `asChild` composes via the same render-prop
   mechanism. **Prefer this over `@base-ui/react/internals/use-button`:** that exact
   subpath does exist, but `internals/*` is an **explicitly unstable** surface (the
   export map exposes dozens of `./internals/…` entries with **no semver/stability
   contract** — it may break across minors). Treat `internals/use-button` as a
   last-resort fallback, acceptable only because quanta pins one Base UI version; do
   not pin the public `asChild` migration to it. **Re-test**
   `<Tooltip.Trigger asChild><Button/></…>` single-ref delivery — this is where
   `asChild` ref-forwarding semantics change.
3. **Only after all three import sites are migrated**, remove `"radix-ui": "^1.3.3"`
   from `package.json` `dependencies` and drop the `/radix-ui/` entry from
   `vitest.config.ts` `server.deps.inline`. This also resolves the Storybook "unable
   to find package.json for radix-ui" content-scan warning (a Tailwind `@source`
   artifact eliminated by removing the dep).

---

## 10. Phased rollout / workstreams

Two tracks run in parallel; the token track is golden-gated and low-risk, the
component track carries the opinionated decisions.

### Phase 0 — Foundations (parallel, independent)

**0a. Emit radius tokens** (token track).
- Deliverables: `lib/emit/radius.ts` + `.test.ts` (bespoke `{ $value?: number }` cast
  + `typeof number` guard, following `parseBorderWidth`; **`full=9999` special-cased**
  to `9999px` / `calc(infinity*1px)`, not `rem()`); `outputs.ts`/`reader.ts`/
  `types.ts`/`parser.ts` wired; **`validator.ts` confirmed/extended** (a `validate()`
  throw fails the whole golden suite); `src/css/primitives/radius.css` +
  `src/css/tailwind/radius.css` emitted; `@import "./radius.css"` uncommented;
  `git diff src/css/` committed.
- Acceptance: `yarn tokens:emit` clean; `yarn test` golden passes (incl. `validate()`);
  `rounded-q-*` utilities present in the bundle; `rounded-q-full` test locks the chosen
  `full` representation.

**0b. Emit motion tokens** (token track).
- **Pre-step (required):** verify Tailwind v4 synthesizes `duration-q-*` / `ease-q-*`
  utilities from the chosen `@theme` key namespace (§7.3); if not, switch the `@theme`
  prefix or hand-author `@utility` rules.
- Deliverables: `lib/emit/motion.ts` + `.test.ts` (a **new** walker — duration is a
  number, easing a string); pipeline wired; validator confirmed/extended; primitives/
  tailwind motion CSS emitted; `:root` slot defaults (`--_duration`/`--_ease`);
  hand-authored `prefers-reduced-motion` reset; `@import "./motion.css"` uncommented;
  committed.
- Acceptance: golden passes (incl. `validate()`); `duration-q-*`/`ease-q-*` utilities
  actually emit in the bundle; reduced-motion reset in the bundle.

*Phase 0 blocks: §7.4 slot radius/motion utilities, and removing the Switch
`rounded-full`/`duration-150` hardcodes. It does not block any other component work.*

### Phase 1 — Slot system to core (component track)

- Deliverables: rename `slot.css` utilities to `q-slot-*` with the §5.2 defs (incl.
  `--_c-bg`/`--_c-border` defaulting); add the §5.4 6-value/4-property `SLOT` records
  with `var()` guards; update `switch.tsx` + `switch.stories.tsx` to `q-slot-*` and
  the new contract; add `@import "./slot.css"` to `components.css`; remove the
  standalone slot import from `preview.css` and add `@source inline()` rules; document
  the `--_c` contract + "component-internal, off-limits in app code" note in
  `ai/AGENTS.md`; add a `switch.test.tsx`.
- Acceptance: Switch renders skinned in the **app bundle** (not just Storybook) across
  all 6 colors and light/dark; no unstyled surfaces; `yarn typecheck` + `yarn test`
  pass; Storybook shows all colors with no stripped classes.
- **Lockstep risk:** every current consumer of bare slot names (`switch.tsx`,
  `switch.stories.tsx`) must be renamed in the same change — a missed one renders an
  unstyled surface (slots have no token fallback).

### Phase 2 — Slot radius/motion (component track; depends on Phase 0)

- Deliverables: add `q-slot-rounded`/`q-slot-duration`/`q-slot-ease` to `slot.css`;
  replace Switch hardcodes with slot/token utilities; add `@source inline()` for them.
- Acceptance: Switch uses tokenized radius + motion; no undefined-var warnings.

### Phase 3 — Base UI integration conventions (component track)

- Deliverables: document the composition recipe (incl. `nativeButton` on
  `render`-replaced triggers), the portal `container` convention (typed
  `HTMLElement | ShadowRoot | RefObject`), the z-index→positioned-subpart mapping
  (Positioner for anchored parts, Popup/Backdrop for Dialog), and the required app
  `isolation: isolate` / `body position: relative` consumer note + CSP `CSPProvider`
  note in `ai/AGENTS.md` + `README.md`.
- Acceptance: docs reviewed; a second small Base UI component (e.g. Tooltip or
  Checkbox) authored against the recipe to validate it end-to-end.

### Phase 4 — Dropdown migration + retire radix (component track)

- Deliverables (in the §9.5 order): Dropdown → Base UI Menu; Button `asChild` →
  `useRender`; remove `radix-ui` dep + `vitest.config.ts` inline; update `menu.css`
  selectors + `dropdown.test.tsx`.
- Acceptance: Dropdown public API unchanged; `keepMenuOpen`/`MenuSwitch` deleted;
  SwitchItem uses the real Switch; all tests pass; Storybook radix warning gone;
  `radix-ui` no longer in `package.json`.

### Dependency summary

```text
Phase 0a (radius) ─┐
Phase 0b (motion) ─┴─▶ Phase 2 (slot radius/motion)
Phase 1 (slot core) ─▶ Phase 2 ─▶ Phase 4 (Dropdown SwitchItem reuses real Switch)
Phase 1 ─▶ Phase 3 (recipe needs the slot contract) ─▶ Phase 4
```

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Renaming bare slot names misses a consumer → unstyled surface (no token fallback). | Rename `switch.tsx` + `switch.stories.tsx` in lockstep within Phase 1; grep for `bg-slot`/`text-slot`/`ring-slot` before merge. |
| Promoting `slot.css` makes `q-slot-*` ship for ALL consumers (public-bundle change). | `q-slot-` prefix avoids the legacy collision; verify no consumer app defines `q-slot-*`; gate promotion on component readiness. |
| Storybook double-defines slot utilities, or tree-shakes them. | Remove the standalone `slot.css` import from `preview.css` when adding it to `components.css`; add the `@source inline()` rules. |
| `--_c-bg`/`--_c-border` without defaulting → transparent surfaces. | Bake `var(--_c-bg, var(--_c))` / `var(--_c-border, var(--_c))` into the utility defs, not each component. |
| `bg-slot` semantic change (`--_c` → `--_c-bg, var(--_c)`). | Backward-compatible only because the fallback resolves to `--_c`; ship the fallback in the same edit. |
| Minimal tint set forces ad-hoc `color-mix` later. | Supported ratios fixed up front (10/20 bg, 40 ring); add new ratios only in `slot.css`. |
| Slot shape/motion utilities reference undefined vars if shipped before tokens. | Phase-gate: `q-slot-rounded/duration/ease` land only after Phase 0. |
| `--_c` accidentally set to a `--color-q-*` alias → silent theming break, no compile error. | Documented contract in `ai/AGENTS.md` + `slot.css` header; review-time check. |
| Incomplete `defineTheme()` still falls through if both override + fallback keys absent. | `var()` fallback to `brand-primary` (always present); document recommended key coverage. |
| Codegen wiring miss (reader/types/parser) → golden/validator throws. | Run per-category `emit/<cat>.test.ts` before the full pipeline. |
| Motion parser must handle ms-duration AND cubic-bezier strings distinctly. | Dedicated motion walker; lock with `motion.test.ts`. |
| `--duration-q-*`/`--ease-q-*` / `--radius-q-*` collide with Tailwind built-ins. | Decide coexist-vs-reset per emitter; document in the header (as border-width does — verified `border-width.ts` documents the choice). |
| Tailwind v4 may not synthesize `duration-q-*`/`ease-q-*` utilities from `@theme --duration-q-*`/`--ease-q-*` (it uses specific namespace prefixes; `--ease-*`/`--duration-*` support varies by version). | **Verify the `@theme` → utility synthesis before Phase 0b** (§7.3); adjust the `@theme` key namespace to the prefix Tailwind recognizes, or fall back to hand-authored `@utility` (like slot/menu). |
| Base UI `FloatingTree` breaks if a second `@base-ui/react` instance is hoisted (`FloatingTree` is a real export). | **Pin one exact workspace version** (or add a resolution/override) so a single copy is hoisted/deduped — plain-vs-peer alone does not guarantee this. |
| z-index applied on the wrong subpart → stacking defeated. | Put `z-q-*` on the **positioned** subpart: the **Positioner** for anchored popups (Menu/Popover/Tooltip/Toast), the **Popup** (+ **Backdrop**) for Dialog, which has **no** Positioner part. |
| Consumer app without `isolation: isolate` root → popovers can be covered. | Document the `isolate`/`position` setup as **required** consumer setup. |
| `color-scheme` not updated by `ThemeController.setPref()` → native form controls don't adapt. | Track as a separate runtime fix: have `ThemeController` set `documentElement.style.colorScheme` on managed-theme changes. |
| Button `asChild` ref-forwarding changes when leaving radix `Slot`. | Re-test `<Tooltip.Trigger asChild><Button/></…>` single-ref delivery. |
| Removing `radix-ui` before all 3 import sites migrated breaks the build. | Removal is the **last** step of Phase 4. |
| `cx()` has no `tailwind-merge` → state-attribute utilities can collide. | Keep base classes minimal; rely on state-selector specificity; revisit only on a real conflict. |
| `color-mix(in oklch, …)` browser support. | Already relied on by the POC; confirm the target browser matrix before shipping to the main bundle. |

---

## 12. Open questions for the user

1. **`neutral` mapping** — confirm `--_c=text-primary`, `--_c-bg=background-secondary-strong`,
   `--_c-fg=text-primary`, `--_c-border=border-strong` with design before freezing
   (it is an editorial choice, not a 1:1 semantic token).
2. **Tint ladder** — is `10/20` (bg) + `40` (ring) sufficient for the near-term
   components, or should we pre-emptively add `5/30/50/80/90` to match uikit?
3. **Radius/motion Tailwind collision** — coexist with Tailwind's built-in
   `--radius-*` / `--duration-*` / `--ease-*`, or reset them to `initial` (as the
   token DS intends)?
4. **`color-scheme` controller fix** — fix `ThemeController.setPref()` to set
   `color-scheme` as part of this effort, or track separately?
5. **Field/Form depth** — should every quanta form control be `Field.Root`-aware, or
   only form-specific ones (Input, Select)?
6. **Component priority** — after Switch + Dropdown, which Base UI primitives are the
   first wave (Checkbox, Radio, Input, Select, Dialog, Tooltip, Popover)?
7. **Shadow tokens** — is design able to vendor `tokens/shadow.json` so elevation can
   be tokenized rather than hand-authored?

---

## 13. Appendix

### 13.1 POC file inventory (current uncommitted / POC files)

| File | Role |
|---|---|
| `src/components/switch/switch.tsx` | POC component: Base UI Switch + slot system + 1 `color` prop |
| `src/components/switch/index.ts` | exports `Switch` (+ types) |
| `src/css/tailwind/slot.css` | bare-named slot `@utility` defs (POC); imported only by Storybook |
| `stories/switch.stories.tsx` | demonstrates the `color` loop |
| `.storybook/preview.css` (line 13) | the POC-only `@import '../src/css/tailwind/slot.css'` |

Vendored-but-unemitted token sources (ready for Phase 0):

| File | Status |
|---|---|
| `tokens/radius.json` | vendored; `@import "./radius.css"` commented at `index.css:24` |
| `tokens/motion.json` | vendored; `@import "./motion.css"` commented at `index.css:33` |
| `tokens/shadow.json` | **absent** — shadow deferred; `@import "./shadow.css"` commented at `index.css:26` |

### 13.2 Exact commands

```bash
# all run from the quanta workspace
yarn workspace @higgsfield/quanta typecheck       # tsc -p tsconfig.json && tsc -p scripts/tsconfig.json
yarn workspace @higgsfield/quanta test            # vitest run (components + golden + per-category emit)
yarn workspace @higgsfield/quanta test:watch      # vitest watch
yarn workspace @higgsfield/quanta tokens:emit     # regenerate src/css/ from tokens/ (golden baseline)
yarn workspace @higgsfield/quanta storybook       # storybook dev -p 6007

# after tokens:emit, review and commit the generated CSS:
git -C packages/quanta diff src/css/
```

### 13.3 Key file map (where each change lands)

| Concern | File(s) |
|---|---|
| Slot utilities | `src/css/tailwind/slot.css` |
| Slot bundle import | `src/css/tailwind/components.css` |
| Bundle manifest (radius/motion uncomment) | `src/css/tailwind/index.css` |
| Storybook slot import + `@source inline` | `.storybook/preview.css` |
| Slot color records / `--_c` contract usage | `src/components/switch/switch.tsx` |
| Color token inventory (mapping source) | `src/css/theme/color.css`, `src/css/primitives/color.css` |
| Codegen registry | `scripts/tokens-emit/lib/outputs.ts` |
| Codegen radius | `scripts/tokens-emit/lib/emit/radius.ts` (+ `.test.ts`) |
| Codegen motion | `scripts/tokens-emit/lib/emit/motion.ts` (+ `.test.ts`) |
| Codegen wiring | `scripts/tokens-emit/lib/{reader,types,parser,validator}.ts` |
| Golden gate | `scripts/tokens-emit/golden.test.ts` |
| Dropdown migration | `src/components/dropdown/{dropdown,dropdown-item,index,dropdown.test}.tsx`, `src/components/menu/menu.css` |
| Button `asChild` migration | `src/components/button/button.tsx` |
| Dep changes | `package.json`, `vitest.config.ts` |
| Authoring API docs | `ai/AGENTS.md`, `README.md` |
