import { createServerFileRoute } from "@tanstack/react-start/server";

// Plain API route (returns Response.json) — avoids the server-function
// seroval serialization layer entirely. POST /api/chat

type ChatMsg = { role: "user" | "assistant"; content: string };

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

async function handleChat(req: Request): Promise<Response> {
  let body: {
    provider?: string;
    apiKey?: string;
    apiBase?: string;
    model?: string;
    system?: string;
    messages?: ChatMsg[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ text: "", error: "Bad request body." }, { status: 200 });
  }

  const provider = body.provider ?? "";
  const apiBase = (body.apiBase ?? "").replace(/\/$/, "");
  const model = body.model ?? "";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const system = body.system ?? "";
  const key = (body.apiKey || envKey(provider)).trim();

  if (!key) return Response.json({ text: "", error: "No API key configured for this provider." });
  if (!apiBase || !model) return Response.json({ text: "", error: "Missing endpoint or model." });

  try {
    if (provider === "anthropic") {
      const res = await fetch(`${apiBase}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens: 1024, system: system || undefined, messages }),
      });
      const json = (await res.json()) as { content?: { text?: string }[]; error?: { message?: string } };
      if (!res.ok) return Response.json({ text: "", error: json?.error?.message || `HTTP ${res.status}` });
      const text = (json.content ?? []).map((c) => c.text ?? "").join("").trim();
      return Response.json({ text: text || "(empty response)" });
    }

    const headers: Record<string, string> = { "content-type": "application/json", authorization: `Bearer ${key}` };
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://agentvillage.os";
      headers["X-Title"] = "AgentVillage OS";
    }
    const msgs = system ? [{ role: "system", content: system }, ...messages] : messages;
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages: msgs }),
    });
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    if (!res.ok) return Response.json({ text: "", error: json?.error?.message || `HTTP ${res.status}` });
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    return Response.json({ text: text || "(empty response)" });
  } catch (err) {
    return Response.json({ text: "", error: (err as Error).message });
  }
}

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: ({ request }) => handleChat(request),
});
