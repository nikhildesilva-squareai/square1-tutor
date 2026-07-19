// Curated "AI tools for your work" directory.
//
// This is intentionally NOT a mega-directory. It's a small, opinionated,
// hand-picked set of tools per role, whose job is to help a non-technical
// person pick the right tool AND then learn to use it well (funnel → free course).
//
// HONESTY RULES for anyone editing this file:
//  - Real tools only, official vendor URLs only. No affiliate/referral links.
//  - `what` = a plain, accurate description of what the tool does.
//  - `useFor` / `avoid` = our honest guidance, not vendor marketing.
//  - Pricing is a COARSE tier (changes constantly) — never quote dollar amounts here.
//  - We do not endorse; featured = editorially useful for beginners, not paid placement.

export type Pricing = "Free" | "Freemium" | "Paid";

export interface Tool {
  name: string;
  role: RoleKey;
  what: string; // one accurate sentence: what it does
  useFor: string; // when to reach for it
  avoid: string; // when NOT to trust/use it
  pricing: Pricing;
  url: string; // official vendor site
  featured?: boolean; // good starting point for beginners
}

export type RoleKey =
  | "everyone"
  | "marketing"
  | "sales"
  | "finance"
  | "people"
  | "operations";

export const ROLES: { key: RoleKey; label: string; blurb: string }[] = [
  { key: "everyone", label: "Everyone", blurb: "The core tools worth knowing whatever your job." },
  { key: "marketing", label: "Marketing", blurb: "Content, campaigns, creative, and SEO." },
  { key: "sales", label: "Sales", blurb: "Prospecting, outreach, and call intelligence." },
  { key: "finance", label: "Finance & Data", blurb: "Spreadsheets, analysis, and reporting." },
  { key: "people", label: "People & HR", blurb: "Hiring, writing, and internal comms." },
  { key: "operations", label: "Operations & PM", blurb: "Notes, docs, and workflow automation." },
];

export const PRICING_TIERS: Pricing[] = ["Free", "Freemium", "Paid"];

export const PRICING_NOTE =
  "Pricing tiers are indicative and change often — check the vendor for current plans. " +
  "These are curated picks and guidance, not endorsements, and we take no referral fees.";

export const TOOLS: Tool[] = [
  // ── EVERYONE ─────────────────────────────────────────────────────────────
  {
    name: "Microsoft Copilot",
    role: "everyone",
    what: "AI assistant built into Word, Excel, Outlook, Teams and Windows.",
    useFor: "First drafts, summarising long email threads and meetings, rewriting in a set tone.",
    avoid: "Trusting its figures or citations blind — always check numbers and facts it pulls in.",
    pricing: "Freemium",
    url: "https://www.microsoft.com/microsoft-copilot",
    featured: true,
  },
  {
    name: "ChatGPT",
    role: "everyone",
    what: "General-purpose chat assistant for writing, analysis, and brainstorming.",
    useFor: "Drafting, explaining a hard concept simply, turning messy notes into structure.",
    avoid: "Anything where being confidently wrong is costly without you checking the source.",
    pricing: "Freemium",
    url: "https://chatgpt.com",
    featured: true,
  },
  {
    name: "Google Gemini",
    role: "everyone",
    what: "Google's assistant, tied into Gmail, Docs, Sheets and Search.",
    useFor: "Working inside Google Workspace, quick research with links you can verify.",
    avoid: "Assuming its search answers are complete — open the sources it lists.",
    pricing: "Freemium",
    url: "https://gemini.google.com",
  },
  {
    name: "Claude",
    what: "Assistant known for careful long-document reading and writing.",
    role: "everyone",
    useFor: "Long reports, policy docs, structured writing where nuance and tone matter.",
    avoid: "Live web facts on the free tier — it isn't a search engine by default.",
    pricing: "Freemium",
    url: "https://claude.ai",
  },
  {
    name: "Perplexity",
    role: "everyone",
    what: "Answer engine that cites its sources as it responds.",
    useFor: "Quick research when you want the answer AND the links to check it.",
    avoid: "Deep original analysis — it's a research shortcut, not a strategist.",
    pricing: "Freemium",
    url: "https://www.perplexity.ai",
    featured: true,
  },
  {
    name: "NotebookLM",
    role: "everyone",
    what: "Google tool that answers questions grounded only in documents you upload.",
    useFor: "Q&A over your own PDFs, notes, and reports — answers stay tied to your sources.",
    avoid: "General knowledge questions — it only knows what you give it (that's the point).",
    pricing: "Free",
    url: "https://notebooklm.google.com",
  },
  {
    name: "Grammarly",
    role: "everyone",
    what: "Writing assistant for grammar, clarity, and tone across apps.",
    useFor: "Cleaning up tone and errors in email and docs before you hit send.",
    avoid: "Relying on it for facts — it fixes how you write, not whether you're right.",
    pricing: "Freemium",
    url: "https://www.grammarly.com",
  },
  {
    name: "Otter.ai",
    role: "everyone",
    what: "Live transcription and summaries for meetings and calls.",
    useFor: "Capturing action items so you can be present in the meeting, not typing.",
    avoid: "Recording people without telling them — check consent and your policy first.",
    pricing: "Freemium",
    url: "https://otter.ai",
  },

  // ── MARKETING ────────────────────────────────────────────────────────────
  {
    name: "Jasper",
    role: "marketing",
    what: "Marketing-focused writing tool with brand-voice and campaign templates.",
    useFor: "Scaling on-brand copy across ads, emails, and landing pages.",
    avoid: "Publishing unedited — it's a fast first draft, not a finished campaign.",
    pricing: "Paid",
    url: "https://www.jasper.ai",
  },
  {
    name: "Copy.ai",
    role: "marketing",
    what: "AI copywriter for short-form marketing and sales content.",
    useFor: "Blasting out subject lines, ad variants, and social captions to test.",
    avoid: "Long-form thought leadership — quality thins out past short copy.",
    pricing: "Freemium",
    url: "https://www.copy.ai",
  },
  {
    name: "Canva Magic Studio",
    role: "marketing",
    what: "AI features inside Canva for design, image edits, and copy.",
    useFor: "Non-designers making decent social graphics and decks fast.",
    avoid: "Brand-critical hero assets — bring a designer for the flagship work.",
    pricing: "Freemium",
    url: "https://www.canva.com/magic",
    featured: true,
  },
  {
    name: "Descript",
    role: "marketing",
    what: "Edit audio and video by editing the transcript, like a doc.",
    useFor: "Cutting podcasts and clips without learning a full video editor.",
    avoid: "High-end broadcast production — it's for speed, not finishing polish.",
    pricing: "Freemium",
    url: "https://www.descript.com",
  },
  {
    name: "ElevenLabs",
    role: "marketing",
    what: "Realistic AI voice generation and voice cloning.",
    useFor: "Voiceovers for explainer videos and ads without a recording booth.",
    avoid: "Cloning any voice you don't have clear permission to use.",
    pricing: "Freemium",
    url: "https://elevenlabs.io",
  },
  {
    name: "Synthesia",
    role: "marketing",
    what: "Turns a script into a video with an AI presenter.",
    useFor: "Training videos and product explainers at scale, in many languages.",
    avoid: "Emotional or brand-defining stories — avatars still read as synthetic.",
    pricing: "Paid",
    url: "https://www.synthesia.io",
  },
  {
    name: "Surfer SEO",
    role: "marketing",
    what: "Optimises content against what's ranking for a target keyword.",
    useFor: "Briefing and grading blog posts so they have a shot at ranking.",
    avoid: "Writing for the algorithm at the cost of something a human wants to read.",
    pricing: "Paid",
    url: "https://surferseo.com",
  },
  {
    name: "Midjourney",
    role: "marketing",
    what: "High-quality AI image generation from text prompts.",
    useFor: "Concept art, mood boards, and striking original imagery.",
    avoid: "Precise brand assets, real logos, or anything needing exact text in-image.",
    pricing: "Paid",
    url: "https://www.midjourney.com",
  },

  // ── SALES ────────────────────────────────────────────────────────────────
  {
    name: "Gong",
    role: "sales",
    what: "Records and analyses sales calls to surface what wins deals.",
    useFor: "Coaching reps and spotting risk in the pipeline from real call data.",
    avoid: "Skipping consent — call recording has legal rules by region.",
    pricing: "Paid",
    url: "https://www.gong.io",
  },
  {
    name: "Apollo.io",
    role: "sales",
    what: "Prospecting database plus AI outreach and sequencing.",
    useFor: "Building targeted lead lists and drafting first-touch emails fast.",
    avoid: "Spraying generic AI emails — personalise or it hits spam and hurts your domain.",
    pricing: "Freemium",
    url: "https://www.apollo.io",
    featured: true,
  },
  {
    name: "Clay",
    role: "sales",
    what: "Enriches lead lists and automates research with AI on top.",
    useFor: "Turning a thin list into rich, personalised outreach at scale.",
    avoid: "Using it before you can do the research manually — garbage in, garbage out.",
    pricing: "Paid",
    url: "https://www.clay.com",
  },
  {
    name: "Lavender",
    role: "sales",
    what: "Real-time coach that scores and improves your sales emails.",
    useFor: "Tightening cold emails so they're shorter and get more replies.",
    avoid: "Treating its score as truth — a high score isn't a guaranteed reply.",
    pricing: "Freemium",
    url: "https://www.lavender.ai",
  },
  {
    name: "HubSpot AI",
    role: "sales",
    what: "AI baked into HubSpot's CRM for drafting, summarising, and forecasting.",
    useFor: "Logging, follow-ups, and content if you already live in HubSpot.",
    avoid: "Buying the CRM just for the AI — the value is in the CRM being your system.",
    pricing: "Freemium",
    url: "https://www.hubspot.com",
  },

  // ── FINANCE & DATA ───────────────────────────────────────────────────────
  {
    name: "Copilot in Excel",
    role: "finance",
    what: "Generates formulas, analysis, and charts from plain-English asks in Excel.",
    useFor: "Getting un-stuck on a formula or exploring a dataset without deep Excel skills.",
    avoid: "Trusting outputs on real numbers without checking — verify every figure.",
    pricing: "Paid",
    url: "https://www.microsoft.com/microsoft-copilot",
    featured: true,
  },
  {
    name: "ChatGPT Data Analysis",
    role: "finance",
    what: "Upload a spreadsheet and it runs analysis and makes charts for you.",
    useFor: "Ad-hoc analysis and quick charts when you'd struggle to write the formulas.",
    avoid: "Sensitive or confidential data — know your company's rules before uploading.",
    pricing: "Freemium",
    url: "https://chatgpt.com",
  },
  {
    name: "Rows",
    role: "finance",
    what: "A spreadsheet with AI and live data connectors built in.",
    useFor: "Dashboards that pull live data without wiring up a BI tool.",
    avoid: "Replacing your system of record — treat it as a fast analysis layer.",
    pricing: "Freemium",
    url: "https://rows.com",
  },
  {
    name: "Copilot in Power BI",
    role: "finance",
    what: "Ask questions of your dashboards and build reports in plain English.",
    useFor: "Getting a narrative summary of a report for people who won't read the charts.",
    avoid: "Assuming the summary caught the nuance — read the underlying data too.",
    pricing: "Paid",
    url: "https://www.microsoft.com/power-bi",
  },

  // ── PEOPLE & HR ──────────────────────────────────────────────────────────
  {
    name: "Textio",
    role: "people",
    what: "Analyses job posts and reviews for biased or off-tone language.",
    useFor: "Writing inclusive, effective job ads and performance feedback.",
    avoid: "Outsourcing judgment — it flags language, it doesn't make the call for you.",
    pricing: "Paid",
    url: "https://textio.com",
  },
  {
    name: "Copilot for HR drafting",
    role: "people",
    what: "Using Copilot or ChatGPT to draft JDs, policies, and comms.",
    useFor: "First drafts of job descriptions, offer emails, and policy summaries.",
    avoid: "Putting real employee data into a public tool — anonymise first.",
    pricing: "Freemium",
    url: "https://www.microsoft.com/microsoft-copilot",
    featured: true,
  },
  {
    name: "Read AI",
    role: "people",
    what: "Meeting summaries plus engagement and sentiment signals.",
    useFor: "Recaps and action items across a lot of internal meetings.",
    avoid: "Reading too much into 'sentiment' scores — they're a hint, not a verdict.",
    pricing: "Freemium",
    url: "https://www.read.ai",
  },

  // ── OPERATIONS & PM ──────────────────────────────────────────────────────
  {
    name: "Notion AI",
    role: "operations",
    what: "AI inside Notion for writing, summarising, and querying your workspace.",
    useFor: "Turning meeting notes into docs and asking questions across your wiki.",
    avoid: "Relying on it if your Notion is messy — it answers from what's there.",
    pricing: "Paid",
    url: "https://www.notion.com/product/ai",
  },
  {
    name: "Zapier AI",
    role: "operations",
    what: "Automates workflows across apps, now with AI steps and an assistant.",
    useFor: "Wiring up 'when X happens, do Y' between your tools without code.",
    avoid: "Automating a broken process — fix the process first, then automate it.",
    pricing: "Freemium",
    url: "https://zapier.com/ai",
    featured: true,
  },
  {
    name: "Make",
    role: "operations",
    what: "Visual automation builder for multi-step workflows across apps.",
    useFor: "More complex automations than Zapier, laid out visually.",
    avoid: "Starting here if you're new — it's powerful but steeper to learn.",
    pricing: "Freemium",
    url: "https://www.make.com",
  },
  {
    name: "Fireflies.ai",
    role: "operations",
    what: "Meeting notetaker that records, transcribes, and summarises calls.",
    useFor: "A searchable record of decisions and actions across many meetings.",
    avoid: "Auto-joining every call — tell attendees, and skip sensitive ones.",
    pricing: "Freemium",
    url: "https://fireflies.ai",
  },
  {
    name: "ClickUp Brain",
    role: "operations",
    what: "AI inside ClickUp for summarising tasks, docs, and project updates.",
    useFor: "Status updates and doc drafting if ClickUp is your project hub.",
    avoid: "Adopting a new PM tool just for the AI — the AI follows your workflow.",
    pricing: "Paid",
    url: "https://clickup.com/ai",
  },
];

export function toolsByRole(role: RoleKey | "all"): Tool[] {
  return role === "all" ? TOOLS : TOOLS.filter((t) => t.role === role);
}

export const TOOL_COUNT = TOOLS.length;
