import { BrandImg } from "./Modals";
import {
  PROVIDERS,
  DOCK,
  BUILDING_LIBRARY,
  BUILDING_MODELS,
  TOWN_HALL,
  type DockKind,
  type ProviderId,
} from "../game/data";
import type { PlacedBuilding, LiveAgent, RoadTool } from "./GameCanvas";

/* ==================================================================
   DYNAMIC DOCK — a fixed-size game toolbar (SimCity / Clash style).
   The dock never grows: clicking a category REPLACES the icons inside
   the same strip with a submenu. A "Back" tile walks up the stack and a
   small breadcrumb shows where you are. No large overlay panels, the map
   stays fully visible at all times.
   ================================================================== */

// One navigable tile in the dock. Either it drills into `children`
// (replacing the dock contents) or it runs a leaf `onSelect` action.
export interface DockItem {
  id: string;
  label: string;
  emoji?: string;
  icon?: string; // rendered dock icon (png)
  art?: string; // brand art (png)
  desc?: string;
  badge?: string;
  accent?: string;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
  onSelect?: () => void;
  children?: DockItem[];
}

export function Dock({
  path,
  onNavigate,
  roadCount,
  roadTool,
  hasTownHall,
  selected,
  selectedAgent,
  onPlaceProvider,
  onPlaceTownHall,
  onRoadTool,
  onClearRoads,
  onOpenFullscreen,
  onOpenBuilding,
  onMoveBuilding,
  onRotateBuilding,
  onDeleteBuilding,
  onChatBuilding,
  onDeselect,
  onChatAgent,
  onConfigureAgent,
  onDeleteAgent,
  onDeselectAgent,
}: {
  path: string[];
  onNavigate: (path: string[]) => void;
  roadCount: number;
  roadTool: RoadTool | null;
  hasTownHall: boolean;
  selected: PlacedBuilding | null;
  selectedAgent: LiveAgent | null;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
  onOpenFullscreen: (kind: DockKind) => void;
  onOpenBuilding: (b: PlacedBuilding) => void;
  onMoveBuilding: (b: PlacedBuilding) => void;
  onRotateBuilding: (b: PlacedBuilding) => void;
  onDeleteBuilding: (b: PlacedBuilding) => void;
  onChatBuilding: (b: PlacedBuilding) => void;
  onDeselect: () => void;
  onChatAgent: (a: LiveAgent) => void;
  onConfigureAgent: (a: LiveAgent) => void;
  onDeleteAgent: (a: LiveAgent) => void;
  onDeselectAgent: () => void;
}) {
  // A selected agent turns the dock into the agent command center.
  if (selectedAgent) {
    const a = selectedAgent;
    const items: DockItem[] = [
      { id: "ag-chat", label: "Chat", emoji: "💬", onSelect: () => onChatAgent(a) },
      { id: "ag-assign", label: "Assign", emoji: "📋", badge: "soon", disabled: true },
      { id: "ag-memory", label: "Memory", emoji: "🧠", badge: "soon", disabled: true },
      { id: "ag-config", label: "Configure", emoji: "⚙️", onSelect: () => onConfigureAgent(a) },
      { id: "ag-delete", label: "Delete", emoji: "🗑️", danger: true, onSelect: () => onDeleteAgent(a) },
    ];
    return <DockBar crumbs={["AI Staff", a.name]} items={items} onBack={onDeselectAgent} />;
  }

  // When a building is selected on the map, the dock becomes its command
  // center — a self-contained context level that ignores the menu stack.
  if (selected) {
    const items = buildingActions(selected, {
      onOpenBuilding,
      onMoveBuilding,
      onRotateBuilding,
      onDeleteBuilding,
      onChatBuilding,
    });
    const name =
      selected.kind === "town-hall" ? "Town Hall" : PROVIDERS[selected.provider].name;
    return <DockBar crumbs={["Departments", name]} items={items} onBack={onDeselect} />;
  }

  const roots = buildRoots({
    roadCount,
    roadTool,
    hasTownHall,
    onPlaceProvider,
    onPlaceTownHall,
    onRoadTool,
    onClearRoads,
    onOpenFullscreen,
  });

  // Resolve the current level by walking the freshly-built tree by id, so
  // every tile reflects live game state on each render.
  let level = roots;
  const trail: DockItem[] = [];
  for (const id of path) {
    const found = level.find((i) => i.id === id);
    if (!found || !found.children) break;
    trail.push(found);
    level = found.children;
  }

  const crumbs = trail.map((t) => t.label);
  const onBack = path.length ? () => onNavigate(path.slice(0, -1)) : undefined;

  // Each tile either drills in (navigate) or fires its leaf action.
  const items: DockItem[] = level.map((node) =>
    node.children
      ? { ...node, onSelect: () => onNavigate([...path, node.id]) }
      : node,
  );

  return <DockBar crumbs={crumbs} items={items} onBack={onBack} />;
}

/* ---- The fixed dock strip ------------------------------------------------ */

function DockBar({
  crumbs,
  items,
  onBack,
}: {
  crumbs: string[];
  items: DockItem[];
  onBack?: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-1.5 px-3"
      style={{ paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* breadcrumb — small, floats above the dock, never covers the map */}
      {crumbs.length > 0 && (
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-md">
          <span className="opacity-60">🏙️</span>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="opacity-40">›</span>}
              <span className={i === crumbs.length - 1 ? "text-white" : "text-white/60"}>{c}</span>
            </span>
          ))}
        </div>
      )}

      {/* the dock — individual floating cards (no unifying background) */}
      <div className="pointer-events-auto flex max-w-[98vw] items-end gap-2.5 overflow-x-auto px-1 pb-1">
        {onBack && (
          <DockTile
            item={{ id: "__back", label: "Back", emoji: "⬅️", accent: "#94a3b8" }}
            onClick={onBack}
          />
        )}
        {items.map((item) => (
          <DockTile key={item.id} item={item} onClick={item.disabled ? undefined : item.onSelect} />
        ))}
      </div>
    </div>
  );
}

function DockTile({ item, onClick }: { item: DockItem; onClick?: () => void }) {
  const { label, emoji, icon, art, badge, accent, disabled, danger, active } = item;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={item.desc ?? label}
      className="group flex w-[80px] shrink-0 flex-col items-center gap-1"
    >
      <div
        className={`relative grid h-[72px] w-[72px] place-items-center rounded-[20px] border shadow-lg transition ${
          disabled
            ? "cursor-not-allowed border-black/5 bg-[#e7eadb]/60 opacity-55"
            : danger
              ? "border-red-300/60 bg-[#FBE9E1]/95 group-hover:-translate-y-1"
              : active
                ? "border-white/50 bg-[#FBFBEF] ring-2 ring-white/60"
                : "border-black/5 bg-[#F0F4E1]/95 group-hover:-translate-y-1 group-hover:bg-[#F6F8E8]"
        }`}
        style={accent && !disabled ? { boxShadow: `inset 0 -3px 0 ${accent}` } : undefined}
      >
        {badge && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white/80">
            {badge}
          </span>
        )}
        <Glyph emoji={emoji} icon={icon} art={art} />
      </div>
      <span className="w-full truncate text-center text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {label}
      </span>
    </button>
  );
}

function Glyph({ emoji, icon, art }: { emoji?: string; icon?: string; art?: string }) {
  const src = art ?? icon;
  if (src) {
    return <BrandImg src={src} alt="" className="h-[54px] w-[54px] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />;
  }
  return <span className="text-3xl">{emoji}</span>;
}

/* ---- Menu tree ----------------------------------------------------------- */

// Build the root dock categories. Only Buildings drills into a dock submenu
// (placement needs the map visible); every management/catalog category opens a
// roomy full-screen view instead. Rebuilt each render so tiles stay live.
function buildRoots(ctx: {
  roadCount: number;
  roadTool: RoadTool | null;
  hasTownHall: boolean;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
  onOpenFullscreen: (kind: DockKind) => void;
}): DockItem[] {
  return DOCK.map((d) => {
    const base = { id: d.id, label: d.label, icon: d.icon, emoji: d.emoji };
    // Departments drills into the in-dock placement menu (map stays visible);
    // every other category opens a full-screen view.
    if (d.id === "departments") {
      return { ...base, children: buildingsMenu(ctx) };
    }
    return { ...base, onSelect: () => ctx.onOpenFullscreen(d.id) };
  });
}

function buildingsMenu(ctx: {
  hasTownHall: boolean;
  roadCount: number;
  roadTool: RoadTool | null;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
}): DockItem[] {
  const townHall: DockItem = {
    id: "town-hall",
    label: TOWN_HALL.name,
    art: TOWN_HALL.art,
    accent: TOWN_HALL.color,
    desc: ctx.hasTownHall ? "Already in city" : "OS control center",
    disabled: ctx.hasTownHall,
    onSelect: ctx.hasTownHall ? undefined : ctx.onPlaceTownHall,
  };

  const placeable: DockItem[] = BUILDING_LIBRARY.map((b) => {
    const p = b.provider ? PROVIDERS[b.provider] : undefined;
    return {
      id: b.id,
      label: b.label,
      art: p?.buildingArt,
      emoji: b.emoji,
      accent: p?.color,
      desc: b.desc,
      badge: p ? undefined : "soon",
      disabled: !p,
      onSelect: p ? () => ctx.onPlaceProvider(b.provider!) : undefined,
    };
  });

  const roads: DockItem = {
    id: "roads",
    label: "Roads",
    emoji: "🛣️",
    desc: "Paint or erase roads on the map",
    children: [
      {
        id: "road-paint",
        label: "Paint",
        emoji: "🛣️",
        active: ctx.roadTool === "road",
        onSelect: () => ctx.onRoadTool(ctx.roadTool === "road" ? null : "road"),
      },
      {
        id: "road-erase",
        label: "Erase",
        emoji: "🧽",
        active: ctx.roadTool === "erase-road",
        onSelect: () => ctx.onRoadTool(ctx.roadTool === "erase-road" ? null : "erase-road"),
      },
      {
        id: "road-clear",
        label: `Clear (${ctx.roadCount})`,
        emoji: "🗑️",
        danger: true,
        disabled: ctx.roadCount === 0,
        onSelect: ctx.onClearRoads,
      },
    ],
  };

  return [townHall, ...placeable, roads];
}

/* ---- Selected-building command center ------------------------------------ */

function buildingActions(
  b: PlacedBuilding,
  h: {
    onOpenBuilding: (b: PlacedBuilding) => void;
    onMoveBuilding: (b: PlacedBuilding) => void;
    onRotateBuilding: (b: PlacedBuilding) => void;
    onDeleteBuilding: (b: PlacedBuilding) => void;
    onChatBuilding: (b: PlacedBuilding) => void;
  },
): DockItem[] {
  const isHall = b.kind === "town-hall";
  const is3D = b.kind === "provider" && !!BUILDING_MODELS[b.provider];
  const items: DockItem[] = [
    { id: "act-open", label: "Open", emoji: "🏢", onSelect: () => h.onOpenBuilding(b) },
  ];
  if (!isHall) {
    items.push({ id: "act-workers", label: "Workers", emoji: "👥", onSelect: () => h.onChatBuilding(b) });
    items.push({ id: "act-tools", label: "Tools", emoji: "🧰", badge: "soon", disabled: true });
  }
  items.push({ id: "act-settings", label: "Settings", emoji: "⚙️", onSelect: () => h.onOpenBuilding(b) });
  if (is3D) {
    items.push({ id: "act-rotate", label: "Rotate", emoji: "🔄", onSelect: () => h.onRotateBuilding(b) });
  }
  items.push({ id: "act-move", label: "Move", emoji: "🚚", onSelect: () => h.onMoveBuilding(b) });
  items.push({ id: "act-delete", label: "Delete", emoji: "🗑️", danger: true, onSelect: () => h.onDeleteBuilding(b) });
  return items;
}
