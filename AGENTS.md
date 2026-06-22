# Agent guide — Higgsfield app (full-stack, server-rendered)

You are editing ONE per-app Cloudflare Worker: a **React 19 + TanStack Start**
app that is **server-rendered (SSR)** and deploys as a single Worker served at
the app's own subdomain. Read `skills/quanta-design.md` before styling. The
rules below are hard constraints — breaking them ships a broken or insecure app.

**Repo layout.** The app project lives in **`app/`** — its own `package.json`,
`src/`, `packages/`, `migrations/`, build config, and the deploy inputs
(`app.manifest.json`, `wrangler.jsonc`). Run every `bun`/build command from
there. This `AGENTS.md` and `skills/` stay at the repo root.

## Stack

- **TanStack Start** (file-based routing under `app/src/routes/`, SSR via
  `app/src/server.ts` → a Worker `export default { fetch }`). No Next/Remix/Astro
  conventions, no `app/src/pages`.
- **Vite 7 + bun**. Build emits `dist/server/server.js` (the Worker) +
  `dist/client` (hashed static assets). Tailwind v4 + Quanta are already wired:
  `app/src/styles.css` imports Quanta's Tailwind entry, scans the vendored Quanta
  source, and restores native Tailwind spacing for app layouts. Legacy shadcn/ui
  files may exist from the scaffold, but they are not the design system; new
  client UI must default to Quanta tokens and components.
- **No separate Hono/Express backend.** Server logic is TanStack **server
  functions** (`createServerFn`) and **server routes**. App-local API routes are
  allowed when a platform contract requires them, for example `GET /api/user`
  as the browser-safe proxy to `https://fnf.internal/user`.

## Hard rules

### 0. Skill router

This root file is the safety rail. Task-specific details live in `skills/`.
Before editing, route yourself to the right skill files:

| Task | Read |
|---|---|
| Landing pages, homepages, marketing/product pages, waitlists, pricing/FAQ/CTA sections | `skills/landing-page.md` + `skills/quanta-design.md` |
| SaaS apps, dashboards, CRMs, admin panels, workspaces, editors, tables, operational tools | `skills/saas-application.md` + `skills/quanta-design.md` |
| Small focused apps, calculators, notes, todos, trackers, timers, converters, simple tools | `skills/small-app-design.md` + `skills/quanta-design.md` |
| UI, layout, styling, fonts, buttons, premium polish | `skills/quanta-design.md` |
| Generation jobs, media upload, profile/workspace, adapters, fnf SDK | `skills/fnf-sdk.md` + `skills/auth.md` + `skills/runtime-and-infra.md` |
| React query/cache/controllers for fnf | `skills/fnf-react.md` + `skills/auth.md` + `skills/runtime-and-infra.md` when generation/media/profile is user-backed |
| Auth, current user, login/logout, `/api/user`, `__auth` routes | `skills/auth.md` + `skills/runtime-and-infra.md` |
| TanStack Start routes, SSR, server functions, Cloudflare Worker runtime | `skills/runtime-and-infra.md` |
| Heavy / long-running work (ffmpeg, headless browser, background jobs), containers | `skills/containers.md` |

Package-local guides are canonical for package APIs:

| Package | Guide |
|---|---|
| `@higgsfield/quanta` | `app/packages/quanta/ai/AGENTS.md` |
| `@higgsfield/fnf` | `app/packages/fnf/ai/AGENTS.md` |
| `@higgsfield/fnf-react` | `app/packages/fnf-react/ai/AGENTS.md` |

If a task touches a vendored package and app code, read both the template skill
and the package guide. The skill explains how this template consumes the package;
the package guide explains the package API.

### 0a. Vendored Higgsfield packages

The `app/packages/` directory contains managed snapshots of
`@higgsfield/fnf`, `@higgsfield/fnf-react`, and `@higgsfield/quanta`. Their
source of truth is the fnf-web repository, not this template. Do not edit
vendored package code manually unless the task explicitly asks to patch the
package snapshot.

Client UI should use Quanta tokens/components. fnf API calls stay server-side.

### 1. SSR-safe rendering
Every route renders on the server per request. NEVER touch browser-only globals
(`window`, `document`, `localStorage`, `navigator`) at module top level or during
render — only inside `useEffect`/event handlers, or guarded with
`typeof window !== "undefined"`. A top-level `window` reference crashes SSR.

### 2. Server-only code stays server-only
Put server logic in `createServerFn(...).handler(...)` or a `*.server.ts` module
(the `.server.ts` suffix keeps it out of the client bundle). Secrets and
bindings are read **server-side, per request** — never shipped to the browser.

### 3. Auth and fnf are BACKEND-ONLY
Call Higgsfield internal services only from server code (a server function,
server route, or `*.server.ts`). The platform attaches identity on server
egress, so tokens never live in app code. NEVER call `https://fnf.internal/*`
from client components.

For current user auth, implement `GET /api/user` as a TanStack server route that
calls `https://fnf.internal/user` server-side and returns the upstream status
and JSON unchanged. Browser UI calls `/api/user`. Login/logout are browser
navigations to `/__auth/login?return=<path>` and
`/__auth/logout?return=<path>`. Read `skills/auth.md` before touching this.

Any app that uses the fnf SDK for generation, media upload, job feed/history,
profile, workspace, wallet, or credits is an authenticated app surface. It must
include `/api/user`, show a signed-out state with `/__auth/login`, and re-check
auth server-side before each SDK operation. Do not build anonymous generation
flows unless the task explicitly says it is an offline/mock demo using memory
adapters only.

If the user prompt asks for a model/generation app, even casually, treat auth,
profile, credits/workspace display, and a generation feed/history as mandatory
acceptance criteria. Example: "create a form app for Nano Banana generation 2"
means build the form **plus** sign-in/logout, `/api/user`, profile/credits/
workspace UI, SDK submit/cost/media upload routes, and a feed/history panel for
submitted generations. Do not wait for the user to explicitly ask for those.

When creating SDK clients in generated apps, use only
`createWorkflowPlatformAdapter({ baseUrl: 'https://fnf.internal' })` from
server-side code. Do not use public/dev fnf URLs, env-selected backend URLs,
`createFnfWebAdapter`, `createDevFnfWebAdapter`, apps-marketplace adapters,
bearer tokens, or dev user headers in generated app code.

This is a generated-template policy. The SDK package itself is adapter-based; if
the user explicitly asks to build a separate non-Supercomputer integration with
another approved backend, use that host's adapter or a custom SDK backend port
instead of applying this template-only restriction.

### 4. Cloudflare bindings via `cloudflare:workers`
Any infra you opt into (D1 `DB`, R2 `STORAGE`, KV `KV`) is read server-side
through `app/src/lib/bindings.server.ts` (`import { env } from "cloudflare:workers"`).
Each binding is present ONLY if declared in `app/app.manifest.json`, so the typed
accessors are optional — guard before use. Do not thread `env` through React
props or read it at module top level.

### 5. Opted-in storage is SHARED — preview data == prod data
If you opt into D1, R2, or KV, each is a SINGLE instance **shared by the preview
and prod deploys**. Only the CODE is split (`vars.HF_ENV`). The DATA is not.
- `env.HF_ENV` tells you which env it is; it CANNOT switch the database / bucket /
  namespace.
- A destructive migration or write you run "just to test on preview" hits
  **production data**. Prefer additive migrations (`CREATE TABLE IF NOT EXISTS`,
  `ADD COLUMN`); avoid `DROP`/destructive `UPDATE` unless you mean prod.

### 6. `app/app.manifest.json` declares infra — NOTHING is provisioned by default
A new app gets **no D1, no R2, no KV, no Durable Object** — `app/app.manifest.json`
ships every service OFF. Opt in only when the app actually needs it:
- `"db": true` → a D1 database, bound `env.DB`
- `"r2": true` → an R2 bucket, bound `env.STORAGE`
- `"kv": true` → a KV namespace, bound `env.KV`
- `"durableObject": "ClassName"` → a Durable Object, bound `env.ROOMS`
- `"container": true` (or `{ "instanceType", "port", "sleepAfter" }`) → a Docker
  container for heavy / long-running work, bound `env.CONTAINER` — see
  `skills/containers.md`

Counts are capped (≤1 each) by the platform, which PROVISIONS the resource and
binds it in an authoritative config at deploy. The committed `app/wrangler.jsonc` is
build/dev input only (used by `wrangler dev`); the platform OVERWRITES its `name`
+ bindings at deploy, so editing a binding there does not change the deploy —
declare infra in `app/app.manifest.json`.

**KV is eventually consistent** (it is NOT Redis): use it for config, feature
flags, and cached reads — NOT for counters, locks, or read-after-write. Reach
for a Durable Object when you need strong consistency.

For a **Durable Object** you must ALSO `export class ClassName extends
DurableObject {…}` from `app/src/server.ts` (alongside the default `{ fetch }`
export) so the class ships in the Worker.

For a **container** — heavy or long-running work a Worker can't do (ffmpeg, a
headless browser, a 30-minute job): set `"container"` in the manifest and follow
**`skills/containers.md`**. It has the exact `app/container/Dockerfile`, the
platform-fixed `AppContainer` class (a Durable Object you export from
`app/src/server.ts`), the keep-alive + 3-hour-deadline pattern that long jobs
REQUIRE (or the container is idle-killed mid-job), and how a background container
calls fnf via a container token. Containers are **off by default**.

## Editing map
- Pages / routing → `app/src/routes/**` (file-based; `__root.tsx` is the shell).
- Server logic → `createServerFn` (see `app/src/lib/api/example.functions.ts`) or
  `*.server.ts`.
- Bindings access → `app/src/lib/bindings.server.ts`.
- Infra declaration → `app/app.manifest.json`; `app/wrangler.jsonc` = build/dev input.
- Durable Object class → exported from `app/src/server.ts`.
- Container (heavy/long jobs) → `app/container/Dockerfile` + the `AppContainer`
  class in `app/src/server.ts`; recipe in `skills/containers.md`.
- Components → Quanta imports from `@higgsfield/quanta/*`; app-local wrappers in
  `app/src/components/**` only when composition is app-specific. Do not start from
  `app/src/components/ui/*` unless the task explicitly asks to keep a legacy shadcn
  component and you migrate its styling to Quanta tokens.
- Styles / theme → `app/src/styles.css` wires Tailwind v4 to Quanta. Use native
  Tailwind spacing for app layout (`p-4`, `gap-2`, `mt-6`) and Quanta semantic
  utilities for color/type (`bg-q-background-primary`,
  `text-q-body-md-regular`). Keep Quanta tokens in `app/packages/quanta`; do not
  redefine app-level design tokens unless a task explicitly requires a custom
  runtime theme.
- D1 schema → `app/migrations/000N_*.sql` (additive; see rule 5).

## Verify
Run from the app project root (`app/`):
```bash
cd app
bun install
bun run typecheck   # tsc --noEmit — must pass
bun run build       # tsc --noEmit && vite build — must pass
```
The sandbox cannot deploy/migrate (no Cloudflare token); the trusted platform CI
does that. Your job is to make `typecheck` and `build` pass.
