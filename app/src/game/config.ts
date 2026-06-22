// Per-provider config (API key, base URL, chosen model, agent name + prompt),
// persisted locally in the browser.
import { PROVIDERS, type ProviderId } from "./data";

export interface ProviderConfig {
  apiKey: string;
  apiBase: string;
  model: string;
  agentName: string; // custom display name for this provider's agent
  systemPrompt: string; // custom system prompt; blank = use built-in personality
}

const KEY = "agentvillage.providerconfig.v1";

function readAll(): Partial<Record<ProviderId, Partial<ProviderConfig>>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getConfig(id: ProviderId): ProviderConfig {
  const all = readAll();
  const def = PROVIDERS[id];
  return {
    apiKey: all[id]?.apiKey ?? "",
    apiBase: all[id]?.apiBase ?? def.apiBase,
    model: all[id]?.model ?? def.defaultModel,
    agentName: all[id]?.agentName?.trim() ? all[id]!.agentName! : def.agent.name,
    systemPrompt: all[id]?.systemPrompt ?? "",
  };
}

export function setConfig(id: ProviderId, cfg: ProviderConfig) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[id] = cfg;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function hasKey(id: ProviderId): boolean {
  return getConfig(id).apiKey.trim().length > 0;
}

// The agent's effective display name (custom override or provider default).
export function agentNameOf(id: ProviderId): string {
  return getConfig(id).agentName;
}

// The effective system prompt for chat: custom override, else built from personality.
export function systemPromptOf(id: ProviderId): string {
  const def = PROVIDERS[id];
  const name = getConfig(id).agentName;
  const custom = getConfig(id).systemPrompt.trim();
  if (custom) return custom;
  return `You are ${name}, the ${def.agent.title} in AgentVillage OS. Personality: ${def.agent.personality} Be ${def.agent.voice}. Keep replies concise.`;
}
