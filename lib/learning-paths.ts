// ═══════════════════════════════════════════════════════════════════════════════
// Curated career tracks — a lightweight "spine" over the course catalog.
//
// Data only (no DB table): each path is an ORDERED sequence of course slugs that
// leads to a role. The catalog page maps these slugs onto the live `courses` rows
// for titles/colours, so nothing here duplicates course content — it just sequences
// existing courses. Keep slugs in sync with the visible courses in lib/catalog.ts.
// A course may appear in more than one path (shared prerequisite / literacy).
// ═══════════════════════════════════════════════════════════════════════════════

export type LearningPath = {
  slug: string;
  name: string;
  role: string; // the destination role, one line
  tagline: string; // what you'll be able to do
  courseSlugs: string[]; // ORDERED core-course sequence
  comingSoon?: string[]; // course titles that will join this path once launched
};

export const LEARNING_PATHS: LearningPath[] = [
  {
    slug: "ai-engineer",
    name: "AI Engineer",
    role: "Build LLM-powered products & autonomous agents",
    tagline:
      "Go from prompting and RAG to production agents and the protocols that run them.",
    courseSlugs: ["generative-ai", "llm-agent-architect", "agentic-ai"],
  },
  {
    slug: "machine-learning-engineer",
    name: "Machine Learning Engineer",
    role: "Train and ship models from raw data to production",
    tagline:
      "Data foundations, the core ML toolkit, and the classical AI that underpins it.",
    courseSlugs: ["data-science", "machine-learning", "artificial-intelligence"],
  },
  {
    slug: "computer-vision-engineer",
    name: "Computer Vision Engineer",
    role: "Build perception systems for images and video",
    tagline: "Master the ML fundamentals, then specialise in modern vision models.",
    courseSlugs: ["machine-learning", "computer-vision"],
  },
  {
    slug: "full-stack-developer",
    name: "Full-Stack Developer",
    role: "Build and ship complete web applications",
    tagline: "Front to back: UI, APIs, data, and deployment.",
    courseSlugs: ["fullstack-development"],
    comingSoon: ["DevOps Engineering", "Game Development"],
  },
  {
    slug: "cybersecurity-specialist",
    name: "Cybersecurity Specialist",
    role: "Defend systems, networks, and data",
    tagline: "Offensive and defensive security, from fundamentals to hands-on kits.",
    courseSlugs: ["cybersecurity"],
  },
  {
    slug: "ai-product-manager",
    name: "AI Product Manager",
    role: "Lead AI products from idea to launch",
    tagline: "Ship AI features with the technical literacy to make the right calls.",
    courseSlugs: ["ai-product-management", "generative-ai"],
  },
];
