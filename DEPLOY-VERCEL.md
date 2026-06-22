# Deploying AgentVillage OS to Vercel

This app was built for the Higgsfield Cloudflare Worker, but it now also runs on
Vercel. The production build (`bun run build`) emits a Web-standard fetch handler
(`app/dist/server/server.js`); on Vercel a small Node function
(`app/api/index.ts`) bridges requests to that handler, and `app/dist/client` is
served as static assets. The same code still deploys on Higgsfield — these files
are inert for the Cloudflare/Vite build.

## One-time setup on Vercel

1. **Import the repo** at https://vercel.com/new → pick `Tiagocruz3/aitown`.
2. **Root Directory:** set to **`app`** (the project lives there).
3. **Framework Preset:** **Other** (the included `app/vercel.json` already sets
   the install/build/output commands, so leave the rest as detected).
4. **Environment Variables** (Project → Settings → Environment Variables) — only
   needed for *live* agent chat; without them the app runs in demo mode:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `XAI_API_KEY`        (Grok / xAI)
   - `OPENROUTER_API_KEY`
   > Note: the in-game building settings let each player paste their own key in
   > the browser too, so these server-side vars are optional fallbacks.
5. **Deploy.** Vercel runs `bun install` → `bun run build`, serves
   `dist/client`, and routes everything else to the SSR function.

## How it's wired (`app/vercel.json`)

- `buildCommand: bun run build` — typecheck + Vite build.
- `outputDirectory: dist/client` — hashed static assets served directly.
- `rewrites: /(.*) → /api/index` — any non-static path (incl. `/` and server
  functions) falls through to the SSR function. Static files are matched first,
  so assets are never rewritten.

## Auto-deploy from GitHub Actions

A workflow at `.github/workflows/deploy-vercel.yml` deploys to Vercel on every
push to `main` (and via manual "Run workflow"). It runs on a GitHub-hosted
runner and triggers a Vercel production deploy.

Add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → **Tokens** → create one |
| `VERCEL_ORG_ID` | `app/.vercel/project.json` after `vercel link`, or Team Settings → General |
| `VERCEL_PROJECT_ID` | `app/.vercel/project.json` after `vercel link`, or Project → Settings → General |

To get the two IDs quickly, run once locally from `app/`:

```bash
cd app
npx vercel@latest link      # links this folder to your Vercel project
cat .vercel/project.json     # shows orgId + projectId
```

(`.vercel/` is local-only; don't commit it.) Once the secrets are set, the
workflow handles deploys — you can use this instead of, or alongside, Vercel's
own Git integration.

## Notes

- Runs on Vercel's **Node.js** runtime (the bundle uses `node:` built-ins), not
  Edge.
- No Cloudflare infra is used (D1/R2/KV are all off), so nothing else needs
  provisioning. `app/src/lib/bindings.server.ts` reads `process.env` instead of
  the Cloudflare `cloudflare:workers` module, keeping the build portable.
- If you connect Vercel's Git integration **and** keep this workflow, you may get
  two deploys per push — pick one. The workflow is handy when you want CI to own
  deploys; the Git integration is zero-config.

