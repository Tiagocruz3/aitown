import { useEffect, useRef, useState } from "react";
import {
  PROVIDERS,
  PROVIDER_ORDER,
  TOWN_HALL,
  FACILITIES,
  IMAGE_MODELS,
  DEFAULT_IMAGE_MODEL,
  type ProviderId,
} from "../game/data";
import {
  getConfig,
  setConfig,
  hasKey,
  systemPromptOf,
  getImageModel,
  setImageModel,
  type ProviderConfig,
} from "../game/config";
import { chat, listModels, generateImage, listImageModels } from "../lib/api/chat.functions";
import {
  getAgentStore,
  saveSession,
  deleteSession,
  addProject,
  deleteProject,
  titleFromMessages,
  type ChatSession,
  type AgentStore,
} from "../game/chatStore";
import { BrandImg } from "./Modals";
import type { PlacedBuilding, LiveAgent } from "./GameCanvas";

type ModelOpt = { id: string; label: string };

// Client → server functions.
async function apiModels(input: { provider: string; apiKey: string; apiBase: string }): Promise<{ models: ModelOpt[]; error?: string }> {
  return listModels({ data: input });
}

async function apiChat(input: {
  provider: string;
  apiKey: string;
  apiBase: string;
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<{ text: string; error?: string }> {
  return chat({ data: input });
}

async function apiGenerateImage(input: {
  apiKey: string;
  apiBase: string;
  model: string;
  prompt: string;
}): Promise<{ image: string; text: string; error?: string }> {
  return generateImage({ data: input });
}

async function apiImageModels(input: { apiKey: string; apiBase: string }): Promise<{ models: ModelOpt[]; error?: string }> {
  return listImageModels({ data: input });
}

// Does this message read like an instruction to CREATE an image? Only then does
// the agent run off to the Design Image Studio and generate one. Kept generous
// so natural phrasings ("gen an image of a cat", "make me a logo") all trigger.
function isImageRequest(text: string): boolean {
  const t = text.toLowerCase().trim();
  // Explicit slash / prefix commands.
  if (/^\/?(image|img|imagine|draw|art|pic|photo)\b/.test(t)) return true;

  const noun =
    /\b(image|images|picture|pictures|pic|pics|photo|photos|logo|logos|artwork|illustration|illustrations|drawing|drawings|graphic|graphics|poster|posters|thumbnail|thumbnails|icon|icons|wallpaper|banner|sticker|stickers|avatar|mockup|render|renders|portrait|painting|paintings|scene|background)\b/;
  const verb =
    /\b(gen|gen\.|generate|generates|create|creates|make|makes|made|draw|draws|design|designs|render|renders|paint|paints|produce|whip up|give me|show me|build|sketch|illustrate|visuali[sz]e|imagine|picture)\b/;

  if (noun.test(t) && verb.test(t)) return true;
  // "an image of …", "picture of …", "logo for …" — noun + connector, verb optional.
  if (
    /\b(image|picture|pic|photo|logo|drawing|illustration|artwork|poster|wallpaper|render|portrait|painting|icon|banner|sticker|avatar)\s+(of|for|showing|with|that|depicting)\b/.test(
      t,
    )
  )
    return true;
  return false;
}

// Strip a leading slash-command (e.g. "/image a red fox") to the bare prompt.
function imagePromptFrom(text: string): string {
  return text.replace(/^\/(image|img|imagine|draw)\b\s*/i, "").trim() || text.trim();
}

/* ==================================================================
   Right-side slide-in shell. Never covers the city center — anchored
   to the right edge, fixed width, the world stays visible at left.
   ================================================================== */

function RightPanel({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex max-w-full p-3">
      <div
        className="pointer-events-auto flex w-[380px] max-w-[92vw] animate-[slideIn_.2s_ease-out] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0f1118] shadow-2xl"
        style={{ boxShadow: `0 20px 60px -10px ${accent}55, 0 0 0 1px #ffffff10` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ==================================================================
   Centered modal shell — used ONLY for agent chat, so chatting feels
   different from the right-edge build-settings panels. Sits in the
   middle of the screen over a dimmed backdrop for easy focus.
   ================================================================== */

function CenterModal({
  accent,
  onClose,
  children,
}: {
  accent: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-2 sm:p-5">
      <div className="absolute inset-0 bg-[#0b0d14]/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 flex h-[94vh] w-[min(1080px,97vw)] animate-[popIn_.18s_ease-out] flex-col overflow-hidden rounded-[24px] border border-white/12 bg-[#0f1118] shadow-2xl"
        style={{ boxShadow: `0 30px 90px -10px ${accent}66, 0 0 0 1px #ffffff14` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Provider building settings panel                                    */
/* ------------------------------------------------------------------ */

export function BuildingPanel({
  building,
  onClose,
  onToast,
  onMove,
  onDelete,
  onChat,
  onSaved,
}: {
  building: PlacedBuilding;
  onClose: () => void;
  onToast: (t: string) => void;
  onMove: () => void;
  onDelete: () => void;
  onChat: () => void;
  onSaved?: () => void;
}) {
  const def = PROVIDERS[building.provider];
  const [cfg, setCfg] = useState<ProviderConfig>(() => getConfig(building.provider));
  const [showKey, setShowKey] = useState(false);
  // Models are ONLY ever the live catalog pulled from the provider API — no
  // hardcoded presets. Empty until a successful connect.
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const hasApiKey = cfg.apiKey.trim().length > 0;
  const connected = testState === "ok";

  // Connect = verify the key by pulling the provider's REAL model list. A
  // non-empty live catalog is what marks the building as connected; those are
  // the only models offered for selection.
  async function connect(silent = false) {
    if (!cfg.apiKey.trim()) {
      setTestState("fail");
      setTestMsg("Enter your API key first.");
      return;
    }
    setTestState("testing");
    setLoadingModels(true);
    if (!silent) setTestMsg(null);
    setModelError(null);
    try {
      const res = await apiModels({ provider: building.provider, apiKey: cfg.apiKey, apiBase: cfg.apiBase });
      if (res.error) {
        setTestState("fail");
        setTestMsg(res.error);
        setModels([]);
      } else if (res.models?.length) {
        setModels(res.models);
        // snap the saved model onto a real one if it isn't in the live list
        if (!res.models.some((m) => m.id === cfg.model)) {
          setCfg((c) => ({ ...c, model: res.models[0].id }));
        }
        setTestState("ok");
        setTestMsg(`Connected — ${res.models.length} live models from ${def.company}.`);
      } else {
        setTestState("fail");
        setTestMsg("Connected, but the provider returned no models.");
        setModels([]);
      }
    } catch (err) {
      setTestState("fail");
      setTestMsg((err as Error).message);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }

  // Auto-connect when opening a building that already has a saved key.
  useEffect(() => {
    if (getConfig(building.provider).apiKey.trim()) connect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building.id]);

  function save() {
    setConfig(building.provider, cfg);
    onToast(`${def.name} settings saved`);
    onSaved?.();
  }

  return (
    <RightPanel accent={def.color}>
      <div className="flex items-center gap-3 border-b border-white/10 p-4" style={{ background: `linear-gradient(90deg, ${def.color}2e, transparent)` }}>
        <BrandImg src={def.buildingArt} alt={def.name} className="h-12 w-12 object-contain" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white">{def.name}</h2>
          <p className="truncate text-xs text-white/55">{def.company} · provider building</p>
        </div>
        <button onClick={onClose} className="rounded-lg px-2.5 py-1.5 text-white/55 hover:bg-white/10 hover:text-white">✕</button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <button onClick={onChat} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold" style={{ background: def.color, color: def.ink }}>
          💬 Chat {cfg.agentName}
        </button>
        <button onClick={onMove} className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85 hover:bg-white/10">✋ Move</button>
        <button
          onClick={onDelete}
          className="ml-auto rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
        >🗑</button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {(() => {
          const status: "ok" | "pending" | "fail" | "off" = connected
            ? "ok"
            : hasApiKey
              ? testState === "fail"
                ? "fail"
                : "pending"
              : "off";
          const map = {
            ok: { c: "#22c55e", t: `Connected — live ${def.company} API` },
            pending: { c: "#f59e0b", t: "Key set — click Connect to verify & load models" },
            fail: { c: "#ef4444", t: "Connection failed — check your key & endpoint" },
            off: { c: "#9ca3af", t: "Not connected — demo mode (mock replies)" },
          } as const;
          const s = map[status];
          return (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: `${s.c}55`, background: `${s.c}14` }}>
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.c, boxShadow: status === "ok" ? `0 0 8px ${s.c}` : undefined }}
              />
              <span className="font-medium text-white/85">{s.t}</span>
            </div>
          );
        })()}

        {/* Agent identity: custom name + system prompt */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3" style={{ boxShadow: `inset 0 -3px 0 ${def.color}` }}>
          <div className="flex items-center gap-2">
            <BrandImg src={def.agentArt} alt="" className="h-9 w-9 object-contain" />
            <div className="text-sm font-bold text-white">Agent identity</div>
          </div>
          <Field label="Agent name" hint="shown on the map & in chat">
            <input
              value={cfg.agentName}
              onChange={(e) => setCfg({ ...cfg, agentName: e.target.value })}
              placeholder={def.agent.name}
              spellCheck={false}
              maxLength={28}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
            />
          </Field>
          <Field label="System prompt" hint={cfg.systemPrompt.trim() ? "custom" : "using default personality"}>
            <textarea
              value={cfg.systemPrompt}
              onChange={(e) => setCfg({ ...cfg, systemPrompt: e.target.value })}
              placeholder={`e.g. You are ${cfg.agentName || def.agent.name}, a ${def.agent.title.toLowerCase()} who… (leave blank to use the built-in personality)`}
              rows={4}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white outline-none placeholder:text-white/30 focus:border-white/25"
            />
          </Field>
          {cfg.systemPrompt.trim() && (
            <button
              onClick={() => setCfg({ ...cfg, systemPrompt: "" })}
              className="text-[11px] font-semibold text-white/50 underline hover:text-white/80"
            >
              Reset to default personality
            </button>
          )}
        </div>

        <Field label="API Key" hint={`at ${hostOf(def.docsUrl)}`}>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={cfg.apiKey}
              onChange={(e) => { setCfg({ ...cfg, apiKey: e.target.value }); setTestState("idle"); setTestMsg(null); }}
              placeholder={def.apiKeyHint}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
            />
            <button onClick={() => setShowKey((s) => !s)} className="rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white/60 hover:bg-white/10">
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <Field label="API Endpoint">
          <input value={cfg.apiBase} onChange={(e) => setCfg({ ...cfg, apiBase: e.target.value })} spellCheck={false} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25" />
        </Field>

        {/* Connect — verifies the key and loads the live model list */}
        <div>
          <button
            onClick={() => connect(false)}
            disabled={testState === "testing" || !hasApiKey}
            className="w-full rounded-xl border px-3 py-2.5 text-sm font-bold transition disabled:opacity-50"
            style={{
              borderColor: testState === "ok" ? "#22c55e66" : testState === "fail" ? "#ef444466" : `${def.color}66`,
              background: testState === "ok" ? "#22c55e1f" : testState === "fail" ? "#ef44441f" : def.color,
              color: testState === "ok" || testState === "fail" ? "#fff" : def.ink,
            }}
          >
            {testState === "testing"
              ? "Connecting…"
              : testState === "ok"
                ? "✓ Connected — Reconnect"
                : testState === "fail"
                  ? "✗ Connection failed — retry"
                  : "🔌 Connect"}
          </button>
          {testMsg && (
            <p
              className="mt-1.5 break-words rounded-lg px-2.5 py-1.5 text-[11px]"
              style={{ background: testState === "ok" ? "#22c55e14" : "#ef444414", color: testState === "ok" ? "#86efac" : "#fca5a5" }}
            >
              {testMsg}
            </p>
          )}
        </div>

        <Field
          label="Model"
          hint={loadingModels ? "loading…" : models.length ? `${models.length} live models` : "needs connection"}
        >
          {models.length ? (
            <div className="relative">
              <select
                value={cfg.model}
                onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
                className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-9 text-sm text-white outline-none focus:border-white/25"
                style={{ borderColor: `${def.color}66` }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#11131c]">
                    {m.label}{m.label !== m.id ? ` — ${m.id}` : ""}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▾</span>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white/45">
              {loadingModels
                ? "Loading the provider's live models…"
                : hasApiKey
                  ? "Click Connect to load this provider's real models."
                  : "Connect your API key to load real models — no presets are used."}
            </div>
          )}
          {modelError && (
            <p className="mt-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">{modelError}</p>
          )}
        </Field>

        <p className="text-[11px] leading-relaxed text-white/40">
          Your key stays in this browser and is sent only to {def.company}'s API via a server proxy when {def.agent.name} chats or you connect. Models shown are pulled live from {def.company} — leave the key blank for demo replies.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-white/10 p-3">
        <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/10">Cancel</button>
        <button onClick={save} className="rounded-xl px-5 py-2 text-sm font-semibold" style={{ background: def.color, color: def.ink }}>Save</button>
      </div>
    </RightPanel>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-sm font-semibold text-white/80">{label}</label>
        {hint && <span className="text-[11px] text-white/35">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function hostOf(u: string) {
  try { return new URL(u).host; } catch { return u; }
}

/* ------------------------------------------------------------------ */
/* Town Hall control-center panel (right side, tabbed)                  */
/* ------------------------------------------------------------------ */

export function TownHallPanel({
  buildings,
  agents,
  onClose,
  onOpenAgent,
  onMove,
  onDelete,
}: {
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  onClose: () => void;
  onOpenAgent: (id: string) => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<string>(TOWN_HALL.tabs[0]);
  const providerBuildings = buildings.filter((b) => b.kind !== "town-hall");

  return (
    <RightPanel accent={TOWN_HALL.color}>
      <div className="flex items-center gap-3 border-b border-white/10 p-4" style={{ background: `linear-gradient(90deg, ${TOWN_HALL.color}33, transparent)` }}>
        <BrandImg src={TOWN_HALL.art} alt="Town Hall" className="h-12 w-12 object-contain" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white">Town Hall</h2>
          <p className="text-xs text-white/55">OS control center</p>
        </div>
        <button onClick={onClose} className="rounded-lg px-2.5 py-1.5 text-white/55 hover:bg-white/10 hover:text-white">✕</button>
      </div>

      {/* horizontal tab strip (keeps panel narrow) */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-white/10 px-3 py-2">
        {TOWN_HALL.tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-white text-black" : "bg-white/8 text-white/70 hover:bg-white/15"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "Dashboard" && (
          <div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Agents" value={agents.length} />
              <Stat label="Buildings" value={buildings.length} />
              <Stat label="Providers" value={new Set(providerBuildings.map((b) => b.provider)).size} />
            </div>
            <p className="mt-3 text-sm text-white/55">Build provider buildings to hire agents, paint roads, and run your AI company from this town.</p>
          </div>
        )}

        {tab === "AI Providers" && (
          <div className="grid grid-cols-2 gap-2">
            {PROVIDER_ORDER.map((id) => {
              const p = PROVIDERS[id];
              const placed = providerBuildings.some((b) => b.provider === id);
              return (
                <div key={id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" style={{ boxShadow: `inset 0 -3px 0 ${p.color}` }}>
                  <BrandImg src={p.buildingArt} alt={p.name} className="mx-auto h-12 w-12 object-contain" />
                  <div className="mt-1 text-xs font-semibold text-white">{p.company}</div>
                  <div className={`text-[10px] ${placed ? "text-emerald-300" : "text-white/40"}`}>{placed ? "● active" : "not placed"}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "Agent Registry" && (agents.length ? (
          <div className="space-y-2">
            {agents.map((a) => {
              const p = PROVIDERS[a.provider];
              return (
                <button key={a.id} onClick={() => onOpenAgent(a.id)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left hover:bg-white/10">
                  <BrandImg src={p.agentArt} alt={a.name} className="h-9 w-9 object-contain" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{a.name}</div>
                    <div className="text-[11px] text-white/45">{p.agent.title}</div>
                  </div>
                  <span className="text-xs text-white/40">chat →</span>
                </button>
              );
            })}
          </div>
        ) : <RoadmapNote label="No agents registered yet" />)}

        {tab === "Building Registry" && (providerBuildings.length ? (
          <div className="grid grid-cols-2 gap-2">
            {providerBuildings.map((b) => {
              const p = PROVIDERS[b.provider];
              return (
                <div key={b.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" style={{ boxShadow: `inset 0 -3px 0 ${p.color}` }}>
                  <BrandImg src={p.buildingArt} alt={p.name} className="mx-auto h-12 w-12 object-contain" />
                  <div className="mt-1 text-xs font-semibold text-white">{p.name}</div>
                  <div className="text-[10px] text-white/40">tile {b.col},{b.row}</div>
                </div>
              );
            })}
          </div>
        ) : <RoadmapNote label="No buildings yet" />)}

        {["Integrations", "Permissions", "Billing", "System Settings"].includes(tab) && (
          <div>
            <RoadmapNote label={tab} />
            {tab === "System Settings" && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <button onClick={onMove} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10">✋ Move Town Hall</button>
                <button onClick={onDelete} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20">🗑 Remove</button>
              </div>
            )}
          </div>
        )}
      </div>
    </RightPanel>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
      <div className="text-lg font-extrabold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}

function RoadmapNote({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
      <div className="text-3xl opacity-70">✨</div>
      <p className="text-sm font-semibold text-white/75">{label}</p>
      <p className="max-w-xs text-xs text-white/40">On the AgentVillage OS roadmap. The data model and UI slot are wired.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agent chat panel (right side, ChatGPT-style)                        */
/* ------------------------------------------------------------------ */

interface ChatMsg { from: "user" | "agent"; text: string; image?: string }

type AgentTab = "chat" | "history" | "projects" | "files" | "memory" | "tasks";

export function AgentPanel({
  provider,
  hasImageStudio = false,
  onImageErrand,
  onClose,
}: {
  provider: ProviderId;
  hasImageStudio?: boolean;
  onImageErrand?: () => boolean;
  onClose: () => void;
}) {
  const def = PROVIDERS[provider];
  const cfg = getConfig(provider);
  const live = hasKey(provider);
  const agentName = cfg.agentName;
  // Greeting personalized to the (possibly custom) agent name.
  const greeting =
    cfg.agentName === def.agent.name
      ? def.agent.greeting
      : `Hi, I'm ${agentName}, your ${def.agent.title}. Ask me anything and I'll get to work.`;
  const [tab, setTab] = useState<AgentTab>("chat");
  const [sessionId, setSessionId] = useState<string>(() => `s-${Date.now()}`);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ from: "agent", text: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [store, setStore] = useState<AgentStore>(() => getAgentStore(provider));
  const [newProject, setNewProject] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, tab]);

  // Persist the active session whenever it has real user content.
  function persistSession(messages: ChatMsg[]) {
    const hasUser = messages.some((m) => m.from === "user");
    if (!hasUser) return;
    const now = Date.now();
    const session: ChatSession = {
      id: sessionId,
      title: titleFromMessages(messages),
      createdAt: now,
      updatedAt: now,
      // Don't persist big image data URLs to localStorage — keep a placeholder.
      messages: messages.map((m) =>
        m.image ? { from: m.from, text: m.text || "🎨 (generated image)" } : { from: m.from, text: m.text },
      ),
    };
    saveSession(provider, session);
    setStore(getAgentStore(provider));
  }

  function newChat() {
    setSessionId(`s-${Date.now()}`);
    setMsgs([{ from: "agent", text: greeting }]);
    setTab("chat");
  }

  function loadSession(s: ChatSession) {
    setSessionId(s.id);
    setMsgs(s.messages.length ? s.messages : [{ from: "agent", text: greeting }]);
    setTab("chat");
  }

  function removeSession(id: string) {
    deleteSession(provider, id);
    setStore(getAgentStore(provider));
  }

  function createProject() {
    const name = newProject.trim();
    if (!name) return;
    addProject(provider, { id: `p-${Date.now()}`, name, note: "", createdAt: Date.now() });
    setNewProject("");
    setStore(getAgentStore(provider));
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...msgs, { from: "user" as const, text }];
    setMsgs(next);
    setBusy(true);

    // IMAGE INTENT: only when the user actually asks to CREATE an image. It only
    // works when a Design Image Studio is on the map AND the OpenRouter key is
    // populated — otherwise the agent explains what's missing (and never falls
    // through to the text model, which would just chat about it).
    if (isImageRequest(text)) {
      const orCfg = getConfig("openrouter");
      const orReady = orCfg.apiKey.trim().length > 0;
      if (!hasImageStudio || !orReady) {
        const fix = !hasImageStudio
          ? "place a **Design Image Studio** on the map (Departments → Design Image Studio)"
          : "add your OpenRouter API key — open the **Design Image Studio** (or OpenRouter Hub) → Settings";
        const blocked: ChatMsg[] = [
          ...next,
          {
            from: "agent" as const,
            text: `🎨 I generate images at the Design Image Studio. To switch it on, ${fix}. Once that's set, just ask and I'll make the image straight away.`,
          },
        ];
        setMsgs(blocked);
        persistSession(blocked);
        setBusy(false);
        return;
      }

      // Both ready — walk to the studio and generate immediately, no questions.
      onImageErrand?.();
      const acked = [...next, { from: "agent" as const, text: "🎨 On it — heading to the Design Image Studio to create that…" }];
      setMsgs(acked);
      try {
        const prompt = imagePromptFrom(text);
        let res = await apiGenerateImage({ apiKey: orCfg.apiKey, apiBase: orCfg.apiBase, model: getImageModel(), prompt });
        // If the saved model has no live endpoint, pick a real one and retry once.
        if (res.error && /no endpoint|not a valid model|invalid model|not found|unsupported/i.test(res.error)) {
          const live = await apiImageModels({ apiKey: orCfg.apiKey, apiBase: orCfg.apiBase });
          const pick = live.models?.find((m) => m.id === DEFAULT_IMAGE_MODEL) ?? live.models?.[0];
          if (pick) {
            setImageModel(pick.id);
            res = await apiGenerateImage({ apiKey: orCfg.apiKey, apiBase: orCfg.apiBase, model: pick.id, prompt });
          }
        }
        if (res.error) throw new Error(res.error);
        if (!res.image) throw new Error("the studio returned no image — try another image model in its settings");
        const done: ChatMsg[] = [
          ...acked,
          {
            from: "agent" as const,
            text: res.text || "Here's your image, made at the Design Image Studio.",
            image: res.image,
          },
        ];
        setMsgs(done);
        persistSession(done);
      } catch (err) {
        const done: ChatMsg[] = [
          ...acked,
          {
            from: "agent" as const,
            text: `⚠️ Couldn't generate the image: ${(err as Error).message}.`,
          },
        ];
        setMsgs(done);
        persistSession(done);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (live) {
      try {
        const data = await apiChat({
          provider,
          apiKey: cfg.apiKey,
          apiBase: cfg.apiBase,
          model: cfg.model,
          messages: next.map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), content: m.text })),
          system: systemPromptOf(provider),
        });
        if (data.error) throw new Error(data.error);
        const done = [...next, { from: "agent" as const, text: data.text || "(no response)" }];
        setMsgs(done);
        persistSession(done);
      } catch (err) {
        const done = [...next, { from: "agent" as const, text: `⚠️ Couldn't reach ${def.company}: ${(err as Error).message}. Open my building → Test connection to diagnose.` }];
        setMsgs(done);
        persistSession(done);
      } finally {
        setBusy(false);
      }
    } else {
      setTimeout(() => {
        const done = [...next, { from: "agent" as const, text: mockReply(agentName, def.agent.voice, text) }];
        setMsgs(done);
        persistSession(done);
        setBusy(false);
      }, 650);
    }
  }

  const TABS: { id: AgentTab; label: string }[] = [
    { id: "chat", label: "Chat" },
    { id: "history", label: "History" },
    { id: "projects", label: "Projects" },
    { id: "files", label: "Files" },
    { id: "memory", label: "Memory" },
    { id: "tasks", label: "Tasks" },
  ];

  return (
    <CenterModal accent={def.color} onClose={onClose}>
      <div className="flex items-center gap-3 border-b border-white/10 p-4" style={{ background: `linear-gradient(90deg, ${def.color}26, transparent)` }}>
        <div className="grid h-11 w-11 place-items-center rounded-full" style={{ background: "#0006", boxShadow: `0 0 0 2px ${def.color}55` }}>
          <BrandImg src={def.agentArt} alt={def.agent.name} className="h-10 w-10 object-contain" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white">{agentName}</h2>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: live ? "#22c55e22" : "#9ca3af22", color: live ? "#86efac" : "#cbd5e1" }}>● {live ? "live" : "demo"}</span>
          </div>
          <div className="truncate text-xs text-white/50">{def.agent.title} · {cfg.model}</div>
        </div>
        <button onClick={onClose} className="rounded-lg px-2.5 py-1.5 text-white/55 hover:bg-white/10 hover:text-white">✕</button>
      </div>

      {/* sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-white/10 px-3 py-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition ${tab === t.id ? "bg-white text-black" : "bg-white/8 text-white/65 hover:bg-white/15"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "chat" && (
        <>
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
            <span className="text-[11px] text-white/45">{titleFromMessages(msgs)}</span>
            <button onClick={newChat} className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:bg-white/15">+ New chat</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed" style={m.from === "user" ? { background: def.color, color: def.ink } : { background: "#ffffff12", color: "#f1f1f4" }}>
                    {m.text}
                    {m.image && (
                      <img
                        src={m.image}
                        alt="Generated"
                        className="mt-2 max-h-[420px] w-full rounded-xl border border-white/10 object-contain"
                      />
                    )}
                  </div>
                </div>
              ))}
              {busy && <div className="text-xs text-white/40">{agentName} is typing…</div>}
            </div>
          </div>
          <div className="border-t border-white/10 px-4 py-3">
            <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder={`Message ${agentName}…`}
                className="max-h-40 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-white/25"
              />
              <button onClick={send} disabled={busy} className="rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: def.color, color: def.ink }}>Send</button>
            </div>
            {!live && <p className="mt-2 text-center text-[11px] text-white/35">Demo mode · add an API key in {def.name}'s settings for live replies</p>}
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white/80">Chat history</span>
            <button onClick={newChat} className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:bg-white/15">+ New chat</button>
          </div>
          {store.sessions.length === 0 ? (
            <RoadmapNote label="No past chats yet — start a conversation and it saves here" />
          ) : (
            <div className="space-y-2">
              {store.sessions.map((s) => (
                <div key={s.id} className={`flex items-center gap-2 rounded-xl border p-2.5 ${s.id === sessionId ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5"}`}>
                  <button onClick={() => loadSession(s)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium text-white">{s.title}</div>
                    <div className="text-[11px] text-white/40">{s.messages.length} messages · {new Date(s.updatedAt).toLocaleDateString()}</div>
                  </button>
                  <button onClick={() => removeSession(s.id)} className="rounded-lg px-2 py-1 text-xs text-white/40 hover:bg-red-500/15 hover:text-red-300">🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex gap-2">
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
              placeholder="New project name…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
            />
            <button onClick={createProject} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: def.color, color: def.ink }}>Add</button>
          </div>
          {store.projects.length === 0 ? (
            <RoadmapNote label="No projects yet — create one to group this agent's work" />
          ) : (
            <div className="space-y-2">
              {store.projects.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="text-lg">📁</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{p.name}</div>
                    <div className="text-[11px] text-white/40">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => { deleteProject(provider, p.id); setStore(getAgentStore(provider)); }} className="rounded-lg px-2 py-1 text-xs text-white/40 hover:bg-red-500/15 hover:text-red-300">🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(tab === "files" || tab === "memory" || tab === "tasks") && (
        <div className="flex-1 overflow-y-auto p-4">
          <RoadmapNote label={tab[0].toUpperCase() + tab.slice(1)} />
        </div>
      )}
    </CenterModal>
  );
}

/* ------------------------------------------------------------------ */
/* Facility building panel (Design Image Studio / YouTube)             */
/* ------------------------------------------------------------------ */

export function FacilityPanel({
  building,
  onClose,
  onMove,
  onDelete,
  onToast,
}: {
  building: PlacedBuilding;
  onClose: () => void;
  onMove: () => void;
  onDelete: () => void;
  onToast: (t: string) => void;
}) {
  const f = FACILITIES[building.facility!];
  const [imgModel, setImgModelState] = useState(() => getImageModel());
  const [liveModels, setLiveModels] = useState<ModelOpt[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const orCfg = getConfig("openrouter");
  const orConnected = orCfg.apiKey.trim().length > 0;

  // Pull OpenRouter's LIVE image-capable models so a renamed/removed slug can't
  // leave a dead default. If the saved model isn't actually servable, snap to a
  // real one automatically (self-heals the "No endpoints found" error).
  useEffect(() => {
    if (!f.usesImageGen) return;
    let cancelled = false;
    setLoadingModels(true);
    setModelError(null);
    apiImageModels({ apiKey: orCfg.apiKey, apiBase: orCfg.apiBase })
      .then((res) => {
        if (cancelled) return;
        if (res.error) setModelError(res.error);
        const models = res.models ?? [];
        setLiveModels(models);
        if (models.length && !models.some((m) => m.id === getImageModel())) {
          const fix = models.find((m) => m.id === DEFAULT_IMAGE_MODEL) ?? models[0];
          setImgModelState(fix.id);
          setImageModel(fix.id);
        }
      })
      .catch((err) => !cancelled && setModelError((err as Error).message))
      .finally(() => !cancelled && setLoadingModels(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building.id]);

  // Prefer the live catalog; fall back to the curated static list. Always keep
  // the currently-selected model visible even if it's not in the list.
  const modelOptions: ModelOpt[] = (() => {
    const base = liveModels.length ? liveModels : IMAGE_MODELS;
    return base.some((m) => m.id === imgModel) ? base : [{ id: imgModel, label: imgModel }, ...base];
  })();

  function chooseModel(id: string) {
    setImgModelState(id);
    setImageModel(id);
    onToast(`Default image model set · ${modelOptions.find((m) => m.id === id)?.label ?? id}`);
  }

  return (
    <RightPanel accent={f.color}>
      <div
        className="flex items-center gap-3 border-b border-white/10 p-4"
        style={{ background: `linear-gradient(90deg, ${f.color}2e, transparent)` }}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: `${f.color}22` }}>
          {f.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white">{f.name}</h2>
          <p className="truncate text-xs text-white/55">Facility · 3D building</p>
        </div>
        <button onClick={onClose} className="rounded-lg px-2.5 py-1.5 text-white/55 hover:bg-white/10 hover:text-white">✕</button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <button onClick={onMove} className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85 hover:bg-white/10">✋ Move</button>
        <button onClick={onDelete} className="ml-auto rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/20">🗑 Remove</button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-sm leading-relaxed text-white/70">{f.blurb}</p>

        {f.usesImageGen ? (
          <>
            {/* OpenRouter connection status (image gen runs on the OpenRouter key) */}
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
              style={{
                borderColor: orConnected ? "#22c55e55" : "#9ca3af55",
                background: orConnected ? "#22c55e14" : "#9ca3af14",
              }}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: orConnected ? "#22c55e" : "#9ca3af", boxShadow: orConnected ? "0 0 8px #22c55e" : undefined }}
              />
              <span className="font-medium text-white/85">
                {orConnected
                  ? "Powered by your OpenRouter Hub key"
                  : "Add an OpenRouter Hub key to generate images"}
              </span>
            </div>

            <Field
              label="Default image model"
              hint={loadingModels ? "loading live models…" : liveModels.length ? `${liveModels.length} live image models` : "used when an agent is told to create an image"}
            >
              <div className="relative">
                <select
                  value={imgModel}
                  onChange={(e) => chooseModel(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-9 text-sm text-white outline-none focus:border-white/25"
                  style={{ borderColor: `${f.color}66` }}
                >
                  {modelOptions.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#11131c]">
                      {m.label}{m.label !== m.id ? ` — ${m.id}` : ""}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▾</span>
              </div>
              {modelError && (
                <p className="mt-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                  Couldn't load live models ({modelError}) — using the built-in list.
                </p>
              )}
            </Field>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-white/55">
              <p className="mb-1 font-semibold text-white/75">How it works</p>
              Ask any chat agent to <span className="text-white/80">“create an image of…”</span> and it walks here
              to generate it with the model above, then returns home — its trip is the visible sign that generation
              is in progress and then complete.
            </div>
          </>
        ) : (
          <RoadmapNote label={`${f.name} controls`} />
        )}
      </div>
    </RightPanel>
  );
}

function mockReply(name: string, voice: string, prompt: string) {
  const p = prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt;
  return `(${voice}) Got it — "${p}". I'm ${name}, and in demo mode I'm simulating a reply. Drop a real API key in my building's settings and I'll answer for real.`;
}
