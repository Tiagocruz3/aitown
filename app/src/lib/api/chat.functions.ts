import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";

// Server-side chat proxy for AgentVillage OS provider agents.
// Keeps the user's API key on the server boundary and normalizes the
// request/response shape across OpenAI-compatible and Anthropic APIs.

const ChatInput = z.object({
  provider: z.enum(["openai", "anthropic", "grok", "openrouter"]),
  apiKey: z.string().default(""),
  apiBase: z.string().url(),
  model: z.string().min(1),
  system: z.string().default(""),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

function envKey(provider: string): string {
  // Optional server-side fallback keys (set as Worker secrets / env vars).
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY ?? "";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY ?? "";
    case "grok":
      return process.env.XAI_API_KEY ?? "";
    case "openrouter":
      return process.env.OPENROUTER_API_KEY ?? "";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
/* listModels — fetch the provider's REAL model catalog with the key   */
/* ------------------------------------------------------------------ */

const ModelsInput = z.object({
  provider: z.enum(["openai", "anthropic", "grok", "openrouter"]),
  apiKey: z.string().default(""),
  apiBase: z.string().url(),
});

// Friendlier label from a raw model id.
function prettyLabel(id: string): string {
  return id;
}

export const listModels = createServerFn({ method: "POST" })
  .inputValidator(ModelsInput)
  .handler(async ({ data }) => {
    const key = (data.apiKey || envKey(data.provider)).trim();
    if (!key) {
      return { models: [] as { id: string; label: string }[], error: "No API key — enter one to load models." };
    }
    const base = data.apiBase.replace(/\/$/, "");
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
        data?: { id?: string; name?: string }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        return { models: [], error: json?.error?.message || `HTTP ${res.status}` };
      }
      const raw = json.data ?? [];
      let models = raw
        .map((m) => ({ id: m.id ?? "", label: m.name ?? prettyLabel(m.id ?? "") }))
        .filter((m) => m.id);

      // Keep the lists relevant: OpenAI/Grok → chat models only; sort newest-ish first.
      if (data.provider === "openai") {
        models = models.filter((m) => /^(gpt|o[0-9]|chatgpt)/i.test(m.id));
      } else if (data.provider === "grok") {
        models = models.filter((m) => /grok/i.test(m.id));
      }
      models.sort((a, b) => a.id.localeCompare(b.id));
      return { models };
    } catch (err) {
      return { models: [], error: (err as Error).message };
    }
  });

export const chat = createServerFn({ method: "POST" })
  .inputValidator(ChatInput)
  .handler(async ({ data }) => {
    const key = (data.apiKey || envKey(data.provider)).trim();
    if (!key) {
      return { text: "", error: "No API key configured for this provider." };
    }

    try {
      if (data.provider === "anthropic") {
        const res = await fetch(`${data.apiBase.replace(/\/$/, "")}/messages`, {
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
        const json = (await res.json()) as {
          content?: { text?: string }[];
          error?: { message?: string };
        };
        if (!res.ok) {
          return { text: "", error: json?.error?.message || `HTTP ${res.status}` };
        }
        const text = (json.content ?? []).map((c) => c.text ?? "").join("").trim();
        return { text: text || "(empty response)" };
      }

      // OpenAI-compatible: OpenAI, xAI (Grok), OpenRouter
      const headers: Record<string, string> = {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      };
      if (data.provider === "openrouter") {
        headers["HTTP-Referer"] = "https://agentvillage.os";
        headers["X-Title"] = "AgentVillage OS";
      }
      const msgs = data.system
        ? [{ role: "system", content: data.system }, ...data.messages]
        : data.messages;
      const res = await fetch(`${data.apiBase.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: data.model, messages: msgs }),
      });
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        return { text: "", error: json?.error?.message || `HTTP ${res.status}` };
      }
      const text = (json.choices?.[0]?.message?.content ?? "").trim();
      return { text: text || "(empty response)" };
    } catch (err) {
      return { text: "", error: (err as Error).message };
    }
  });
