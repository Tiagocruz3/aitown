import { useEffect, useRef, useState } from "react";
import { PROVIDERS, type ProviderId } from "../game/data";
import { getConfig, setConfig, hasKey, type ProviderConfig } from "../game/config";
import type { PlacedBuilding } from "./GameCanvas";

/* ------------------------------------------------------------------ */
/* Building = provider settings / configuration modal                  */
/* ------------------------------------------------------------------ */

export function BuildingModal({
  building,
  onClose,
  onToast,
}: {
  building: PlacedBuilding;
  onClose: () => void;
  onToast: (t: string) => void;
}) {
  const def = PROVIDERS[building.provider];
  const [cfg, setCfg] = useState<ProviderConfig>(() => getConfig(building.provider));
  const [showKey, setShowKey] = useState(false);
  const connected = cfg.apiKey.trim().length > 0;

  function save() {
    setConfig(building.provider, cfg);
    onToast(`${def.name} settings saved`);
    onClose();
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        className="flex max-h-[88vh] w-[min(560px,94vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11131c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-4 border-b border-white/10 p-5"
          style={{ background: `linear-gradient(90deg, ${def.color}33, transparent)` }}
        >
          <BrandImg src={def.buildingArt} alt={def.name} className="h-16 w-16 object-contain" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white">{def.name}</h2>
            <p className="truncate text-sm text-white/60">{def.company} · provider building</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* connection status */}
          <div
            className="flex items-center justify-between rounded-xl border px-4 py-3"
            style={{
              borderColor: connected ? "#22c55e55" : "#ffffff14",
              background: connected ? "#22c55e14" : "#ffffff06",
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: connected ? "#22c55e" : "#9ca3af" }}
              />
              <span className="font-medium text-white/85">
                {connected ? "Connected — live API calls enabled" : "Not connected — using mock replies"}
              </span>
            </div>
            <span className="text-xs text-white/40">{def.agent.name}</span>
          </div>

          {/* API key */}
          <Field label="API Key" hint={`Get one at ${new URL(def.docsUrl).host}`}>
            <div className="flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                value={cfg.apiKey}
                onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
                placeholder={def.apiKeyHint}
                spellCheck={false}
                autoComplete="off"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <button
                onClick={() => setShowKey((s) => !s)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white/60 hover:bg-white/10"
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {/* base URL */}
          <Field label="API Endpoint">
            <input
              value={cfg.apiBase}
              onChange={(e) => setCfg({ ...cfg, apiBase: e.target.value })}
              spellCheck={false}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            />
          </Field>

          {/* model select */}
          <Field label="Model">
            <div className="grid grid-cols-2 gap-2">
              {def.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCfg({ ...cfg, model: m.id })}
                  className="rounded-xl border px-3 py-2 text-left text-sm transition"
                  style={{
                    borderColor: cfg.model === m.id ? def.color : "#ffffff14",
                    background: cfg.model === m.id ? `${def.color}22` : "#ffffff06",
                    color: "#fff",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          <p className="text-xs leading-relaxed text-white/40">
            Your key is stored locally in this browser and sent only to {def.company}'s API through a server proxy when {def.agent.name} chats. Leave it blank to keep playing with mock replies.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/10">
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-xl px-5 py-2 text-sm font-semibold"
            style={{ background: def.color, color: def.ink }}
          >
            Save settings
          </button>
        </div>
      </div>
    </Backdrop>
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

/* ------------------------------------------------------------------ */
/* Agent = ChatGPT-style chat, branded to its provider                 */
/* ------------------------------------------------------------------ */

interface ChatMsg {
  from: "user" | "agent";
  text: string;
}

export function AgentModal({
  provider,
  onClose,
}: {
  provider: ProviderId;
  onClose: () => void;
}) {
  const def = PROVIDERS[provider];
  const cfg = getConfig(provider);
  const live = hasKey(provider);
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ from: "agent", text: def.agent.greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...msgs, { from: "user" as const, text }];
    setMsgs(next);
    setBusy(true);

    if (live) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            apiKey: cfg.apiKey,
            apiBase: cfg.apiBase,
            model: cfg.model,
            messages: next.map((m) => ({
              role: m.from === "user" ? "user" : "assistant",
              content: m.text,
            })),
            system: `You are ${def.agent.name}, the ${def.agent.title} in AgentVillage OS. Personality: ${def.agent.personality} Be ${def.agent.voice}. Keep replies concise.`,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "request failed");
        setMsgs((m) => [...m, { from: "agent", text: data.text || "(no response)" }]);
      } catch (err) {
        setMsgs((m) => [
          ...m,
          { from: "agent", text: `⚠️ Couldn't reach ${def.company} (${(err as Error).message}). Check the API key in my building's settings.` },
        ]);
      } finally {
        setBusy(false);
      }
    } else {
      // mock reply, provider-flavored
      setTimeout(() => {
        setMsgs((m) => [...m, { from: "agent", text: mockReply(def.agent.name, def.agent.voice, text) }]);
        setBusy(false);
      }, 700);
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        className="flex h-[80vh] w-[min(560px,94vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1118] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 border-b border-white/10 p-4"
          style={{ background: `linear-gradient(90deg, ${def.color}26, transparent)` }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full ring-2" style={{ background: "#0006", boxShadow: `0 0 0 2px ${def.color}55` }}>
            <BrandImg src={def.agentArt} alt={def.agent.name} className="h-11 w-11 object-contain" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white">{def.agent.name}</h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: live ? "#22c55e22" : "#9ca3af22", color: live ? "#86efac" : "#cbd5e1" }}
              >
                ● {live ? "live" : "demo"}
              </span>
            </div>
            <div className="text-xs text-white/50">
              {def.agent.title} · {def.models.find((m) => m.id === cfg.model)?.label ?? cfg.model}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm"
                style={
                  m.from === "user"
                    ? { background: def.color, color: def.ink }
                    : { background: "#ffffff12", color: "#f1f1f4" }
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-xs text-white/40">{def.agent.name} is typing…</div>}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`Message ${def.agent.name}…`}
              className="max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />
            <button
              onClick={send}
              disabled={busy}
              className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: def.color, color: def.ink }}
            >
              Send
            </button>
          </div>
          {!live && (
            <p className="mt-2 text-center text-[11px] text-white/35">
              Demo mode · add an API key in {def.name}'s settings for live replies
            </p>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

function mockReply(name: string, voice: string, prompt: string) {
  const p = prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt;
  return `(${voice}) Got it — "${p}". I'm ${name}, and in demo mode I'm simulating a reply. Drop a real API key in my building's settings and I'll answer for real.`;
}

/* ------------------------------------------------------------------ */
/* Context menu + shared bits                                          */
/* ------------------------------------------------------------------ */

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: { label: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div className="fixed z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#161823] py-1 shadow-2xl" style={{ left: x, top: y }}>
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.onClick();
              onClose();
            }}
            className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${it.danger ? "text-red-400" : "text-white/85"}`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  );
}

// Renders a cross-origin image as a normal <img>; falls back to a colored chip if it fails.
function BrandImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return <div className={className} style={{ borderRadius: 12, background: "#ffffff14" }} aria-label={alt} />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />;
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      {children}
    </div>
  );
}
