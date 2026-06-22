import { BrandImg } from "./Modals";
import {
  PROVIDERS,
  DOCK,
  AGENT_LIBRARY,
  BUILDING_LIBRARY,
  WORKFLOWS,
  INTEGRATIONS,
  MISSION_SECTIONS,
  ASSET_SECTIONS,
  MARKETPLACE_SECTIONS,
  WORLD_SECTIONS,
  TOWN_HALL,
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
  buildings,
  agents,
  roadCount,
  roadTool,
  hasTownHall,
  placing,
  selected,
  onPlaceProvider,
  onPlaceTownHall,
  onOpenAgent,
  onRoadTool,
  onClearRoads,
  onOpenBuilding,
  onMoveBuilding,
  onDuplicateBuilding,
  onDeleteBuilding,
  onChatBuilding,
  onDeselect,
}: {
  path: string[];
  onNavigate: (path: string[]) => void;
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  roadCount: number;
  roadTool: RoadTool | null;
  hasTownHall: boolean;
  placing: boolean;
  selected: PlacedBuilding | null;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onOpenAgent: (id: string) => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
  onOpenBuilding: (b: PlacedBuilding) => void;
  onMoveBuilding: (b: PlacedBuilding) => void;
  onDuplicateBuilding: (b: PlacedBuilding) => void;
  onDeleteBuilding: (b: PlacedBuilding) => void;
  onChatBuilding: (b: PlacedBuilding) => void;
  onDeselect: () => void;
}) {
  // When a building is selected on the map, the dock becomes its command
  // center — a self-contained context level that ignores the menu stack.
  if (selected) {
    const items = buildingActions(selected, {
      onOpenBuilding,
      onMoveBuilding,
      onDuplicateBuilding,
      onDeleteBuilding,
      onChatBuilding,
      onDeselect,
    });
    const name =
      selected.kind === "town-hall" ? "Town Hall" : PROVIDERS[selected.provider].name;
    return <DockBar crumbs={["Buildings", name]} items={items} onBack={onDeselect} />;
  }

  const roots = buildRoots({
    buildings,
    agents,
    roadCount,
    roadTool,
    hasTownHall,
    placing,
    onPlaceProvider,
    onPlaceTownHall,
    onOpenAgent,
    onRoadTool,
    onClearRoads,
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-3">
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

      {/* the dock — fixed height, horizontal scroll on overflow, never grows up */}
      <div className="pointer-events-auto flex max-w-[96vw] items-end gap-2 overflow-x-auto rounded-[26px] border border-black/5 bg-[#11131c]/55 p-2 backdrop-blur-md">
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
      className="group flex w-[76px] shrink-0 flex-col items-center gap-1"
    >
      <div
        className={`relative grid h-[68px] w-[68px] place-items-center rounded-[20px] border shadow-md transition ${
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
      <span className="w-full truncate text-center text-[11px] font-semibold text-white drop-shadow">
        {label}
      </span>
    </button>
  );
}

function Glyph({ emoji, icon, art }: { emoji?: string; icon?: string; art?: string }) {
  const src = art ?? icon;
  if (src) {
    return <BrandImg src={src} alt="" className="h-[52px] w-[52px] object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />;
  }
  return <span className="text-3xl">{emoji}</span>;
}

/* ---- Menu tree ----------------------------------------------------------- */

// Build the root dock categories with their (live) submenus. Rebuilt on every
// render so tiles always reflect current buildings / agents / road state.
function buildRoots(ctx: {
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  roadCount: number;
  roadTool: RoadTool | null;
  hasTownHall: boolean;
  placing: boolean;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onOpenAgent: (id: string) => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
}): DockItem[] {
  const childrenFor: Record<string, DockItem[]> = {
    agents: agentsMenu(ctx),
    buildings: buildingsMenu(ctx),
    workflows: soonTiles(WORKFLOWS),
    integrations: integrationsMenu(),
    workforce: workforceMenu(ctx),
    missions: soonSections(MISSION_SECTIONS, "📋"),
    assets: soonSections(ASSET_SECTIONS, "📦"),
    marketplace: soonSections(MARKETPLACE_SECTIONS, "🛒"),
    world: soonSections(WORLD_SECTIONS, "🌍"),
  };

  return DOCK.map((d) => ({
    id: d.id,
    label: d.label,
    icon: d.icon,
    emoji: d.emoji,
    children: childrenFor[d.id] ?? [],
  }));
}

function agentsMenu(ctx: {
  agents: LiveAgent[];
  onOpenAgent: (id: string) => void;
}): DockItem[] {
  const live: DockItem[] = ctx.agents.map((a) => {
    const p = PROVIDERS[a.provider];
    return {
      id: `agent-${a.id}`,
      label: a.name,
      art: p.agentArt,
      accent: p.color,
      desc: p.agent.title,
      onSelect: () => ctx.onOpenAgent(a.id),
    };
  });
  const library: DockItem[] = AGENT_LIBRARY.map((a) => ({
    id: a.id,
    label: a.label,
    emoji: a.emoji,
    desc: a.desc,
    badge: "soon",
    disabled: true,
  }));
  return [...live, ...library];
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

function integrationsMenu(): DockItem[] {
  return INTEGRATIONS.map((grp) => ({
    id: `grp-${grp.group}`,
    label: grp.group,
    emoji: "🔌",
    desc: `${grp.items.length} integrations`,
    children: grp.items.map((it) => ({
      id: it.id,
      label: it.label,
      emoji: it.emoji,
      badge: "soon",
      disabled: true,
    })),
  }));
}

function workforceMenu(ctx: {
  agents: LiveAgent[];
  onOpenAgent: (id: string) => void;
}): DockItem[] {
  if (!ctx.agents.length) {
    return [
      {
        id: "no-workers",
        label: "No workers",
        emoji: "🪧",
        desc: "Place a provider building to hire your first agent.",
        disabled: true,
      },
    ];
  }
  return ctx.agents.map((a) => {
    const p = PROVIDERS[a.provider];
    return {
      id: `wf-${a.id}`,
      label: a.name,
      art: p.agentArt,
      accent: p.color,
      desc: a.state,
      onSelect: () => ctx.onOpenAgent(a.id),
    };
  });
}

function soonTiles(items: { id: string; emoji: string; label: string; desc: string }[]): DockItem[] {
  return items.map((w) => ({
    id: w.id,
    label: w.label,
    emoji: w.emoji,
    desc: w.desc,
    badge: "soon",
    disabled: true,
  }));
}

function soonSections(sections: string[], emoji: string): DockItem[] {
  return sections.map((s) => ({
    id: s,
    label: s,
    emoji,
    badge: "soon",
    disabled: true,
  }));
}

/* ---- Selected-building command center ------------------------------------ */

function buildingActions(
  b: PlacedBuilding,
  h: {
    onOpenBuilding: (b: PlacedBuilding) => void;
    onMoveBuilding: (b: PlacedBuilding) => void;
    onDuplicateBuilding: (b: PlacedBuilding) => void;
    onDeleteBuilding: (b: PlacedBuilding) => void;
    onChatBuilding: (b: PlacedBuilding) => void;
    onDeselect: () => void;
  },
): DockItem[] {
  const isHall = b.kind === "town-hall";
  const items: DockItem[] = [
    {
      id: "act-open",
      label: isHall ? "Open" : "Configure",
      emoji: "⚙️",
      onSelect: () => h.onOpenBuilding(b),
    },
  ];
  if (!isHall) {
    items.push({ id: "act-chat", label: "Chat", emoji: "💬", onSelect: () => h.onChatBuilding(b) });
  }
  items.push({ id: "act-move", label: "Move", emoji: "✋", onSelect: () => h.onMoveBuilding(b) });
  items.push({ id: "act-upgrade", label: "Upgrade", emoji: "⬆️", badge: "soon", disabled: true });
  if (!isHall) {
    items.push({
      id: "act-duplicate",
      label: "Duplicate",
      emoji: "➕",
      onSelect: () => h.onDuplicateBuilding(b),
    });
  }
  items.push({
    id: "act-delete",
    label: "Delete",
    emoji: "💣",
    danger: true,
    onSelect: () => h.onDeleteBuilding(b),
  });
  return items;
}
