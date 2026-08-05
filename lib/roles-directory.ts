// ═══════════════════════════════════════════════════════════════════════════════
// AI roles directory — the public, citable map of "what job does this lead to?"
//
// Why this exists: answer engines cite first-party, verifiable pages. A mirror
// of someone else's company list gets the SOURCE cited, not us. What we can own
// outright is the link between a role and the curriculum that reaches it —
// nobody else has that data.
//
// Split of responsibilities:
//   - Editorial copy (summary, responsibilities, aliases) lives HERE.
//   - "Skills you'll build" is NOT written here — the role page reads real
//     module titles from the DB, so the page can never claim a skill the
//     curriculum doesn't actually teach.
//   - Salary renders ONLY when `salary.source` is present. See RoleSalary.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * A salary figure may only be published with its provenance attached. The site
 * already carries uncited "$130–200k" ranges on the landing course grid; those
 * are exactly the kind of claim an answer engine will lift and attribute to us,
 * so this directory refuses to render a number that has no source behind it.
 *
 * To publish one: fill this in from a named survey (Levels.fyi, Stack Overflow
 * Developer Survey, SEEK, the ABS) including the year the figure is FOR, and
 * the role page and its Occupation schema will start emitting it automatically.
 */
export type RoleSalary = {
  /** Display range, e.g. "130,000–200,000". No currency symbol — see `currency`. */
  range: string;
  /** ISO 4217, e.g. "USD", "AUD". Stated explicitly: a bare "$" is ambiguous. */
  currency: string;
  /** The market the figure describes, e.g. "United States". */
  region: string;
  /** Provenance. Without this the figure is not rendered and not emitted. */
  source: { name: string; url: string; year: number };
};

export type RoleLane = "career" | "work";

export type Role = {
  slug: string;
  /** The job title as it appears on real job ads. */
  title: string;
  lane: RoleLane;
  /** Other titles the same job is advertised under. Helps entity matching. */
  alsoKnownAs: string[];
  /** One or two sentences: what this person actually does. */
  summary: string;
  /** Day-to-day work. Plain, checkable statements — no aspirational filler. */
  responsibilities: string[];
  /**
   * Course slugs that train for this role. These are also the /diagnostic/{slug}
   * URLs — the public face of each course — and the source of the module list
   * rendered as "skills you'll build".
   */
  courseSlugs: string[];
  /** Only set alongside a source. See RoleSalary. */
  salary?: RoleSalary;
};

export const ROLES: Role[] = [
  // ── Career lane — roles you train into by writing code ─────────────────────
  {
    slug: "ai-engineer",
    title: "AI Engineer",
    lane: "career",
    alsoKnownAs: ["Generative AI Engineer", "LLM Engineer", "Applied AI Engineer"],
    summary:
      "Builds products on top of large language models — retrieval pipelines, assistants and AI features inside existing software. Less model training than model application: the hard part is making a probabilistic system behave reliably in production.",
    responsibilities: [
      "Design and ship retrieval-augmented generation (RAG) pipelines over company data",
      "Choose models and tune inference controls for cost, latency and reliability",
      "Defend against prompt injection and unsafe output before anything reaches users",
      "Evaluate AI features with real test sets rather than impressions",
      "Integrate model APIs into existing products and own them in production",
    ],
    courseSlugs: ["generative-ai", "artificial-intelligence"],
  },
  {
    slug: "machine-learning-engineer",
    title: "Machine Learning Engineer",
    lane: "career",
    alsoKnownAs: ["ML Engineer", "MLOps Engineer"],
    summary:
      "Trains, evaluates and deploys machine-learning models, then keeps them working as data shifts underneath them. Sits between data science and software engineering, and is accountable for the model in production.",
    responsibilities: [
      "Build training pipelines and select features from raw data",
      "Diagnose overfitting and choose evaluation metrics that survive class imbalance",
      "Tune optimisation and regularisation rather than accepting library defaults",
      "Deploy models behind APIs and monitor for drift and degradation",
      "Retrain and version models as the underlying data changes",
    ],
    courseSlugs: ["machine-learning"],
  },
  {
    slug: "data-scientist",
    title: "Data Scientist",
    lane: "career",
    alsoKnownAs: ["Product Data Scientist", "Quantitative Analyst"],
    summary:
      "Turns raw data into decisions — designing the analysis, running it honestly, and telling the organisation what it does and does not support. The output is a decision someone can act on, not a chart.",
    responsibilities: [
      "Frame a business question as something data can actually answer",
      "Design and read experiments, including A/B tests, without fooling yourself",
      "Build cohort, retention and forecasting analyses from source data",
      "Quantify uncertainty and state it plainly to non-technical stakeholders",
      "Automate recurring analysis so it stops being manual",
    ],
    courseSlugs: ["data-science"],
  },
  {
    slug: "security-engineer",
    title: "Security Engineer",
    lane: "career",
    alsoKnownAs: ["Cybersecurity Engineer", "Application Security Engineer", "AppSec Engineer"],
    summary:
      "Finds and closes the ways a system can be broken into, before someone else finds them. Covers application, cloud and identity security, plus the governance work that proves controls exist.",
    responsibilities: [
      "Threat-model systems and prioritise what is actually exploitable",
      "Test applications for injection, broken authentication and access-control flaws",
      "Harden cloud configuration, secrets handling and identity boundaries",
      "Respond to incidents and write up what happened and why",
      "Evidence controls against a recognised framework for audit",
    ],
    courseSlugs: ["cybersecurity"],
  },
  {
    slug: "full-stack-engineer",
    title: "Full Stack Engineer",
    lane: "career",
    alsoKnownAs: ["Software Engineer", "Full Stack Developer", "Product Engineer"],
    summary:
      "Builds and ships complete web products — interface, server, database and deployment. The generalist role most AI products are actually built by.",
    responsibilities: [
      "Build user interfaces and the APIs behind them",
      "Model data and write the queries that keep pages fast",
      "Implement authentication, authorisation and payments safely",
      "Deploy, monitor and debug applications in production",
      "Add AI features to existing products without destabilising them",
    ],
    courseSlugs: ["fullstack-development"],
  },
  {
    slug: "computer-vision-engineer",
    title: "Computer Vision Engineer",
    lane: "career",
    alsoKnownAs: ["CV Engineer", "Perception Engineer", "Vision Systems Engineer"],
    summary:
      "Builds systems that interpret images and video — detection, segmentation, tracking and OCR — and makes them run fast enough to be useful on real footage.",
    responsibilities: [
      "Build image-processing and convolutional-network pipelines",
      "Train and evaluate object detection and segmentation models",
      "Track objects across frames in real-time video",
      "Optimise inference for latency and hardware constraints",
      "Handle messy real-world capture: lighting, occlusion and scale",
    ],
    courseSlugs: ["computer-vision"],
  },
  {
    slug: "llm-agent-architect",
    title: "LLM Agent Architect",
    lane: "career",
    alsoKnownAs: ["AI Agent Engineer", "Agent Systems Engineer"],
    summary:
      "Designs the architecture of systems where language models take actions — tool use, memory, planning and the protocols that let agents talk to other software safely.",
    responsibilities: [
      "Design tool-use interfaces and decide what an agent is permitted to do",
      "Architect memory and context strategies that survive long tasks",
      "Wire agents into external systems over protocols such as MCP",
      "Build guardrails, approval steps and audit trails around agent actions",
      "Evaluate agent reliability on tasks rather than on single responses",
    ],
    courseSlugs: ["llm-agent-architect"],
  },
  {
    slug: "agentic-ai-engineer",
    title: "Agentic AI Engineer",
    lane: "career",
    alsoKnownAs: ["Autonomous Systems Engineer", "AI Automation Engineer"],
    summary:
      "Builds and operates autonomous agents at production scale — multi-agent orchestration, long-running workflows, and the monitoring that keeps them from quietly going wrong.",
    responsibilities: [
      "Build agents that complete multi-step tasks without a human in every loop",
      "Orchestrate multiple agents and resolve conflicts between them",
      "Instrument agent runs so failures are diagnosable after the fact",
      "Control cost and runaway behaviour in long-running autonomy",
      "Deploy and operate agent systems against real workloads",
    ],
    courseSlugs: ["agentic-ai"],
  },
  {
    slug: "ai-product-manager",
    title: "AI Product Manager",
    lane: "career",
    alsoKnownAs: ["AI PM", "Technical Product Manager, AI"],
    summary:
      "Decides what AI product gets built and why. Owns the problem, the success measures and the trade-offs — including when the honest answer is that AI is the wrong tool.",
    responsibilities: [
      "Identify problems where AI genuinely beats the deterministic alternative",
      "Write specifications engineers can build from, including failure behaviour",
      "Define evaluation criteria and acceptable error rates before launch",
      "Run user research and translate findings into roadmap decisions",
      "Plan go-to-market and pricing for a product with variable output quality",
    ],
    courseSlugs: ["ai-product-management"],
  },

  // ── Work lane — existing jobs, done better with AI. No code. ───────────────
  {
    slug: "marketer",
    title: "Marketer",
    lane: "work",
    alsoKnownAs: ["Marketing Manager", "Content Marketer", "Growth Marketer"],
    summary:
      "Uses AI assistants as a copywriter, strategist and analyst — producing on-brand campaigns, emails, ads and reporting at a volume that was previously impossible, without outsourcing judgment.",
    responsibilities: [
      "Produce on-brand copy at scale across campaigns, emails, ads and landing pages",
      "Draft creative briefs and campaign strategy with AI as a thinking partner",
      "Analyse campaign performance and write the reporting narrative",
      "Build reusable prompts so output stays consistent across a team",
      "Keep claims accurate — AI drafts, the marketer remains accountable",
    ],
    courseSlugs: ["ai-for-marketers"],
  },
  {
    slug: "finance-professional",
    title: "Finance Professional",
    lane: "work",
    alsoKnownAs: ["Financial Analyst", "Accountant", "Finance Manager", "Bookkeeper"],
    summary:
      "Applies AI to analysis, month-end, forecasting and board reporting — with the verification discipline finance requires, because an unchecked number is worse than no number.",
    responsibilities: [
      "Accelerate spreadsheet analysis and reconciliation work",
      "Draft variance commentary and management reporting",
      "Build and pressure-test forecasts and scenarios",
      "Prepare board packs and client communication",
      "Verify every AI-produced figure before it leaves your desk",
    ],
    courseSlugs: ["ai-for-finance"],
  },
  {
    slug: "founder",
    title: "Founder",
    lane: "work",
    alsoKnownAs: ["Startup Founder", "Small Business Owner", "Solo Operator"],
    summary:
      "Runs every function with no team to delegate to. Uses AI as the first hire they can afford — validating ideas, writing the pitch, selling, and running operations.",
    responsibilities: [
      "Validate ideas and pressure-test strategy against a critical counterpart",
      "Write pitch material, investor updates and sales copy",
      "Specify what gets built clearly enough for a developer or agency",
      "Run day-to-day operations, admin and customer communication",
      "Own the numbers — and check the ones AI produces",
    ],
    courseSlugs: ["ai-for-founders"],
  },
  {
    slug: "teacher",
    title: "Teacher",
    lane: "work",
    alsoKnownAs: ["Educator", "Lecturer", "Instructional Designer"],
    summary:
      "Hands the preparation mountain to AI — lesson plans, differentiation, resources, feedback and reports — while pedagogy, accuracy and duty of care stay with the teacher.",
    responsibilities: [
      "Plan lessons and differentiate material for varied levels",
      "Generate resources, worksheets and assessment items",
      "Draft feedback and reports without losing individual detail",
      "Handle parent communication and administrative writing",
      "Teach AI literacy and design AI-aware assessment for students",
    ],
    courseSlugs: ["ai-for-teachers"],
  },
  {
    slug: "project-manager",
    title: "Project Manager",
    lane: "work",
    alsoKnownAs: ["Delivery Manager", "Programme Manager", "Scrum Master"],
    summary:
      "Uses AI across the delivery cycle — requirements, planning, risk and stakeholder reporting — and builds no-code assistants that absorb the recurring administrative load.",
    responsibilities: [
      "Gather and clarify requirements from messy stakeholder input",
      "Build plans, estimates and risk registers",
      "Produce status reporting tailored to each audience",
      "Summarise meetings into decisions and owned actions",
      "Assemble no-code project assistants for recurring work",
    ],
    courseSlugs: ["ai-for-project-managers"],
  },
  {
    slug: "sales-professional",
    title: "Sales Professional",
    lane: "work",
    alsoKnownAs: ["Account Executive", "Sales Development Representative", "Account Manager"],
    summary:
      "Pushes the admin half of selling onto AI — research, outreach drafts, call prep, follow-ups and proposals — to spend more hours actually in front of buyers.",
    responsibilities: [
      "Research accounts and buying committees before outreach",
      "Draft personalised outreach grounded in real research, never invented",
      "Prepare for calls and capture follow-ups afterwards",
      "Produce proposals and answer objections with accurate claims",
      "Keep pipeline hygiene current without losing an afternoon to it",
    ],
    courseSlugs: ["ai-for-sales"],
  },
  {
    slug: "operations-manager",
    title: "Operations Manager",
    lane: "work",
    alsoKnownAs: ["Supply Chain Analyst", "Operations Analyst", "Logistics Manager"],
    summary:
      "Applies AI to forecasting, procurement, logistics exceptions and the institutional knowledge that usually lives in one person's head.",
    responsibilities: [
      "Build demand forecasts and read them critically",
      "Handle procurement analysis and supplier comparison",
      "Triage logistics exceptions and draft the resulting communication",
      "Turn scattered SOPs into a searchable knowledge base",
      "Automate recurring operational reporting",
    ],
    courseSlugs: ["ai-for-operations"],
  },
  {
    slug: "creator",
    title: "Creator",
    lane: "work",
    alsoKnownAs: ["Content Creator", "YouTuber", "Podcaster", "Newsletter Writer"],
    summary:
      "Uses AI as a writers' room — ideas, scripts, show notes and repurposing one idea into ten assets — while still sounding like themselves rather than like a model.",
    responsibilities: [
      "Generate and filter content ideas continuously",
      "Draft scripts, outlines and show notes",
      "Repurpose one piece of work across multiple formats and platforms",
      "Write sponsor pitches and audience communication",
      "Preserve a distinctive voice rather than defaulting to AI register",
    ],
    courseSlugs: ["ai-for-creators"],
  },
  {
    slug: "student",
    title: "Student",
    lane: "work",
    alsoKnownAs: ["University Student", "Postgraduate Researcher"],
    summary:
      "Uses AI as a personal tutor rather than a shortcut — active reading, guided problem-solving and study systems that build understanding instead of replacing it.",
    responsibilities: [
      "Read actively, using AI to interrogate material rather than summarise it away",
      "Work through problems with guidance instead of answers",
      "Plan essays and structure arguments",
      "Build a personal study system and revision schedule",
      "Stay inside academic-integrity rules while using AI openly",
    ],
    courseSlugs: ["ai-for-students"],
  },
];

export function getRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}

export const CAREER_ROLES = ROLES.filter((r) => r.lane === "career");
export const WORK_ROLES = ROLES.filter((r) => r.lane === "work");
