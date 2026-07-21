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

// ── Non-technical lane: outcome-framed AI-at-work judgment checks ─────────────
// These test practical workplace judgment (briefing, verification, tool choice,
// privacy), not course content. Answerable by a thoughtful practitioner.

const AI_FOUNDATIONS: DiagQuestion[] = [
  {
    stem: "You want an AI assistant to draft an email declining a vendor's renewal offer. Which brief gets the best first draft?",
    options: [
      "Write me a professional email to a vendor",
      "Decline the renewal politely, keep the door open for next year, keep it under 150 words",
      "Write several versions so I can pick whichever sounds most professional",
      "Ask the assistant what it thinks the email should say before giving it details",
    ],
    correct: 1, topic: "Briefing the AI",
  },
  {
    stem: "An AI assistant gives you a confident summary of a regulation that affects your work. Before acting on it, you should…",
    options: [
      "Trust it — assistants rarely get well-known regulations wrong",
      "Check the key claims against the actual regulation or an official source",
      "Ask the same assistant to confirm that its own summary is accurate",
      "Rewrite the summary in your own words so the wording is yours",
    ],
    correct: 1, topic: "Verifying output",
  },
  {
    stem: "You need to digest a 40-page PDF report before a meeting. The best move is…",
    options: [
      "Paste the report into a chat window a few sentences at a time",
      "Use an assistant that accepts document uploads and ask for a structured summary",
      "Ask an assistant to infer what the report probably says from its title",
      "Skim it yourself first, then ask the assistant to agree with your reading",
    ],
    correct: 1, topic: "Tool choice",
  },
  {
    stem: "A colleague suggests pasting a client's contract — names, payment terms and all — into a free AI chatbot. The right call is…",
    options: [
      "Go ahead — anything you paste is discarded when you close the tab",
      "Check your company's AI policy and anonymise sensitive details first",
      "Paste it, but add a line asking the chatbot to keep it confidential",
      "Split the contract across two chatbots so neither sees all of it",
    ],
    correct: 1, topic: "Data privacy",
  },
  {
    stem: "The AI's first draft of your report introduction is generic and flat. Your best next step is…",
    options: [
      "Give it specific feedback — the audience, what's missing, the tone you want",
      "Open a fresh chat and type exactly the same prompt again",
      "Accept it — first drafts are about as good as assistants get",
      "Switch tools immediately; a weak first draft means a weak tool",
    ],
    correct: 0, topic: "Iterating",
  },
];

const AI_FOR_MARKETERS: DiagQuestion[] = [
  {
    stem: "You're asking an AI assistant for launch-post ideas for a new product. The brief that earns the best ideas includes…",
    options: [
      "The product name only, so the assistant's creativity isn't boxed in",
      "The audience, the goal, the channel, and an example post in your voice",
      "A request for a hundred ideas so at least a few of them will land",
      "An instruction to emulate whatever your biggest competitor posted last week",
    ],
    correct: 1, topic: "Campaign briefing",
  },
  {
    stem: "An AI drafts ad copy claiming your product is “rated #1 by customers”. Before publishing, you should…",
    options: [
      "Publish it — customers rarely question a ratings claim",
      "Verify the claim against a real source, and cut it if you can't",
      "Soften it to “one of the highest rated” and ship it",
      "Keep it if it sounds like something your customers would say",
    ],
    correct: 1, topic: "Claim checking",
  },
  {
    stem: "To get AI drafts that sound like your brand rather than generic marketing copy, the most reliable approach is…",
    options: [
      "Tell it to “sound on-brand” and trust it to know what that means",
      "Give it real examples of your best copy plus a short note on tone dos and don'ts",
      "Regenerate repeatedly until a draft happens to sound right",
      "Ask for a “professional but fun” tone — it covers most brands",
    ],
    correct: 1, topic: "Brand voice",
  },
  {
    stem: "You want AI help thinking through segments for your email list. The safe way to handle subscriber data is…",
    options: [
      "Paste the full list — email addresses aren't sensitive on their own",
      "Use anonymised or aggregated data, in line with your company's privacy policy",
      "Upload it to whichever free tool gives you the fastest answer",
      "Share it only in a chat you plan to delete straight afterwards",
    ],
    correct: 1, topic: "Customer data",
  },
  {
    stem: "The most dependable role for AI in a content pipeline today is…",
    options: [
      "Publishing directly to your channels without a review step",
      "First drafts, variations and repurposing — with a human pass before anything ships",
      "Replacing your style guide and your approval process",
      "Reporting last month's campaign numbers from memory",
    ],
    correct: 1, topic: "Content workflow",
  },
];

const AI_FOR_FINANCE: DiagQuestion[] = [
  {
    stem: "You're asking an AI assistant to help explain a budget variance to non-finance stakeholders. The best brief includes…",
    options: [
      "The variance figures, who the audience is, and the level of detail they need",
      "Nothing extra — variance explanations are standard everywhere",
      "Just the words “explain this variance simply”",
      "A request to frame the variance so it looks smaller than it is",
    ],
    correct: 0, topic: "Briefing analysis",
  },
  {
    stem: "An AI assistant summarises a spreadsheet and reports a total that will drive a decision. You should…",
    options: [
      "Recalculate the figure yourself before anyone relies on it",
      "Trust it — arithmetic is exactly what computers are for",
      "Ask the assistant to double-check its own total",
      "Round the number conservatively and move on",
    ],
    correct: 0, topic: "Verifying numbers",
  },
  {
    stem: "Which finance task is the best fit for an AI assistant today?",
    options: [
      "Drafting the first pass of a variance commentary for your review",
      "Approving supplier payments without a second pair of eyes",
      "Signing off the month-end close on its own authority",
      "Setting the final numbers in your statutory accounts directly",
    ],
    correct: 0, topic: "Task fit",
  },
  {
    stem: "Before pasting company financials into an AI chatbot, the key question is…",
    options: [
      "Whether your company's policy allows that data in that tool",
      "Whether the chatbot's answers usually sound accurate",
      "Whether anyone outside the team would ever see the chat",
      "Whether the file fits under the tool's upload size limit",
    ],
    correct: 0, topic: "Confidential data",
  },
  {
    stem: "AI-drafted commentary on your monthly results is most useful when you treat it as…",
    options: [
      "A first draft to check against the actual numbers before it circulates",
      "Final wording, since it was generated from the data itself",
      "A substitute for review by your controller or manager",
      "Something to forward straight on to the auditors",
    ],
    correct: 0, topic: "Review discipline",
  },
];

const AI_FOR_CREATORS: DiagQuestion[] = [
  {
    stem: "You want AI help outlining a video on a topic you know well. The strongest prompt gives it…",
    options: [
      "Your angle, your audience, and the points you already know you want to hit",
      "The topic title alone, to see what the assistant comes up with",
      "A competitor's most popular video to copy beat for beat",
      "An instruction to make the outline as long and thorough as possible",
    ],
    correct: 0, topic: "Creative briefing",
  },
  {
    stem: "To keep AI-assisted scripts sounding like you and not like everyone else, the habit that matters most is…",
    options: [
      "Feeding it your past work and rewriting drafts in your own words",
      "Using the most popular AI tool, since it has the best default style",
      "Publishing drafts untouched so your output stays consistent",
      "Asking for “a completely unique voice” in every prompt",
    ],
    correct: 0, topic: "Voice",
  },
  {
    stem: "Your AI draft includes a surprising claim about your niche that you hadn't heard before. You should…",
    options: [
      "Trace it to a source you trust before it goes in the script",
      "Include it — surprising claims are exactly what audiences share",
      "Ask the assistant how confident it feels about the claim",
      "Attribute it vaguely to “studies” so you're covered",
    ],
    correct: 0, topic: "Fact-checking",
  },
  {
    stem: "When AI helps produce something you publish commercially, the careful move is…",
    options: [
      "Know your platform's AI rules and check the tool's terms on commercial use",
      "Assume anything a tool generates automatically belongs to you alone",
      "Avoid mentioning AI anywhere, whatever the platform's policy asks",
      "Publish AI-assisted work only on platforms that don't ask questions",
    ],
    correct: 0, topic: "Rights & terms",
  },
  {
    stem: "The most reliable productivity win from AI for a working creator is…",
    options: [
      "Compressing the messy early stages — ideas, outlines, rough drafts",
      "Fully automating publishing so content ships itself",
      "Replacing audience research with the assistant's guesses",
      "Producing engagement numbers to include in sponsor decks",
    ],
    correct: 0, topic: "Creative workflow",
  },
];

const AI_FOR_FOUNDERS: DiagQuestion[] = [
  {
    stem: "You're using an AI assistant to draft an investor update. The brief that saves you the most rewriting includes…",
    options: [
      "The key numbers, the tone you want, and a past update you liked",
      "The words “write an investor update for a startup”",
      "An instruction to keep it upbeat regardless of the numbers",
      "As little context as possible so nothing sensitive is involved",
    ],
    correct: 0, topic: "Delegating to AI",
  },
  {
    stem: "An AI assistant sizes your market at a precise-sounding figure with no source. For the pitch deck, you should…",
    options: [
      "Use it only if you can back it with a source you can cite",
      "Use it — precision signals that you really know your market",
      "Average it with a second assistant's estimate to be safe",
      "Round it up to the nearest headline-friendly number",
    ],
    correct: 0, topic: "Verifying claims",
  },
  {
    stem: "The highest-leverage early use of AI in a small startup team is usually…",
    options: [
      "Drafting, research prep, and support replies that a human reviews",
      "Replacing your first customer-facing hires entirely",
      "Automating decisions you haven't yet figured out how to make manually",
      "Handling legal review so you can skip paying a lawyer",
    ],
    correct: 0, topic: "Where AI fits",
  },
  {
    stem: "Before an AI tool touches your cap table, contracts, or customer lists, you should…",
    options: [
      "Check the tool's data-handling terms and what your agreements let you share",
      "Rename the files so the contents aren't obvious",
      "Use a personal account so the company isn't the one liable",
      "Trust any well-known tool with company data by default",
    ],
    correct: 0, topic: "Sensitive data",
  },
  {
    stem: "You want AI answering customer emails. The responsible rollout starts with…",
    options: [
      "Draft mode — the AI suggests replies and a person approves them",
      "Full autopilot from day one to maximise the time saved",
      "Turning it on only outside business hours when mistakes are less visible",
      "Starting with your angriest customers, where reply speed matters most",
    ],
    correct: 0, topic: "Customer-facing AI",
  },
];

const AI_FOR_TEACHERS: DiagQuestion[] = [
  {
    stem: "You're asking an AI assistant to draft a lesson activity. The prompt that gets a usable draft includes…",
    options: [
      "The year level, the learning goal, and the time and materials you have",
      "The subject name and nothing else, to keep the options open",
      "A request for the most fun activity the assistant can imagine",
      "An instruction to reproduce your textbook's activity exactly",
    ],
    correct: 0, topic: "Lesson briefing",
  },
  {
    stem: "An AI-generated worksheet includes a historical date you're not sure about. You should…",
    options: [
      "Check it against a reliable reference before it reaches students",
      "Use it — worksheets are low-stakes enough for it not to matter",
      "Ask the assistant whether it is sure about the date",
      "Leave it in and correct it in class if a student notices",
    ],
    correct: 0, topic: "Content accuracy",
  },
  {
    stem: "When using AI tools for anything involving students, the line to hold is…",
    options: [
      "No identifiable student information goes into tools your school hasn't approved",
      "Anything is acceptable if it meaningfully saves preparation time",
      "First names are fine as long as surnames stay out of it",
      "It's fine as long as students would never find out",
    ],
    correct: 0, topic: "Student privacy",
  },
  {
    stem: "You suspect a student used AI on a written assignment. The fair first step is…",
    options: [
      "Talk with the student and look at their drafting process",
      "Rely on an AI-detector score as the final word",
      "Apply the plagiarism penalty — suspicion is enough here",
      "Run the essay through several detectors and average the scores",
    ],
    correct: 0, topic: "Academic integrity",
  },
  {
    stem: "The best use of AI in your marking workflow is…",
    options: [
      "Drafting comment starters that you personalise for each student",
      "Letting it assign the final grades unsupervised",
      "Pasting full essays with student names into any free tool",
      "Replacing your rubric with the assistant's own preferences",
    ],
    correct: 0, topic: "Feedback workflow",
  },
];

const AI_FOR_PROJECT_MANAGERS: DiagQuestion[] = [
  {
    stem: "You want an AI assistant to draft user stories from a feature idea. The best input is…",
    options: [
      "The problem, the user, the constraints, and your acceptance-criteria style",
      "The feature name — a good assistant can infer the rest",
      "A competitor's press release for it to reverse-engineer",
      "An instruction to write stories the team can't push back on",
    ],
    correct: 0, topic: "Work briefing",
  },
  {
    stem: "An AI summary of a long stakeholder thread will drive your next decision. Before you act on it…",
    options: [
      "Skim the original thread to confirm the summary didn't drop a key point",
      "Act on it — summarising is AI's most dependable skill",
      "Forward the summary so others can validate it for you",
      "Ask the assistant to shorten it further to remove the noise",
    ],
    correct: 0, topic: "Summary verification",
  },
  {
    stem: "The safest way to use AI meeting notes is…",
    options: [
      "As a draft you check before decisions and owners are circulated",
      "As the official record the moment the meeting ends",
      "As a replacement for attending recurring meetings",
      "As evidence in disagreements about who promised what",
    ],
    correct: 0, topic: "Meeting workflow",
  },
  {
    stem: "Your roadmap discussion includes unannounced features and customer names. Before using an AI notetaker…",
    options: [
      "Check the tool is approved for confidential content and attendees know it's on",
      "Assume notetakers are covered by ordinary meeting privacy",
      "Use it as normal and delete the recording afterwards",
      "Record only the parts of meetings without customer names",
    ],
    correct: 0, topic: "Confidential data",
  },
  {
    stem: "Which of these should you NOT hand to an AI assistant outright?",
    options: [
      "Committing delivery dates to customers on the team's behalf",
      "Drafting a first-pass project brief from your rough notes",
      "Turning a spec into a checklist of edge cases to review",
      "Rewriting a status update for an executive audience",
    ],
    correct: 0, topic: "Judgment calls",
  },
];

const AI_FOR_SALES: DiagQuestion[] = [
  {
    stem: "For AI-drafted outreach that doesn't read like a template, the input that matters most is…",
    options: [
      "Real details about this prospect and the problem you solve for their role",
      "A clear instruction telling it to sound personal, warm and human",
      "A higher word count so the email feels substantial and considered",
      "Your best-performing template with the company name swapped in",
    ],
    correct: 0, topic: "Outreach briefing",
  },
  {
    stem: "AI research tells you a prospect “recently raised funding”. Before referencing it in your email…",
    options: [
      "Confirm it from the company's own announcements or a news source",
      "Mention it anyway — even if it's wrong, it shows you did research",
      "Phrase it vaguely, like “congrats on the recent news”",
      "Ask the assistant where it heard that and accept its answer",
    ],
    correct: 0, topic: "Research verification",
  },
  {
    stem: "You want AI help prioritising your pipeline. The right way to handle CRM data is…",
    options: [
      "Use tools your company has approved for customer data, not personal accounts",
      "Export everything to whichever tool ranks the leads fastest",
      "Paste individual customer records into a free chatbot as needed",
      "Strip out the revenue figures and share everything else freely",
    ],
    correct: 0, topic: "Customer data",
  },
  {
    stem: "The best AI-assisted call prep looks like…",
    options: [
      "A short AI brief you sanity-check, plus questions tailored to the account",
      "A full script you read verbatim so nothing gets missed",
      "No prep — you can ask the assistant questions live during the call",
      "Memorising the assistant's estimates of the prospect's budget",
    ],
    correct: 0, topic: "Call preparation",
  },
  {
    stem: "An AI draft promises a capability your product doesn't quite have yet. You should…",
    options: [
      "Correct it before sending — the draft is your responsibility",
      "Send it — the roadmap will catch up before onboarding starts",
      "Keep it but soften the wording with “up to” and “as much as”",
      "Leave it in and let legal handle it if it ever becomes an issue",
    ],
    correct: 0, topic: "Honest selling",
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
  "ai-foundations": AI_FOUNDATIONS,
  "ai-for-marketers": AI_FOR_MARKETERS,
  "ai-for-finance": AI_FOR_FINANCE,
  "ai-for-creators": AI_FOR_CREATORS,
  "ai-for-founders": AI_FOR_FOUNDERS,
  "ai-for-teachers": AI_FOR_TEACHERS,
  "ai-for-project-managers": AI_FOR_PROJECT_MANAGERS,
  "ai-for-sales": AI_FOR_SALES,
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
  // Non-technical lane — outcome-framed checks for employed professionals
  { slug: "ai-foundations", title: "Everyday AI Skills", icon: "\u{1F4A1}", role: "AI-Productive Professional", color: "#16A34A" },
  { slug: "ai-for-marketers", title: "AI for Marketers", icon: "\u{1F4E3}", role: "AI-Productive Marketer", color: "#DB2777" },
  { slug: "ai-for-finance", title: "AI for Finance", icon: "\u{1F4B9}", role: "AI-Productive Finance Professional", color: "#059669" },
  { slug: "ai-for-creators", title: "AI for Creators", icon: "\u{1F3A8}", role: "AI-Productive Creator", color: "#EA580C" },
  { slug: "ai-for-founders", title: "AI for Founders", icon: "\u{1F331}", role: "AI-Productive Founder", color: "#4338CA" },
  { slug: "ai-for-teachers", title: "AI for Teachers", icon: "\u{1F34E}", role: "AI-Productive Teacher", color: "#0D9488" },
  { slug: "ai-for-project-managers", title: "AI for Project Managers", icon: "\u{1F5C2}\u{FE0F}", role: "AI-Productive Project Manager", color: "#B45309" },
  { slug: "ai-for-sales", title: "AI for Sales", icon: "\u{1F91D}", role: "AI-Productive Sales Professional", color: "#0E7490" },
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
  "ai-foundations": {
    h1: "How much is AI actually saving you each week?",
    description: "Free 3-minute everyday AI skill check. Five workplace scenarios on briefing AI assistants, checking their work, tool choice, and privacy — instant results, no signup.",
    body: "AI assistants like ChatGPT, Claude, Microsoft Copilot, and Google Gemini are now within reach of almost every desk job — but there's a big gap between having access to them and getting real work out of them. The difference isn't technical. It comes down to habits: how you brief an assistant, how you check its work, and where you draw the line on what you share.\n\nThis 3-minute check puts you in five everyday work situations and asks what you'd do: briefing an assistant so the first draft is actually usable, verifying output before you act on it, picking the right tool for the job, handling sensitive information safely, and turning a flat draft into a good one.\n\nNo code, no jargon, no signup — just an honest read on whether your current habits are getting you AI's full value or leaving most of it on the table.",
    faqs: [
      { q: "Do I need a technical background?", a: "No. The questions are about workplace judgment — briefing, checking, and privacy — not programming or how the models work under the hood." },
      { q: "Which AI tools does this apply to?", a: "All the mainstream assistants — ChatGPT, Claude, Microsoft Copilot, Google Gemini and others. The habits it tests are the same whichever one your workplace uses." },
      { q: "Is this a certification?", a: "No — it's a quick snapshot of your working habits with AI. For a fuller picture and a personalised learning path, take the free full assessment after signing up." },
    ],
    topicRelevance: {
      "Briefing the AI": "The quality of your brief decides whether the first draft is usable or a rewrite.",
      "Verifying output": "Assistants state wrong things confidently — checking before acting is the core safety habit.",
      "Tool choice": "Matching the task to the right tool and feature saves more time than any prompt trick.",
      "Data privacy": "Knowing what can and can't go into a chatbot protects you, your employer, and your clients.",
      "Iterating": "The second prompt — specific, corrective feedback — is where good output actually comes from.",
    },
  },
  "ai-for-marketers": {
    h1: "Is AI pulling its weight in your marketing?",
    description: "Free 3-minute AI skill check for marketers. Five scenarios on campaign briefs, claim checking, brand voice, and customer data — instant results, no signup.",
    body: "Marketing teams were among the first to adopt AI assistants — ChatGPT, Claude, Copilot, Gemini — for copy, ideas, and repurposing. But adoption isn't the same as advantage. The marketers getting real leverage brief assistants like they'd brief an agency, keep a human pass before anything ships, and never let a tool invent a claim their brand has to stand behind.\n\nThis 3-minute check tests five judgment calls working marketers face constantly: briefing an assistant for campaign ideas, catching unverifiable claims in AI copy, getting drafts that sound like your brand instead of everyone's, handling customer data responsibly, and knowing where AI belongs in the content pipeline.\n\nNo signup, instant results — and an honest look at whether you're using AI like a pro or like everyone else.",
    faqs: [
      { q: "Does this test a specific AI tool?", a: "No — the scenarios apply equally to ChatGPT, Claude, Microsoft Copilot, Google Gemini, or any assistant your team uses. Judgment transfers across tools." },
      { q: "Do I need to know prompt engineering?", a: "No jargon required. If you know how to brief a colleague or an agency well, you already have the underlying skill this measures." },
      { q: "What happens after the check?", a: "You get an instant snapshot of your strengths and gaps. If you want to go deeper, the full course covers AI-assisted marketing workflows end to end." },
    ],
    topicRelevance: {
      "Campaign briefing": "A brief with audience, goal, and voice examples is what separates usable ideas from noise.",
      "Claim checking": "Every claim in published copy is your brand's responsibility, not the tool's.",
      "Brand voice": "Real examples of your copy teach an assistant your voice better than any adjective can.",
      "Customer data": "Subscriber and customer data carries legal and trust obligations that don't pause for convenience.",
      "Content workflow": "AI compresses drafting and repurposing — the human review pass is what keeps quality up.",
    },
  },
  "ai-for-finance": {
    h1: "Is AI pulling its weight in your finance work?",
    description: "Free 3-minute AI skill check for finance professionals. Five scenarios on briefing analysis, verifying numbers, confidentiality, and review discipline — instant results, no signup.",
    body: "Finance work runs on accuracy and confidentiality — which is exactly why AI assistants like ChatGPT, Claude, Copilot, and Gemini need more careful handling here than almost anywhere else. Used well, they compress commentary drafting, stakeholder explanations, and first-pass analysis. Used carelessly, they put wrong numbers in front of decision-makers or company data in the wrong place.\n\nThis 3-minute check tests the five habits that make AI safe and genuinely useful in a finance role: briefing an assistant on analysis for a non-finance audience, verifying any number an assistant produces, knowing which tasks fit AI today and which don't, keeping company financials inside policy, and treating AI output as a draft rather than a deliverable.\n\nNo signup, no jargon — five scenarios, instant results.",
    faqs: [
      { q: "Is it safe to use AI assistants in finance at all?", a: "Yes, within limits: drafting, explaining, and summarising with human verification are strong uses. The risk comes from trusting unverified numbers or pasting confidential data into unapproved tools." },
      { q: "Do I need Excel or coding skills for this check?", a: "No — it tests judgment, not formulas. The scenarios are about how you brief, verify, and share, in plain language." },
      { q: "Which tools does it cover?", a: "It's tool-agnostic. The same habits apply to ChatGPT, Claude, Microsoft Copilot, Google Gemini, or an assistant built into your finance software." },
    ],
    topicRelevance: {
      "Briefing analysis": "Audience and context in the brief are what turn figures into an explanation people follow.",
      "Verifying numbers": "Assistants can misread or miscount — any figure that drives a decision needs your check.",
      "Task fit": "Knowing what to delegate and what to keep is the core AI skill in a controls-driven role.",
      "Confidential data": "Company financials in an unapproved tool is a policy breach, however useful the answer.",
      "Review discipline": "AI output that touches reported numbers is a draft until a human has verified it.",
    },
  },
  "ai-for-creators": {
    h1: "Is AI speeding you up — or flattening your voice?",
    description: "Free 3-minute AI skill check for content creators. Five scenarios on creative briefs, keeping your voice, fact-checking, and platform rules — instant results, no signup.",
    body: "For creators, AI assistants like ChatGPT, Claude, Copilot, and Gemini are a double-edged tool: they can compress the messy early stages of making things, or they can sand your voice down into the same output as everyone else's. The difference is in how you use them.\n\nThis 3-minute check tests five judgment calls working creators face: briefing an assistant so it amplifies your angle instead of replacing it, keeping your voice through AI-assisted drafts, fact-checking claims before they reach your audience, handling the rights and platform-policy side of AI-assisted work, and knowing where in your workflow AI genuinely pays off.\n\nYour audience follows you for you — this check tells you whether your AI habits protect that or dilute it. Five questions, instant results, no signup.",
    faqs: [
      { q: "Will using AI make my content generic?", a: "It can, if you publish default output. Creators who feed assistants their own work and rewrite drafts in their own words keep their voice — that's part of what this check tests." },
      { q: "Does this apply to video, writing, and podcasts alike?", a: "Yes — the scenarios are about briefing, verification, voice, and rights, which apply whatever format you publish in." },
      { q: "Do I need a paid AI subscription?", a: "No. The habits tested here work the same on free and paid tiers of ChatGPT, Claude, Copilot, Gemini, and similar tools." },
    ],
    topicRelevance: {
      "Creative briefing": "Giving the assistant your angle and audience keeps the work yours from the first draft.",
      "Voice": "Your voice is the asset — AI drafts are raw material for it, not a replacement.",
      "Fact-checking": "Your audience's trust rides on every claim you publish, wherever the draft came from.",
      "Rights & terms": "Platform AI policies and tool terms decide what you can safely publish and monetise.",
      "Creative workflow": "AI pays off most in ideation and rough drafts — the finishing still needs your hands.",
    },
  },
  "ai-for-founders": {
    h1: "Is AI a real lever in your company yet?",
    description: "Free 3-minute AI skill check for founders. Five scenarios on delegating to AI, verifying claims, sensitive company data, and customer-facing rollout — instant results, no signup.",
    body: "Founders have the most to gain from AI assistants — small teams, endless drafting, constant context-switching — and the most to lose from using them carelessly. ChatGPT, Claude, Copilot, and Gemini can absorb real work across investor updates, research prep, and support. But the same tools can also put an unsourced number in your pitch deck or company data somewhere it shouldn't be.\n\nThis 3-minute check tests five founder-shaped judgment calls: briefing an assistant so delegation actually saves time, verifying claims before they go in front of investors, picking the highest-leverage places for AI in a small team, protecting sensitive company data, and rolling out customer-facing AI responsibly.\n\nFive questions, instant results, no signup — a quick read on whether AI is a lever in your company or just another tab.",
    faqs: [
      { q: "Is this about building AI into my product?", a: "No — it's about using AI assistants to run the company: drafting, research, support, and operations. Product AI strategy is a separate topic the full course touches on." },
      { q: "Which tools does it assume?", a: "None in particular. The scenarios apply to ChatGPT, Claude, Microsoft Copilot, Google Gemini, and the growing set of AI features inside the tools you already use." },
      { q: "Is this a test of technical skill?", a: "No — it's a test of operating judgment: what to delegate, what to verify, what to protect. No code involved." },
    ],
    topicRelevance: {
      "Delegating to AI": "Good briefs are what turn AI from a novelty into delegated work you barely rewrite.",
      "Verifying claims": "Unsourced figures in front of investors cost credibility you can't easily buy back.",
      "Where AI fits": "Leverage comes from reviewed drafting and prep, not from automating unowned decisions.",
      "Sensitive data": "Cap tables, contracts, and customer lists deserve a read of the terms before any upload.",
      "Customer-facing AI": "Draft-first rollout keeps a human between the AI and your customers while you learn.",
    },
  },
  "ai-for-teachers": {
    h1: "Is AI saving you hours — without cutting corners?",
    description: "Free 3-minute AI skill check for teachers. Five scenarios on lesson prep, content accuracy, student privacy, and academic integrity — instant results, no signup.",
    body: "Teachers are quietly among the heaviest users of AI assistants like ChatGPT, Claude, Copilot, and Gemini — for lesson activities, differentiation, worksheets, and feedback. The wins are real, and so are the pitfalls: plausible-sounding errors reaching students, identifiable student data going into unapproved tools, and unreliable AI-detection scores driving unfair integrity decisions.\n\nThis 3-minute check tests the five judgment calls that decide which side of that line you're on: briefing an assistant for lesson materials, checking AI-generated content before students see it, holding the line on student privacy, handling suspected AI use in student work fairly, and using AI in marking without handing over the judgment that's yours.\n\nNo signup, no jargon, no grading of you as a teacher — just an honest snapshot of your AI habits.",
    faqs: [
      { q: "Is using AI for lesson planning considered cutting corners?", a: "Not in itself — drafting activities and materials with AI and reviewing them carefully is a legitimate time-saver. The corner-cutting risk is in skipping the review or the privacy check." },
      { q: "Does this cover AI detectors?", a: "It covers the judgment around them: how to respond fairly when you suspect AI use in student work, rather than treating any detector score as a verdict." },
      { q: "Do I need my school's permission to take this?", a: "No — this check involves no student data and no school systems. It's five scenario questions about your own working habits." },
    ],
    topicRelevance: {
      "Lesson briefing": "Year level, goal, and constraints in the prompt are what make a draft classroom-ready.",
      "Content accuracy": "Anything AI-generated that reaches students carries your authority — check it first.",
      "Student privacy": "Identifiable student data belongs only in tools your school has approved.",
      "Academic integrity": "Fair process beats detector scores when you suspect AI use in student work.",
      "Feedback workflow": "AI can draft the scaffolding of feedback; the judgment and the grade stay yours.",
    },
  },
  "ai-for-project-managers": {
    h1: "Is AI making you a faster, sharper project manager?",
    description: "Free 3-minute AI skill check for project managers. Five scenarios on briefing work, verifying summaries, meeting notes, and confidential data — instant results, no signup.",
    body: "Project management is coordination work — briefs, summaries, notes, status updates — which makes it one of the richest surfaces for AI assistants like ChatGPT, Claude, Copilot, and Gemini. It also makes it one of the riskiest: a dropped point in an AI summary or an unchecked meeting note can quietly steer a project off course.\n\nThis 3-minute check tests five judgment calls PMs face weekly: briefing an assistant to draft work items that hold up, verifying AI summaries before they drive decisions, using AI meeting notes without letting them become an unchecked record, keeping confidential roadmap and customer material inside approved tools, and knowing which calls should never be delegated to an assistant.\n\nFive questions, instant results, no signup — and no pretending AI replaces the judgment that makes a good PM.",
    faqs: [
      { q: "Does this apply outside software projects?", a: "Yes — the scenarios are about briefing, verification, meetings, and confidentiality, which apply to project work in any industry." },
      { q: "Which AI tools does it cover?", a: "It's tool-agnostic: chat assistants like ChatGPT, Claude, Copilot, and Gemini, plus AI notetakers and the AI features appearing inside project tools." },
      { q: "Will it tell me which tasks to automate?", a: "It gives you a read on your judgment across five areas, including task fit. The full course goes deeper into building AI into PM workflows step by step." },
    ],
    topicRelevance: {
      "Work briefing": "Problem, user, and constraints in the brief are what make AI-drafted work items stick.",
      "Summary verification": "A summary that drives a decision deserves a pass over the original first.",
      "Meeting workflow": "AI notes are a draft record — decisions and owners need your check before circulating.",
      "Confidential data": "Roadmaps and customer names call for approved tools and informed attendees.",
      "Judgment calls": "Commitments and trade-offs are the PM's to make; AI drafts around them, not over them.",
    },
  },
  "ai-for-sales": {
    h1: "Is AI helping you sell more — or just sound generic?",
    description: "Free 3-minute AI skill check for sales professionals. Five scenarios on outreach briefs, research verification, CRM data, and honest claims — instant results, no signup.",
    body: "Sales teams reached for AI assistants early — ChatGPT, Claude, Copilot, Gemini — mostly for outreach and research. The result: inboxes full of AI-written emails that all sound the same. The sellers actually gaining ground use AI differently — real prospect specifics in the brief, verification before a 'personalised' detail goes out, and a hard line on claims the product can't back.\n\nThis 3-minute check tests five judgment calls that decide which group you're in: briefing AI for outreach that doesn't read like a template, verifying AI research before you reference it, handling CRM and customer data properly, prepping calls with AI without outsourcing your thinking, and keeping AI drafts honest about what you sell.\n\nFive questions, instant results, no signup.",
    faqs: [
      { q: "Won't buyers just ignore AI-written outreach?", a: "They ignore generic outreach, however it was written. The check covers what makes AI-assisted outreach specific enough to earn a reply — and that starts with your input, not the tool." },
      { q: "Does this cover AI tools built into CRMs?", a: "The judgment tested here applies to them too — briefing, verification, and data handling work the same whether the AI lives in a chat window or inside your CRM." },
      { q: "Is this a sales skills test?", a: "No — it assumes you can sell. It measures how well your AI habits support that: better inputs, verified research, safe data handling, honest claims." },
    ],
    topicRelevance: {
      "Outreach briefing": "Specifics about the prospect are the difference between outreach and noise.",
      "Research verification": "One wrong 'personalised' detail can end a thread before it starts — verify first.",
      "Customer data": "CRM data belongs in company-approved tools, never in personal chatbot accounts.",
      "Call preparation": "AI briefs speed up prep; the thinking about this account is still your edge.",
      "Honest selling": "Every capability claim in a draft you send is a promise you'll have to keep.",
    },
  },
};
