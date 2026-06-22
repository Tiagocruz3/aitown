// Vercel serverless function (Node runtime) — hosts the TanStack Start SSR app.
//
// The production build emits a Web-standard fetch handler at
// dist/server/server.js (`export default { fetch(request, env, ctx) }`). This
// function bridges Vercel's Node request/response to that handler, so the same
// bundle that runs on the Higgsfield Cloudflare Worker also runs on Vercel.
//
// Static assets in dist/client are served directly by Vercel (see vercel.json);
// every other request is rewritten here and rendered by the SSR handler.
import type { IncomingMessage, ServerResponse } from "node:http";
import process from "node:process";
// Built at deploy time by `bun run build` (runs before functions are bundled).
import handler from "../dist/server/server.js";

export const config = {
  // We need the raw request body for POST server functions — never pre-parsed.
  api: { bodyParser: false },
};

export default async function (req: IncomingMessage, res: ServerResponse) {
  try {
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost";
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const url = `${proto}://${host}${req.url ?? "/"}`;
    const method = (req.method ?? "GET").toUpperCase();

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
      else headers.set(k, v);
    }

    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await readBody(req) : undefined;

    const request = new Request(url, {
      method,
      headers,
      body: body && body.length ? body : undefined,
    });

    const response = await handler.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<!doctype html><h1>This page didn't load</h1>");
  }
}

// Read the raw request stream. @vercel/node may surface a pre-read body on
// req.body; honour it if present, otherwise drain the stream ourselves.
function readBody(req: IncomingMessage): Promise<Buffer> {
  const pre = (req as unknown as { body?: unknown }).body;
  if (pre != null) {
    if (Buffer.isBuffer(pre)) return Promise.resolve(pre);
    if (typeof pre === "string") return Promise.resolve(Buffer.from(pre));
    return Promise.resolve(Buffer.from(JSON.stringify(pre)));
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
