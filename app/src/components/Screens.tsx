import { useState } from "react";
import { BrandImg } from "./Modals";
import {
  PROVIDERS,
  DOCK,
  AGENT_LIBRARY,
  INTEGRATIONS,
  WORK_SECTIONS,
  CONTROL_SECTIONS,
  type DockKind,
} from "../game/data";
import type { PlacedBuilding, LiveAgent } from "./GameCanvas";

/* ==================================================================
   FULL-SCREEN MANAGEMENT SCREENS
   Dashboards & catalogs (Workforce, Agents, Marketplace, …) get the
   whole screen — roomy grids, not a cramped dock submenu. Placement
   (Buildings / Roads) stays on the dock so the map is visible there;
   these management views are deliberately full-screen for ease of use.
   ================================================================== */

const TITLES: Record<string, { title: string; subtitle: string }> = {
  staff: { title: "AI Staff", subtitle: "Create, manage and chat with your agents" },
  services: { title: "Services", subtitle: "Connect external tools your agents can use" },
  work: { title: "Work", subtitle: "Missions, projects, campaigns & tasks" },
  control: { title: "Control Center", subtitle: "Keys, usage, registries, billing & settings" },
};

export function FullscreenView({
  kind,
  buildings,
  agents,
  onOpenAgent,
  onClose,
}: {
  kind: DockKind;
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  onOpenAgent: (id: string) => void;
  onClose: () => void;
}) {
  const meta = DOCK.find((d) => d.id === kind);
  const t = TITLES[kind] ?? { title: meta?.label ?? kind, subtitle: "" };

  return (
    <div className="absolute inset-0 z-40 flex flex-col p-3 sm:p-6">
      {/* dimmed, blurred world behind — full-screen focus, click to leave */}
      <div className="absolute inset-0 bg-[#0b0d14]/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1200px] animate-[screenIn_.18s_ease-out] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0f17]/95 shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
          {meta?.icon && <BrandImg src={meta.icon} alt="" className="h-11 w-11 object-contain" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{t.title}</h2>
            {t.subtitle && <p className="truncate text-xs text-white/50 sm:text-sm">{t.subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/15"
          >
            ✕ Close
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {kind === "staff" && <AgentsScreen agents={agents} onOpenAgent={onOpenAgent} />}
          {kind === "services" && <IntegrationsScreen />}
          {kind === "work" && <SectionScreen sections={WORK_SECTIONS} />}
          {kind === "control" && (
            <ControlScreen buildings={buildings} agents={agents} onOpenAgent={onOpenAgent} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- shared bits --------------------------------------------------------- */

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function GTile({
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
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-55"
          : "border-white/10 bg-white/[0.05] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09]"
      }`}
      style={accent ? { boxShadow: `inset 0 -3px 0 ${accent}` } : undefined}
    >
      {badge && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/55">
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
      <div className="text-sm font-semibold leading-tight text-white">{label}</div>
      {desc && <div className="line-clamp-2 text-[11px] leading-snug text-white/45">{desc}</div>}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 mt-1 text-xs font-bold uppercase tracking-wide text-white/45">{children}</div>;
}

/* ---- per-kind screens ---------------------------------------------------- */

function AgentsScreen({ agents, onOpenAgent }: { agents: LiveAgent[]; onOpenAgent: (id: string) => void }) {
  return (
    <div className="space-y-6">
      {agents.length > 0 && (
        <div>
          <SectionLabel>In your town now — click to chat</SectionLabel>
          <Grid>
            {agents.map((a) => {
              const p = PROVIDERS[a.provider];
              return (
                <GTile
                  key={a.id}
                  art={p.agentArt}
                  label={a.name}
                  desc={p.agent.title}
                  accent={p.color}
                  onClick={() => onOpenAgent(a.id)}
                />
              );
            })}
          </Grid>
        </div>
      )}
      <div>
        <SectionLabel>Agent types</SectionLabel>
        <Grid>
          {AGENT_LIBRARY.map((a) => (
            <GTile key={a.id} emoji={a.emoji} label={a.label} desc={a.desc} badge="soon" disabled />
          ))}
        </Grid>
      </div>
    </div>
  );
}

const CONTROL_ICON: Record<string, string> = {
  "API Keys": "🔑",
  Usage: "📈",
  Analytics: "📊",
  Billing: "💳",
  Settings: "⚙️",
};

function ControlScreen({
  buildings,
  agents,
  onOpenAgent,
}: {
  buildings: PlacedBuilding[];
  agents: LiveAgent[];
  onOpenAgent: (id: string) => void;
}) {
  const soon = CONTROL_SECTIONS.filter((s) => !s.includes("Registry"));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Agents" value={agents.length} />
        <Stat label="Buildings" value={buildings.length} />
        <Stat label="Providers" value={new Set(agents.map((a) => a.provider)).size} />
        <Stat label="Spend" value="$0" />
      </div>

      {agents.length > 0 && (
        <div>
          <SectionLabel>Agent registry — click to chat</SectionLabel>
          <Grid>
            {agents.map((a) => {
              const p = PROVIDERS[a.provider];
              return (
                <GTile key={a.id} art={p.agentArt} label={a.name} desc={p.agent.title} accent={p.color} onClick={() => onOpenAgent(a.id)} />
              );
            })}
          </Grid>
        </div>
      )}

      {buildings.length > 0 && (
        <div>
          <SectionLabel>Building registry</SectionLabel>
          <Grid>
            {buildings.map((b) => {
              const isHall = b.kind === "town-hall";
              const p = isHall ? null : PROVIDERS[b.provider];
              return (
                <GTile
                  key={b.id}
                  art={p?.buildingArt}
                  emoji={isHall ? "🏛️" : undefined}
                  label={isHall ? "Town Hall" : p!.name}
                  desc={`tile ${b.col}, ${b.row}`}
                  accent={p?.color}
                />
              );
            })}
          </Grid>
        </div>
      )}

      <div>
        <SectionLabel>Control</SectionLabel>
        <Grid>
          {soon.map((s) => (
            <GTile key={s} emoji={CONTROL_ICON[s] ?? "•"} label={s} badge="soon" disabled />
          ))}
        </Grid>
      </div>
      <p className="text-xs leading-relaxed text-white/40">
        API keys are set per building — open a Department and use its Settings to add a provider key. Usage,
        billing & analytics are on the roadmap.
      </p>
    </div>
  );
}

function IntegrationsScreen() {
  return (
    <div className="space-y-6">
      {INTEGRATIONS.map((grp) => (
        <div key={grp.group}>
          <SectionLabel>{grp.group}</SectionLabel>
          <Grid>
            {grp.items.map((it) => (
              <GTile key={it.id} emoji={it.emoji} label={it.label} badge="soon" disabled />
            ))}
          </Grid>
        </div>
      ))}
    </div>
  );
}

function SectionScreen({ sections }: { sections: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {sections.map((s, i) => (
          <button
            key={s}
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              i === active ? "bg-white text-black" : "bg-white/8 text-white/70 hover:bg-white/15"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
        <span className="text-4xl opacity-70">✨</span>
        <p className="text-lg font-bold text-white/80">{sections[active]}</p>
        <p className="max-w-md text-sm text-white/45">
          On the AgentVillage OS roadmap. The data model and UI slot are wired and ready for this view.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}
