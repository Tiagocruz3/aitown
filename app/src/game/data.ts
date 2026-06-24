// AgentVillage OS — provider-driven game data.
// The town is built from AI-PROVIDER buildings. Placing a provider building
// spawns exactly ONE branded agent for that provider. No building => no agent.
// All art is AI-generated (FarmVille / Town Star style), hosted on CDN.

const CDN =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/";

// ---- Provider identity ------------------------------------------------------

export type ProviderId = "openai" | "anthropic" | "grok" | "openrouter";

export const ART = {
  buildings: {
    openai: CDN + "hf_20260622_084529_531d7d56-3085-483d-bf63-da5e128c5065.png",
    anthropic:
      CDN + "hf_20260622_084532_cbb54c1c-3581-44d3-8777-efd034da38b0.png",
    grok: CDN + "hf_20260622_084534_eeb95a5b-8b0d-4764-8584-828bfa2e3ae2.png",
    openrouter:
      CDN + "hf_20260622_084538_c7b3634b-0c87-438b-84d0-f6146561f3b6.png",
  },
  agents: {
    openai: CDN + "hf_20260622_084541_acc62035-6c3e-4786-b699-fc6770b4c243.png",
    anthropic:
      CDN + "hf_20260622_084544_01707e3d-2786-492f-960f-5b546759be39.png",
    grok: CDN + "hf_20260622_084548_59eeddaa-0753-4c59-9bc3-c6ff6b1828fd.png",
    openrouter:
      CDN + "hf_20260622_084552_63945239-440b-4857-9c10-84a252ac0f34.png",
  },
} as const;

export interface ProviderModelOption {
  id: string;
  label: string;
}

export interface ProviderDef {
  id: ProviderId;
  name: string; // brand name for the building
  company: string; // legal-ish provider name
  buildingArt: string;
  agentArt: string;
  color: string; // primary brand accent
  color2: string; // secondary accent / gradient end
  ink: string; // readable text color on the brand color
  // The branded agent that spawns with this building. Agents are NAMED BY THE
  // USER (and given their own prompt) when the building is placed — only the
  // role title is predefined here.
  agent: {
    title: string;
  };
  // Settings the building modal collects:
  apiBase: string; // default endpoint placeholder
  apiKeyHint: string; // placeholder for the key field
  models: ProviderModelOption[]; // selectable models
  defaultModel: string;
  docsUrl: string;
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  openai: {
    id: "openai",
    name: "OpenAI HQ",
    company: "OpenAI",
    buildingArt: ART.buildings.openai,
    agentArt: ART.agents.openai,
    color: "#10a37f",
    color2: "#0b7d61",
    ink: "#ffffff",
    agent: {
      title: "OpenAI Agent",
    },
    apiBase: "https://api.openai.com/v1",
    apiKeyHint: "sk-...",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "o3", label: "o3 (reasoning)" },
    ],
    defaultModel: "gpt-4o",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Studio",
    company: "Anthropic",
    buildingArt: ART.buildings.anthropic,
    agentArt: ART.agents.anthropic,
    color: "#d97757",
    color2: "#b85c3c",
    ink: "#ffffff",
    agent: {
      title: "Anthropic Agent",
    },
    apiBase: "https://api.anthropic.com/v1",
    apiKeyHint: "sk-ant-...",
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    ],
    defaultModel: "claude-3-5-sonnet-20241022",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  grok: {
    id: "grok",
    name: "Grok Tower",
    company: "xAI",
    buildingArt: ART.buildings.grok,
    agentArt: ART.agents.grok,
    color: "#1d9bf0",
    color2: "#0b0b0d",
    ink: "#ffffff",
    agent: {
      title: "xAI Agent",
    },
    apiBase: "https://api.x.ai/v1",
    apiKeyHint: "xai-...",
    models: [
      { id: "grok-4", label: "Grok-4" },
      { id: "grok-3", label: "Grok-3" },
      { id: "grok-3-mini", label: "Grok-3 mini" },
    ],
    defaultModel: "grok-3",
    docsUrl: "https://console.x.ai",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter Hub",
    company: "OpenRouter",
    buildingArt: ART.buildings.openrouter,
    agentArt: ART.agents.openrouter,
    color: "#6467f2",
    color2: "#8b5cf6",
    ink: "#ffffff",
    agent: {
      title: "OpenRouter Agent",
    },
    apiBase: "https://openrouter.ai/api/v1",
    apiKeyHint: "sk-or-...",
    models: [
      { id: "openai/gpt-4o", label: "GPT-4o (via OpenRouter)" },
      { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "meta-llama/llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "x-ai/grok-3", label: "Grok-3" },
    ],
    defaultModel: "openai/gpt-4o",
    docsUrl: "https://openrouter.ai/keys",
  },
};

export const PROVIDER_ORDER: ProviderId[] = [
  "openai",
  "anthropic",
  "grok",
  "openrouter",
];

// Providers whose building is rendered as a rotatable 3D GLB model on the map
// (replacing the flat sprite). Served from app/public/ → /models/*.glb.
export const BUILDING_MODELS: Partial<Record<ProviderId, string>> = {
  openai: "/models/openai-hq.glb",
  anthropic: "/models/anthropic-studio.glb",
  grok: "/models/grok-tower.glb",
  openrouter: "/models/openrouter-hub.glb",
};

// ---- Facility buildings -----------------------------------------------------
// Non-provider 3D buildings that give the town a capability (rather than
// spawning a branded chat agent). The Design Image Studio is where agents go to
// generate images; YouTube is the video-production hub. Both are rotatable GLBs.

export type FacilityId = "image-studio" | "youtube";

export interface FacilityDef {
  id: FacilityId;
  name: string;
  emoji: string;
  model: string; // GLB rendered as a rotatable 3D building
  color: string;
  color2: string;
  ink: string;
  blurb: string;
  // If set, this facility generates images via OpenRouter (the Image Studio).
  usesImageGen?: boolean;
}

export const FACILITIES: Record<FacilityId, FacilityDef> = {
  "image-studio": {
    id: "image-studio",
    name: "Design Image Studio",
    emoji: "🎨",
    model: "/models/youtube.glb",
    color: "#ec4899",
    color2: "#a855f7",
    ink: "#ffffff",
    blurb:
      "AI image generation, powered by OpenRouter. Ask any agent to create an image and it walks here to make it.",
    usesImageGen: true,
  },
  youtube: {
    id: "youtube",
    name: "YouTube Studio",
    emoji: "▶️",
    model: "/models/image-studio.glb",
    color: "#ff0033",
    color2: "#cc0029",
    ink: "#ffffff",
    blurb: "Video production hub — scripting, thumbnails, editing & uploads.",
  },
};

export const FACILITY_ORDER: FacilityId[] = ["image-studio", "youtube"];

// ---- Image generation -------------------------------------------------------
// The Image Studio uses the OpenRouter API. These are OpenRouter's image-capable
// models; the studio's default is used whenever an agent is told to create an
// image (see AgentPanel image-intent handling).

export interface ImageModelOption {
  id: string;
  label: string;
}

export const IMAGE_MODELS: ImageModelOption[] = [
  { id: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (Nano Banana)" },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash · image (free)" },
];

export const DEFAULT_IMAGE_MODEL = "google/gemini-2.5-flash-image";

// ---- Dock -------------------------------------------------------------------

// Town Star-style rendered dock icons (glossy 3D, transparent PNG, lightweight).
const ICONCDN = "https://d2ol7oe51mr4n9.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/";
export const DOCK_ICONS = {
  agents: ICONCDN + "fb616f2e-7d8b-411e-b36f-a0ab8a57bd77.png",
  buildings: ICONCDN + "f5a848a7-e483-42bd-b5e5-17a8e87477d5.png",
  workflows: ICONCDN + "df2f515c-1c8a-4b67-9d38-576a211bb911.png",
  integrations: ICONCDN + "1291b70e-8f08-4a87-b17d-bccd13267d02.png",
  workforce: ICONCDN + "4abfe8c9-5c90-4c1a-9f43-82d6585af778.png",
  missions: ICONCDN + "4d057146-8708-4ae0-956e-4b05b1702c9c.png",
  assets: ICONCDN + "ce840721-69e5-4ab1-a89a-4c4d9bbc29f5.png",
  marketplace: ICONCDN + "4712214e-598f-4e39-96b7-539179b0ebd8.png",
  world: ICONCDN + "eca13e72-4b65-4a15-baf2-237cff4e0180.png",
} as const;

// The 5 MVP dock categories (context-aware; see Trays/Dock).
export type DockKind = "staff" | "departments" | "services" | "work" | "control";

export interface DockCategory {
  id: DockKind;
  icon: string; // rendered icon url
  emoji: string; // emoji fallback while art loads
  label: string;
}

export const GRID_HELP =
  "Drag to pan · Scroll to zoom · Open a dock category to build · Click a building to configure / move / remove · Click an agent to chat · Right-click a building for quick options";

// Road tile colors (flat, drawn under buildings & agents).
export const ROAD = {
  fill: "#7d7f88",
  edge: "#5d5f68",
  dash: "#d9c66a",
} as const;

// The 5-category MVP dock. Departments drills into the in-dock placement
// menu; the rest open a full-screen view. Selecting an agent/building turns
// the dock into that thing's command center (see Trays).
export const DOCK: DockCategory[] = [
  { id: "staff", icon: DOCK_ICONS.agents, emoji: "🤖", label: "AI Staff" },
  { id: "departments", icon: DOCK_ICONS.buildings, emoji: "🏢", label: "Departments" },
  { id: "services", icon: DOCK_ICONS.integrations, emoji: "🧰", label: "Services" },
  { id: "work", icon: DOCK_ICONS.missions, emoji: "📋", label: "Work" },
  { id: "control", icon: DOCK_ICONS.workforce, emoji: "📊", label: "Control Center" },
];

// ---- Library / modal content -----------------------------------------------

// Agent Library categories (the "Agents" dock modal).
export const AGENT_LIBRARY: { id: string; emoji: string; label: string; desc: string }[] = [
  { id: "create", emoji: "✨", label: "Create Agent", desc: "Design a custom AI worker from scratch." },
  { id: "import", emoji: "📥", label: "Import Agent", desc: "OpenAI, CrewAI, LangGraph, JSON packages." },
  { id: "chat", emoji: "💬", label: "Chat Agents", desc: "General-purpose conversational helpers." },
  { id: "research", emoji: "🔬", label: "Research Agents", desc: "Web search, reports, knowledge bases." },
  { id: "developer", emoji: "💻", label: "Developer Agents", desc: "Code, automation, deployment." },
  { id: "marketing", emoji: "📣", label: "Marketing Agents", desc: "Campaigns, social, content." },
  { id: "design", emoji: "🎨", label: "Design Agents", desc: "Images, branding, video assets." },
  { id: "sales", emoji: "💼", label: "Sales Agents", desc: "CRM, leads, outreach." },
  { id: "support", emoji: "🎧", label: "Support Agents", desc: "Customer support & tickets." },
  { id: "custom", emoji: "🧩", label: "Custom Agents", desc: "Your bespoke specialists." },
];

// Building Library categories (the "Buildings" dock modal).
// Each provider building is placeable; the rest are showcased as "coming soon"
// facilities so the city library feels complete.
export const BUILDING_LIBRARY: {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  provider?: ProviderId; // if set, placing it spawns this provider's agent
  facility?: FacilityId; // if set, places a 3D facility building (no agent)
}[] = [
  { id: "openai", emoji: "🟢", label: "OpenAI HQ", desc: "Hire an OpenAI agent — you name it.", provider: "openai" },
  { id: "anthropic", emoji: "🟠", label: "Anthropic Studio", desc: "Hire an Anthropic agent — you name it.", provider: "anthropic" },
  { id: "grok", emoji: "🔵", label: "Grok Tower", desc: "Hire an xAI agent — you name it.", provider: "grok" },
  { id: "openrouter", emoji: "🟣", label: "OpenRouter Hub", desc: "Hire a multi-model agent — you name it.", provider: "openrouter" },
  { id: "design-studio", emoji: "🎨", label: "Design Image Studio", desc: "AI image generation via OpenRouter.", facility: "image-studio" },
  { id: "youtube", emoji: "▶️", label: "YouTube Studio", desc: "Video production hub.", facility: "youtube" },
  { id: "research-lab", emoji: "🔬", label: "Research Lab", desc: "Research, reports, knowledge base." },
  { id: "builder-workshop", emoji: "🛠️", label: "Builder Workshop", desc: "App dev, automation, deploys." },
  { id: "social-hub", emoji: "📣", label: "Social Hub", desc: "Social media, campaigns, scheduling." },
  { id: "sales-center", emoji: "💼", label: "Sales Center", desc: "CRM, leads, outreach." },
  { id: "finance-office", emoji: "💰", label: "Finance Office", desc: "Revenue, invoices, budgets." },
];

// Workflows (production systems).
export const WORKFLOWS: { id: string; emoji: string; label: string; desc: string }[] = [
  { id: "tiktok", emoji: "🎵", label: "TikTok Factory", desc: "Daily short-form video at scale." },
  { id: "leadgen", emoji: "🎯", label: "Lead Generation Center", desc: "Find, enrich & qualify leads." },
  { id: "website", emoji: "🌐", label: "Website Factory", desc: "Spin up landing pages fast." },
  { id: "automation", emoji: "⚙️", label: "Automation Factory", desc: "Chain tasks end-to-end." },
  { id: "podcast", emoji: "🎙️", label: "Podcast Factory", desc: "Scripted & produced episodes." },
  { id: "course", emoji: "🎓", label: "Course Factory", desc: "Build & package courses." },
  { id: "newsletter", emoji: "📧", label: "Newsletter Factory", desc: "Research, write, schedule." },
];

// Integration catalog grouped by category (the "Integrations" dock modal).
export const INTEGRATIONS: { group: string; items: { id: string; emoji: string; label: string }[] }[] = [
  {
    group: "AI Providers",
    items: [
      { id: "openai", emoji: "🟢", label: "OpenAI" },
      { id: "anthropic", emoji: "🟠", label: "Anthropic" },
      { id: "gemini", emoji: "🔷", label: "Gemini" },
      { id: "grok", emoji: "🔵", label: "Grok" },
      { id: "deepseek", emoji: "🐳", label: "DeepSeek" },
      { id: "openrouter", emoji: "🟣", label: "OpenRouter" },
      { id: "lmstudio", emoji: "🖥️", label: "LM Studio" },
      { id: "ollama", emoji: "🦙", label: "Ollama" },
    ],
  },
  {
    group: "Development",
    items: [
      { id: "github", emoji: "🐙", label: "GitHub" },
      { id: "vercel", emoji: "▲", label: "Vercel" },
      { id: "supabase", emoji: "⚡", label: "Supabase" },
      { id: "netlify", emoji: "🌐", label: "Netlify" },
    ],
  },
  {
    group: "Productivity",
    items: [
      { id: "google", emoji: "🔎", label: "Google" },
      { id: "notion", emoji: "📓", label: "Notion" },
      { id: "slack", emoji: "💬", label: "Slack" },
      { id: "discord", emoji: "🎮", label: "Discord" },
      { id: "dropbox", emoji: "📦", label: "Dropbox" },
    ],
  },
  {
    group: "Design",
    items: [
      { id: "canva", emoji: "🎨", label: "Canva" },
      { id: "figma", emoji: "🖌️", label: "Figma" },
      { id: "adobe", emoji: "🅰️", label: "Adobe" },
    ],
  },
  {
    group: "Marketing",
    items: [
      { id: "tiktok", emoji: "🎵", label: "TikTok" },
      { id: "instagram", emoji: "📸", label: "Instagram" },
      { id: "facebook", emoji: "👍", label: "Facebook" },
      { id: "youtube", emoji: "▶️", label: "YouTube" },
      { id: "linkedin", emoji: "💼", label: "LinkedIn" },
      { id: "x", emoji: "✖️", label: "X" },
    ],
  },
];

// Workforce sections, Mission sections, Asset sections, Marketplace sections,
// World sections — used as tabs/lists inside their respective modals.
export const WORKFORCE_SECTIONS = ["All Agents", "Teams", "Departments", "Performance", "Revenue", "Assignments"];
export const MISSION_SECTIONS = ["Active Missions", "Completed Missions", "Scheduled Missions", "Templates"];
export const ASSET_SECTIONS = ["Buildings", "Agents", "Models", "Voices", "Images", "Documents", "Knowledge Bases"];
export const MARKETPLACE_SECTIONS = ["Agents", "Buildings", "Workflows", "Plugins", "Themes", "Templates"];
export const WORLD_SECTIONS = ["Cities", "Alliances", "Trade", "Agent Rentals", "Leaderboards"];

// MVP dock sections.
export const WORK_SECTIONS = ["Missions", "Projects", "Campaigns", "Research Tasks", "Build Requests"];
export const CONTROL_SECTIONS = ["API Keys", "Usage", "Analytics", "Agent Registry", "Building Registry", "Billing", "Settings"];

// Town Hall — a physical building (NOT in the dock). Its modal is the OS control center.
export const TOWN_HALL = {
  id: "town-hall",
  name: "Town Hall",
  emoji: "🏛️",
  // Reuse the buildings dock icon as the placed sprite until dedicated art exists.
  art: DOCK_ICONS.buildings,
  color: "#caa24a",
  color2: "#a8852f",
  tabs: [
    "Dashboard",
    "AI Providers",
    "Integrations",
    "Agent Registry",
    "Building Registry",
    "Permissions",
    "Billing",
    "System Settings",
  ],
} as const;
