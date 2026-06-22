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
  // The branded agent that spawns with this building:
  agent: {
    name: string;
    title: string;
    personality: string;
    greeting: string;
    voice: string; // how the agent "talks" in mock replies
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
      name: "Nova",
      title: "OpenAI Agent",
      personality: "Fast, helpful, endlessly capable.",
      greeting:
        "Hi, I'm Nova, your OpenAI agent. Ask me anything and I'll get to work.",
      voice: "crisp and upbeat",
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
      name: "Claude",
      title: "Anthropic Agent",
      personality: "Thoughtful, careful, warm.",
      greeting:
        "Hello, I'm Claude, your Anthropic agent. I'm happy to help — what shall we work on?",
      voice: "warm and considered",
    },
    apiBase: "https://api.anthropic.com/v1",
    apiKeyHint: "sk-ant-...",
    models: [
      { id: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
      { id: "claude-3-opus", label: "Claude 3 Opus" },
    ],
    defaultModel: "claude-3-7-sonnet",
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
      name: "Grok",
      title: "xAI Agent",
      personality: "Witty, blunt, a little rebellious.",
      greeting:
        "Yo, Grok here — xAI's finest. Fire away, I don't do boring answers.",
      voice: "witty and irreverent",
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
      name: "Router",
      title: "OpenRouter Agent",
      personality: "Resourceful, routes you to the best model for the job.",
      greeting:
        "Hey, I'm Router. I can reach hundreds of models through OpenRouter — what do you need?",
      voice: "smart and resourceful",
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

// ---- Dock -------------------------------------------------------------------

// Town Star-style rendered dock icons (glossy 3D, transparent PNG).
export const DOCK_ICONS = {
  agents: CDN + "hf_20260622_091949_0c28e160-7a85-465b-af5d-87a9302ba757.png",
  buildings: CDN + "hf_20260622_091951_a48c5078-bd9a-4855-965d-9e1eab6e4d95.png",
  workflows: CDN + "hf_20260622_091953_4a135791-fd17-49d4-bd59-b821db101e88.png",
  integrations:
    CDN + "hf_20260622_091957_21a3f884-be1f-403a-be93-84e5c470a96e.png",
  workforce: CDN + "hf_20260622_091959_b38446cc-0ae6-4a9f-acc6-4b0d5aec5eee.png",
  missions: CDN + "hf_20260622_092001_bc644f75-da91-4097-a10d-0567fc8939d9.png",
  assets: CDN + "hf_20260622_092003_7967c902-d359-434c-99fd-8db19123558c.png",
  marketplace:
    CDN + "hf_20260622_092005_b0c4c365-b2e8-4b9c-b129-e31d8235c74e.png",
  world: CDN + "hf_20260622_092008_1dad692a-ff19-43dd-be4d-a0c1786454e5.png",
} as const;

// Modal kinds opened by each dock category.
export type DockKind =
  | "agents"
  | "buildings"
  | "workflows"
  | "integrations"
  | "workforce"
  | "missions"
  | "assets"
  | "marketplace"
  | "world"
  | "roads";

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

// The 9-category dock, in the spec order.
export const DOCK: DockCategory[] = [
  { id: "agents", icon: DOCK_ICONS.agents, emoji: "🤖", label: "Agents" },
  { id: "buildings", icon: DOCK_ICONS.buildings, emoji: "🏢", label: "Buildings" },
  { id: "workflows", icon: DOCK_ICONS.workflows, emoji: "⚡", label: "Workflows" },
  {
    id: "integrations",
    icon: DOCK_ICONS.integrations,
    emoji: "🔌",
    label: "Integrations",
  },
  { id: "workforce", icon: DOCK_ICONS.workforce, emoji: "👥", label: "Workforce" },
  { id: "missions", icon: DOCK_ICONS.missions, emoji: "📋", label: "Missions" },
  { id: "assets", icon: DOCK_ICONS.assets, emoji: "📦", label: "Assets" },
  {
    id: "marketplace",
    icon: DOCK_ICONS.marketplace,
    emoji: "🛒",
    label: "Marketplace",
  },
  { id: "world", icon: DOCK_ICONS.world, emoji: "🌍", label: "World" },
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
}[] = [
  { id: "openai", emoji: "🟢", label: "OpenAI HQ", desc: "Spawns Nova, your OpenAI agent.", provider: "openai" },
  { id: "anthropic", emoji: "🟠", label: "Anthropic Studio", desc: "Spawns Claude, your Anthropic agent.", provider: "anthropic" },
  { id: "grok", emoji: "🔵", label: "Grok Tower", desc: "Spawns Grok, your xAI agent.", provider: "grok" },
  { id: "openrouter", emoji: "🟣", label: "OpenRouter Hub", desc: "Spawns Router, multi-model access.", provider: "openrouter" },
  { id: "research-lab", emoji: "🔬", label: "Research Lab", desc: "Research, reports, knowledge base." },
  { id: "builder-workshop", emoji: "🛠️", label: "Builder Workshop", desc: "App dev, automation, deploys." },
  { id: "social-hub", emoji: "📣", label: "Social Hub", desc: "Social media, campaigns, scheduling." },
  { id: "design-studio", emoji: "🎨", label: "Design Studio", desc: "Images, branding, video." },
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
