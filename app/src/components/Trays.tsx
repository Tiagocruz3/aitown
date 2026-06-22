import { useState } from "react";
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
  type DockKind,
  type ProviderId,
} from "../game/data";
import type { PlacedBuilding, LiveAgent, RoadTool } from "./GameCanvas";

/* ==================================================================
   BOTTOM TRAY — the dock expands upward into this. Town Star style.
   Anchored to the bottom, short height, never covers the city center.
   ================================================================== */

export function DockTray({
  kind,
  buildings,
  agents,
  roadCount,
  roadTool,
  hasTownHall,
  onClose,
  onPlaceProvider,
  onPlaceTownHall,
  onOpenAgent,
  onRoadTool,
  onClearRoads,
}: {
  kind: DockKind;
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  roadCount: number;
  roadTool: RoadTool | null;
  hasTownHall: boolean;
  onClose: () => void;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onOpenAgent: (id: string) => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
}) {
  const meta = DOCK.find((d) => d.id === kind);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[100px]">
      <div
        className="pointer-events-auto w-[min(1040px,97vw)] animate-[trayUp_.18s_ease-out] rounded-[26px] border border-white/10 bg-[#11131c]/92 shadow-2xl backdrop-blur-xl"
        style={{ maxHeight: "42vh" }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
          {meta?.icon && <BrandImg src={meta.icon} alt="" className="h-9 w-9 object-contain" />}
          <div className="flex-1">
            <h3 className="text-base font-extrabold tracking-tight text-white">{trayTitle(kind)}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/8 px-4 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/15"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(46vh - 56px)" }}>
          {kind === "agents" && <AgentsTray agents={agents} onOpenAgent={onOpenAgent} />}
          {kind === "buildings" && (
            <BuildingsTray
              hasTownHall={hasTownHall}
              roadCount={roadCount}
              roadTool={roadTool}
              onPlaceProvider={onPlaceProvider}
              onPlaceTownHall={onPlaceTownHall}
              onRoadTool={onRoadTool}
              onClearRoads={onClearRoads}
            />
          )}
          {kind === "workflows" && <RowTiles items={WORKFLOWS} badge="soon" />}
          {kind === "integrations" && <IntegrationsTray />}
          {kind === "workforce" && (
            <WorkforceTray buildings={buildings} agents={agents} onOpenAgent={onOpenAgent} />
          )}
          {kind === "missions" && <SectionRow sections={MISSION_SECTIONS} />}
          {kind === "assets" && <SectionRow sections={ASSET_SECTIONS} />}
          {kind === "marketplace" && <SectionRow sections={MARKETPLACE_SECTIONS} />}
          {kind === "world" && <SectionRow sections={WORLD_SECTIONS} />}
        </div>
      </div>
    </div>
  );
}

function trayTitle(kind: DockKind): string {
  const map: Record<string, string> = {
    agents: "Agents",
    buildings: "Buildings",
    workflows: "Workflows",
    integrations: "Integrations",
    workforce: "Workforce",
    missions: "Missions",
    assets: "Assets",
    marketplace: "Marketplace",
    world: "World",
    roads: "Roads",
  };
  return map[kind] ?? kind;
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
      {children}
    </div>
  );
}

function Tile({
  emoji,
  art,
  label,
  desc,
  accent,
  badge,
  disabled,
  onClick,
}: {
  emoji?: string;
  art?: string;
  label: string;
  desc?: string;
  accent?: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex w-[128px] shrink-0 flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-55"
          : "border-white/10 bg-white/[0.05] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09]"
      }`}
      style={accent ? { boxShadow: `inset 0 -3px 0 ${accent}` } : undefined}
    >
      {badge && (
        <span className="absolute right-2 top-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white/55">
          {badge}
        </span>
      )}
      <div className="grid h-14 w-14 place-items-center">
        {art ? (
          <BrandImg src={art} alt={label} className="h-14 w-14 object-contain transition group-hover:scale-110" />
        ) : (
          <span className="text-3xl transition group-hover:scale-110">{emoji}</span>
        )}
      </div>
      <div className="text-[12px] font-semibold leading-tight text-white">{label}</div>
      {desc && <div className="line-clamp-2 text-[9px] leading-snug text-white/45">{desc}</div>}
    </button>
  );
}

function AgentsTray({ agents, onOpenAgent }: { agents: LiveAgent[]; onOpenAgent: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {agents.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/45">In your town now</div>
          <HScroll>
            {agents.map((a) => {
              const p = PROVIDERS[a.provider];
              return (
                <Tile key={a.id} art={p.agentArt} label={p.agent.name} desc={p.agent.title} accent={p.color} onClick={() => onOpenAgent(a.id)} />
              );
            })}
          </HScroll>
        </div>
      )}
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/45">Agent types</div>
        <HScroll>
          {AGENT_LIBRARY.map((a) => (
            <Tile key={a.id} emoji={a.emoji} label={a.label} desc={a.desc} badge="soon" disabled />
          ))}
        </HScroll>
      </div>
    </div>
  );
}

function BuildingsTray({
  hasTownHall,
  roadCount,
  roadTool,
  onPlaceProvider,
  onPlaceTownHall,
  onRoadTool,
  onClearRoads,
}: {
  hasTownHall: boolean;
  roadCount: number;
  roadTool: RoadTool | null;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
}) {
  return (
    <div className="space-y-3">
      <HScroll>
        <Tile
          emoji={TOWN_HALL.emoji}
          art={TOWN_HALL.art}
          label={TOWN_HALL.name}
          desc={hasTownHall ? "Already in city" : "OS control center"}
          accent={TOWN_HALL.color}
          disabled={hasTownHall}
          onClick={hasTownHall ? undefined : onPlaceTownHall}
        />
        {BUILDING_LIBRARY.map((b) => {
          const p = b.provider ? PROVIDERS[b.provider] : undefined;
          return (
            <Tile
              key={b.id}
              art={p?.buildingArt}
              emoji={b.emoji}
              label={b.label}
              desc={b.desc}
              accent={p?.color}
              badge={p ? undefined : "soon"}
              disabled={!p}
              onClick={p ? () => onPlaceProvider(b.provider!) : undefined}
            />
          );
        })}
      </HScroll>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-white/45">Roads</span>
        <button
          onClick={() => onRoadTool(roadTool === "road" ? null : "road")}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            roadTool === "road" ? "border-white/40 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          🛣️ Paint
        </button>
        <button
          onClick={() => onRoadTool(roadTool === "erase-road" ? null : "erase-road")}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            roadTool === "erase-road" ? "border-white/40 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          }`}
        >
          🧽 Erase
        </button>
        <div className="ml-auto flex items-center gap-2">
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
      <p className="text-[11px] text-white/35">
        Pick a building, then click a tile to place it. Pick a road tool, then paint directly on the map — the tray stays out of the city.
      </p>
    </div>
  );
}

function IntegrationsTray() {
  return (
    <div className="space-y-3">
      {INTEGRATIONS.map((grp) => (
        <div key={grp.group}>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/45">{grp.group}</div>
          <HScroll>
            {grp.items.map((it) => (
              <Tile key={it.id} emoji={it.emoji} label={it.label} disabled />
            ))}
          </HScroll>
        </div>
      ))}
    </div>
  );
}

function WorkforceTray({
  buildings,
  agents,
  onOpenAgent,
}: {
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  onOpenAgent: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Stat label="Agents" value={agents.length} />
        <Stat label="Buildings" value={buildings.length} />
        <Stat label="Revenue" value="$0" />
      </div>
      {agents.length ? (
        <HScroll>
          {agents.map((a) => {
            const p = PROVIDERS[a.provider];
            return <Tile key={a.id} art={p.agentArt} label={p.agent.name} desc={a.state} accent={p.color} onClick={() => onOpenAgent(a.id)} />;
          })}
        </HScroll>
      ) : (
        <p className="py-3 text-sm text-white/45">No workers yet — place a provider building to hire your first agent.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[92px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
      <div className="text-lg font-extrabold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}

function RowTiles({ items, badge }: { items: { id: string; emoji: string; label: string; desc: string }[]; badge?: string }) {
  return (
    <HScroll>
      {items.map((w) => (
        <Tile key={w.id} emoji={w.emoji} label={w.label} desc={w.desc} badge={badge} disabled />
      ))}
    </HScroll>
  );
}

function SectionRow({ sections }: { sections: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {sections.map((s, i) => (
          <button
            key={s}
            onClick={() => setActive(i)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              i === active ? "bg-white text-black" : "bg-white/8 text-white/70 hover:bg-white/15"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/45">
        <span className="text-xl opacity-70">✨</span>
        <span>
          <b className="text-white/70">{sections[active]}</b> — on the AgentVillage OS roadmap. The data model and UI slot are wired and ready.
        </span>
      </div>
    </div>
  );
}
