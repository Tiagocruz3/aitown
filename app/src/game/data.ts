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

export interface DockCategory {
  id: string;
  icon: string; // emoji fallback
  label: string;
  kind: "chat-agents" | "buildings" | "panel";
}

export const GRID_HELP =
  "Drag to pan · Scroll to zoom · Place a provider building to spawn its agent · Click an agent to chat · Click a building for settings · Right-click a building for options";

// First category is Chat Agents, then the 4 provider Buildings, then panels.
export const DOCK: DockCategory[] = [
  { id: "chat-agents", icon: "💬", label: "Chat Agents", kind: "chat-agents" },
  { id: "buildings", icon: "🏢", label: "Buildings", kind: "buildings" },
  { id: "workforce", icon: "👥", label: "Workforce", kind: "panel" },
  { id: "integrations", icon: "🔌", label: "Integrations", kind: "panel" },
  { id: "marketplace", icon: "🛒", label: "Marketplace", kind: "panel" },
  { id: "world", icon: "🌍", label: "World", kind: "panel" },
];
