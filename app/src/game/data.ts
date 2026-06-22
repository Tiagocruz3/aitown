// AgentVillage OS — static game data (assets, building & agent catalogs).
// All art is AI-generated (FarmVille / Town Star style) and hosted on CDN.

export const ART = {
  buildings: {
    townhall:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073910_0d0b65b5-4424-4af4-89df-879ef6af68d1.png",
    socialhub:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073912_73a9b21e-b2bc-4d81-923f-a92a064b2029.png",
    researchlab:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073914_7695cbea-ef6f-4786-b132-03cdf9ad2c0f.png",
    builderworkshop:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073916_a2a21e7e-298a-4e88-8e7d-809f804cadff.png",
    designstudio:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073918_ed75f84d-ce3b-4b91-bc43-f7126858255a.png",
    salescenter:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073920_ff95ed9b-310d-40a6-9c7d-0f90318fae7d.png",
    financeoffice:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073922_ea095227-fea2-450a-ac79-b67fd74b2540.png",
  },
  agents: {
    social:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073924_54b1748d-d70b-4639-9bdc-dbab85d070b3.png",
    dev: "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073926_5acd62f8-5f94-43d8-bf63-f4720ab6b502.png",
    research:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073929_3fd0e50f-e316-41e6-9f17-f928052f1cf2.png",
    design:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073931_947c025d-fa19-4341-abbf-8bf49fffed04.png",
    sales:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FNORjZACwRQB6VtB4tX0jmJWhf/hf_20260622_073933_ec0c21d9-410a-4a1e-a42e-c3467aacc3d8.png",
  },
} as const;

export type BuildingKind =
  | "townhall"
  | "socialhub"
  | "researchlab"
  | "builderworkshop"
  | "designstudio"
  | "salescenter"
  | "financeoffice";

export type AgentRole = "social" | "dev" | "research" | "design" | "sales";

export interface BuildingDef {
  kind: BuildingKind;
  name: string;
  desc: string;
  art: string;
  color: string;
  tabs: string[];
  functions: string[];
}

export const BUILDINGS: Record<BuildingKind, BuildingDef> = {
  townhall: {
    kind: "townhall",
    name: "Town Hall",
    desc: "The heart of your AI company. Global settings, providers, billing & registry.",
    art: ART.buildings.townhall,
    color: "#f4b740",
    tabs: ["Overview", "AI Providers", "Integrations", "Registry", "Billing", "Settings"],
    functions: ["Global Settings", "AI Providers", "Integrations", "Agent Registry", "Building Registry", "Permissions", "Billing", "Economy"],
  },
  socialhub: {
    kind: "socialhub",
    name: "Social Hub",
    desc: "Social media, campaigns, scheduling, analytics & content generation.",
    art: ART.buildings.socialhub,
    color: "#ec4899",
    tabs: ["Overview", "Workers", "Campaigns", "Tools", "Analytics", "Settings"],
    functions: ["Social media", "Campaigns", "Scheduling", "Analytics", "Content generation"],
  },
  researchlab: {
    kind: "researchlab",
    name: "Research Lab",
    desc: "Research, reports, web search & a living knowledge base.",
    art: ART.buildings.researchlab,
    color: "#06b6d4",
    tabs: ["Overview", "Workers", "Reports", "Knowledge Base", "Analytics", "Settings"],
    functions: ["Research", "Reports", "Web Search", "Knowledge Base"],
  },
  builderworkshop: {
    kind: "builderworkshop",
    name: "Builder Workshop",
    desc: "App development, automation, GitHub & deployment.",
    art: ART.buildings.builderworkshop,
    color: "#8b5cf6",
    tabs: ["Overview", "Workers", "Projects", "Deploy", "Analytics", "Settings"],
    functions: ["App Development", "Automation", "GitHub", "Deployment"],
  },
  designstudio: {
    kind: "designstudio",
    name: "Design Studio",
    desc: "Images, branding, video assets, Figma & Canva.",
    art: ART.buildings.designstudio,
    color: "#f97316",
    tabs: ["Overview", "Workers", "Assets", "Brand", "Analytics", "Settings"],
    functions: ["Images", "Branding", "Video Assets", "Figma", "Canva"],
  },
  salescenter: {
    kind: "salescenter",
    name: "Sales Center",
    desc: "CRM, leads, outreach & follow-ups.",
    art: ART.buildings.salescenter,
    color: "#22c55e",
    tabs: ["Overview", "Workers", "Leads", "Outreach", "Analytics", "Settings"],
    functions: ["CRM", "Leads", "Outreach", "Follow-ups"],
  },
  financeoffice: {
    kind: "financeoffice",
    name: "Finance Office",
    desc: "Revenue, invoices & budgets.",
    art: ART.buildings.financeoffice,
    color: "#14b8a6",
    tabs: ["Overview", "Workers", "Revenue", "Invoices", "Analytics", "Settings"],
    functions: ["Revenue", "Invoices", "Budgets"],
  },
};

export interface AgentDef {
  role: AgentRole;
  name: string;
  title: string;
  art: string;
  personality: string;
  model: string;
  building: BuildingKind;
  tools: string[];
}

export const AGENT_DEFS: AgentDef[] = [
  {
    role: "social",
    name: "Nova",
    title: "Social Media Agent",
    art: ART.agents.social,
    personality: "Energetic, trend-obsessed, always online.",
    model: "GPT-4o",
    building: "socialhub",
    tools: ["Instagram", "TikTok", "X", "Scheduler", "Analytics"],
  },
  {
    role: "dev",
    name: "Byte",
    title: "Developer Agent",
    art: ART.agents.dev,
    personality: "Precise, methodical, lives in the terminal.",
    model: "Claude 3.7 Sonnet",
    building: "builderworkshop",
    tools: ["GitHub", "Vercel", "Supabase", "Terminal"],
  },
  {
    role: "research",
    name: "Sage",
    title: "Research Agent",
    art: ART.agents.research,
    personality: "Curious, thorough, cites everything.",
    model: "Gemini 2.5 Pro",
    building: "researchlab",
    tools: ["Web Search", "Knowledge Base", "PDF Reader"],
  },
  {
    role: "design",
    name: "Iris",
    title: "Design Agent",
    art: ART.agents.design,
    personality: "Visual, bold, obsessed with aesthetics.",
    model: "GPT-4o",
    building: "designstudio",
    tools: ["Figma", "Canva", "Image Gen", "Brand Kit"],
  },
  {
    role: "sales",
    name: "Max",
    title: "Sales Agent",
    art: ART.agents.sales,
    personality: "Charismatic, persistent, closes deals.",
    model: "Claude 3.7 Sonnet",
    building: "salescenter",
    tools: ["CRM", "Email", "LinkedIn", "Calendar"],
  },
];

export interface DockCategory {
  id: string;
  icon: string;
  label: string;
}

export const GRID_HELP = "Drag to pan · Scroll to zoom · Click a building or agent · Right-click a building for options";

export const DOCK: DockCategory[] = [
  { id: "agents", icon: "🤖", label: "Agents" },
  { id: "buildings", icon: "🏢", label: "Buildings" },
  { id: "workflows", icon: "⚡", label: "Workflows" },
  { id: "integrations", icon: "🔌", label: "Integrations" },
  { id: "workforce", icon: "👥", label: "Workforce" },
  { id: "decorations", icon: "🌳", label: "Decorations" },
  { id: "marketplace", icon: "🛒", label: "Marketplace" },
  { id: "world", icon: "🌍", label: "World" },
];
