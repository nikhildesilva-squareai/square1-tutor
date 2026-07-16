// ═══════════════════════════════════════════════════════════════════════════════
// Mini-diagnostic question bank — the no-signup, 3-minute on-ramp.
//
// Five MCQs per track. The point is NOT a rigorous assessment (that's the full
// signed-in version) — it's a fast taste that produces a teaser skill snapshot
// and funnels into the real free assessment.
//
// Tracks without a bespoke set fall back to GENERAL. Expand any time.
// ═══════════════════════════════════════════════════════════════════════════════

export interface DiagQuestion {
  stem: string;
  options: string[];
  correct: number; // index into options
  topic: string;
}

const GENERATIVE_AI: DiagQuestion[] = [
  {
    stem: "What does an LLM's 'context window' refer to?",
    options: ["Its training data size", "How much text it can consider at once", "The UI chat box", "Its number of parameters"],
    correct: 1, topic: "LLM fundamentals",
  },
  {
    stem: "RAG (Retrieval-Augmented Generation) mainly helps a model by…",
    options: ["Making it train faster", "Giving it relevant external context at query time", "Reducing its parameter count", "Encrypting prompts"],
    correct: 1, topic: "RAG",
  },
  {
    stem: "A 'temperature' of 0 in generation tends to produce output that is…",
    options: ["More random and creative", "More deterministic and focused", "Longer", "Multilingual"],
    correct: 1, topic: "Inference controls",
  },
  {
    stem: "Which is a good first defence against prompt injection?",
    options: ["Trusting all tool output as instructions", "Treating retrieved/user content as data, not commands", "Raising temperature", "Removing the system prompt"],
    correct: 1, topic: "AI safety",
  },
  {
    stem: "Embeddings are most directly used to…",
    options: ["Render UI", "Measure semantic similarity between texts", "Compress images losslessly", "Schedule GPUs"],
    correct: 1, topic: "Embeddings",
  },
];

const AGENTIC_AI: DiagQuestion[] = [
  {
    stem: "In an agentic system, 'tool use' (function calling) lets the model…",
    options: ["Retrain itself between messages", "Call external functions or APIs and use their results to act", "Enlarge its own context window", "Run with no prompt at all"],
    correct: 1, topic: "Tool use",
  },
  {
    stem: "The ReAct pattern runs an agent as a loop of…",
    options: ["A single one-shot completion", "Reason, act (call a tool), observe the result, then repeat", "Random tool calls until it stops", "Fine-tuning after every step"],
    correct: 1, topic: "Agent loops",
  },
  {
    stem: "Breaking a complex goal into an ordered set of sub-tasks before acting is called…",
    options: ["Tokenisation", "Task planning and decomposition", "Quantisation", "Sharding"],
    correct: 1, topic: "Planning",
  },
  {
    stem: "An agent's long-term memory is most commonly implemented with…",
    options: ["A larger system prompt only", "A vector store the agent writes to and retrieves from", "Turning the context window off", "A higher temperature"],
    correct: 1, topic: "Memory",
  },
  {
    stem: "Because agents can call tools, a critical safety risk is…",
    options: ["Slow font rendering", "Prompt injection turning retrieved or tool content into malicious instructions", "Using too few tokens", "Choosing a smaller model"],
    correct: 1, topic: "Agent safety",
  },
];

const FULLSTACK: DiagQuestion[] = [
  {
    stem: "Which HTTP status code means 'created successfully'?",
    options: ["200", "201", "400", "404"],
    correct: 1, topic: "HTTP & APIs",
  },
  {
    stem: "In SQL, which prevents most injection attacks?",
    options: ["String concatenation", "Parameterised queries", "SELECT *", "Disabling the WHERE clause"],
    correct: 1, topic: "Database security",
  },
  {
    stem: "A JWT stored for auth should typically be…",
    options: ["Logged to the console", "Kept out of localStorage when XSS is a concern (e.g. httpOnly cookie)", "Shared in the URL", "Hard-coded in the client bundle"],
    correct: 1, topic: "Auth",
  },
  {
    stem: "What does an index on a database column primarily improve?",
    options: ["Write speed", "Read/lookup speed", "Disk usage", "Password strength"],
    correct: 1, topic: "Databases",
  },
  {
    stem: "In React, a list of items should each have a…",
    options: ["Random key per render", "Stable unique key", "No key", "Inline style"],
    correct: 1, topic: "React",
  },
];

const MACHINE_LEARNING: DiagQuestion[] = [
  {
    stem: "Overfitting is when a model…",
    options: ["Generalises too well", "Memorises training data and fails on new data", "Has too few parameters", "Trains too slowly"],
    correct: 1, topic: "Generalisation",
  },
  {
    stem: "You split data into train/validation/test mainly to…",
    options: ["Save disk space", "Estimate performance on unseen data honestly", "Speed up training", "Avoid using a GPU"],
    correct: 1, topic: "Evaluation",
  },
  {
    stem: "Which metric is misleading on a heavily imbalanced dataset?",
    options: ["Precision", "Recall", "Raw accuracy", "F1 score"],
    correct: 2, topic: "Metrics",
  },
  {
    stem: "Gradient descent updates weights in the direction that…",
    options: ["Increases the loss", "Decreases the loss", "Randomises the loss", "Freezes the loss"],
    correct: 1, topic: "Optimisation",
  },
  {
    stem: "Regularisation (e.g. L2) is used to…",
    options: ["Increase overfitting", "Penalise complexity and reduce overfitting", "Remove the test set", "Speed up inference only"],
    correct: 1, topic: "Regularisation",
  },
];

const CYBERSECURITY: DiagQuestion[] = [
  {
    stem: "Hashing passwords (vs encrypting) is preferred because…",
    options: ["It's reversible", "It's one-way, so stored values can't be trivially recovered", "It's faster to email", "It avoids salting"],
    correct: 1, topic: "Credential storage",
  },
  {
    stem: "What does the 'principle of least privilege' mean?",
    options: ["Give every user admin", "Grant only the access strictly needed", "Disable all logging", "Share one root account"],
    correct: 1, topic: "Access control",
  },
  {
    stem: "An XSS vulnerability lets an attacker…",
    options: ["Run SQL on the DB directly", "Execute script in another user's browser", "Read server RAM", "Bypass TLS"],
    correct: 1, topic: "Web vulnerabilities",
  },
  {
    stem: "TLS primarily provides…",
    options: ["Faster DNS", "Encryption + integrity in transit", "Password hashing", "Rate limiting"],
    correct: 1, topic: "Cryptography",
  },
  {
    stem: "A good response to a phishing-prone org is…",
    options: ["Disable MFA", "Enforce MFA and user training", "Email passwords", "Open all ports"],
    correct: 1, topic: "Defensive security",
  },
];

const DATA_SCIENCE: DiagQuestion[] = [
  {
    stem: "The median is preferred over the mean when data is…",
    options: ["Perfectly normal", "Skewed or has outliers", "Categorical", "Boolean"],
    correct: 1, topic: "Statistics",
  },
  {
    stem: "In SQL, GROUP BY is typically paired with…",
    options: ["Aggregate functions like COUNT/AVG", "ALTER TABLE", "DROP", "An index rebuild"],
    correct: 0, topic: "SQL",
  },
  {
    stem: "Correlation does not imply…",
    options: ["Association", "Causation", "A dataset", "A chart"],
    correct: 1, topic: "Inference",
  },
  {
    stem: "An A/B test needs a control group mainly to…",
    options: ["Double the traffic", "Isolate the effect of the change", "Avoid logging", "Skip statistics"],
    correct: 1, topic: "Experimentation",
  },
  {
    stem: "A p-value of 0.03 (α=0.05) suggests the result is…",
    options: ["Definitely true", "Statistically significant at that threshold", "A bug", "Caused by the treatment for certain"],
    correct: 1, topic: "Hypothesis testing",
  },
];

const DEVOPS: DiagQuestion[] = [
  {
    stem: "A Docker image vs a container: a container is…",
    options: ["The blueprint", "A running instance of an image", "A registry", "A YAML file"],
    correct: 1, topic: "Containers",
  },
  {
    stem: "CI (Continuous Integration) primarily…",
    options: ["Deploys to prod automatically", "Builds & tests every change automatically", "Replaces git", "Stores secrets"],
    correct: 1, topic: "CI/CD",
  },
  {
    stem: "In Kubernetes, a Pod is…",
    options: ["A physical server", "The smallest deployable unit (one+ containers)", "A load balancer", "A database"],
    correct: 1, topic: "Kubernetes",
  },
  {
    stem: "Infrastructure as Code (e.g. Terraform) gives you…",
    options: ["Manual clicking", "Versioned, reproducible infrastructure", "Slower rollbacks", "No state"],
    correct: 1, topic: "IaC",
  },
  {
    stem: "A good first signal to alert on for reliability is…",
    options: ["CPU temperature only", "Error rate / latency (SLOs)", "Number of files", "Commit count"],
    correct: 1, topic: "Observability",
  },
];

const GENERAL: DiagQuestion[] = [
  {
    stem: "What does an API let two systems do?",
    options: ["Share a database password", "Communicate over a defined interface", "Run on the same CPU", "Skip the network"],
    correct: 1, topic: "Fundamentals",
  },
  {
    stem: "Big-O notation describes an algorithm's…",
    options: ["Exact runtime in seconds", "How its cost grows with input size", "Memory address", "Source language"],
    correct: 1, topic: "Algorithms",
  },
  {
    stem: "Version control (git) primarily lets a team…",
    options: ["Track and merge changes over time", "Compile faster", "Avoid testing", "Encrypt traffic"],
    correct: 0, topic: "Tooling",
  },
  {
    stem: "Which is a key property of a good function?",
    options: ["Does many unrelated things", "Does one thing well (single responsibility)", "Has no name", "Always global state"],
    correct: 1, topic: "Code quality",
  },
  {
    stem: "What's the main benefit of writing tests?",
    options: ["Slower releases", "Confidence that changes don't break behaviour", "More bugs", "Bigger bundles"],
    correct: 1, topic: "Testing",
  },
];

const BANK: Record<string, DiagQuestion[]> = {
  "agentic-ai": AGENTIC_AI,
  "generative-ai": GENERATIVE_AI,
  "llm-agent-architect": GENERATIVE_AI,
  "artificial-intelligence": GENERATIVE_AI,
  "ai-product-management": GENERAL,
  "machine-learning": MACHINE_LEARNING,
  "computer-vision": MACHINE_LEARNING,
  "drone-technology": MACHINE_LEARNING,
  "fullstack-development": FULLSTACK,
  "game-development": FULLSTACK,
  "cybersecurity": CYBERSECURITY,
  "data-science": DATA_SCIENCE,
  "devops-engineering": DEVOPS,
};

/**
 * Deterministically shuffle a question's options so the correct answer isn't
 * always in the same slot. The hand-authored bank clustered the correct answer
 * on index 1 ("just pick B" every time), which looks unprofessional and is
 * trivially gameable. The shuffle is SEEDED BY THE STEM (a pure function of the
 * question text) so the quiz page and the results page — which both call
 * getDiagnostic independently — produce the IDENTICAL order, keeping the
 * answer-index scoring correct across the navigation.
 */
function shuffleOptions(q: DiagQuestion): DiagQuestion {
  // FNV-1a hash of the stem → a stable, non-zero 32-bit seed.
  let seed = 0x811c9dc5;
  for (let i = 0; i < q.stem.length; i++) {
    seed ^= q.stem.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  seed = seed || 1;
  const rand = () => {
    // xorshift32 — deterministic PRNG from the seed.
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 0x100000000;
  };
  const items = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correct }));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return { ...q, options: items.map((x) => x.opt), correct: items.findIndex((x) => x.isCorrect) };
}

export function getDiagnostic(slug: string): DiagQuestion[] {
  return (BANK[slug] ?? GENERAL).map(shuffleOptions);
}

export interface DiagResult {
  score: number;
  total: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  weakTopics: string[];
  blurb: string;
}

export function scoreDiagnostic(questions: DiagQuestion[], answers: number[]): DiagResult {
  let score = 0;
  const missed: string[] = [];
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;
    else missed.push(q.topic);
  });

  const total = questions.length;
  const ratio = total > 0 ? score / total : 0;
  const level: DiagResult["level"] =
    ratio >= 0.8 ? "Advanced" : ratio >= 0.5 ? "Intermediate" : "Beginner";

  // Weak topics = the ones they missed; if they aced it, name growth areas anyway
  const weakTopics = missed.length > 0
    ? Array.from(new Set(missed)).slice(0, 3)
    : Array.from(new Set(questions.map((q) => q.topic))).slice(0, 2);

  const blurb =
    level === "Advanced"
      ? "Strong foundation. The full assessment will pinpoint the advanced gaps between you and the role."
      : level === "Intermediate"
        ? "Solid base with clear gaps to close. The full report maps exactly what's between you and the offer."
        : "Great starting point. The full assessment builds you a personalised path from here to job-ready.";

  return { score, total, level, weakTopics, blurb };
}

/** The 5-band readiness label (Novice → Expert) derived from the raw score. This
 *  is the level the results page shows; the share text, the browser/OG title and
 *  the shared OG image all use it too, so every surface agrees. (Distinct from
 *  DiagResult.level, a coarser 3-tier ratio label kept for backwards-compat.) */
export function readinessBand(score: number): string {
  const bands = ["Novice", "Developing", "Competent", "Proficient", "Expert"];
  return bands[Math.max(0, Math.min(4, score <= 1 ? 0 : score - 1))];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Subjects — the 9 world-class courses, shared by all diagnostic routes
// ═══════════════════════════════════════════════════════════════════════════════

export interface DiagSubject {
  slug: string;
  title: string;
  icon: string;
  role: string;
  color: string;
}

export const DIAG_SUBJECTS: DiagSubject[] = [
  { slug: "generative-ai", title: "Generative AI", icon: "\u{1F916}", role: "AI Engineer", color: "#6366f1" },
  { slug: "machine-learning", title: "Machine Learning", icon: "\u{1F9E0}", role: "ML Engineer", color: "#8b5cf6" },
  { slug: "fullstack-development", title: "Full Stack Dev", icon: "\u{1F680}", role: "Full Stack Engineer", color: "#06b6d4" },
  { slug: "cybersecurity", title: "Cybersecurity", icon: "\u{1F510}", role: "Security Engineer", color: "#ef4444" },
  { slug: "data-science", title: "Data Science", icon: "\u{1F4CA}", role: "Data Scientist", color: "#14b8a6" },
  { slug: "artificial-intelligence", title: "Artificial Intelligence", icon: "⚡", role: "AI Engineer", color: "#0ea5e9" },
  { slug: "computer-vision", title: "Computer Vision", icon: "\u{1F441}️", role: "CV Engineer", color: "#10b981" },
  { slug: "llm-agent-architect", title: "LLM Agent Architect", icon: "\u{1F6E0}️", role: "Agent Architect", color: "#7C3AED" },
  { slug: "agentic-ai", title: "Agentic AI", icon: "\u{1F916}", role: "Agentic AI Engineer", color: "#7C3AED" },
  { slug: "ai-product-management", title: "AI Product Management", icon: "\u{1F4CB}", role: "AI PM", color: "#0EA5E9" },
];

export function getSubject(slug: string): DiagSubject | undefined {
  return DIAG_SUBJECTS.find((s) => s.slug === slug);
}

// ═══════════════════════════════════════════════════════════════════════════════
// URL encoding/decoding for shareable results
// ═══════════════════════════════════════════════════════════════════════════════

export function encodeAnswers(answers: number[]): string {
  return answers.join(",");
}

export function decodeAnswers(param: string | null): number[] | null {
  if (!param) return null;
  const parts = param.split(",");
  if (parts.length === 0) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 3)) return null;
  return nums;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Per-topic result breakdown (for the results page radar + topic list)
// ═══════════════════════════════════════════════════════════════════════════════

export interface TopicResult {
  topic: string;
  correct: boolean;
}

export function getTopicResults(questions: DiagQuestion[], answers: number[]): TopicResult[] {
  return questions.map((q, i) => ({
    topic: q.topic,
    correct: answers[i] === q.correct,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEO content per subject (for /diagnostic/[subject] pages)
// ═══════════════════════════════════════════════════════════════════════════════

export interface SubjectSEO {
  h1: string;
  description: string;
  body: string;
  faqs: { q: string; a: string }[];
  topicRelevance: Record<string, string>;
}

export const SUBJECT_SEO: Record<string, SubjectSEO> = {
  "generative-ai": {
    h1: "Are you ready to be an AI Engineer?",
    description: "Take this free 3-minute generative AI skill check. Five questions on LLMs, RAG, prompt engineering, embeddings, and AI safety — instant results, no signup.",
    body: "Generative AI is transforming every industry. Companies are hiring AI Engineers who can build with large language models, design retrieval-augmented generation pipelines, and ship safe, reliable AI products. But the field moves fast — skills that were cutting-edge six months ago are table stakes today.\n\nThis 3-minute snapshot tests five core areas that hiring managers look for: LLM fundamentals, RAG architecture, inference controls, AI safety, and embeddings. It won't replace a full technical interview, but it will tell you where you stand and where to focus.\n\nWhether you're a software engineer pivoting into AI, a data scientist expanding your toolkit, or a student choosing your first specialisation, this diagnostic gives you an honest starting point.",
    faqs: [
      { q: "How long does the AI skill check take?", a: "About 3 minutes. Five multiple-choice questions, instant results. No signup required." },
      { q: "What topics does it cover?", a: "LLM fundamentals, retrieval-augmented generation (RAG), inference controls like temperature, prompt injection defence, and embeddings for semantic search." },
      { q: "Is this a certification?", a: "No — it's a quick skill snapshot to help you identify gaps. For a full AI-graded assessment with a personalised learning plan, take the free full assessment after signing up." },
    ],
    topicRelevance: {
      "LLM fundamentals": "Understanding how models process context is the foundation of every AI engineering role.",
      "RAG": "RAG pipelines are how production AI systems stay grounded in real data.",
      "Inference controls": "Tuning temperature and sampling is essential for reliable AI outputs.",
      "AI safety": "Defending against prompt injection separates prototypes from production systems.",
      "Embeddings": "Semantic search and retrieval depend on understanding vector representations.",
    },
  },
  "machine-learning": {
    h1: "Are you ready to be an ML Engineer?",
    description: "Free 3-minute machine learning skill check. Test your knowledge of overfitting, evaluation, metrics, optimisation, and regularisation — instant results.",
    body: "Machine learning engineers are among the most sought-after roles in tech. But the gap between completing a tutorial and being job-ready is wider than most people realise. Employers want engineers who understand not just how to call sklearn, but why a model overfits, when accuracy is the wrong metric, and how regularisation actually works.\n\nThis quick diagnostic tests five foundational ML concepts that separate beginners from practitioners: generalisation, honest evaluation, metric selection for imbalanced data, gradient-based optimisation, and regularisation techniques.\n\nIt takes about 3 minutes, requires no signup, and gives you an immediate snapshot of where you stand on the ML readiness spectrum.",
    faqs: [
      { q: "What ML topics does this test?", a: "Overfitting and generalisation, train/test splitting, metrics for imbalanced datasets, gradient descent, and regularisation (L1/L2)." },
      { q: "Do I need coding experience?", a: "No code is required for this quick check. The full assessment includes hands-on coding challenges." },
      { q: "How is this different from the full assessment?", a: "This is a 5-question snapshot. The full assessment has 20 questions including code exercises, is AI-graded, and builds a personalised learning plan." },
    ],
    topicRelevance: {
      "Generalisation": "Knowing why models overfit is the first thing interviewers test.",
      "Evaluation": "Honest evaluation methodology separates reliable models from lucky ones.",
      "Metrics": "Choosing the right metric for imbalanced data is a common interview trap.",
      "Optimisation": "Understanding gradient descent is essential for debugging training issues.",
      "Regularisation": "Regularisation is your primary tool against overfitting in practice.",
    },
  },
  "fullstack-development": {
    h1: "Are you ready to be a Full Stack Engineer?",
    description: "Free 3-minute full stack development skill check. HTTP, SQL security, authentication, databases, and React — instant results, no signup.",
    body: "Full stack engineering remains one of the most versatile and in-demand roles in software. But the breadth of skills required — from HTTP protocols to database design to frontend frameworks — makes it hard to know where your gaps are.\n\nThis diagnostic covers five areas that full stack interviews consistently test: HTTP status codes and API design, SQL injection prevention, secure authentication patterns, database indexing, and React fundamentals.\n\nThree minutes, five questions, and you'll know exactly which areas need work before your next interview or project.",
    faqs: [
      { q: "What does this full stack check cover?", a: "HTTP and API conventions, SQL injection prevention, JWT authentication best practices, database indexing, and React component patterns." },
      { q: "Which frameworks does it test?", a: "The questions are framework-agnostic where possible, with one React-specific question. The concepts apply across frameworks." },
      { q: "Can I retake it?", a: "Yes — you can retake it any time. For a deeper assessment, sign up for the free full assessment." },
    ],
    topicRelevance: {
      "HTTP & APIs": "Every full stack role requires solid understanding of HTTP semantics.",
      "Database security": "SQL injection is still one of the most exploited vulnerabilities — interviewers expect you to prevent it.",
      "Auth": "Secure token handling is non-negotiable in production applications.",
      "Databases": "Understanding indexes is what separates fast applications from slow ones.",
      "React": "Component key management affects rendering performance and correctness.",
    },
  },
  "cybersecurity": {
    h1: "Are you ready to be a Security Engineer?",
    description: "Free 3-minute cybersecurity skill check. Password hashing, access control, XSS, TLS, and defensive security — instant results, no signup.",
    body: "Cybersecurity is no longer a niche specialisation — every organisation needs security engineers. But the field covers an enormous surface area, from cryptography to social engineering to network defence.\n\nThis quick diagnostic tests five areas that form the foundation of any security role: credential storage best practices, the principle of least privilege, common web vulnerabilities like XSS, transport-layer security, and practical defensive measures against phishing.\n\nWhether you're transitioning from IT, coming from development, or studying security formally, this 3-minute check will highlight where you're strong and where you need to dig deeper.",
    faqs: [
      { q: "What security topics does this cover?", a: "Password hashing vs encryption, principle of least privilege, cross-site scripting (XSS), TLS/encryption in transit, and multi-factor authentication as a defence against phishing." },
      { q: "Is this relevant for SOC analyst roles?", a: "Yes — these fundamentals apply across security roles including SOC analyst, penetration tester, and security engineer." },
      { q: "Do I need a security background?", a: "No — the questions test foundational concepts. If you're considering a career in security, this is a great starting point." },
    ],
    topicRelevance: {
      "Credential storage": "Choosing hashing over encryption for passwords is a fundamental security decision.",
      "Access control": "Least privilege is the most widely applied security principle in enterprise environments.",
      "Web vulnerabilities": "XSS remains in the OWASP Top 10 — every security role requires understanding it.",
      "Cryptography": "TLS underpins all secure communication on the internet.",
      "Defensive security": "MFA and user training are the most cost-effective defences against credential theft.",
    },
  },
  "data-science": {
    h1: "Are you ready to be a Data Scientist?",
    description: "Free 3-minute data science skill check. Statistics, SQL, inference, experimentation, and hypothesis testing — instant results, no signup.",
    body: "Data science roles require a unique blend of statistics, programming, and domain expertise. Companies want data scientists who can design experiments, write SQL, interpret results honestly, and communicate findings to non-technical stakeholders.\n\nThis diagnostic tests five areas that data science interviews consistently probe: descriptive statistics and when to use median vs mean, SQL aggregation patterns, the distinction between correlation and causation, A/B test design, and statistical significance.\n\nThree minutes, five questions, and you'll know whether you're ready for data science interviews or need to strengthen your foundations first.",
    faqs: [
      { q: "What data science topics are tested?", a: "Central tendency (median vs mean), SQL GROUP BY, correlation vs causation, A/B testing methodology, and p-values / statistical significance." },
      { q: "Do I need to know Python?", a: "Not for this quick check. The full assessment includes Python coding challenges." },
      { q: "Is this relevant for analytics roles too?", a: "Absolutely — these statistical and SQL fundamentals are essential for data analysts, business analysts, and data scientists alike." },
    ],
    topicRelevance: {
      "Statistics": "Knowing when median beats mean is the kind of judgment call that separates analysts from data scientists.",
      "SQL": "GROUP BY with aggregates is the bread and butter of real-world data queries.",
      "Inference": "Understanding that correlation is not causation prevents costly business decisions.",
      "Experimentation": "A/B test design is a core competency for any data role at a product company.",
      "Hypothesis testing": "Interpreting p-values correctly is surprisingly rare — and highly valued.",
    },
  },
  "artificial-intelligence": {
    h1: "Are you ready to work in Artificial Intelligence?",
    description: "Free 3-minute AI skill check. LLMs, RAG, prompt engineering, AI safety, and embeddings — instant results, no signup required.",
    body: "Artificial intelligence is reshaping industries from healthcare to finance to education. Whether you're aiming for a research role, an applied AI position, or a product role involving AI, you need a solid grasp of how modern AI systems work.\n\nThis quick diagnostic covers five essential areas: how large language models process information, retrieval-augmented generation for grounding AI in real data, controlling model output through inference parameters, defending against prompt injection attacks, and using embeddings for semantic similarity.\n\nTake 3 minutes to find out where you stand — no account needed, instant results.",
    faqs: [
      { q: "How is this different from the Generative AI check?", a: "The questions overlap because modern AI is heavily driven by generative models. The full courses diverge: AI covers broader theory (classical ML, planning, search) while Generative AI focuses on LLM-specific engineering." },
      { q: "Do I need a maths background?", a: "Not for this quick check. The questions test conceptual understanding, not mathematical derivations." },
      { q: "What comes after this snapshot?", a: "Sign up for the free full assessment — 20 questions including code challenges, AI-graded with a personalised learning plan." },
    ],
    topicRelevance: {
      "LLM fundamentals": "Understanding context windows is essential for designing effective AI applications.",
      "RAG": "Retrieval-augmented generation is the standard pattern for production AI that needs factual grounding.",
      "Inference controls": "Temperature and sampling parameters directly control output quality and reliability.",
      "AI safety": "Prompt injection defence is a critical skill for anyone deploying AI in production.",
      "Embeddings": "Embeddings power search, recommendations, and clustering across the AI industry.",
    },
  },
  "computer-vision": {
    h1: "Are you ready to be a Computer Vision Engineer?",
    description: "Free 3-minute computer vision and ML skill check. Overfitting, evaluation, metrics, optimisation, and regularisation — instant results.",
    body: "Computer vision powers everything from autonomous vehicles to medical imaging to augmented reality. CV engineers need strong foundations in machine learning theory before specialising in image processing, object detection, and neural network architectures.\n\nThis diagnostic tests five ML fundamentals that underpin all computer vision work: model generalisation and overfitting, proper evaluation methodology, metric selection for imbalanced datasets (common in detection tasks), gradient-based optimisation, and regularisation.\n\nThree minutes to discover your starting point — then decide whether to dive into the full CV learning path.",
    faqs: [
      { q: "Why does this test ML basics instead of CV-specific topics?", a: "CV is built on ML foundations. The full course covers CNNs, object detection, segmentation, and more — but you need these basics first." },
      { q: "Do I need to know PyTorch or TensorFlow?", a: "Not for this quick check. The full assessment includes framework-specific coding challenges." },
      { q: "Is this relevant for robotics roles?", a: "Yes — these ML fundamentals are prerequisites for perception systems in robotics." },
    ],
    topicRelevance: {
      "Generalisation": "Overfitting is especially problematic in CV where models memorise texture patterns.",
      "Evaluation": "Proper train/test splitting prevents inflated accuracy claims in image classification.",
      "Metrics": "Object detection tasks are inherently imbalanced — raw accuracy is almost always misleading.",
      "Optimisation": "Understanding gradient flow is critical for training deep convolutional networks.",
      "Regularisation": "Dropout and weight decay are standard tools for training vision models.",
    },
  },
  "llm-agent-architect": {
    h1: "Are you ready to be an LLM Agent Architect?",
    description: "Free 3-minute LLM agent skill check. Context windows, RAG, temperature, prompt safety, and embeddings — instant results, no signup.",
    body: "LLM Agent Architects design autonomous AI systems that can reason, use tools, and complete complex multi-step tasks. It's one of the newest and fastest-growing roles in AI engineering, sitting at the intersection of prompt engineering, system design, and AI safety.\n\nThis diagnostic tests five areas fundamental to agent architecture: how LLMs handle context, retrieval-augmented generation for grounding agents in real data, inference parameter tuning for reliable agent behaviour, prompt injection defence (critical for agents with tool access), and embeddings for semantic retrieval.\n\nThree minutes, five questions — find out if you have the foundations to build autonomous AI systems.",
    faqs: [
      { q: "What is an LLM Agent Architect?", a: "Someone who designs AI systems where language models autonomously use tools, make decisions, and complete multi-step tasks — think AI assistants, coding agents, and research agents." },
      { q: "How is this different from the Generative AI check?", a: "Same foundational questions, because agent architecture builds on LLM fundamentals. The full courses diverge into tool use, planning, memory systems, and multi-agent orchestration." },
      { q: "What experience do I need?", a: "Programming experience helps, but this quick check tests conceptual understanding. The full course teaches you to build agents from scratch." },
    ],
    topicRelevance: {
      "LLM fundamentals": "Agents are limited by their context window — understanding this constraint drives architecture decisions.",
      "RAG": "Agents need retrieval to access information beyond their training data.",
      "Inference controls": "Deterministic agent behaviour requires careful temperature and sampling configuration.",
      "AI safety": "Agents with tool access are high-risk targets for prompt injection — safety is non-negotiable.",
      "Embeddings": "Semantic search powers the memory and retrieval systems that make agents useful.",
    },
  },
  "agentic-ai": {
    h1: "Are you ready to build agentic AI?",
    description: "Free 3-minute agentic AI skill check. Tool use, agent loops, planning, memory, and agent safety — instant results, no signup.",
    body: "Agentic AI is the shift from models that answer questions to systems that take action — calling tools, making decisions, and completing multi-step tasks on their own. It's one of the fastest-moving areas in AI, and the engineers who can design reliable agents are in short supply.\n\nThis quick diagnostic tests five foundations that separate a working agent from a demo: tool use and function calling, the reason–act loop that drives an agent, planning and task decomposition, memory systems for state and recall, and the safety concerns unique to systems that can act.\n\nIt takes about 3 minutes, needs no signup, and gives you an instant read on where you stand before diving into the full Agentic AI track.",
    faqs: [
      { q: "What does an Agentic AI engineer do?", a: "They design systems where a language model autonomously uses tools, plans multi-step work, keeps memory, and completes tasks — from coding agents to research and workflow automation." },
      { q: "How is this different from the LLM Agent Architect check?", a: "The foundations overlap because both build on agent fundamentals. The full Agentic AI course focuses on building and shipping agents end-to-end; LLM Agent Architect goes deeper into protocols, harnesses, and frameworks." },
      { q: "Do I need to code to take it?", a: "No — this quick check tests conceptual understanding. The full course teaches you to build agents hands-on, so some programming experience helps there." },
    ],
    topicRelevance: {
      "Tool use": "Calling tools is what turns a language model into an agent that can actually act.",
      "Agent loops": "The reason–act–observe loop is the core control flow of every autonomous agent.",
      "Planning": "Decomposing a goal into ordered steps is what lets agents tackle complex, multi-step tasks.",
      "Memory": "Memory systems give agents state and recall beyond a single context window.",
      "Agent safety": "Agents with tool access are high-risk for prompt injection — safety is non-negotiable.",
    },
  },
  "ai-product-management": {
    h1: "Are you ready to be an AI Product Manager?",
    description: "Free 3-minute tech skill check for AI PMs. APIs, algorithms, version control, code quality, and testing — instant results, no signup.",
    body: "AI Product Managers sit at the intersection of technology, business, and user experience. You don't need to write production code, but you do need enough technical literacy to make informed decisions, ask the right questions, and earn your engineering team's respect.\n\nThis diagnostic tests five areas of general technical literacy that separate effective AI PMs from those who get steamrolled in technical discussions: API design and system communication, algorithmic thinking, version control workflows, code quality principles, and testing methodology.\n\nThree minutes to find out whether your technical foundations are PM-ready.",
    faqs: [
      { q: "Do AI PMs need to code?", a: "Not production code, but you need enough technical literacy to evaluate trade-offs, read PRDs, and communicate with engineers. This check tests that literacy." },
      { q: "Why general tech topics instead of AI-specific ones?", a: "AI PMs need broad technical foundations first. The full course covers AI-specific topics like model evaluation, MLOps, responsible AI, and AI product strategy." },
      { q: "Is this relevant for traditional PMs moving into AI?", a: "Exactly who this is for. If you can pass this, you have the technical baseline to start learning AI-specific PM skills." },
    ],
    topicRelevance: {
      "Fundamentals": "Understanding APIs is essential for evaluating integration complexity and system architecture.",
      "Algorithms": "Big-O thinking helps you assess engineering estimates and trade-offs.",
      "Tooling": "Git fluency is expected in any technical environment — it's how your team works.",
      "Code quality": "Recognising good code principles helps you review PRDs and evaluate technical debt.",
      "Testing": "Understanding test strategy helps you assess release readiness and risk.",
    },
  },
};
