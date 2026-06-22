# Skill: Runtime And Infra

Use this for TanStack Start routing, SSR, server functions, server routes,
Cloudflare Worker runtime, D1/R2, Durable Objects, and deployment-facing
changes. If the task touches current user, login, logout, or `/api/user`, also
read `skills/auth.md`.

## Stack

- React 19 + TanStack Start.
- File-based routes live under `app/src/routes/`.
- SSR entry goes through `app/src/server.ts`, which exports the Worker handler.
- Build emits `dist/server/server.js` and `dist/client`.
- No Next.js, Remix, Astro, `app/src/pages`, Hono app, Express app, or separate API
  framework. App-local API endpoints are TanStack server routes under
  `app/src/routes/api/**`.

## SSR Safety

- Every route renders on the server per request.
- Never touch `window`, `document`, `localStorage`, `navigator`, or
  `matchMedia` at module top level or during render.
- Browser globals belong in `useEffect`, event handlers, or guarded branches.

## Server-Only Code

- Put server logic in `createServerFn(...).handler(...)` or `*.server.ts`.
- Secrets and Cloudflare bindings are read server-side per request.
- Do not pass secrets, bindings, or account tokens through React props.
- Use `createServerFn({ method: "POST" })` for mutations such as generation
  submit, cost preview, media upload, workspace switch, database writes, and
  other operations that change user-owned state. Use GET only for pure reads.

## Server Routes

Use TanStack Start server routes for browser-safe API proxies such as
`/api/user`:

```ts
// app/src/routes/api/user.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/user')({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ ok: true })
      },
    },
  },
})
```

Server routes are part of the same Worker. Do not add Hono/Express or a second
backend process.

Do not manually edit or hand-write `app/src/routeTree.gen.ts`. After adding nested
routes such as `app/src/routes/api/user.tsx` or
`app/src/routes/api/media/upload.tsx`, let the TanStack Router plugin regenerate the
route tree. A stale route tree that imports nested routes but never adds them as
children can make `/api/user` or `/api/media/upload` look like backend failures
when the route was never registered.

## Binary Upload Routes

Do not send files through JSON server-function input. Browser `File`, `Blob`,
`ArrayBuffer`, `Uint8Array`, base64 strings, and byte arrays must not be
serialized into `createServerFn` data. This can produce `Maximum call stack size
exceeded`, huge payloads, and corrupted upload sources.

For uploads, use an app-local multipart route:

```ts
// app/src/routes/api/media/upload.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/media/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData()
        const file = form.get('file')
        if (!(file instanceof File)) {
          return Response.json({ ok: false, code: 'missing_file' }, { status: 400 })
        }

        const bytes = new Uint8Array(await file.arrayBuffer())
        return Response.json({
          ok: true,
          contentType: file.type,
          size: bytes.byteLength,
        })
      },
    },
  },
})
```

Client code must use `FormData` and must not set the `content-type` header:

```ts
const form = new FormData()
form.append('file', file)
await fetch('/api/media/upload', { method: 'POST', body: form })
```

For generation flows, upload first and return a small media reference/id. The
later generation JSON request should contain prompt/settings/media refs only,
never raw bytes.

Route handlers must declare the HTTP methods the browser will use. For example,
a generation proxy route must expose `POST`, not only `GET`:

```ts
// app/src/routes/api/generate.ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/generate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        return Response.json({ ok: true, body })
      },
    },
  },
})
```

If a generated app shows `Method Not Allowed`, first check whether the browser is
POSTing to a route that only registered `GET`, or whether a mutation was built as
a GET server function. This commonly breaks generation submit/cost/media flows.

## Cloudflare Bindings

- Read D1/R2 bindings through `app/src/lib/bindings.server.ts`.
- Use `import { env } from "cloudflare:workers"` only in server-only modules.
- `app/app.manifest.json` declares infra. `app/wrangler.jsonc` is build/dev input; the
  deploy platform overwrites authoritative bindings.

## Shared Data Warning

Preview and production share the same D1 and R2 resources. `env.HF_ENV` changes
code behavior only; it does not switch databases or buckets.

- Prefer additive migrations.
- Avoid `DROP`, destructive `UPDATE`, and destructive backfills unless the user
  explicitly approves production data changes.

## Durable Objects

If `app/app.manifest.json` declares `"durableObject": "ClassName"`, also export the
class from `app/src/server.ts`:

```ts
export class ClassName extends DurableObject {
  // ...
}
```

Containers/code sandboxes are not deployable through this template yet.
