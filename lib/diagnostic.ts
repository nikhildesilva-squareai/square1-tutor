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

export function getDiagnostic(slug: string): DiagQuestion[] {
  return BANK[slug] ?? GENERAL;
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
