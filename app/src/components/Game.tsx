import { useEffect, useRef, useState } from "react";
import {
  GameCanvas,
  type PlacedBuilding,
  type LiveAgent,
  type RoadTool,
} from "./GameCanvas";
import { BuildingPanel, AgentPanel, TownHallPanel } from "./Panels";
import { DockTray } from "./Trays";
import { ContextMenu, BrandImg } from "./Modals";
import { agentNameOf } from "../game/config";
import {
  PROVIDERS,
  PROVIDER_ORDER,
  DOCK,
  GRID_HELP,
  TOWN_HALL,
  type DockKind,
  type ProviderId,
} from "../game/data";

const STORAGE_KEY = "agentvillage.save.v3";

// What the user is currently placing from the dock.
type PlaceTarget = { kind: "provider"; provider: ProviderId } | { kind: "town-hall" } | null;

export function Game() {
  const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
  const [placing, setPlacing] = useState<PlaceTarget>(null);
  const [roadTool, setRoadTool] = useState<RoadTool | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [roadCount, setRoadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null); // building selected on map (shows edit toolbar)
  const [openBuilding, setOpenBuilding] = useState<PlacedBuilding | null>(null);
  const [openTownHall, setOpenTownHall] = useState<PlacedBuilding | null>(null);
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);
  const [dockModal, setDockModal] = useState<DockKind | null>(null);
  const [ctx, setCtx] = useState<{ b: PlacedBuilding; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const agents = useRef<LiveAgent[]>([]);
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
    if (b.kind !== "provider") return; // town hall has no agent
    const def = PROVIDERS[b.provider];
    agents.current.push({
      id: b.id,
      provider: b.provider,
      name: agentNameOf(b.provider),
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

  // Pull the latest (possibly custom) agent names from config into live agents.
  function syncAgentNames() {
    agents.current.forEach((a) => {
      a.name = agentNameOf(a.provider);
    });
    bump();
  }

  // load save & reconcile agents to buildings (enforces "no building, no agents")
  useEffect(() => {
    let initial: PlacedBuilding[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data?.buildings)) {
          initial = data.buildings
            .map((b: PlacedBuilding) => ({ ...b, kind: b.kind ?? "provider" }))
            .filter(
              (b: PlacedBuilding) =>
                b && (b.kind === "town-hall" || PROVIDER_ORDER.includes(b.provider)),
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

  useEffect(() => {
    persist(buildings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings]);

  function showToast(t: string) {
    setToast(t);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 2600);
  }

  function place(col: number, row: number) {
    if (!placing) return;
    if (placing.kind === "town-hall") {
      const b: PlacedBuilding = {
        id: `town-hall-${Date.now()}`,
        kind: "town-hall",
        provider: "openai",
        col,
        row,
      };
      setBuildings((arr) => [...arr, b]);
      bump();
      showToast("Town Hall built · your OS control center is live");
      setPlacing(null);
      return;
    }
    const def = PROVIDERS[placing.provider];
    const b: PlacedBuilding = {
      id: `b-${placing.provider}-${Date.now()}`,
      kind: "provider",
      provider: placing.provider,
      col,
      row,
    };
    setBuildings((arr) => [...arr, b]);
    spawnAgent(b);
    bump();
    showToast(`${def.name} placed · ${def.agent.name} reporting for duty`);
    setPlacing(null);
  }

  function startPlacingProvider(p: ProviderId) {
    setRoadTool(null);
    setMovingId(null);
    setPlacing({ kind: "provider", provider: p });
    setDockModal(null);
  }
  function startPlacingTownHall() {
    setRoadTool(null);
    setMovingId(null);
    setPlacing({ kind: "town-hall" });
    setDockModal(null);
  }
  function chooseRoadTool(t: RoadTool | null) {
    setPlacing(null);
    if (t) setMovingId(null);
    setRoadTool(t);
    if (t) setDockModal(null);
  }
  function clearRoads() {
    roads.current = new Set();
    setRoadCount(0);
    persist(buildings);
    showToast("All roads cleared");
  }

  function startMoving(b: PlacedBuilding) {
    setPlacing(null);
    setRoadTool(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setMovingId(b.id);
    showToast(
      `Moving ${b.kind === "town-hall" ? "Town Hall" : PROVIDERS[b.provider].name} · click a free tile`,
    );
  }

  function moveTo(id: string, col: number, row: number) {
    setBuildings((arr) => {
      const next = arr.map((b) => (b.id === id ? { ...b, col, row } : b));
      const a = agents.current.find((x) => x.id === id);
      if (a) {
        a.homeCol = col;
        a.homeRow = row;
        a.target = { col, row };
        a.state = "walk";
      }
      persist(next);
      return next;
    });
    setMovingId(null);
    bump();
    showToast("Building moved");
  }

  function deleteBuilding(b: PlacedBuilding) {
    setBuildings((arr) => arr.filter((x) => x.id !== b.id));
    despawnAgent(b.id);
    setMovingId((m) => (m === b.id ? null : m));
    setSelectedId((s) => (s === b.id ? null : s));
    setOpenBuilding((ob) => (ob?.id === b.id ? null : ob));
    setOpenTownHall((th) => (th?.id === b.id ? null : th));
    bump();
    if (b.kind === "town-hall") showToast("Town Hall removed");
    else
      showToast(
        `${PROVIDERS[b.provider].name} removed · ${PROVIDERS[b.provider].agent.name} dismissed`,
      );
  }

  function duplicateBuilding(b: PlacedBuilding) {
    if (b.kind === "town-hall") {
      showToast("Only one Town Hall allowed");
      return;
    }
    const nb: PlacedBuilding = {
      ...b,
      id: `b-${b.provider}-${Date.now()}`,
      col: Math.min(15, b.col + 1),
    };
    setBuildings((arr) => [...arr, nb]);
    spawnAgent(nb);
    bump();
    showToast(`${PROVIDERS[b.provider].name} duplicated`);
  }

  // open a building (route town-hall to its own panel); closes the tray
  function openBuildingById(b: PlacedBuilding) {
    setDockModal(null);
    setSelectedId(b.id);
    if (b.kind === "town-hall") {
      setOpenBuilding(null);
      setOpenTownHall(b);
    } else {
      setOpenTownHall(null);
      setOpenBuilding(b);
    }
  }

  function openAgentById(id: string) {
    setDockModal(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setOpenAgentId(id);
  }
  function openAgentByProvider(p: ProviderId) {
    const a = agents.current.find((x) => x.provider === p);
    if (a) openAgentById(a.id);
  }

  // toggle a bottom tray; opening one closes any right panel
  function toggleTray(kind: DockKind) {
    setDockModal((cur) => {
      const next = cur === kind ? null : kind;
      if (next) {
        setOpenBuilding(null);
        setOpenTownHall(null);
        setOpenAgentId(null);
      }
      return next;
    });
  }

  const liveAgents = agents.current;
  const hasTownHall = buildings.some((b) => b.kind === "town-hall");
  const selected = buildings.find((b) => b.id === selectedId) ?? null;
  const openAgentProvider = openAgentId
    ? (agents.current.find((a) => a.id === openAgentId)?.provider ?? null)
    : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#8fd3ff] select-none">
      <GameCanvas
        buildings={buildings}
        agents={agents}
        roads={roads}
        placingActive={!!placing}
        roadTool={roadTool}
        movingId={movingId}
        onPlace={place}
        onPaintRoad={paintRoad}
        onMoveTo={moveTo}
        onPickBuilding={openBuildingById}
        onPickAgent={openAgentById}
        onDeselect={() => setSelectedId(null)}
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
      {buildings.length === 0 && !placing && !dockModal && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="pointer-events-auto rounded-3xl border border-white/15 bg-black/45 px-6 py-5 backdrop-blur-md">
            <div className="text-3xl">🏗️</div>
            <p className="mt-2 font-semibold text-white">Your town is empty</p>
            <p className="mt-1 max-w-xs text-sm text-white/60">
              Open <b>Buildings</b> and place the Town Hall, then add provider buildings — each one hires its branded AI agent.
            </p>
            <button
              onClick={() => toggleTray("buildings")}
              className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Open Buildings
            </button>
          </div>
        </div>
      )}

      {/* placing banner */}
      {placing && (
        <Banner
          color={placing.kind === "town-hall" ? TOWN_HALL.color : PROVIDERS[placing.provider].color}
        >
          Click a free tile to place{" "}
          {placing.kind === "town-hall" ? "Town Hall" : PROVIDERS[placing.provider].name} ·{" "}
          <button className="underline" onClick={() => setPlacing(null)}>
            cancel
          </button>
        </Banner>
      )}

      {/* move mode banner */}
      {movingId && (
        <Banner color="#4f46e5">
          ✋ Click a free tile to drop the building ·{" "}
          <button className="underline" onClick={() => setMovingId(null)}>
            cancel
          </button>
        </Banner>
      )}

      {/* road tool banner */}
      {roadTool && (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 flex items-center gap-3 rounded-full border border-white/20 bg-[#5d5f68] px-5 py-2 text-sm font-semibold text-white shadow-lg">
          <span>{roadTool === "road" ? "🛣️ Click or drag to paint roads" : "🧽 Click or drag to erase roads"}</span>
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

      {/* selected-building info card (top-left, Town Star style) */}
      {selected && !movingId && (
        <BuildingInfoCard
          building={selected}
          onOpen={() => openBuildingById(selected)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Town Star-style edit toolbar for the selected building (Open / Move / Remove) */}
      {selected && !movingId && (
        <EditToolbar
          building={selected}
          onOpen={() => openBuildingById(selected)}
          onMove={() => startMoving(selected)}
          onDuplicate={() => duplicateBuilding(selected)}
          onRemove={() => {
            const name = selected.kind === "town-hall" ? "Town Hall" : PROVIDERS[selected.provider].name;
            if (confirm(`Remove ${name}?`)) deleteBuilding(selected);
          }}
        />
      )}

      {/* ===== Town Star-style floating bottom dock (the launcher) ===== */}
      {/* Hidden while a tray is open — the tray becomes the dock. */}
      {!selected && !dockModal && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3">
          <div className="flex max-w-[96vw] items-end gap-2 overflow-x-auto rounded-[26px] border border-black/5 bg-[#11131c]/55 p-2 backdrop-blur-md">
            {DOCK.map((d) => {
              const active =
                dockModal === d.id || (d.id === "buildings" && (!!roadTool || placing?.kind === "town-hall"));
              return (
                <button
                  key={d.id}
                  onClick={() => toggleTray(d.id)}
                  className="group flex shrink-0 flex-col items-center gap-1"
                >
                  <div
                    className={`grid h-[68px] w-[68px] place-items-center rounded-[20px] border transition ${
                      active
                        ? "border-white/40 bg-[#FBFBEF] shadow-lg"
                        : "border-black/5 bg-[#F0F4E1]/90 shadow-md group-hover:-translate-y-1 group-hover:bg-[#F6F8E8]"
                    }`}
                  >
                    <DockIcon icon={d.icon} emoji={d.emoji} />
                  </div>
                  <span className="text-[11px] font-semibold text-white drop-shadow">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* hint */}
      <div className="pointer-events-none absolute bottom-28 left-4 hidden max-w-xs rounded-lg bg-black/30 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur sm:block">
        {GRID_HELP}
      </div>

      {/* ===== Bottom tray (the dock expands upward into this) ===== */}
      {dockModal && (
        <DockTray
          kind={dockModal}
          buildings={buildings}
          agents={liveAgents}
          roadCount={roadCount}
          roadTool={roadTool}
          hasTownHall={hasTownHall}
          onClose={() => setDockModal(null)}
          onPlaceProvider={startPlacingProvider}
          onPlaceTownHall={startPlacingTownHall}
          onOpenAgent={(id) => openAgentById(id)}
          onRoadTool={chooseRoadTool}
          onClearRoads={clearRoads}
        />
      )}

      {/* ===== Right-side panels (building settings / town hall / agent chat) ===== */}
      {openBuilding && (
        <BuildingPanel
          building={openBuilding}
          onClose={() => setOpenBuilding(null)}
          onToast={showToast}
          onMove={() => startMoving(openBuilding)}
          onDelete={() => deleteBuilding(openBuilding)}
          onChat={() => openAgentByProvider(openBuilding.provider)}
          onSaved={syncAgentNames}
        />
      )}
      {openTownHall && (
        <TownHallPanel
          buildings={buildings}
          agents={liveAgents}
          onClose={() => setOpenTownHall(null)}
          onOpenAgent={(id) => openAgentById(id)}
          onMove={() => startMoving(openTownHall)}
          onDelete={() => deleteBuilding(openTownHall)}
        />
      )}
      {openAgentProvider && (
        <AgentPanel provider={openAgentProvider} onClose={() => setOpenAgentId(null)} />
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          items={
            ctx.b.kind === "town-hall"
              ? [
                  { label: "Open", onClick: () => openBuildingById(ctx.b) },
                  { label: "Move", onClick: () => startMoving(ctx.b) },
                  { label: "Remove", danger: true, onClick: () => deleteBuilding(ctx.b) },
                ]
              : [
                  { label: "Open settings", onClick: () => openBuildingById(ctx.b) },
                  { label: "Chat with agent", onClick: () => openAgentByProvider(ctx.b.provider) },
                  { label: "Move", onClick: () => startMoving(ctx.b) },
                  { label: "Duplicate", onClick: () => duplicateBuilding(ctx.b) },
                  { label: "Remove", danger: true, onClick: () => deleteBuilding(ctx.b) },
                ]
          }
        />
      )}

      {toast && (
        <div className="absolute left-1/2 top-32 z-30 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Banner({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white shadow-lg"
      style={{ background: color }}
    >
      {children}
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

function DockIcon({ icon, emoji }: { icon: string; emoji: string }) {
  const [ok, setOk] = useState(true);
  if (icon && ok) {
    return (
      <img
        src={icon}
        alt=""
        className="h-[52px] w-[52px] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]"
        onError={() => setOk(false)}
      />
    );
  }
  return <span className="text-3xl">{emoji}</span>;
}

/* Town Star-style top-left building info card */
function BuildingInfoCard({
  building,
  onOpen,
  onClose,
}: {
  building: PlacedBuilding;
  onOpen: () => void;
  onClose: () => void;
}) {
  const isHall = building.kind === "town-hall";
  const name = isHall ? "Town Hall" : PROVIDERS[building.provider].name;
  const sub = isHall ? "OS control center" : PROVIDERS[building.provider].company;
  const art = isHall ? TOWN_HALL.art : PROVIDERS[building.provider].buildingArt;
  const agent = isHall ? null : agentNameOf(building.provider);
  const color = isHall ? TOWN_HALL.color : PROVIDERS[building.provider].color;
  return (
    <div className="absolute left-4 top-20 z-20 w-[260px] rounded-2xl bg-[#F0F4E1]/95 p-3 shadow-xl backdrop-blur">
      <div className="flex items-start gap-3">
        <BrandImg src={art} alt={name} className="h-14 w-14 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold leading-tight text-[#2a2f1e]">{name}</div>
          <div className="truncate text-xs font-medium text-[#5b6047]">{sub}</div>
        </div>
        <button onClick={onClose} className="text-[#5b6047] hover:text-[#2a2f1e]">
          ✕
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        <StatBar icon="🤖" value={isHall ? "Control center" : `${agent} on duty`} color={color} />
        <StatBar icon="📍" value={`Tile ${building.col}, ${building.row}`} />
      </div>
      <button
        onClick={onOpen}
        className="mt-2.5 w-full rounded-xl py-2 text-sm font-bold text-white shadow"
        style={{ background: color }}
      >
        {isHall ? "Open Town Hall" : "Open settings"}
      </button>
    </div>
  );
}

function StatBar({ icon, value, color }: { icon: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <div
        className="flex-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2a2f1e] shadow-inner"
        style={color ? { boxShadow: `inset 0 0 0 1.5px ${color}55` } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/* Town Star-style edit toolbar (bottom center): Open / Move / Duplicate / Remove */
function EditToolbar({
  building,
  onOpen,
  onMove,
  onDuplicate,
  onRemove,
}: {
  building: PlacedBuilding;
  onOpen: () => void;
  onMove: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const isHall = building.kind === "town-hall";
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-3">
      <div className="flex items-end gap-2 rounded-[24px] border border-black/5 bg-[#11131c]/55 p-2 backdrop-blur-md">
        <ToolCard emoji="⚙️" label="Open" onClick={onOpen} />
        <ToolCard emoji="✋" label="Move" onClick={onMove} />
        {!isHall && <ToolCard emoji="➕" label="Duplicate" onClick={onDuplicate} />}
        <ToolCard emoji="💣" label="Remove" danger onClick={onRemove} />
      </div>
    </div>
  );
}

function ToolCard({
  emoji,
  label,
  danger,
  onClick,
}: {
  emoji: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-1">
      <div
        className={`grid h-[64px] w-[64px] place-items-center rounded-[20px] border shadow-md transition group-hover:-translate-y-1 ${
          danger ? "border-red-300/60 bg-[#FBE9E1]/95" : "border-black/5 bg-[#F0F4E1]/95"
        }`}
      >
        <span className="text-3xl">{emoji}</span>
      </div>
      <span className="text-[11px] font-semibold text-white drop-shadow">{label}</span>
    </button>
  );
}
