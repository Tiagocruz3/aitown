import { useEffect, useRef, useState } from "react";
import {
  GameCanvas,
  buildingNameOf,
  type PlacedBuilding,
  type LiveAgent,
  type RoadTool,
} from "./GameCanvas";
import { BuildingPanel, AgentPanel, TownHallPanel, FacilityPanel } from "./Panels";
import { Dock } from "./Trays";
import { FullscreenView } from "./Screens";
import { MODEL_FRAMES } from "../game/model3d";
import { ContextMenu, ConfirmModal, type ConfirmSpec } from "./Modals";
import { agentNameOf } from "../game/config";
import {
  PROVIDERS,
  PROVIDER_ORDER,
  FACILITIES,
  FACILITY_ORDER,
  TOWN_HALL,
  type DockKind,
  type ProviderId,
  type FacilityId,
} from "../game/data";

const STORAGE_KEY = "agentvillage.save.v3";

// What the user is currently placing from the dock.
type PlaceTarget =
  | { kind: "provider"; provider: ProviderId }
  | { kind: "facility"; facility: FacilityId }
  | { kind: "town-hall" }
  | null;

export function Game() {
  const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
  const [placing, setPlacing] = useState<PlaceTarget>(null);
  const [roadTool, setRoadTool] = useState<RoadTool | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [roadCount, setRoadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null); // building selected on map (shows edit toolbar)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null); // agent selected on map
  const [openBuilding, setOpenBuilding] = useState<PlacedBuilding | null>(null);
  const [openTownHall, setOpenTownHall] = useState<PlacedBuilding | null>(null);
  const [openFacility, setOpenFacility] = useState<PlacedBuilding | null>(null);
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);
  // Menu-stack navigation for the fixed dock. Empty = main menu; ["buildings"]
  // drills into the placement submenu (the only category that stays in-dock).
  const [dockPath, setDockPath] = useState<string[]>([]);
  // Full-screen management/catalog view (Workforce, Marketplace, …) or null.
  const [fullscreen, setFullscreen] = useState<DockKind | null>(null);
  // Empty tile the user clicked — highlights the square AND opens the dock there.
  const [pickedTile, setPickedTile] = useState<{ col: number; row: number } | null>(null);
  const [ctx, setCtx] = useState<{ b: PlacedBuilding; x: number; y: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmSpec & { onConfirm: () => void }) | null>(null);
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
                b &&
                (b.kind === "town-hall" ||
                  (b.kind === "facility" && !!b.facility && FACILITY_ORDER.includes(b.facility)) ||
                  PROVIDER_ORDER.includes(b.provider)),
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

  // Keep zoom on the CANVAS only — never zoom the page, so the fixed HUD can't
  // drift out of the visible (visual) viewport. Block ctrl+wheel zoom, Safari
  // pinch gestures, and ctrl +/-/0 keyboard zoom.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const onGesture = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("gesturestart", onGesture as EventListener);
    window.addEventListener("gesturechange", onGesture as EventListener);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("gesturestart", onGesture as EventListener);
      window.removeEventListener("gesturechange", onGesture as EventListener);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

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
    if (placing.kind === "facility") {
      const f = FACILITIES[placing.facility];
      const b: PlacedBuilding = {
        id: `f-${placing.facility}-${Date.now()}`,
        kind: "facility",
        provider: "openrouter", // placeholder; facilities have no chat agent
        facility: placing.facility,
        col,
        row,
      };
      setBuildings((arr) => [...arr, b]);
      bump();
      showToast(
        f.usesImageGen
          ? `${f.name} built · agents will come here to generate images`
          : `${f.name} built`,
      );
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
    setDockPath([]);
    setPickedTile(null);
  }
  function startPlacingFacility(f: FacilityId) {
    setRoadTool(null);
    setMovingId(null);
    setPlacing({ kind: "facility", facility: f });
    setDockPath([]);
    setPickedTile(null);
  }
  function startPlacingTownHall() {
    setRoadTool(null);
    setMovingId(null);
    setPlacing({ kind: "town-hall" });
    setDockPath([]);
    setPickedTile(null);
  }
  function chooseRoadTool(t: RoadTool | null) {
    setPlacing(null);
    if (t) setMovingId(null);
    setRoadTool(t);
    // Keep the dock on the Roads submenu so Paint/Erase can be toggled freely.
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
    setPickedTile(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setOpenFacility(null);
    setMovingId(b.id);
    showToast(`Moving ${buildingNameOf(b)} · click a free tile`);
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
    setOpenFacility((fb) => (fb?.id === b.id ? null : fb));
    bump();
    if (b.kind === "provider")
      showToast(`${PROVIDERS[b.provider].name} removed · ${PROVIDERS[b.provider].agent.name} dismissed`);
    else showToast(`${buildingNameOf(b)} removed`);
  }

  // Ask for confirmation via the in-game modal (no native confirm() popups).
  function confirmRemoveBuilding(b: PlacedBuilding) {
    const name = buildingNameOf(b);
    const message =
      b.kind === "town-hall"
        ? "This removes your OS control center from the town."
        : b.kind === "facility"
          ? `This removes ${name} from the town.`
          : `This dismisses ${agentNameOf(b.provider)} and removes ${name} from the town.`;
    setConfirmDialog({
      title: `Remove ${name}?`,
      message,
      confirmLabel: "Remove",
      danger: true,
      onConfirm: () => deleteBuilding(b),
    });
  }

  function confirmClearRoads() {
    if (roadCount === 0) return;
    setConfirmDialog({
      title: "Clear all roads?",
      message: `This removes all ${roadCount} road tile${roadCount === 1 ? "" : "s"} from the town.`,
      confirmLabel: "Clear all",
      danger: true,
      onConfirm: clearRoads,
    });
  }

  // Rotate a 3D-model building by one frame (and persist it).
  function rotateBuilding(b: PlacedBuilding) {
    setBuildings((arr) => {
      const next = arr.map((x) =>
        x.id === b.id ? { ...x, rot: ((x.rot ?? 0) + 1) % MODEL_FRAMES } : x,
      );
      persist(next);
      return next;
    });
    bump();
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

  // Clicking an empty tile highlights it AND opens the dock there. Clicking
  // off the grid (or another action) clears it, which hides the dock again.
  function pickTile(cell: { col: number; row: number } | null) {
    setSelectedAgentId(null);
    if (cell) {
      setPickedTile(cell);
    } else {
      setPickedTile(null);
      setDockPath([]);
    }
  }

  // Clicking an agent on the map SELECTS it — the dock becomes the agent
  // command center (Chat / Assign / Memory / Configure / Delete).
  function selectAgent(id: string) {
    setDockPath([]);
    setPickedTile(null);
    setFullscreen(null);
    setSelectedId(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setOpenFacility(null);
    setOpenAgentId(null);
    setSelectedAgentId(id);
  }
  function configureAgent(a: LiveAgent) {
    const b = buildings.find((x) => x.id === a.id);
    if (b) openBuildingById(b);
  }
  function confirmRemoveAgent(a: LiveAgent) {
    const b = buildings.find((x) => x.id === a.id);
    if (b) confirmRemoveBuilding(b);
  }

  // Clicking a building on the map just SELECTS it — the dock turns into that
  // building's command center. The full settings panel only opens via "Open".
  function selectBuilding(b: PlacedBuilding) {
    setDockPath([]);
    setPickedTile(null);
    setSelectedAgentId(null);
    setFullscreen(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setOpenFacility(null);
    setOpenAgentId(null);
    setSelectedId(b.id);
  }

  // Open a roomy full-screen management screen (AI Staff, Services, …).
  function openFullscreen(kind: DockKind) {
    setDockPath([]);
    setPickedTile(null);
    setSelectedAgentId(null);
    setSelectedId(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setOpenFacility(null);
    setOpenAgentId(null);
    setFullscreen(kind);
  }

  // open a building (route town-hall to its own panel); resets the dock
  function openBuildingById(b: PlacedBuilding) {
    setDockPath([]);
    setPickedTile(null);
    setFullscreen(null);
    setSelectedId(b.id);
    if (b.kind === "town-hall") {
      setOpenBuilding(null);
      setOpenFacility(null);
      setOpenTownHall(b);
    } else if (b.kind === "facility") {
      setOpenBuilding(null);
      setOpenTownHall(null);
      setOpenFacility(b);
    } else {
      setOpenTownHall(null);
      setOpenFacility(null);
      setOpenBuilding(b);
    }
  }

  function openAgentById(id: string) {
    setDockPath([]);
    setPickedTile(null);
    setFullscreen(null);
    setSelectedId(null);
    setOpenBuilding(null);
    setOpenTownHall(null);
    setOpenFacility(null);
    setOpenAgentId(id);
  }
  function openAgentByProvider(p: ProviderId) {
    const a = agents.current.find((x) => x.provider === p);
    if (a) openAgentById(a.id);
  }

  // Send a provider's agent on an image-generation errand: walk to the Design
  // Image Studio, "work" there, then return home — a visible symbol of the
  // generation being in progress and then complete. Returns true if it started
  // (an Image Studio building exists and the agent is on the map).
  function sendAgentToStudio(p: ProviderId): boolean {
    const studio = buildings.find((b) => b.kind === "facility" && b.facility === "image-studio");
    if (!studio) return false;
    const a = agents.current.find((x) => x.provider === p);
    if (!a) return false;
    a.errand = "to-studio";
    a.target = { col: studio.col, row: Math.min(15, studio.row + 1) };
    a.state = "walk";
    bump();
    return true;
  }
  const hasImageStudio = buildings.some(
    (b) => b.kind === "facility" && b.facility === "image-studio",
  );

  // Navigate the dock menu stack; entering a submenu closes any open surface.
  function navigateDock(path: string[]) {
    if (path.length) {
      setFullscreen(null);
      setOpenBuilding(null);
      setOpenTownHall(null);
      setOpenAgentId(null);
    }
    setDockPath(path);
  }

  const liveAgents = agents.current;
  const hasTownHall = buildings.some((b) => b.kind === "town-hall");
  const selected = buildings.find((b) => b.id === selectedId) ?? null;
  const selectedAgent = agents.current.find((a) => a.id === selectedAgentId) ?? null;
  const highlightTile = selected
    ? { col: selected.col, row: selected.row }
    : selectedAgent
      ? { col: selectedAgent.homeCol, row: selectedAgent.homeRow }
      : pickedTile;
  const openAgentProvider = openAgentId
    ? (agents.current.find((a) => a.id === openAgentId)?.provider ?? null)
    : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#8fd3ff] select-none" style={{ touchAction: "none" }}>
      <GameCanvas
        buildings={buildings}
        agents={agents}
        roads={roads}
        placingActive={!!placing}
        roadTool={roadTool}
        movingId={movingId}
        selectedTile={highlightTile}
        onPlace={place}
        onPaintRoad={paintRoad}
        onMoveTo={moveTo}
        onPickBuilding={selectBuilding}
        onPickAgent={selectAgent}
        onPickTile={pickTile}
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
      {buildings.length === 0 && !placing && dockPath.length === 0 && !selected && !fullscreen && !pickedTile && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="pointer-events-auto rounded-3xl border border-white/15 bg-black/45 px-6 py-5 backdrop-blur-md">
            <div className="text-3xl">🏗️</div>
            <p className="mt-2 font-semibold text-white">Your town is empty</p>
            <p className="mt-1 max-w-xs text-sm text-white/60">
              Open <b>Departments</b> and place the Town Hall, then add provider buildings — each one hires its branded AI agent.
            </p>
            <button
              onClick={() => navigateDock(["departments"])}
              className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Open Departments
            </button>
          </div>
        </div>
      )}

      {/* placing banner */}
      {placing && (
        <Banner
          color={
            placing.kind === "town-hall"
              ? TOWN_HALL.color
              : placing.kind === "facility"
                ? FACILITIES[placing.facility].color
                : PROVIDERS[placing.provider].color
          }
        >
          Click a free tile to place{" "}
          {placing.kind === "town-hall"
            ? "Town Hall"
            : placing.kind === "facility"
              ? FACILITIES[placing.facility].name
              : PROVIDERS[placing.provider].name}{" "}
          ·{" "}
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

      {/* ===== Dynamic dock — only appears when a square is highlighted ===== */}
      {/* Click an empty tile to open it at root, or a building for its command */}
      {/* center; otherwise the bottom stays clear. */}
      {!movingId && !fullscreen && (selected || selectedAgent || pickedTile || dockPath.length > 0) && (
        <Dock
          path={dockPath}
          onNavigate={navigateDock}
          roadCount={roadCount}
          roadTool={roadTool}
          hasTownHall={hasTownHall}
          selected={selected}
          selectedAgent={selectedAgent}
          onPlaceProvider={startPlacingProvider}
          onPlaceFacility={startPlacingFacility}
          onPlaceTownHall={startPlacingTownHall}
          onRoadTool={chooseRoadTool}
          onClearRoads={confirmClearRoads}
          onOpenFullscreen={openFullscreen}
          onOpenBuilding={openBuildingById}
          onMoveBuilding={startMoving}
          onRotateBuilding={rotateBuilding}
          onDeleteBuilding={confirmRemoveBuilding}
          onChatBuilding={(b) => openAgentByProvider(b.provider)}
          onDeselect={() => setSelectedId(null)}
          onChatAgent={(a) => openAgentById(a.id)}
          onConfigureAgent={configureAgent}
          onDeleteAgent={confirmRemoveAgent}
          onDeselectAgent={() => setSelectedAgentId(null)}
        />
      )}

      {/* ===== Full-screen management screens (Workforce, Marketplace, …) ===== */}
      {fullscreen && (
        <FullscreenView
          kind={fullscreen}
          buildings={buildings}
          agents={liveAgents}
          onOpenAgent={(id) => openAgentById(id)}
          onClose={() => setFullscreen(null)}
        />
      )}

      {/* ===== Right-side panels (building settings / town hall / agent chat) ===== */}
      {openBuilding && (
        <BuildingPanel
          building={openBuilding}
          onClose={() => setOpenBuilding(null)}
          onToast={showToast}
          onMove={() => startMoving(openBuilding)}
          onDelete={() => confirmRemoveBuilding(openBuilding)}
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
          onDelete={() => confirmRemoveBuilding(openTownHall)}
        />
      )}
      {openFacility && (
        <FacilityPanel
          building={openFacility}
          onClose={() => setOpenFacility(null)}
          onToast={showToast}
          onMove={() => startMoving(openFacility)}
          onDelete={() => confirmRemoveBuilding(openFacility)}
        />
      )}
      {openAgentProvider && (
        <AgentPanel
          provider={openAgentProvider}
          hasImageStudio={hasImageStudio}
          onImageErrand={() => sendAgentToStudio(openAgentProvider)}
          onClose={() => setOpenAgentId(null)}
        />
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          onClose={() => setCtx(null)}
          items={
            ctx.b.kind === "town-hall" || ctx.b.kind === "facility"
              ? [
                  { label: "Open", onClick: () => openBuildingById(ctx.b) },
                  { label: "Move", onClick: () => startMoving(ctx.b) },
                  { label: "Remove", danger: true, onClick: () => confirmRemoveBuilding(ctx.b) },
                ]
              : [
                  { label: "Open settings", onClick: () => openBuildingById(ctx.b) },
                  { label: "Chat with agent", onClick: () => openAgentByProvider(ctx.b.provider) },
                  { label: "Move", onClick: () => startMoving(ctx.b) },
                  { label: "Duplicate", onClick: () => duplicateBuilding(ctx.b) },
                  { label: "Remove", danger: true, onClick: () => confirmRemoveBuilding(ctx.b) },
                ]
          }
        />
      )}

      {toast && (
        <div className="absolute left-1/2 top-32 z-30 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal
          {...confirmDialog}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
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
