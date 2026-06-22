# Skill: FNF SDK

Use this when the task touches `@higgsfield/fnf`: generation jobs, media upload,
profile/workspace data, adapters, observability, or server-side job submission.

Before coding, read:

- `app/packages/fnf/ai/AGENTS.md`
- `skills/auth.md`

## Template Rules

- Keep fnf API calls server-side: `createServerFn` or `*.server.ts`.
- Do not call fnf from browser components.
- A real generation app is never "just a form." If the prompt mentions using a
  Higgsfield model, SDK, generation, media upload, or model settings, the app
  must include auth, profile/credits/workspace display, submit/cost/media server
  operations, and a generation feed/history by default.
- If the app has any real SDK-backed generation/media/profile/credits feature,
  it must require auth. Implement `/api/user`, signed-out UI, login/logout, and
  a server-side auth check before each SDK operation.
- Browser auth/user UI calls `/api/user`; that route proxies
  `https://fnf.internal/user` server-side. Do not call `fnf.internal` from the
  browser.
- Generated apps must use `createWorkflowPlatformAdapter` with
  `baseUrl: 'https://fnf.internal'` from server code. Do not use
  env-controlled backend URL selectors, public fnf URLs, dev fnf URLs,
  apps-marketplace, or direct product routes in generated apps.
- This strict rule is for Supercomputer/template-generated apps. If the user
  explicitly asks for a separate SDK consumer with another approved endpoint,
  use that host's adapter or custom SDK backend ports instead of forcing
  `fnf.internal`.
- Do not expose service secrets, dev user ids, bearer tokens, media upload URLs,
  prompts, or raw backend bodies to the client.
- Register only the job models the app uses.
- Upload/resolve media before submit.
- Display credits are already normalized when using `client.cost(input).credits`
  or `profile.getCredits()`. Raw wallet fields from `getWallet()` are
  credit-cents; divide by 100 or use `getCredits()` for UI.
- Observability is safe metadata only. Never emit prompts, params, headers,
  tokens, URLs, filenames, emails, workspace names, or raw bodies.

## Mandatory Generation App Checklist

For prompts like "create a Nano Banana generation app", "build a Seedance form",
"make an image/video generator", or anything equivalent, deliver all of this:

- `GET /api/user` route that proxies `https://fnf.internal/user` server-side.
- Signed-out state with a Quanta sign-in button to
  `/__auth/login?return=<current path>`.
- Logout action to `/__auth/logout?return=/`.
- Server-side auth guard before every SDK submit, upload, cost, feed, profile,
  credits, and workspace operation.
- Profile tab/panel showing safe user fields, current workspace, and display
  credits from profile APIs.
- Model form with validated settings for the requested model.
- Cost preview using the SDK cost path when supported by the chosen model.
- Media upload route using multipart `FormData` when the model accepts media.
- Submit route/server function using `createJobClient` and registered jobs.
- Feed/history panel using SDK list/get/getSet data so the user can see queued,
  running, completed, and failed generations after submit.
- Request/debug logs on server SDK routes: method, logical operation/path,
  response status, SDK error code/status/message. Never log prompts, raw params,
  headers, tokens, cookies, upload URLs, filenames, emails, workspace names, or
  file bytes.

If any item is intentionally omitted, the app must be an explicitly offline/mock
demo using memory adapters only. Otherwise, omission is a bug.

## Common Imports

```ts
import { createJobClient } from '@higgsfield/fnf/client'
import { createMediaClient } from '@higgsfield/fnf/media'
import { createProfileClient } from '@higgsfield/fnf/profile'
import { createWorkflowPlatformAdapter } from '@higgsfield/fnf/adapters'
import { nanoBanana2, seedance2_0 } from '@higgsfield/fnf/jobs'
```

## Server Pattern

Create the adapter inside server-only code after auth has been checked.

```ts
const auth = await requireCurrentUser()
if (!auth.ok) {
  return new Response(JSON.stringify(auth.body), {
    status: auth.status,
    headers: { 'content-type': 'application/json' },
  })
}
```

Then create SDK clients with the fnf.internal logical-operation adapter:

```ts
const FNF_INTERNAL_BASE_URL = 'https://fnf.internal'

const adapter = createWorkflowPlatformAdapter({
  baseUrl: FNF_INTERNAL_BASE_URL,
  observability,
})

const jobs = createJobClient({ adapter, jobs: [seedance2_0, nanoBanana2] })
const media = createMediaClient({ mediaAdapter: adapter })
const profile = createProfileClient({ profileAdapter: adapter })
```

Generated apps use fnf.internal only:

```ts
const adapter = createWorkflowPlatformAdapter({
  baseUrl: 'https://fnf.internal',
  observability,
})
```

Do not pass `getToken`. Do not send `Authorization`. The platform attaches
identity automatically for server-side calls to `https://fnf.internal`.

This adapter sends SDK operations only to the fnf.internal logical endpoints
`/user`, `/workspaces`, and `/jobs`. The platform behind fnf.internal decides
final internal routes.

Do not add model-specific route logic in app code. The SDK builds validated wire
params, fnf.internal resolves final endpoints, and the app handles only safe
request/response state.

Generated apps must never use:

```ts
process.env.FNF_BASE_URL
const backendUrl = process.env.SOME_BACKEND_URL
createWorkflowPlatformAdapter({ baseUrl: backendUrl })
createFnfWebAdapter({ baseUrl: '...' })
createDevFnfWebAdapter(...)
createAppsMarketplaceAdapter(...)
fetch('https://fnf.internal/jobs') // hand-written request; use the SDK adapter
```

## fnf.internal Method Contract

Generated apps must not decide fnf.internal HTTP methods themselves. Use SDK
clients, and let `createWorkflowPlatformAdapter` send the correct operation:

| SDK operation | fnf.internal method/path |
| --- | --- |
| job submit | `POST /jobs` with `operation: "submit"` |
| job cost | `POST /jobs` with `operation: "cost"` |
| job cancel | `POST /jobs` with `operation: "cancel"` |
| media presign / confirm | `POST /jobs` with `operation: "media.presign"` or `"media.confirm"` |
| job get / get set / list | `GET /jobs?operation=get|get_set|list...` |
| media get / list | `GET /jobs?operation=media.get|media.list...` |
| profile user | `GET /user` |
| workspace reads | `GET /workspaces?operation=list|current|wallet` |
| workspace switch | `POST /workspaces` with `operation: "switch"` |

If the browser calls an app-local route for generation, that app route must be a
mutation route such as `POST /api/generate`; it must not be `GET`. The route
then checks auth server-side and calls `jobs.submit(...)`. Do not forward browser
requests directly to `fnf.internal`, `/jobs`, `/jobs/v2/*`, or `/api/user`.

For TanStack server functions, use `createServerFn({ method: "POST" })` for
submit, cost, media upload, workspace switch, and other write-like SDK
operations. Use GET only for pure read functions. A 405 / "Method Not Allowed"
on generation almost always means the generated app used a GET route/function
for a submit/cost/media operation, or tried to call a fnf.internal write
operation through a query string instead of letting the SDK use `POST /jobs`.

## Strict Media Upload Contract

Binary files must never cross a JSON server-function boundary. Do not pass
`File`, `Blob`, `ArrayBuffer`, `Uint8Array`, base64 strings, or arrays of bytes
inside `createServerFn` input or JSON request bodies. This causes stack overflows,
huge payloads, broken serialization, or unusable object-shaped bytes.

Use one of these two patterns:

1. Browser uploads to an app-local `POST /api/media/upload` route with
   `FormData`.
2. Browser uses `useAttachments` only when the provided media client has a safe
   browser-capable upload path. For server-only fnf.internal/auth flows, prefer
   the `FormData` route.

Then generation submits only the returned `MediaRef`:

```txt
File in browser
  -> POST multipart FormData /api/media/upload
  -> server auth guard
  -> media.upload({ source: bytes, ... })
  -> returns MediaRef
  -> POST JSON /api/generate with prompt/settings/MediaRef only
  -> server auth guard
  -> jobs.submit(...)
```

Client upload example:

```ts
const form = new FormData()
form.append('file', file)

const response = await fetch('/api/media/upload', {
  method: 'POST',
  body: form,
})

const upload = await response.json()
if (!upload.ok)
  throw new Error(upload.error?.code ?? 'upload_failed')
```

Do not set the `content-type` header manually for `FormData`; the browser must
add the multipart boundary.

Server upload route example:

```ts
import { createFileRoute } from '@tanstack/react-router'
import { createMediaClient } from '@higgsfield/fnf/media'

export const Route = createFileRoute('/api/media/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireCurrentUser()
        if (!auth.ok) {
          return Response.json(
            { ok: false, error: { code: 'unauthorized', status: auth.status } },
            { status: auth.status },
          )
        }

        const form = await request.formData()
        const file = form.get('file')
        if (!(file instanceof File)) {
          return Response.json(
            { ok: false, error: { code: 'missing_file' } },
            { status: 400 },
          )
        }

        console.info('[api/media/upload] file', {
          contentType: file.type,
          size: file.size,
        })

        const bytes = new Uint8Array(await file.arrayBuffer())
        const media = createMediaClient({ mediaAdapter: adapter })
        const result = await media.upload({
          source: bytes,
          filename: 'upload',
          contentType: file.type,
          type: 'image',
          forceIpCheck: true,
        })

        return Response.json({ ok: true, ref: result.ref })
      },
    },
  },
})
```

Generation route input must look like this:

```ts
{
  prompt: string
  settings: { aspectRatio: '3:4', resolution: '1k', batchSize: 1 }
  media?: { image?: MediaRef }
}
```

Do not include `file`, `blob`, `bytes`, `arrayBuffer`, `base64`, or raw
`data:image/...` values in generation input. If upload fails with
`Maximum call stack size exceeded`, the app almost certainly tried to serialize
binary through JSON or used `String.fromCharCode(...bytes)` on a large file.

## Job Client Pattern

Only call the job client after the server auth guard succeeds.

Register exactly the models the app exposes:

```ts
const jobs = createJobClient({
  adapter,
  jobs: [seedance2_0, nanoBanana2],
})
```

Use public camelCase settings:

```ts
await jobs.submit({
  model: 'seedance_2_0',
  prompt: { instruction: prompt },
  settings: {
    mode: 'std',
    duration: 5,
    aspectRatio: '16:9',
    resolution: '720p',
    batchSize: 1,
  },
})
```

Never send snake_case settings from UI code. The SDK maps `aspectRatio` to
`aspect_ratio`, `batchSize` to `batch_size`, and similar wire fields through
job schemas.

Server-function submit example:

```ts
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createJobClient } from '@higgsfield/fnf/client'
import { createWorkflowPlatformAdapter } from '@higgsfield/fnf/adapters'
import { nanoBanana2 } from '@higgsfield/fnf/jobs'

export const generate = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ prompt: z.string().min(1) }))
  .handler(async ({ data }) => {
    const auth = await requireCurrentUser()
    if (!auth.ok) {
      return {
        ok: false as const,
        code: 'unauthorized',
        status: auth.status,
      }
    }

    const adapter = createWorkflowPlatformAdapter({
      baseUrl: 'https://fnf.internal',
    })

    const jobs = createJobClient({ adapter, jobs: [nanoBanana2] })
    const result = await jobs.submit({
      model: 'nano_banana_2',
      prompt: { instruction: data.prompt },
      settings: { aspectRatio: '3:4', resolution: '1k', batchSize: 1 },
    })

    return { ok: true as const, result }
  })
```

Do not use `createServerFn({ method: "GET" })` or a `GET` server route for
generation. Generation is a mutation even when the form has no uploaded file.

## Model Catalog Snapshot

Use the package guide as source of truth, but common generated-app choices are:

- Images: `soulV2Image`, `soulCinemaImage`, `gptImage2`, `seedreamV4_5`,
  `nanoBanana2`, `nanoBananaFlash`, `recraftV41Image`.
- Video: `seedance2_0`, `kling3_0`, `kling3MotionControl`, `happyHorse`,
  `grokImagine`, `grokImagineV15`, `veo3_1Lite`, `wan27`.
- Upscale: `topazImageUpscale`, `topazImageGenerativeUpscale`,
  `nanoBanana2Upscale`, `topazVideoUpscale`, `higgsfieldVideoUpscale`,
  `soraEnhanceVideo`, `bytedanceVideoUpscale`.

Import only the entries the screen needs. The `jobs: [...]` array is the source
of model autocomplete and media-role narrowing.

## Media Pattern

Use `createMediaClient({ mediaAdapter: adapter })` server-side after auth, or
behind a safe client boundary that still reaches a server auth guard. Upload
first, then submit the returned `MediaRef`:

```ts
const upload = await media.upload({
  source: fileBytes,
  filename: 'input.png',
  type: 'image',
  forceIpCheck: true,
})

await jobs.submit({
  model: 'nano_banana_2',
  media: { image: upload.ref },
  prompt: { instruction: prompt },
})
```

Attach/resolve media metadata before submit when local validation depends on
dimensions or duration. Unknown metadata is allowed locally; backend remains
authoritative.

Allowed `media.upload({ source })` values are only `Blob`, `ArrayBuffer`,
`Uint8Array`, or `{ read: async () => Blob | ArrayBuffer | Uint8Array }`. The SDK
throws `invalid_media_source` for JSON-shaped objects so broken upload plumbing
fails clearly before presign/transfer.

## Profile And Workspace

Use the profile domain for account/workspace panels:

```ts
const snapshot = await profile.getSnapshot()
const credits = await profile.getCredits({ includeOnDemand: true })
await profile.switchWorkspace({ workspaceId })
```

Workspace switching updates backend context only. The app still owns routing,
session metadata, adapter header state, and cache invalidation.

Do not use `profile.getUser()` directly in browser components for auth gating.
For browser UI, use `/api/user` from `skills/auth.md`. Use the SDK profile
client server-side when the app is already performing SDK-backed account,
workspace, wallet, or credit operations.

Credit display rule:

- `profile.getWallet()` returns raw backend credit-cent values.
- `profile.getCredits()` returns display credits.
- `profile.getCredits()` returns a `ProfileCredits` object, not a number. Use
  `credits?.totalAvailableCredits`, `credits?.availableCredits`, or
  `snapshot.credits?.totalAvailableCredits` in UI.
- `jobs.cost(input).credits` returns display credits.
- Do not show raw wallet values directly in UI.

## Marketplace / Service Adapters Are Not For Generated Apps

Some fnf snapshots include `createAppsMarketplaceAdapter`. It is server-side
only, defaults to the dev apps-marketplace backend for now, and is for SDK smoke
tests or trusted service experiments only. Generated apps must not use it.
Generated apps use
`createWorkflowPlatformAdapter({ baseUrl: 'https://fnf.internal' })`
exclusively.

## Job UI Pattern

For a generated app UI:

1. Build the form with Quanta components.
2. Load `/api/user` before enabling SDK-backed controls.
3. If signed out, show sign-in UI and disable/hide generation, upload, cost,
   feed/history, profile, workspace, and credit actions.
4. Keep submit/cost/profile/media calls in server functions or safe app-local
   server-only modules.
5. Re-check auth inside each server function before calling SDK clients.
6. Return only safe data to the browser: generation ids, statuses, display
   credits, and sanitized errors.
7. Use `safeSubmit`/typed error codes when crossing worker/iframe boundaries.
8. Show validation, cost, upload state, running state, terminal state, and
   typed errors as real UI states.

Do not build anonymous real generation. The only allowed anonymous SDK-looking
flow is an explicit mock/offline demo using memory adapters and no network
requests.

## Troubleshooting Generation 405

If sign-in works but generation fails with `Method Not Allowed`:

1. Confirm the app-local generation function/route is `POST`, not `GET`.
2. Confirm the code calls `jobs.submit(...)` or `jobs.cost(...)` through the SDK,
   not hand-written `fetch('/jobs?...')`.
3. Confirm `createWorkflowPlatformAdapter({ baseUrl })` uses exactly
   `https://fnf.internal`, not the preview app URL, `/api/user`, a public fnf
   URL, a dev fnf URL, or a model-specific fnf route.
4. Confirm the server handler re-checks `https://fnf.internal/user` before SDK
   calls, then creates the adapter/client inside the server handler.
5. Confirm reads use `GET /jobs?operation=...`, while submit/cost/cancel/media
   writes use `POST /jobs`. Do not send `operation=submit` in a GET query.

If upload fails with `Maximum call stack size exceeded`:

1. Search for `String.fromCharCode(...`, base64 conversion, `JSON.stringify(file)`,
   `Array.from(bytes)`, or passing `File`/`Blob`/`ArrayBuffer` to
   `createServerFn` input.
2. Replace that flow with `FormData` POST to `/api/media/upload`.
3. Return only `{ ref: MediaRef }` from upload.
4. Send only that `MediaRef` in generation JSON.
5. Add logs for file `size` and `contentType`, but never file bytes, upload URL,
   token, raw prompt, or raw backend body.

## Observability

SDK observability is a safe metadata callback. It is not product analytics by
default and it must not leak prompts, params, headers, tokens, URLs, filenames,
emails, workspace names, or raw bodies.

Allowed metadata examples: model id, operation, status, duration, safe job id,
safe media id, media type, credit estimate, and error code.

Pass observability to the adapter as well as clients when debugging transport
problems:

```ts
const adapter = createWorkflowPlatformAdapter({
  baseUrl: 'https://fnf.internal',
  observability,
})

const jobs = createJobClient({ adapter, jobs: [nanoBanana2], observability })
const media = createMediaClient({ mediaAdapter: adapter, observability })
```

Without adapter observability you may see `fnf.job.submit` fail but not the
underlying `fnf.transport.request` method/path/status.
