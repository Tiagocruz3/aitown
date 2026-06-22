# Containers — heavy & long-running work

Use a **container** when the work can't run in a Worker: ffmpeg/video, a headless
browser, image processing, a long (minutes-to-hours) job, or any CPU/memory-heavy
task. A container is a **Docker image** that runs alongside your Worker, fronted
by a **Durable Object**. It's **off by default** — opt in only when you need it.

Don't reach for a container for ordinary backend logic — use server functions /
server routes (see `skills/runtime-and-infra.md`). Containers cost compute while
running; they sleep when idle.

## The shape (what the platform fixes vs what you write)

The platform **fixes** the names so you can't mis-wire them:
- Durable Object class **`AppContainer`**, binding **`env.CONTAINER`**, exactly one instance type, `max_instances: 1`.

**You write** these:
0. add the dep (not in the base template): `cd app && bun add @cloudflare/containers`.
1. `app/app.manifest.json` → opt in.
2. `app/container/Dockerfile` (+ its server) → the image, listening on a port.
3. `export class AppContainer extends Container` in `app/src/server.ts`.

## 1. Opt in — `app/app.manifest.json`

```jsonc
{
  "container": { "instanceType": "standard-2", "port": 8080, "sleepAfter": "5m" }
}
// or just  "container": true  for the defaults above
```
`port` must match the port your container server listens on. `sleepAfter` is the
**idle** shutdown — active jobs keep themselves alive (see §4).

## 2. The image — `app/container/Dockerfile`

Keep it in its own folder (`app/container/`) so it's clearly the container's
image, not the app. It must run an HTTP server on the `port` from the manifest:

```dockerfile
# app/container/Dockerfile  (example: ffmpeg + a tiny Node server)
FROM node:20-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /srv
COPY server.mjs .
EXPOSE 8080
CMD ["node", "server.mjs"]
```

`app/container/server.mjs` accepts the job, does the heavy work in the
background, exposes `GET /status`, and (if it needs Higgsfield data) calls back to
your app's API with the **container token** (see §5):

```js
import http from "node:http";
let state = { done: false, outputKey: null };

http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/start") {
    const job = await readJson(req);                 // { jobId, containerToken, appBaseUrl, ... }
    res.writeHead(202).end("started");               // return FAST — work runs detached
    runJob(job).catch((e) => (state = { ...state, error: String(e) }));
    return;
  }
  if (req.url === "/status") { res.writeHead(200).end(JSON.stringify(state)); return; }
  res.writeHead(404).end();
}).listen(8080);

async function runJob(job) {
  // ... run ffmpeg, etc. (can take many minutes) ...
  // If you need Higgsfield data, call YOUR app (NOT fnf directly) with the token:
  //   await fetch(`${job.appBaseUrl}/api/whatever`,
  //     { headers: { Authorization: `Bearer ${job.containerToken}` } });
  state = { done: true, outputKey: `jobs/${job.jobId}/out.mp4` };
}
```

> The container disk is **ephemeral** (gone on restart). Durable state lives in
> D1/R2 via the Worker — never rely on files in the container.

## 3. The Durable Object — `app/src/server.ts`

Export a class named **exactly `AppContainer`** (the platform binds it). It keeps
the container alive while a job runs and writes the result to D1 when done:

```ts
import { Container } from "@cloudflare/containers";
import { bindings } from "./lib/bindings.server";

const MAX_JOB_MS = 3 * 60 * 60 * 1000; // 3h hard deadline (crash/hang backstop)

export class AppContainer extends Container {
  defaultPort = 8080;     // must match the manifest port + the container server
  sleepAfter = "5m";      // idle shutdown; an ACTIVE job renews this (below)

  // Called on a timer while a job runs. CRITICAL: without renewing, a container
  // doing background work with no incoming requests is idle-killed mid-job.
  async tick(jobId: string, startedAt: number) {
    const env = bindings();
    if (Date.now() - startedAt > MAX_JOB_MS) {            // crash/hang backstop
      await this.destroy();
      await env.DB?.prepare("UPDATE jobs SET status='timed_out' WHERE id=?").bind(jobId).run();
      return;                                             // stop renewing
    }
    this.renewActivityTimeout();                          // keep the container alive
    const status = await (await this.containerFetch("http://c/status")).json();
    if (status.done) {
      await env.DB?.prepare("UPDATE jobs SET status='done', output=? WHERE id=?")
        .bind(status.outputKey, jobId).run();
      await this.stop();                                  // let it sleep → $0
    } else {
      this.schedule(60, "tick", jobId, startedAt);        // re-arm (~60s)
    }
  }
}

// ... your normal default `export default { fetch }` SSR handler stays below ...
```

Don't override the Durable Object `alarm()` — `Container` uses it internally; use
`schedule()` for periodic work.

## 4. Long jobs — never block a request; keep it alive; have a deadline

- **Kickoff returns fast.** The browser hits your app, you start the container and
  return a `jobId` in seconds — you do NOT hold the request for the whole job.
- **Persist + poll.** Write a `jobs` row to D1 (`status=running`); the browser
  polls a cheap `GET /api/jobs/:id` every few seconds (not one long connection).
- **Keep-alive.** While the job runs, the DO renews the activity timeout
  (`tick` above). `sleepAfter` only kills a TRULY idle container.
- **Deadline.** The 3h cap stops renewing a hung/crashed container so it can't
  bill forever.

Kickoff + status routes (TanStack server routes):

```ts
// POST /api/jobs  — start a job
const jobId = crypto.randomUUID();
await env.DB.prepare("INSERT INTO jobs (id, status) VALUES (?, 'running')").bind(jobId).run();
const c = env.CONTAINER.getByName(jobId);                 // one container per job
await c.fetch(new Request("https://c/start", {            // proxied to the container
  method: "POST",
  body: JSON.stringify({ jobId, containerToken, appBaseUrl: new URL(request.url).origin }),
}));
// kick the DO's keep-alive loop, then return immediately
// (call c.tick(jobId, Date.now()) via an RPC/route on the DO, or schedule it from /start)
return Response.json({ jobId });

// GET /api/jobs/:id — cheap status the browser polls
const row = await env.DB.prepare("SELECT status, output FROM jobs WHERE id=?").bind(id).first();
return Response.json(row);
```

## 5. Calling Higgsfield (fnf) from the container — the container token

A background container has no signed-in viewer, so it can't call fnf directly.
Instead it calls **your app's own API** as the viewer, using a short-lived
**container token**. The flow:

1. **Browser, at kickoff** — mint a token (same-origin; the platform handles it):
   ```js
   const { token } = await fetch("/__auth/container-token", { method: "POST" }).then(r => r.json());
   await fetch("/api/jobs", { method: "POST", body: form, headers: { "x-hf-container-token": token } });
   ```
2. **Your app** reads `x-hf-container-token` and passes it to the container at
   `/start` (as `containerToken` above).
3. **The container**, when it needs fnf, calls **your app** (not fnf):
   ```js
   await fetch(`${appBaseUrl}/api/generate`, {
     method: "POST",
     headers: { Authorization: `Bearer ${containerToken}` },
     body: JSON.stringify({ ... }),
   });
   ```
4. **Your `/api/generate` route** calls fnf the normal way (server-side, via the
   fnf SDK / `https://fnf.internal/*`) — the platform injects the viewer's
   credentials automatically. You write nothing special; it works because the
   platform resolved the viewer from the container token.

The token is scoped to **one user + one app** and expires in **3h**. The
container never holds a real Higgsfield/Cloudflare credential.

## 6. Results & big files

- Small results / status → the DO writes **D1** (it has `env.DB`).
- Big outputs (a video) → write to **R2** (declare `"r2": true`); the container
  reports only the **key**, and your app/DO records it in D1. Don't pass big blobs
  through HTTP bodies.

## Gotchas (read before shipping)

- **Idle-kill** — a busy-but-no-requests container sleeps unless you
  `renewActivityTimeout()` (the `tick` loop). This is the #1 mistake.
- **Ephemeral disk** — container files vanish on restart; persist via D1/R2.
- **One instance** — `max_instances` is 1; design for a single container per job
  (`getByName(jobId)`), not a pool.
- **Cold start** — the first request after idle takes a few seconds to boot; show
  a "starting…" state.
- **`port` must match** the manifest, the Dockerfile `EXPOSE`/listen, and
  `defaultPort` in `AppContainer`.
- **Don't call fnf from the container directly** — always go through your app's
  API with the container token (§5).
