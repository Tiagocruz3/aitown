# Template Skill Router

This folder contains task-focused instructions for agents working in this
template. Start with the root `AGENTS.md`, then open the skill files that match
the task. Package-local guides under `app/packages/*/ai/AGENTS.md` remain canonical
for the vendored Higgsfield packages.

## Route By Task

| Task | Read |
|---|---|
| Landing pages, homepages, marketing/product pages, waitlists, pricing/FAQ/CTA sections | `skills/landing-page.md` + `skills/quanta-design.md` |
| SaaS apps, dashboards, CRMs, admin panels, workspaces, editors, tables, operational tools | `skills/saas-application.md` + `skills/quanta-design.md` |
| Small focused apps, calculators, notes, todos, trackers, timers, converters, simple tools | `skills/small-app-design.md` + `skills/quanta-design.md` |
| UI, layout, styling, fonts, buttons, premium polish, Quanta tokens/spacing | `skills/quanta-design.md` |
| Generation jobs, media upload, profile/workspace, adapters, fnf SDK | `skills/fnf-sdk.md` + `skills/auth.md` + `skills/runtime-and-infra.md` |
| React query/cache/controllers for fnf | `skills/fnf-react.md` + `skills/auth.md` + `skills/runtime-and-infra.md` when generation/media/profile is user-backed |
| Auth, current user, login/logout, `/api/user`, `__auth` routes | `skills/auth.md` + `skills/runtime-and-infra.md` |
| TanStack Start routes, SSR, server functions, Cloudflare Worker runtime | `skills/runtime-and-infra.md` |
| Heavy / long-running work (ffmpeg, headless browser, background jobs), containers | `skills/containers.md` |

## Package Guide Routes

| Package | Canonical package guide |
|---|---|
| `@higgsfield/quanta` | `app/packages/quanta/ai/AGENTS.md` |
| `@higgsfield/fnf` | `app/packages/fnf/ai/AGENTS.md` |
| `@higgsfield/fnf-react` | `app/packages/fnf-react/ai/AGENTS.md` |

If a skill and a package guide overlap, follow both: the skill explains how the
template should use the package, and the package guide explains the package API.

For UI tasks, the package guide gives the Quanta API and token vocabulary, while
`skills/quanta-design.md` gives the template-specific composition rules. The
current spacing rule is simple: app layout uses native Tailwind spacing
(`p-4`, `gap-2`, `mt-6`); Quanta semantic styling uses `q-` utilities for
color/type/z-index/border-width/components.
