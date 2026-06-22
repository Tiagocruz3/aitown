// Server-only environment access.
//
// Originally this read Cloudflare Worker bindings via `cloudflare:workers`.
// That module only exists inside the Workers runtime, so to stay portable
// (Node / Vercel as well as Cloudflare) we read from `process.env` instead.
// This app opts into NO infra (db/r2/kv all false in app.manifest.json), so
// there are no real bindings to expose — only plain env vars. On the
// Higgsfield Worker `process.env` is populated by `nodejs_compat`; on
// Node/Vercel it is the standard environment.
import process from "node:process";
// Type-only import (erased at build) — keeps the binding shapes documented
// without pulling the Cloudflare runtime module into the bundle.
import type {
  D1Database,
  DurableObjectNamespace,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";

type AppEnv = {
  DB?: D1Database;
  STORAGE?: R2Bucket;
  KV?: KVNamespace;
  CONTAINER?: DurableObjectNamespace;
  HF_ENV?: string;
  APP_SLUG?: string;
};

export function bindings(): AppEnv {
  return (process.env ?? {}) as unknown as AppEnv;
}
