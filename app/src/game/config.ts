// Per-provider config (API key, base URL, chosen model), persisted locally.
import { PROVIDERS, type ProviderId } from "./data";

export interface ProviderConfig {
  apiKey: string;
  apiBase: string;
  model: string;
}

const KEY = "agentvillage.providerconfig.v1";

function readAll(): Partial<Record<ProviderId, ProviderConfig>> {
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
