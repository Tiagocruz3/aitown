import { createServerFileRoute } from "@tanstack/react-start/server";

// Plain API route (returns Response.json) — POST /api/models
// Fetches the provider's real model catalog using the supplied key.

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

async function handleModels(req: Request): Promise<Response> {
  let body: { provider?: string; apiKey?: string; apiBase?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ models: [], error: "Bad request body." });
  }

  const provider = body.provider ?? "";
  const apiBase = (body.apiBase ?? "").replace(/\/$/, "");
  const key = (body.apiKey || envKey(provider)).trim();

  if (!key) return Response.json({ models: [], error: "No API key — enter one to load models." });
  if (!apiBase) return Response.json({ models: [], error: "Missing endpoint." });

  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (provider === "anthropic") {
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["authorization"] = `Bearer ${key}`;
    }
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://agentvillage.os";
      headers["X-Title"] = "AgentVillage OS";
    }

    const res = await fetch(`${apiBase}/models`, { method: "GET", headers });
    const json = (await res.json()) as {
      data?: { id?: string; name?: string; display_name?: string }[];
      error?: { message?: string };
    };
    if (!res.ok) return Response.json({ models: [], error: json?.error?.message || `HTTP ${res.status}` });

    const raw = json.data ?? [];
    let models = raw
      .map((m) => ({ id: m.id ?? "", label: m.display_name ?? m.name ?? m.id ?? "" }))
      .filter((m) => m.id);

    if (provider === "openai") models = models.filter((m) => /^(gpt|o[0-9]|chatgpt)/i.test(m.id));
    else if (provider === "grok") models = models.filter((m) => /grok/i.test(m.id));
    models.sort((a, b) => a.id.localeCompare(b.id));

    return Response.json({ models });
  } catch (err) {
    return Response.json({ models: [], error: (err as Error).message });
  }
}

export const ServerRoute = createServerFileRoute("/api/models").methods({
  POST: ({ request }) => handleModels(request),
});
