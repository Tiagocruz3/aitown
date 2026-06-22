// Assemble a Vercel Build Output API (v3) directory from the Vite build.
//
// Layout produced (relative to app/):
//   .vercel/output/
//     config.json                 routing: static files first, else SSR
//     static/                     <- dist/client (hashed assets)
//     functions/ssr.func/
//       .vc-config.json           Node runtime config
//       package.json              { "type": "module" }
//       index.mjs                 SSR entry (Node req/res -> fetch handler)
//       server/                   <- dist/server (server.js + chunks)
//
// Run after `vite build` (see the package.json "vercel-build" script). Vercel
// detects .vercel/output and deploys it directly — no framework inference.
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = process.cwd();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, ".vercel", "output");
const distClient = path.join(root, "dist", "client");
const distServer = path.join(root, "dist", "server");

if (!existsSync(distClient) || !existsSync(distServer)) {
  console.error("[vercel-build] dist/ not found — run the Vite build first.");
  process.exit(1);
}

// Fresh output
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// 1) Static assets (served first by the "filesystem" handler)
await cp(distClient, path.join(out, "static"), { recursive: true });

// 2) SSR function
const func = path.join(out, "functions", "ssr.func");
await mkdir(func, { recursive: true });
await cp(distServer, path.join(func, "server"), { recursive: true });
await cp(path.join(scriptDir, "vercel-ssr-entry.mjs"), path.join(func, "index.mjs"));
await writeFile(path.join(func, "package.json"), JSON.stringify({ type: "module" }) + "\n");
await writeFile(
  path.join(func, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
    },
    null,
    2,
  ) + "\n",
);

// 3) Routing — try a static file, otherwise hand off to the SSR function
await writeFile(
  path.join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/ssr" }],
    },
    null,
    2,
  ) + "\n",
);

console.log("[vercel-build] wrote", path.relative(root, out));
