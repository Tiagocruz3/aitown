import { useState } from "react";
import { BUILDINGS, AGENT_DEFS, type BuildingKind } from "../game/data";
import type { PlacedBuilding } from "./GameCanvas";

export function BuildingModal({
  building,
  onClose,
}: {
  building: PlacedBuilding;
  onClose: () => void;
}) {
  const def = BUILDINGS[building.kind];
  const [tab, setTab] = useState(def.tabs[0]);
  const workers = AGENT_DEFS.filter((a) => a.building === building.kind);

  return (
    <Backdrop onClose={onClose}>
      <div
        className="flex h-[78vh] w-[min(880px,94vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11131c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-4 border-b border-white/10 p-5" style={{ background: `linear-gradient(90deg, ${def.color}22, transparent)` }}>
          <img src={def.art} alt={def.name} className="h-16 w-16 rounded-xl object-contain" style={{ background: "#0008" }} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white">{def.name}</h2>
            <p className="truncate text-sm text-white/60">{def.desc}</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white">✕</button>
        </div>
        {/* tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2">
          {def.tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "Overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Status" value="Operational" accent={def.color} />
                <Stat label="Level" value="3" accent={def.color} />
                <Stat label="Workers" value={String(workers.length)} accent={def.color} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-white/80">Functions</h3>
                <div className="flex flex-wrap gap-2">
                  {def.functions.map((f) => (
                    <span key={f} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "Workers" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {workers.length === 0 && <p className="text-sm text-white/50">No agents assigned yet.</p>}
              {workers.map((w) => (
                <div key={w.name} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <img src={w.art} alt={w.name} className="mx-auto h-20 w-20 object-contain" />
                  <div className="mt-1 text-sm font-semibold text-white">{w.name}</div>
                  <div className="text-xs text-white/50">{w.title}</div>
                </div>
              ))}
            </div>
          )}
          {tab !== "Overview" && tab !== "Workers" && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="text-4xl">🚧</div>
              <p className="text-sm font-medium text-white/70">{tab}</p>
              <p className="max-w-sm text-xs text-white/45">
                This panel is wired into the building's data model. Connect a provider in Town Hall to activate live {tab.toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-lg font-bold" style={{ color: accent }}>{value}</div>
    </div>
  );
}

interface ChatMsg {
  from: "user" | "agent";
  text: string;
}

export function AgentModal({
  agentRole,
  onClose,
  onAssign,
}: {
  agentRole: string;
  onClose: () => void;
  onAssign: (text: string) => void;
}) {
  const def = AGENT_DEFS.find((a) => a.role === agentRole) ?? AGENT_DEFS[0];
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: "agent", text: `Hi, I'm ${def.name} — your ${def.title}. ${def.personality} What should I work on?` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text }]);
    setBusy(true);
    onAssign(text);
    // mock AI reply (the real AI layer plugs in here later)
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          from: "agent",
          text: `On it. I'm walking to the ${BUILDINGS[def.building].name} to handle "${text}". I'll report back here when the results are ready.`,
        },
      ]);
      setBusy(false);
    }, 900);
  }

  return (
    <Backdrop onClose={onClose}>
      <div
        className="flex h-[80vh] w-[min(560px,94vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1118] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <img src={def.art} alt={def.name} className="h-12 w-12 rounded-full object-contain ring-2 ring-white/10" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white">{def.name}</h2>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">● online</span>
            </div>
            <div className="text-xs text-white/50">{def.title} · {def.model}</div>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-white/60 hover:bg-white/10 hover:text-white">✕</button>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-4 py-2">
          {def.tools.map((t) => (
            <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/55">{t}</span>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.from === "user" ? "bg-indigo-500 text-white" : "bg-white/8 text-white/90"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-xs text-white/40">{def.name} is typing…</div>}
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
              placeholder={`Assign a task to ${def.name}…`}
              className="max-h-28 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />
            <button
              onClick={send}
              disabled={busy}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

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
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#161823] py-1 shadow-2xl"
        style={{ left: x, top: y }}
      >
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.onClick();
              onClose();
            }}
            className={`block w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${
              it.danger ? "text-red-400" : "text-white/85"
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </div>
  );
}
