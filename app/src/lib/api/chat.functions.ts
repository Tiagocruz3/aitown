import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side chat proxy for AgentVillage OS provider agents.
// Keeps the user's API key on the server boundary and normalizes the
// request/response shape across OpenAI-compatible and Anthropic APIs.
//
// NOTE: every handler returns a PLAIN object (never throws, never returns a
// Response) so the server-function serializer (seroval) can always encode it.

function readEnv(name: string): string {
  try {
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
    return g.process?.env?.[name] ?? "";
  } catch {
    return "";
  }
}

function envKey(provider: string): string {
  switch (provider) {
    case "openai": return readEnv("OPENAI_API_KEY");
    case "anthropic": return readEnv("ANTHROPIC_API_KEY");
    case "grok": return readEnv("XAI_API_KEY");
    case "openrouter": return readEnv("OPENROUTER_API_KEY");
    default: return "";
  }
}

// Plain string validation (no .url() — avoids zod-v4 format quirks).
const ChatInput = z.object({
  provider: z.string(),
  apiKey: z.string().default(""),
  apiBase: z.string(),
  model: z.string(),
  system: z.string().default(""),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .default([]),
});

const ModelsInput = z.object({
  provider: z.string(),
  apiKey: z.string().default(""),
  apiBase: z.string(),
});

export const listModels = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as z.infer<typeof ModelsInput>)
  .handler(async ({ data }) => {
    const key = (data.apiKey || envKey(data.provider)).trim();
    if (!key) return { models: [] as { id: string; label: string }[], error: "No API key — enter one to load models." };
    const base = data.apiBase.replace(/\/$/, "");
    if (!base) return { models: [] as { id: string; label: string }[], error: "Missing endpoint." };
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (data.provider === "anthropic") {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
      } else {
        headers["authorization"] = `Bearer ${key}`;
      }
      if (data.provider === "openrouter") {
        headers["HTTP-Referer"] = "https://agentvillage.os";
        headers["X-Title"] = "AgentVillage OS";
      }
      const res = await fetch(`${base}/models`, { method: "GET", headers });
      const json = (await res.json()) as {
        data?: { id?: string; name?: string; display_name?: string }[];
        error?: { message?: string };
      };
      if (!res.ok) return { models: [], error: json?.error?.message || `HTTP ${res.status}` };
      const raw = json.data ?? [];
      let models = raw
        .map((m) => ({ id: m.id ?? "", label: m.display_name ?? m.name ?? m.id ?? "" }))
        .filter((m) => m.id);
      if (data.provider === "openai") models = models.filter((m) => /^(gpt|o[0-9]|chatgpt)/i.test(m.id));
      else if (data.provider === "grok") models = models.filter((m) => /grok/i.test(m.id));
      models.sort((a, b) => a.id.localeCompare(b.id));
      return { models };
    } catch (err) {
      return { models: [], error: (err as Error).message };
    }
  });

export const chat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data }) => {
    const key = (data.apiKey || envKey(data.provider)).trim();
    if (!key) return { text: "", error: "No API key configured for this provider." };
    const base = data.apiBase.replace(/\/$/, "");
    if (!base || !data.model) return { text: "", error: "Missing endpoint or model." };

    try {
      if (data.provider === "anthropic") {
        const res = await fetch(`${base}/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: data.model,
            max_tokens: 1024,
            system: data.system || undefined,
            messages: data.messages,
          }),
        });
        const json = (await res.json()) as { content?: { text?: string }[]; error?: { message?: string } };
        if (!res.ok) return { text: "", error: json?.error?.message || `HTTP ${res.status}` };
        const text = (json.content ?? []).map((c) => c.text ?? "").join("").trim();
        return { text: text || "(empty response)" };
      }

      const headers: Record<string, string> = { "content-type": "application/json", authorization: `Bearer ${key}` };
      if (data.provider === "openrouter") {
        headers["HTTP-Referer"] = "https://agentvillage.os";
        headers["X-Title"] = "AgentVillage OS";
      }
      const msgs = data.system ? [{ role: "system", content: data.system }, ...data.messages] : data.messages;
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: data.model, messages: msgs }),
      });
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
      if (!res.ok) return { text: "", error: json?.error?.message || `HTTP ${res.status}` };
      const text = (json.choices?.[0]?.message?.content ?? "").trim();
      return { text: text || "(empty response)" };
    } catch (err) {
      return { text: "", error: (err as Error).message };
    }
  });
