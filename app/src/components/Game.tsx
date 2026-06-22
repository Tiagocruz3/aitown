import { useEffect, useRef, useState } from "react";
import { GameCanvas, type PlacedBuilding, type LiveAgent } from "./GameCanvas";
import { BuildingModal, AgentModal, ContextMenu } from "./Modals";
import { BUILDINGS, AGENT_DEFS, DOCK, GRID_HELP, type BuildingKind } from "../game/data";

const STORAGE_KEY = "agentvillage.save.v1";

const DEFAULT_BUILDINGS: PlacedBuilding[] = [
  { id: "b-townhall", kind: "townhall", col: 8, row: 8 },
  { id: "b-socialhub", kind: "socialhub", col: 6, row: 7 },
  { id: "b-researchlab", kind: "researchlab", col: 10, row: 7 },
  { id: "b-builderworkshop", kind: "builderworkshop", col: 6, row: 10 },
  { id: "b-designstudio", kind: "designstudio", col: 10, row: 10 },
  { id: "b-salescenter", kind: "salescenter", col: 4, row: 9 },
  { id: "b-financeoffice", kind: "financeoffice", col: 12, row: 9 },
];

export function Game() {
  const [buildings, setBuildings] = useState<PlacedBuilding[]>(DEFAULT_BUILDINGS);
  const [placing, setPlacing] = useState<BuildingKind | null>(null);
  const [openBuilding, setOpenBuilding] = useState<PlacedBuilding | null>(null);
  const [openAgent, setOpenAgent] = useState<string | null>(null);
  const [dockTab, setDockTab] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ b: PlacedBuilding; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // agents live in a ref so the rAF loop mutates them without React re-renders
  const agents = useRef<LiveAgent[]>(
    AGENT_DEFS.map((d, i) => ({
      id: `a-${d.role}`,
      role: d.role,
      name: d.name,
      art: d.art,
      col: 7 + (i % 3),
      row: 8 + Math.floor(i / 3),
      target: { col: 7, row: 8 },
      state: "idle",
      speed: 1.1 + Math.random() * 0.5,
      wait: Math.random() * 2,
    })),
  );

  // load save
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.buildings)) setBuildings(data.buildings);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // persist buildings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ buildings }));
    } catch {
      /* ignore */
    }
  }, [buildings]);

  function showToast(t: string) {
    setToast(t);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 2200);
  }

  function place(col: number, row: number) {
    if (!placing) return;
    setBuildings((b) => [...b, { id: `b-${placing}-${Date.now()}`, kind: placing, col, row }]);
    showToast(`${BUILDINGS[placing].name} placed`);
    setPlacing(null);
  }

  function sendAgentTo(agentId: string, kind: BuildingKind) {
    const target = buildings.find((b) => b.kind === kind);
    const a = agents.current.find((x) => x.id === agentId);
    if (a && target) {
      a.target = { col: target.col, row: target.row };
      a.state = "walk";
      // when it arrives the loop sets idle; we flag work after a delay
      window.setTimeout(() => {
        const aa = agents.current.find((x) => x.id === agentId);
        if (aa) {
          aa.state = "work";
          aa.wait = 4;
        }
      }, 2500);
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#8fd3ff] select-none">
      <GameCanvas
        buildings={buildings}
        agents={agents}
        placing={placing}
        onPlace={place}
        onPickBuilding={(b) => setOpenBuilding(b)}
        onPickAgent={(id) => setOpenAgent(agents.current.find((a) => a.id === id)?.role ?? null)}
        onContextBuilding={(b, x, y) => setCtx({ b, x, y })}
      />

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <div className="pointer-events-auto rounded-2xl border border-white/15 bg-black/35 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏙️</span>
            <span className="font-extrabold tracking-tight text-white">AgentVillage OS</span>
          </div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <Pill icon="🤖" label={`${AGENT_DEFS.length} Agents`} />
          <Pill icon="🏢" label={`${buildings.length} Buildings`} />
          <Pill icon="💰" label="12,400" />
        </div>
      </div>

      {/* placing banner */}
      {placing && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-white/20 bg-emerald-500/90 px-5 py-2 text-sm font-semibold text-white shadow-lg">
          Click a free tile to place {BUILDINGS[placing].name} ·{" "}
          <button className="underline" onClick={() => setPlacing(null)}>cancel</button>
        </div>
      )}

      {/* dock category drawer */}
      {dockTab && (
        <DockDrawer
          tab={dockTab}
          onClose={() => setDockTab(null)}
          onPlace={(k) => {
            setPlacing(k);
            setDockTab(null);
          }}
          onOpenAgent={(role) => {
            setOpenAgent(role);
            setDockTab(null);
          }}
        />
      )}

      {/* bottom dock */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-3">
        <div className="flex gap-1 rounded-2xl border border-white/15 bg-black/40 p-1.5 backdrop-blur-md">
          {DOCK.map((d) => (
            <button
              key={d.id}
              onClick={() => setDockTab(dockTab === d.id ? null : d.id)}
              className={`flex w-[68px] flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition ${
                dockTab === d.id ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <span className="text-xl">{d.icon}</span>
              <span className="text-[10px] font-medium text-white/80">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-24 left-4 rounded-lg bg-black/30 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur">
        {GRID_HELP}
      </div>

      {/* modals */}
      {openBuilding && <BuildingModal building={openBuilding} onClose={() => setOpenBuilding(null)} />}
      {openAgent && (
        <AgentModal
          agentRole={openAgent}
          onClose={() => setOpenAgent(null)}
          onAssign={() => {
            const def = AGENT_DEFS.find((a) => a.role === openAgent);
            if (def) sendAgentTo(`a-${def.role}`, def.building);
          }}
        />
      )}
      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          items={[
            { label: "Open", onClick: () => setOpenBuilding(ctx.b) },
            { label: "Upgrade", onClick: () => showToast(`${BUILDINGS[ctx.b.kind].name} upgraded`) },
            { label: "Duplicate", onClick: () => setBuildings((b) => [...b, { ...ctx.b, id: `b-${ctx.b.kind}-${Date.now()}`, col: Math.min(15, ctx.b.col + 1) }]) },
            { label: "Delete", danger: true, onClick: () => setBuildings((b) => b.filter((x) => x.id !== ctx.b.id)) },
          ]}
        />
      )}

      {toast && (
        <div className="absolute left-1/2 top-32 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function DockDrawer({
  tab,
  onClose,
  onPlace,
  onOpenAgent,
}: {
  tab: string;
  onClose: () => void;
  onPlace: (k: BuildingKind) => void;
  onOpenAgent: (role: string) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-[88px] flex justify-center px-3">
      <div className="w-[min(720px,94vw)] rounded-2xl border border-white/15 bg-[#11131c]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold capitalize text-white">{tab}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        {tab === "buildings" && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Object.values(BUILDINGS).map((b) => (
              <button
                key={b.kind}
                onClick={() => onPlace(b.kind)}
                className="group rounded-xl border border-white/10 bg-white/5 p-2 text-center hover:border-white/30 hover:bg-white/10"
              >
                <img src={b.art} alt={b.name} className="mx-auto h-16 w-16 object-contain transition group-hover:scale-110" />
                <div className="mt-1 truncate text-xs font-medium text-white/85">{b.name}</div>
              </button>
            ))}
          </div>
        )}

        {tab === "agents" && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {AGENT_DEFS.map((a) => (
              <button
                key={a.role}
                onClick={() => onOpenAgent(a.role)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-center hover:border-white/30 hover:bg-white/10"
              >
                <img src={a.art} alt={a.name} className="mx-auto h-16 w-16 object-contain" />
                <div className="mt-1 text-xs font-medium text-white/85">{a.name}</div>
                <div className="truncate text-[10px] text-white/45">{a.title}</div>
              </button>
            ))}
          </div>
        )}

        {tab !== "buildings" && tab !== "agents" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="text-3xl">✨</div>
            <p className="text-sm font-medium text-white/75 capitalize">{tab}</p>
            <p className="max-w-sm text-xs text-white/45">
              The {tab} system is part of the AgentVillage OS roadmap. The data model and dock slot are ready — connect it from Town Hall.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
