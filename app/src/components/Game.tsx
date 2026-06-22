import { useEffect, useRef, useState } from "react";
import { GameCanvas, type PlacedBuilding, type LiveAgent, type RoadTool } from "./GameCanvas";
import { BuildingModal, AgentModal, ContextMenu } from "./Modals";
import {
  PROVIDERS,
  PROVIDER_ORDER,
  DOCK,
  GRID_HELP,
  type ProviderId,
} from "../game/data";

const STORAGE_KEY = "agentvillage.save.v2";

export function Game() {
  // Empty town to start: "no building, no agents".
  const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
  const [placing, setPlacing] = useState<ProviderId | null>(null);
  const [roadTool, setRoadTool] = useState<RoadTool | null>(null);
  const [roadCount, setRoadCount] = useState(0);
  const [openBuilding, setOpenBuilding] = useState<PlacedBuilding | null>(null);
  const [openAgent, setOpenAgent] = useState<ProviderId | null>(null);
  const [dockTab, setDockTab] = useState<string | null>(null);
  const [ctx, setCtx] = useState<{ b: PlacedBuilding; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // tick to force re-render of dock/HUD when agents ref changes
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  // Agents live in a ref so the rAF loop mutates them without React re-renders.
  // RULE: exactly one agent per building; agent id === building id.
  const agents = useRef<LiveAgent[]>([]);
  // Roads live in a ref (a Set of "col,row") for the same reason.
  const roads = useRef<Set<string>>(new Set());

  function persist(nextBuildings: PlacedBuilding[]) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ buildings: nextBuildings, roads: Array.from(roads.current) }),
      );
    } catch {
      /* ignore */
    }
  }

  function paintRoad(col: number, row: number, erase: boolean) {
    const key = `${col},${row}`;
    // never lay road under a building
    if (!erase && buildings.some((b) => b.col === col && b.row === row)) return;
    const before = roads.current.size;
    if (erase) roads.current.delete(key);
    else roads.current.add(key);
    if (roads.current.size !== before) {
      setRoadCount(roads.current.size);
      persist(buildings);
    }
  }

  function spawnAgent(b: PlacedBuilding) {
    const def = PROVIDERS[b.provider];
    agents.current.push({
      id: b.id,
      provider: b.provider,
      name: def.agent.name,
      art: def.agentArt,
      homeCol: b.col,
      homeRow: b.row,
      col: b.col,
      row: Math.min(15, b.row + 1),
      target: { col: b.col, row: b.row },
      state: "idle",
      speed: 1.0 + Math.random() * 0.5,
      wait: Math.random() * 2,
    });
  }

  function despawnAgent(buildingId: string) {
    agents.current = agents.current.filter((a) => a.id !== buildingId);
  }

  // load save (and reconcile agents to buildings — enforces "no building no agents")
  useEffect(() => {
    let initial: PlacedBuilding[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.buildings)) {
          initial = data.buildings.filter(
            (b: PlacedBuilding) => b && PROVIDER_ORDER.includes(b.provider),
          );
        }
        if (Array.isArray(data?.roads)) {
          roads.current = new Set(
            data.roads.filter((k: unknown): k is string => typeof k === "string"),
          );
          setRoadCount(roads.current.size);
        }
      }
    } catch {
      /* ignore */
    }
    setBuildings(initial);
    agents.current = [];
    initial.forEach(spawnAgent);
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist (buildings + roads)
  useEffect(() => {
    persist(buildings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings]);

  function showToast(t: string) {
    setToast(t);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 2200);
  }

  function place(col: number, row: number) {
    if (!placing) return;
    const def = PROVIDERS[placing];
    const b: PlacedBuilding = { id: `b-${placing}-${Date.now()}`, provider: placing, col, row };
    setBuildings((arr) => [...arr, b]);
    spawnAgent(b);
    bump();
    showToast(`${def.name} placed · ${def.agent.name} reporting for duty`);
    setPlacing(null);
  }

  // building placement and road painting are mutually exclusive tools
  function startPlacing(p: ProviderId) {
    setRoadTool(null);
    setPlacing(p);
    setDockTab(null);
  }
  function chooseRoadTool(t: RoadTool | null) {
    setPlacing(null);
    setRoadTool(t);
  }
  function clearRoads() {
    roads.current = new Set();
    setRoadCount(0);
    persist(buildings);
    showToast("All roads cleared");
  }

  function deleteBuilding(b: PlacedBuilding) {
    setBuildings((arr) => arr.filter((x) => x.id !== b.id));
    despawnAgent(b.id);
    bump();
    showToast(`${PROVIDERS[b.provider].name} removed · ${PROVIDERS[b.provider].agent.name} dismissed`);
  }

  const liveAgents = agents.current;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#8fd3ff] select-none">
      <GameCanvas
        buildings={buildings}
        agents={agents}
        roads={roads}
        placing={placing}
        roadTool={roadTool}
        onPlace={place}
        onPaintRoad={paintRoad}
        onPickBuilding={(b) => setOpenBuilding(b)}
        onPickAgent={(id) => {
          const a = agents.current.find((x) => x.id === id);
          if (a) setOpenAgent(a.provider);
        }}
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
          <Pill icon="💬" label={`${liveAgents.length} Agents`} />
          <Pill icon="🏢" label={`${buildings.length} Buildings`} />
          <Pill icon="🛣️" label={`${roadCount} Roads`} />
        </div>
      </div>

      {/* empty-state hint */}
      {buildings.length === 0 && !placing && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-black/45 px-6 py-5 backdrop-blur-md">
            <div className="text-3xl">🏗️</div>
            <p className="mt-2 font-semibold text-white">Your town is empty</p>
            <p className="mt-1 max-w-xs text-sm text-white/60">
              Open the <b>Buildings</b> dock and place a provider building. Each one you place spawns its branded AI agent.
            </p>
            <button
              onClick={() => setDockTab("buildings")}
              className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Open Buildings
            </button>
          </div>
        </div>
      )}

      {/* placing banner */}
      {placing && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white shadow-lg" style={{ background: PROVIDERS[placing].color }}>
          Click a free tile to place {PROVIDERS[placing].name} ·{" "}
          <button className="underline" onClick={() => setPlacing(null)}>
            cancel
          </button>
        </div>
      )}

      {/* road tool banner */}
      {roadTool && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 flex items-center gap-3 rounded-full border border-white/20 bg-[#5d5f68] px-5 py-2 text-sm font-semibold text-white shadow-lg">
          <span>
            {roadTool === "road" ? "🛣️ Click or drag to paint roads" : "🧽 Click or drag to erase roads"}
          </span>
          <button
            className={`rounded-full px-2 py-0.5 text-xs ${roadTool === "road" ? "bg-white text-black" : "bg-white/20"}`}
            onClick={() => chooseRoadTool("road")}
          >
            Paint
          </button>
          <button
            className={`rounded-full px-2 py-0.5 text-xs ${roadTool === "erase-road" ? "bg-white text-black" : "bg-white/20"}`}
            onClick={() => chooseRoadTool("erase-road")}
          >
            Erase
          </button>
          <button className="underline" onClick={() => chooseRoadTool(null)}>
            done
          </button>
        </div>
      )}

      {/* dock drawer */}
      {dockTab && (
        <DockDrawer
          tab={dockTab}
          buildings={buildings}
          roadCount={roadCount}
          roadTool={roadTool}
          onClose={() => setDockTab(null)}
          onPlace={startPlacing}
          onOpenAgent={(p) => {
            setOpenAgent(p);
            setDockTab(null);
          }}
          onRoadTool={chooseRoadTool}
          onClearRoads={clearRoads}
        />
      )}

      {/* bottom dock */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-3">
        <div className="flex gap-1 rounded-2xl border border-white/15 bg-black/40 p-1.5 backdrop-blur-md">
          {DOCK.map((d) => (
            <button
              key={d.id}
              onClick={() => setDockTab(dockTab === d.id ? null : d.id)}
              className={`flex w-[72px] flex-col items-center gap-1 rounded-xl px-2 py-2 transition ${
                dockTab === d.id ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <DockIcon id={d.id} fallback={d.icon} />
              <span className="text-[10px] font-medium text-white/80">{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-24 left-4 hidden max-w-xs rounded-lg bg-black/30 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur sm:block">
        {GRID_HELP}
      </div>

      {/* modals */}
      {openBuilding && (
        <BuildingModal building={openBuilding} onClose={() => setOpenBuilding(null)} onToast={showToast} />
      )}
      {openAgent && <AgentModal provider={openAgent} onClose={() => setOpenAgent(null)} />}
      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          items={[
            { label: "Open settings", onClick: () => setOpenBuilding(ctx.b) },
            { label: "Chat with agent", onClick: () => setOpenAgent(ctx.b.provider) },
            {
              label: "Duplicate",
              onClick: () => {
                const nb: PlacedBuilding = {
                  ...ctx.b,
                  id: `b-${ctx.b.provider}-${Date.now()}`,
                  col: Math.min(15, ctx.b.col + 1),
                };
                setBuildings((arr) => [...arr, nb]);
                spawnAgent(nb);
                bump();
              },
            },
            { label: "Delete", danger: true, onClick: () => deleteBuilding(ctx.b) },
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

// Dock icons: use real provider art where it makes sense, emoji otherwise.
function DockIcon({ id, fallback }: { id: string; fallback: string }) {
  if (id === "buildings") {
    return (
      <div className="flex h-7 w-7 items-center justify-center">
        <img src={PROVIDERS.openai.buildingArt} alt="" className="h-7 w-7 object-contain" />
      </div>
    );
  }
  if (id === "chat-agents") {
    return (
      <div className="flex h-7 w-7 items-center justify-center">
        <img src={PROVIDERS.anthropic.agentArt} alt="" className="h-7 w-7 object-contain" />
      </div>
    );
  }
  return <span className="flex h-7 items-center text-xl">{fallback}</span>;
}

function DockDrawer({
  tab,
  buildings,
  roadCount,
  roadTool,
  onClose,
  onPlace,
  onOpenAgent,
  onRoadTool,
  onClearRoads,
}: {
  tab: string;
  buildings: PlacedBuilding[];
  roadCount: number;
  roadTool: RoadTool | null;
  onClose: () => void;
  onPlace: (p: ProviderId) => void;
  onOpenAgent: (p: ProviderId) => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
}) {
  // which providers currently have a building (=> have a live agent)
  const placedProviders = Array.from(new Set(buildings.map((b) => b.provider)));

  return (
    <div className="absolute inset-x-0 bottom-[92px] flex justify-center px-3">
      <div className="w-[min(760px,94vw)] rounded-2xl border border-white/15 bg-[#11131c]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-white">{DOCK_TITLE[tab] ?? tab}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {tab === "buildings" && (
          <>
            <p className="mb-3 text-xs text-white/45">
              Place a provider building on the map. Each spawns exactly one branded agent — one agent per building.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PROVIDER_ORDER.map((id) => {
                const p = PROVIDERS[id];
                return (
                  <button
                    key={id}
                    onClick={() => onPlace(id)}
                    className="group rounded-xl border border-white/10 bg-white/5 p-3 text-center transition hover:border-white/30 hover:bg-white/10"
                    style={{ boxShadow: `inset 0 -2px 0 ${p.color}` }}
                  >
                    <img src={p.buildingArt} alt={p.name} className="mx-auto h-20 w-20 object-contain transition group-hover:scale-110" />
                    <div className="mt-1 truncate text-sm font-semibold text-white">{p.name}</div>
                    <div className="truncate text-[10px] text-white/45">{p.company}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "chat-agents" && (
          <>
            <p className="mb-3 text-xs text-white/45">
              These are the agents living in your town. Place a provider building to add its agent here.
            </p>
            {placedProviders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="text-3xl">💬</div>
                <p className="text-sm font-medium text-white/70">No agents yet</p>
                <p className="max-w-sm text-xs text-white/45">Place a provider building to spawn its branded chat agent.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {placedProviders.map((id) => {
                  const p = PROVIDERS[id];
                  return (
                    <button
                      key={id}
                      onClick={() => onOpenAgent(id)}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-center transition hover:border-white/30 hover:bg-white/10"
                      style={{ boxShadow: `inset 0 -2px 0 ${p.color}` }}
                    >
                      <img src={p.agentArt} alt={p.agent.name} className="mx-auto h-20 w-20 object-contain" />
                      <div className="mt-1 text-sm font-semibold text-white">{p.agent.name}</div>
                      <div className="truncate text-[10px] text-white/45">{p.agent.title}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "roads" && (
          <>
            <p className="mb-3 text-xs text-white/45">
              Paint roads tile-by-tile, or click and drag to draw a path. Roads can't be placed under buildings. Your agents stroll the town along them.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onRoadTool("road")}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  roadTool === "road"
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="text-lg">🛣️</span> Paint road
              </button>
              <button
                onClick={() => onRoadTool("erase-road")}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  roadTool === "erase-road"
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                <span className="text-lg">🧽</span> Erase road
              </button>
              <button
                onClick={() => onRoadTool(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Stop
              </button>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-white/45">{roadCount} tiles</span>
                <button
                  onClick={onClearRoads}
                  disabled={roadCount === 0}
                  className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-white/35">
              Tip: pick a tool here, then the drawer closes out of the way — paint directly on the map. Re-open Roads to switch or stop.
            </p>
          </>
        )}

        {tab !== "buildings" && tab !== "chat-agents" && tab !== "roads" && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="text-3xl">✨</div>
            <p className="text-sm font-medium capitalize text-white/75">{DOCK_TITLE[tab] ?? tab}</p>
            <p className="max-w-sm text-xs text-white/45">
              Part of the AgentVillage OS roadmap. The dock slot and data model are ready to wire up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const DOCK_TITLE: Record<string, string> = {
  "chat-agents": "Chat Agents",
  buildings: "Provider Buildings",
  workforce: "Workforce",
  integrations: "Integrations",
  marketplace: "Marketplace",
  world: "World",
};
