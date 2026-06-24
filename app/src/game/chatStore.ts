// Per-agent chat history + projects, persisted to localStorage.
import type { ProviderId } from "./data";

export interface ChatMessage {
  from: "user" | "agent";
  text: string;
  image?: string; // data URL for generated images (persisted with the chat)
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface Project {
  id: string;
  name: string;
  note: string;
  createdAt: number;
}

export interface AgentStore {
  sessions: ChatSession[];
  projects: Project[];
}

const KEY = "agentvillage.agentstore.v1";

function readAll(): Partial<Record<ProviderId, AgentStore>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Partial<Record<ProviderId, AgentStore>>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Likely the quota was exceeded by large image data URLs. Keep the chats —
    // drop images from all but each provider's most-recent session, then retry;
    // if it still doesn't fit, drop every image. Text history is never lost.
    try {
      const trimmed = stripImages(all, true);
      localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      try {
        const bare = stripImages(all, false);
        localStorage.setItem(KEY, JSON.stringify(bare));
      } catch {
        /* give up — keep whatever was already stored */
      }
    }
  }
}

// Return a copy with image data URLs removed. `keepNewest` retains images in the
// first (most-recent) session of each provider, dropping them from older ones.
function stripImages(
  all: Partial<Record<ProviderId, AgentStore>>,
  keepNewest: boolean,
): Partial<Record<ProviderId, AgentStore>> {
  const out: Partial<Record<ProviderId, AgentStore>> = {};
  for (const [id, store] of Object.entries(all) as [ProviderId, AgentStore][]) {
    if (!store) continue;
    out[id] = {
      projects: store.projects,
      sessions: store.sessions.map((s, i) =>
        keepNewest && i === 0
          ? s
          : { ...s, messages: s.messages.map((m) => (m.image ? { ...m, image: undefined } : m)) },
      ),
    };
  }
  return out;
}

export function getAgentStore(id: ProviderId): AgentStore {
  const all = readAll();
  return { sessions: all[id]?.sessions ?? [], projects: all[id]?.projects ?? [] };
}

export function saveSession(id: ProviderId, session: ChatSession) {
  const all = readAll();
  const store = all[id] ?? { sessions: [], projects: [] };
  const idx = store.sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) store.sessions[idx] = session;
  else store.sessions.unshift(session);
  // cap history to 50 sessions
  store.sessions = store.sessions.slice(0, 50);
  all[id] = store;
  writeAll(all);
}

export function deleteSession(id: ProviderId, sessionId: string) {
  const all = readAll();
  const store = all[id];
  if (!store) return;
  store.sessions = store.sessions.filter((s) => s.id !== sessionId);
  all[id] = store;
  writeAll(all);
}

export function addProject(id: ProviderId, project: Project) {
  const all = readAll();
  const store = all[id] ?? { sessions: [], projects: [] };
  store.projects.unshift(project);
  all[id] = store;
  writeAll(all);
}

export function deleteProject(id: ProviderId, projectId: string) {
  const all = readAll();
  const store = all[id];
  if (!store) return;
  store.projects = store.projects.filter((p) => p.id !== projectId);
  all[id] = store;
  writeAll(all);
}

export function titleFromMessages(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.from === "user");
  if (!firstUser) return "New chat";
  const t = firstUser.text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 38) + "…" : t || "New chat";
}
