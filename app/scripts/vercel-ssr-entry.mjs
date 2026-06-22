// Vercel Build Output API — SSR function entry (Node runtime).
//
// Bridges Vercel's Node request/response to the TanStack Start Web fetch
// handler in ./server/server.js (the production build, copied in next to this
// file by scripts/vercel-build.mjs). This is the catch-all: every request that
// isn't a static file in .vercel/output/static is routed here by config.json.
import process from "node:process";
import handler from "./server/server.js";

export default async function (req, res) {
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = `${proto}://${host}${req.url || "/"}`;
    const method = (req.method || "GET").toUpperCase();

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
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<!doctype html><h1>This page didn't load</h1>");
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
