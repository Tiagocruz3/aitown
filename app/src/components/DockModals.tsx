import { useState } from "react";
import { Backdrop, BrandImg } from "./Modals";
import {
  PROVIDERS,
  PROVIDER_ORDER,
  DOCK,
  DOCK_ICONS,
  AGENT_LIBRARY,
  BUILDING_LIBRARY,
  WORKFLOWS,
  INTEGRATIONS,
  WORKFORCE_SECTIONS,
  MISSION_SECTIONS,
  ASSET_SECTIONS,
  MARKETPLACE_SECTIONS,
  WORLD_SECTIONS,
  TOWN_HALL,
  type DockKind,
  type ProviderId,
} from "../game/data";
import type { PlacedBuilding, LiveAgent, RoadTool } from "./GameCanvas";

/* ================================================================== */
/* Shared centered-modal shell with a big rendered category icon       */
/* ================================================================== */

function DockShell({
  kind,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  kind: DockKind;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const icon = (DOCK_ICONS as Record<string, string>)[kind];
  return (
    <Backdrop onClose={onClose}>
      <div
        className={`flex max-h-[86vh] ${wide ? "w-[min(860px,95vw)]" : "w-[min(640px,95vw)]"} flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#11131c] shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent p-5">
          {icon ? (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.06]">
              <BrandImg src={icon} alt="" className="h-14 w-14 object-contain drop-shadow" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="truncate text-sm text-white/55">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 text-white/55 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </Backdrop>
  );
}

// A reusable Town-Star-ish tile button (creamy card with big icon + label).
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
      className={`group relative flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-60"
          : "border-white/10 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.09]"
      }`}
      style={accent ? { boxShadow: `inset 0 -3px 0 ${accent}` } : undefined}
    >
      {badge && (
        <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55">
          {badge}
        </span>
      )}
      <div className="grid h-16 w-16 place-items-center">
        {art ? (
          <BrandImg src={art} alt={label} className="h-16 w-16 object-contain transition group-hover:scale-110" />
        ) : (
          <span className="text-4xl transition group-hover:scale-110">{emoji}</span>
        )}
      </div>
      <div className="mt-0.5 text-sm font-semibold leading-tight text-white">{label}</div>
      {desc && <div className="text-[10px] leading-snug text-white/45">{desc}</div>}
    </button>
  );
}

function SectionPills({ sections }: { sections: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
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
      <Empty label={sections[active]} />
    </>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center">
      <div className="text-3xl opacity-70">✨</div>
      <p className="text-sm font-semibold text-white/75">{label}</p>
      <p className="max-w-sm text-xs text-white/40">
        On the AgentVillage OS roadmap. The data model and UI slot are wired and ready to fill.
      </p>
    </div>
  );
}

/* ================================================================== */
/* The dock router: one component, switches on `kind`                  */
/* ================================================================== */

export function DockModal({
  kind,
  buildings,
  agents,
  roadCount,
  roadTool,
  onClose,
  onPlaceProvider,
  onPlaceTownHall,
  onOpenAgent,
  onRoadTool,
  onClearRoads,
  hasTownHall,
}: {
  kind: DockKind;
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  roadCount: number;
  roadTool: RoadTool | null;
  onClose: () => void;
  onPlaceProvider: (p: ProviderId) => void;
  onPlaceTownHall: () => void;
  onOpenAgent: (id: string) => void;
  onRoadTool: (t: RoadTool | null) => void;
  onClearRoads: () => void;
  hasTownHall: boolean;
}) {
  const meta = DOCK.find((d) => d.id === kind);
  const title = meta?.label ?? kind;

  /* ---- AGENTS ---- */
  if (kind === "agents") {
    return (
      <DockShell kind={kind} title="Agent Library" subtitle="Create, import, and manage your AI workers" onClose={onClose} wide>
        <p className="mb-3 text-xs text-white/45">
          Live agents come from placed provider buildings. Browse the agent types you can build toward.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {AGENT_LIBRARY.map((a) => (
            <Tile key={a.id} emoji={a.emoji} label={a.label} desc={a.desc} badge={a.id === "create" || a.id === "import" ? "soon" : undefined} disabled />
          ))}
        </div>
        {agents.length > 0 && (
          <>
            <div className="mb-2 mt-6 text-sm font-bold text-white/80">In your town now</div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {agents.map((a) => {
                const p = PROVIDERS[a.provider];
                return (
                  <Tile key={a.id} art={p.agentArt} label={p.agent.name} desc={p.agent.title} accent={p.color} onClick={() => onOpenAgent(a.id)} />
                );
              })}
            </div>
          </>
        )}
      </DockShell>
    );
  }

  /* ---- BUILDINGS ---- */
  if (kind === "buildings") {
    return (
      <DockShell kind={kind} title="Building Library" subtitle="Place buildings to grow your city" onClose={onClose} wide>
        <p className="mb-3 text-xs text-white/45">
          Provider buildings each spawn one branded agent. The Town Hall is your OS control center.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {/* Town Hall first */}
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
        </div>

        {/* Roads tool lives with Buildings (city construction) */}
        <div className="mb-2 mt-6 text-sm font-bold text-white/80">Roads</div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onRoadTool("road")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              roadTool === "road" ? "border-white/40 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            🛣️ Paint road
          </button>
          <button
            onClick={() => onRoadTool("erase-road")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              roadTool === "erase-road" ? "border-white/40 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            🧽 Erase road
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
        <p className="mt-2 text-[11px] text-white/35">
          Pick a road tool — the modal closes so you can paint directly on the map. Re-open Buildings to switch or stop.
        </p>
      </DockShell>
    );
  }

  /* ---- WORKFLOWS ---- */
  if (kind === "workflows") {
    return (
      <DockShell kind={kind} title="Workflows" subtitle="Install production systems" onClose={onClose} wide>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {WORKFLOWS.map((w) => (
            <Tile key={w.id} emoji={w.emoji} label={w.label} desc={w.desc} badge="soon" disabled />
          ))}
        </div>
      </DockShell>
    );
  }

  /* ---- INTEGRATIONS ---- */
  if (kind === "integrations") {
    return (
      <DockShell kind={kind} title="Integrations" subtitle="Connect external services" onClose={onClose} wide>
        <div className="space-y-5">
          {INTEGRATIONS.map((grp) => (
            <div key={grp.group}>
              <div className="mb-2 text-sm font-bold text-white/80">{grp.group}</div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {grp.items.map((it) => (
                  <Tile key={it.id} emoji={it.emoji} label={it.label} disabled />
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-white/35">
            AI providers connect through their building's settings (click any provider building). Other integrations are on the roadmap.
          </p>
        </div>
      </DockShell>
    );
  }

  /* ---- WORKFORCE ---- */
  if (kind === "workforce") {
    return (
      <DockShell kind={kind} title="Workforce Center" subtitle="Manage all workers and teams" onClose={onClose}>
        {agents.length > 0 ? (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <Stat label="Agents" value={agents.length} />
              <Stat label="Buildings" value={buildings.length} />
              <Stat label="Revenue" value="$0" />
            </div>
            <div className="mb-2 text-sm font-bold text-white/80">All Agents</div>
            <div className="space-y-2">
              {agents.map((a) => {
                const p = PROVIDERS[a.provider];
                return (
                  <button
                    key={a.id}
                    onClick={() => onOpenAgent(a.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition hover:bg-white/10"
                  >
                    <BrandImg src={p.agentArt} alt={p.agent.name} className="h-10 w-10 object-contain" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{p.agent.name}</div>
                      <div className="text-[11px] text-white/45">{p.agent.title} · {a.state}</div>
                    </div>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${p.color}22`, color: "#fff" }}>
                      chat →
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <Empty label="No workers yet — place a provider building to hire your first agent" />
        )}
      </DockShell>
    );
  }

  /* ---- MISSIONS / ASSETS / MARKETPLACE / WORLD (section modals) ---- */
  if (kind === "missions")
    return (
      <DockShell kind={kind} title="Mission Center" subtitle="Manage tasks and work" onClose={onClose}>
        <SectionPills sections={MISSION_SECTIONS} />
      </DockShell>
    );
  if (kind === "assets")
    return (
      <DockShell kind={kind} title="Assets" subtitle="Manage city resources" onClose={onClose}>
        <SectionPills sections={ASSET_SECTIONS} />
      </DockShell>
    );
  if (kind === "marketplace")
    return (
      <DockShell kind={kind} title="Marketplace" subtitle="Buy and sell content" onClose={onClose}>
        <SectionPills sections={MARKETPLACE_SECTIONS} />
      </DockShell>
    );
  if (kind === "world")
    return (
      <DockShell kind={kind} title="World" subtitle="The larger AgentVillage universe" onClose={onClose}>
        <SectionPills sections={WORLD_SECTIONS} />
      </DockShell>
    );

  // fallback
  return (
    <DockShell kind={kind} title={title} onClose={onClose}>
      <Empty label={title} />
    </DockShell>
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

/* ================================================================== */
/* Town Hall modal — the OS control center (physical building)         */
/* ================================================================== */

export function TownHallModal({
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
    <Backdrop onClose={onClose}>
      <div
        className="flex max-h-[88vh] w-[min(820px,95vw)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#11131c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-4 border-b border-white/10 p-5"
          style={{ background: `linear-gradient(90deg, ${TOWN_HALL.color}33, transparent)` }}
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.06]">
            <BrandImg src={TOWN_HALL.art} alt="Town Hall" className="h-14 w-14 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold tracking-tight text-white">Town Hall</h2>
            <p className="text-sm text-white/55">Operating system control center</p>
          </div>
          <button onClick={onClose} className="rounded-xl px-3 py-1.5 text-white/55 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* tab rail */}
          <div className="w-44 shrink-0 space-y-1 overflow-y-auto border-r border-white/10 p-3">
            {TOWN_HALL.tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  tab === t ? "bg-white/15 font-semibold text-white" : "text-white/60 hover:bg-white/8"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* tab body */}
          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            {tab === "Dashboard" && (
              <div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Agents" value={agents.length} />
                  <Stat label="Buildings" value={buildings.length} />
                  <Stat label="Providers" value={new Set(providerBuildings.map((b) => b.provider)).size} />
                </div>
                <p className="mt-4 text-sm text-white/55">
                  Welcome to your AgentVillage. Build provider buildings to hire agents, paint roads, and run your AI company from this town.
                </p>
              </div>
            )}

            {tab === "AI Providers" && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PROVIDER_ORDER.map((id) => {
                  const p = PROVIDERS[id];
                  const placed = providerBuildings.some((b) => b.provider === id);
                  return (
                    <div key={id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" style={{ boxShadow: `inset 0 -3px 0 ${p.color}` }}>
                      <BrandImg src={p.buildingArt} alt={p.name} className="mx-auto h-14 w-14 object-contain" />
                      <div className="mt-1 text-sm font-semibold text-white">{p.company}</div>
                      <div className={`text-[10px] ${placed ? "text-emerald-300" : "text-white/40"}`}>{placed ? "● active" : "not placed"}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "Agent Registry" && (
              agents.length ? (
                <div className="space-y-2">
                  {agents.map((a) => {
                    const p = PROVIDERS[a.provider];
                    return (
                      <button key={a.id} onClick={() => onOpenAgent(a.id)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left hover:bg-white/10">
                        <BrandImg src={p.agentArt} alt={p.agent.name} className="h-10 w-10 object-contain" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{p.agent.name}</div>
                          <div className="text-[11px] text-white/45">{p.agent.title}</div>
                        </div>
                        <span className="text-xs text-white/40">chat →</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Empty label="No agents registered yet" />
              )
            )}

            {tab === "Building Registry" && (
              providerBuildings.length ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {providerBuildings.map((b) => {
                    const p = PROVIDERS[b.provider];
                    return (
                      <div key={b.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" style={{ boxShadow: `inset 0 -3px 0 ${p.color}` }}>
                        <BrandImg src={p.buildingArt} alt={p.name} className="mx-auto h-14 w-14 object-contain" />
                        <div className="mt-1 text-xs font-semibold text-white">{p.name}</div>
                        <div className="text-[10px] text-white/40">tile {b.col},{b.row}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty label="No buildings yet" />
              )
            )}

            {["Integrations", "Permissions", "Billing", "System Settings"].includes(tab) && (
              <div>
                <Empty label={tab} />
                {tab === "System Settings" && (
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button onClick={onMove} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10">
                      ✋ Move Town Hall
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Remove the Town Hall?")) onDelete();
                      }}
                      className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
                    >
                      🗑 Remove Town Hall
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Backdrop>
  );
}
