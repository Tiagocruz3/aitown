// Per-provider config (API key, base URL, chosen model, agent name + prompt),
// persisted locally in the browser.
import { PROVIDERS, DEFAULT_IMAGE_MODEL, type ProviderId } from "./data";

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

// The Design Image Studio's default image model (used whenever an agent is told
// to create an image). Persisted locally; falls back to the global default.
const IMG_MODEL_KEY = "agentvillage.imagemodel.v1";

// Slugs that OpenRouter has retired (kept here so a previously-saved value is
// silently migrated to the current default instead of 404ing on generation).
const DEAD_IMAGE_MODELS = new Set(["google/gemini-2.5-flash-image-preview"]);

export function getImageModel(): string {
  if (typeof window === "undefined") return DEFAULT_IMAGE_MODEL;
  try {
    const v = localStorage.getItem(IMG_MODEL_KEY);
    if (!v || DEAD_IMAGE_MODELS.has(v)) return DEFAULT_IMAGE_MODEL;
    return v;
  } catch {
    return DEFAULT_IMAGE_MODEL;
  }
}

export function setImageModel(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IMG_MODEL_KEY, id);
  } catch {
    /* ignore */
  }
}

// The effective system prompt for chat: custom override, else built from personality.
export function systemPromptOf(id: ProviderId): string {
  const def = PROVIDERS[id];
  const name = getConfig(id).agentName;
  const custom = getConfig(id).systemPrompt.trim();
  if (custom) return custom;
  return `You are ${name}, the ${def.agent.title} in AgentVillage OS. Personality: ${def.agent.personality} Be ${def.agent.voice}. Keep replies concise.`;
}
