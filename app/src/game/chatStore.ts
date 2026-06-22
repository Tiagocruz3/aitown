// Per-agent chat history + projects, persisted to localStorage.
import type { ProviderId } from "./data";

export interface ChatMessage {
  from: "user" | "agent";
  text: string;
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
    /* ignore */
  }
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
