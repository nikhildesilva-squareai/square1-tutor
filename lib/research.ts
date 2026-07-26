// ═══════════════════════════════════════════════════════════════════════════════
// Research library — articles written by the Square 1 AI team.
//
// Single source of truth for /research (index), /research/[slug] (detail),
// sitemap entries, and Article structured data. Each entry maps to a PDF in
// /public/research. To publish a new article: drop the PDF there and add one
// entry here — everything else (page, sitemap, SEO markup) derives from it.
// ═══════════════════════════════════════════════════════════════════════════════

export type ResearchArticle = {
  slug: string;
  title: string;
  description: string; // 1–3 sentences; used as meta description + card blurb
  topic: string;
  pdf?: string;         // optional path under /public — newer articles are
                        // markdown-native (content/research/<slug>.md) with no PDF
  published: string;    // ISO date (site publication date)
};

export const RESEARCH_TOPICS = [
  "AI Safety & Ethics",
  "Security",
  "LLMs & Agents",
  "Healthcare",
  "Education",
  "Cloud & Infrastructure",
  "Industry & Society",
] as const;

export const RESEARCH_ARTICLES: ResearchArticle[] = [
  {
    slug: "ai-empathy-paradox-explainable-ai",
    title: "The AI Empathy Paradox and Explainable AI",
    description:
      "Why systems that feel empathetic and systems that explain themselves pull in different design directions — and how explainable-AI techniques can close the trust gap between the two.",
    topic: "AI Safety & Ethics",
    pdf: "/research/ai-empathy-paradox-explainable-ai.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-fluency-for-educators",
    title: "AI Fluency for Educators",
    description:
      "The 4D framework — delegation, description, discernment, diligence — plus a systematic review of ten studies on how teachers build AI fluency while keeping human judgment central to the classroom.",
    topic: "Education",
    pdf: "/research/ai-fluency-for-educators.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-in-cybersecurity",
    title: "AI in Cybersecurity",
    description:
      "Where machine learning genuinely strengthens defence — threat detection, anomaly spotting, response automation — and where attackers are using the same tools back.",
    topic: "Security",
    pdf: "/research/ai-in-cybersecurity.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-decision-management-systems",
    title: "AI Decision Management Systems",
    description:
      "Research on systems that automate and augment organisational decision-making: architectures, governance, and the line between decision support and decision delegation.",
    topic: "LLMs & Agents",
    pdf: "/research/ai-decision-management-systems.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-enhanced-threat-modeling",
    title: "AI-Enhanced Threat Modeling",
    description:
      "Applying AI to threat modeling: generating attack scenarios, prioritising risks, and keeping security analysis current as systems change faster than manual reviews can.",
    topic: "Security",
    pdf: "/research/ai-enhanced-threat-modeling.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-image-recognition",
    title: "AI Image Recognition: State of the Field",
    description:
      "A tour of modern image recognition — convolutional and transformer-based approaches, benchmark progress, and the practical limits that still separate lab results from deployment.",
    topic: "LLMs & Agents",
    pdf: "/research/ai-image-recognition.pdf",
    published: "2026-07-06",
  },
  {
    slug: "multi-agent-ai-safety",
    title: "Safety in Multi-Agent AI Systems",
    description:
      "When multiple AI agents interact, new failure modes appear that single-agent safety work doesn't cover. This paper maps the risks and the emerging mitigations.",
    topic: "AI Safety & Ethics",
    pdf: "/research/multi-agent-ai-safety.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-early-disease-detection",
    title: "AI-Driven Early Disease Detection",
    description:
      "How machine learning models are pushing diagnosis earlier — the screening domains showing real clinical signal, and the validation hurdles between promising models and patient impact.",
    topic: "Healthcare",
    pdf: "/research/ai-early-disease-detection.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-autonomous-loops-mineral-processing",
    title: "AI-Autonomous Loops in Mineral Processing",
    description:
      "How a digital bridge between geological models and plant hardware — hosted in a digital twin — enables real-time ore sorting and dynamic filtration, cutting energy use and improving water circularity in mining.",
    topic: "Industry & Society",
    pdf: "/research/ai-autonomous-loops-mineral-processing.pdf",
    published: "2026-07-06",
  },
  {
    slug: "blockchain-ai-accountability",
    title: "Blockchain for AI Accountability",
    description:
      "Can tamper-evident ledgers make AI systems auditable? An examination of blockchain-backed provenance, model audit trails, and the accountability gaps they can and cannot close.",
    topic: "AI Safety & Ethics",
    pdf: "/research/blockchain-ai-accountability.pdf",
    published: "2026-07-06",
  },
  {
    slug: "ai-cloud-security",
    title: "AI for Cloud Security",
    description:
      "Securing cloud environments with AI: detection across sprawling attack surfaces, misconfiguration hunting, and the operational realities of trusting models with security decisions.",
    topic: "Security",
    pdf: "/research/ai-cloud-security.pdf",
    published: "2026-07-06",
  },
  {
    slug: "comparative-linguistic-framework",
    title: "A Comparative Linguistic Framework",
    description:
      "A framework for comparing how languages encode meaning — and what systematic cross-linguistic comparison reveals for language technology and language learning.",
    topic: "Industry & Society",
    pdf: "/research/comparative-linguistic-framework.pdf",
    published: "2026-07-06",
  },
  {
    slug: "culturally-responsive-ai",
    title: "Culturally Responsive AI",
    description:
      "AI systems are trained on some cultures more than others. This research examines what culturally responsive design means in practice and why it matters for global deployment.",
    topic: "AI Safety & Ethics",
    pdf: "/research/culturally-responsive-ai.pdf",
    published: "2026-07-06",
  },
  {
    slug: "optimizing-ai-workflows-2026",
    title: "Optimizing AI Workflows in 2026",
    description:
      "A report on how teams are actually structuring AI-assisted work in 2026 — the workflow patterns, tooling choices, and process changes that separate productive adoption from noise.",
    topic: "Industry & Society",
    pdf: "/research/optimizing-ai-workflows-2026.pdf",
    published: "2026-07-06",
  },
  {
    slug: "zero-trust-security-ai",
    title: "Enhancing Zero-Trust Security with AI",
    description:
      "Zero-trust assumes breach; AI makes the continuous verification it demands tractable. How adaptive models strengthen identity, access, and anomaly decisions in zero-trust architectures.",
    topic: "Security",
    pdf: "/research/zero-trust-security-ai.pdf",
    published: "2026-07-06",
  },
  {
    slug: "generative-ai-creative-industries",
    title: "Generative AI in the Creative Industries",
    description:
      "How generative models are reshaping creative work — production pipelines, authorship and rights questions, and where human craft concentrates as generation gets cheap.",
    topic: "Industry & Society",
    pdf: "/research/generative-ai-creative-industries.pdf",
    published: "2026-07-06",
  },
  {
    slug: "explainable-ai-healthcare",
    title: "Explainable AI in Healthcare",
    description:
      "Clinicians won't act on predictions they can't interrogate. This paper reviews explainability techniques for medical AI and the evidence on what actually earns clinical trust.",
    topic: "Healthcare",
    pdf: "/research/explainable-ai-healthcare.pdf",
    published: "2026-07-06",
  },
  {
    slug: "llm-efficiency",
    title: "LLM Efficiency: Doing More with Less",
    description:
      "Research on making large language models cheaper to train and serve — quantisation, distillation, and architectural efficiency, and what they trade away for their savings.",
    topic: "LLMs & Agents",
    pdf: "/research/llm-efficiency.pdf",
    published: "2026-07-06",
  },
  {
    slug: "mirror-in-the-machine",
    title: "The Mirror in the Machine",
    description:
      "What AI systems reflect back about the people and data that built them — an essay on bias, projection, and interpretation in human–AI interaction.",
    topic: "AI Safety & Ethics",
    pdf: "/research/mirror-in-the-machine.pdf",
    published: "2026-07-06",
  },
  {
    slug: "assessing-multi-agent-systems",
    title: "Assessing Multi-Agent AI Systems",
    description:
      "Evaluating a single model is hard; evaluating a system of interacting agents is harder. Methods and metrics for assessing multi-agent behaviour beyond per-agent benchmarks.",
    topic: "LLMs & Agents",
    pdf: "/research/assessing-multi-agent-systems.pdf",
    published: "2026-07-06",
  },
  {
    slug: "llm-resource-usage-hallucinations",
    title: "Resource-Efficient LLMs and Hallucination Control",
    description:
      "Two failure axes of deployed LLMs — wasted compute and confident falsehoods — and the techniques that push toward efficient resource use with grounded, verifiable output.",
    topic: "LLMs & Agents",
    pdf: "/research/llm-resource-usage-hallucinations.pdf",
    published: "2026-07-06",
  },
  {
    slug: "quantum-computing-adoption-sri-lanka",
    title: "Quantum Computing Adoption in Sri Lanka",
    description:
      "A study of quantum computing readiness in Sri Lanka: the research capacity, industry appetite, and policy groundwork an emerging economy needs to participate early.",
    topic: "Industry & Society",
    pdf: "/research/quantum-computing-adoption-sri-lanka.pdf",
    published: "2026-07-06",
  },

  // ── 2026-07-27 SEO expansion — markdown-native articles (no PDF) ──────────
  {
    slug: "gpu-vs-cpu-for-machine-learning",
    title: "GPU vs CPU for Machine Learning: Which Do You Need?",
    description:
      "Learn when machine learning needs a GPU and when a CPU is enough, covering training versus inference, memory, parallelism and sensible cloud choices.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "what-is-model-serving",
    title: "What Is Model Serving? ML Deployment Explained",
    description:
      "Model serving explained for beginners: how trained ML models answer live requests, the role of APIs, latency, autoscaling and popular serving tools.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "what-is-a-vector-database",
    title: "What Is a Vector Database? A Beginner's Guide",
    description:
      "What a vector database is, how embeddings and similarity search work, when you need one for AI apps, and how to choose between the main options.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "how-to-deploy-a-machine-learning-model",
    title: "How to Deploy a Machine Learning Model: Step by Step",
    description:
      "A step-by-step guide to deploying a machine learning model: packaging, choosing infrastructure, building an API, testing, monitoring and rollback.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "cloud-cost-optimisation-for-ai-workloads",
    title: "Cloud Cost Optimisation for AI Workloads: A Practical Guide",
    description:
      "Practical ways to control cloud costs for AI workloads: right-sizing GPUs, spot capacity, caching, budgets, and the habits that stop bill surprises.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "ci-cd-for-machine-learning",
    title: "CI/CD for Machine Learning: How to Automate ML Pipelines",
    description:
      "How CI/CD works for machine learning: automated testing for data and models, pipeline stages, deployment strategies and the tools teams rely on.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "serverless-vs-containers-for-ai-applications",
    title: "Serverless vs Containers for AI Applications",
    description:
      "Serverless vs containers for AI applications compared: cold starts, GPU access, scaling behaviour, cost patterns and when each approach wins.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "managed-vs-self-hosted-llms",
    title: "Managed vs Self-Hosted LLMs: Which Should You Choose?",
    description:
      "Managed vs self-hosted LLMs compared: control, privacy, latency, operational burden and total cost — plus a decision framework for choosing well.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "mlops-skills-employers-want",
    title: "MLOps Skills Employers Actually Want",
    description:
      "The MLOps skills employers look for — cloud platforms, pipelines, containers, monitoring and LLM operations — and how to build proof you have them.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "scaling-llm-inference",
    title: "Scaling LLM Inference: Architecture and Cost Design",
    description:
      "How to scale LLM inference: batching, KV caching, quantisation, autoscaling GPUs, routing and the observability you need to keep latency down.",
    topic: "Cloud & Infrastructure",
    published: "2026-07-27",
  },
  {
    slug: "what-is-an-ai-tutor",
    title: "What Is an AI Tutor? How AI Tutoring Works in 2026",
    description:
      "Learn what an AI tutor actually does, how it differs from chatbots and human teachers, where it helps most, and how to judge one before you commit.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "adaptive-learning-explained",
    title: "Adaptive Learning Explained: How It Personalises Study",
    description:
      "Adaptive learning adjusts what you study based on your performance. How the systems work, why fixed pacing fails, and what to look for in a platform.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "spaced-repetition-for-skill-learning",
    title: "Spaced Repetition: How to Make New Skills Stick",
    description:
      "Why cramming fades and spaced repetition lasts: the science of retrieval practice and spacing, applied to real skills like coding and prompt writing.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "teaching-with-ai-classroom-guide",
    title: "Teaching With AI: A Practical Guide for Educators",
    description:
      "A practical guide to teaching with AI: what to delegate, how to multiply practice and feedback, redesigning tasks, and teaching its failure modes.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "assessment-in-the-age-of-chatgpt",
    title: "Assessment in the Age of ChatGPT: What Still Works",
    description:
      "How to assess students when ChatGPT can write the essay: process evidence, supervised checkpoints, oral defences, and tasks where AI use is the skill.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "project-based-learning-with-ai",
    title: "Project-Based Learning With AI: A Practical How-To",
    description:
      "How to run project-based learning in the AI era: briefs that resist one-shot generation, decision records, defences, and rubric-driven AI grading.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "bootcamp-vs-self-paced-vs-ai-graded-learning",
    title: "Bootcamp vs Self-Paced vs AI-Graded: Which Suits You?",
    description:
      "Bootcamps, self-paced courses and AI-graded platforms compared on cost, feedback, structure and risk — and how to choose the route that fits your life.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "certificates-vs-portfolios-tech-careers",
    title: "Certificates vs Portfolios: What Gets You Hired in Tech",
    description:
      "Certificates open doors, portfolios close offers. How hiring treats each, what AI has changed, and how to build both from the same learning hours.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "how-adults-learn-to-code-2026",
    title: "How Adults Learn to Code in 2026: A Realistic Roadmap",
    description:
      "A realistic guide for adults learning to code in 2026: what AI changes, why practice-first beats video-watching, and a route that survives real life.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "ai-literacy-core-skill-debate",
    title: "AI Literacy: Should It Be a Core Skill in Every School?",
    description:
      "The case for and against making AI literacy a core skill: what it really means, the strongest arguments on both sides, and where the debate is settling.",
    topic: "Education",
    published: "2026-07-27",
  },
  {
    slug: "ai-medical-imaging-explained",
    title: "AI in Medical Imaging: How It Works",
    description:
      "How AI medical imaging works, from pixel data to triage lists: the model families involved, where accuracy comes from, and why radiologists stay in the loop.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "clinical-decision-support-ai",
    title: "Clinical Decision Support AI: A Practical Guide",
    description:
      "What clinical decision support AI does inside a hospital, how alerts are designed and delivered, and why governance and usability decide whether a tool helps.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "validating-medical-ml-models",
    title: "Validating Medical ML Models: A Practical Guide",
    description:
      "A step-by-step approach to validating medical machine learning models: honest data splits, external testing, subgroup checks, thresholds and drift monitoring.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "health-data-privacy-ai",
    title: "Health Data Privacy in AI: A Practical Guide",
    description:
      "How health AI teams handle patient data responsibly: de-identification limits, consent and secondary use, federated approaches, and privacy risks inside models.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "ai-triage-vs-traditional-triage",
    title: "AI Triage vs Traditional Triage: A Comparison",
    description:
      "Comparing AI-assisted triage with established nurse-led triage scales: what each does well, where automation helps, and the risks of shifting the first call.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "machine-learning-skills-health-tech-careers",
    title: "Machine Learning Skills for Health-Tech Roles",
    description:
      "The machine learning skills health-tech employers screen for: clinical data handling, leakage detection, validation discipline and regulatory literacy.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "bias-in-clinical-ai-models",
    title: "Bias in Clinical AI Models: Causes and Remedies",
    description:
      "Where bias in clinical AI models comes from — sampling, measurement, labels and proxies — and which remedies reduce harm rather than tidying up the metrics.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "ai-medical-scribes",
    title: "AI Medical Scribes: Benefits, Risks and Reality",
    description:
      "How AI medical scribes work, what they realistically change about clinical documentation, and the accuracy, consent and accountability questions they raise.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "ai-drug-discovery-explained",
    title: "AI in Drug Discovery: What It Can and Cannot Do",
    description:
      "Where AI genuinely accelerates drug discovery — structure prediction, generative chemistry, property models — and why the clinical bottleneck stays untouched.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "medical-ai-regulation-explained",
    title: "Medical AI Regulation: How Oversight Is Evolving",
    description:
      "How medical AI regulation works: when software becomes a device, risk classification, the evidence regulators expect, and the problem of models that change.",
    topic: "Healthcare",
    published: "2026-07-27",
  },
  {
    slug: "ai-for-marketers-workplace-guide",
    title: "AI for Marketers: A Practical Guide to Daily Workflows",
    description:
      "AI for marketers explained: where models genuinely help with copy, research and repurposing, where they fail, and how to build repeatable on-brand workflows.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "ai-for-finance-professionals-guide",
    title: "AI in Finance Teams: A Practical Guide for Professionals",
    description:
      "How finance teams can use AI safely: strong use cases in commentary and contracts, hard limits on numbers and advice, plus controls that keep work auditable.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "ai-and-entry-level-jobs",
    title: "AI and Entry-Level Jobs: What Changes and What Remains",
    description:
      "AI is absorbing the routine tasks junior roles were built on. What that means for graduates, the apprenticeship pipeline, and how both sides should respond.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "reskilling-for-the-ai-economy",
    title: "Reskilling for the AI Economy: A Realistic Roadmap",
    description:
      "Reskilling for AI without the hype: why most professionals need fluency rather than a career change, what effective training looks like, and its honest limits.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "ai-augmentation-vs-automation",
    title: "AI Augmentation vs Automation: How to Choose per Task",
    description:
      "Augmentation or automation? Compare the two AI adoption approaches: where each fits, how each fails, the economics, and a five-question per-task framework.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "introducing-ai-in-a-small-business",
    title: "Introducing AI in a Small Business: A Step-by-Step Guide",
    description:
      "A step-by-step guide to introducing AI in a small business: pick one bottleneck, run a two-week trial, set three simple rules, then scale task by task.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "how-to-write-an-ai-usage-policy",
    title: "How to Write an AI Usage Policy for Your Workplace",
    description:
      "How to write an AI usage policy staff actually follow: the core sections, data rules, accountability, common mistakes, and a rollout that changes behaviour.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "ai-and-workplace-productivity",
    title: "AI and Workplace Productivity: Beyond the Hype Cycle",
    description:
      "AI productivity gains are real but uneven. Why they vanish from dashboards, where they concentrate, and why user skill is the multiplier organisations miss.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "trust-in-ai-systems",
    title: "Trust in AI Systems: How It Is Built, Lost and Earned",
    description:
      "Trust in AI systems examined: why fluent output miscalibrates human judgement, what calibrated trust looks like, and how organisations earn or destroy it.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "human-ai-collaboration-at-work",
    title: "Human-AI Collaboration at Work: Getting the Split Right",
    description:
      "Human-AI collaboration works when the division of labour is right. What to delegate, what humans must keep, common failure modes, and the new skill it demands.",
    topic: "Industry & Society",
    published: "2026-07-27",
  },
  {
    slug: "what-is-retrieval-augmented-generation",
    title: "What Is RAG? Retrieval-Augmented Generation Explained",
    description:
      "Learn what retrieval-augmented generation (RAG) is, how it grounds LLM answers in your own documents, and when to choose it over fine-tuning or prompting.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "llm-context-windows-explained",
    title: "LLM Context Windows Explained: Tokens, Limits and Cost",
    description:
      "Understand LLM context windows: what tokens are, why limits matter, how long inputs affect cost and accuracy, and practical ways to work within them.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "fine-tuning-vs-prompt-engineering",
    title: "Fine-Tuning vs Prompt Engineering: Which to Use When",
    description:
      "Fine-tuning vs prompt engineering: what each changes in an LLM, where each wins, typical costs and risks, and a practical decision path for your project.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "rag-vs-fine-tuning",
    title: "RAG vs Fine-Tuning: How to Choose for Your LLM Project",
    description:
      "RAG vs fine-tuning compared: how each adds knowledge to an LLM, strengths, costs, failure modes, and how to decide which approach fits your use case.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "how-to-evaluate-llm-outputs",
    title: "How to Evaluate LLM Outputs: A Practical Guide",
    description:
      "A practical guide to evaluating LLM outputs: rubrics, golden sets, LLM-as-judge, regression checks and human review, with pitfalls to avoid at each step.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "how-to-build-an-ai-agent-loop",
    title: "How to Build an AI Agent Loop: From Prompt to Action",
    description:
      "Learn how to build an AI agent loop step by step: the reason-act cycle, tool calls, stopping conditions, error handling and guardrails that keep it safe.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "llm-tool-use-function-calling",
    title: "LLM Tool Use and Function Calling Explained",
    description:
      "LLM tool use explained: how function calling works, how models pick tools, what MCP-style protocols add, and how to design tool schemas agents can use.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "single-agent-vs-multi-agent-systems",
    title: "Single-Agent vs Multi-Agent AI Systems: A Comparison",
    description:
      "Single-agent vs multi-agent AI systems compared: when one capable agent beats a team, coordination costs, failure modes and a practical way to choose.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "llm-engineering-skills-employers-want",
    title: "LLM Engineering Skills Employers Actually Want",
    description:
      "The LLM engineering skills employers look for: prompting, RAG, evaluation, agent design and deployment, plus how to build evidence you can show in interviews.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "ai-agent-memory-design",
    title: "AI Agent Memory: How Agents Remember and Why It Matters",
    description:
      "AI agent memory explained: short-term context, long-term stores, summarisation and retrieval, plus design trade-offs that decide what an agent remembers.",
    topic: "LLMs & Agents",
    published: "2026-07-27",
  },
  {
    slug: "what-is-ai-alignment",
    title: "What Is AI Alignment? A Clear Beginner's Guide",
    description:
      "AI alignment explained in plain English: what it means, why making AI pursue human intent is so hard, and the techniques used to close the gap.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "ai-safety-vs-ai-ethics",
    title: "AI Safety vs AI Ethics: Key Differences Explained",
    description:
      "AI safety vs AI ethics: how the two fields differ, where they overlap on bias and transparency, and which skills each path actually rewards.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "ai-bias-audit-step-by-step",
    title: "AI Bias Audit: A Step-by-Step Practical Guide",
    description:
      "How to run an AI bias audit step by step: scope protected groups, choose fairness metrics, test with disaggregated data, diagnose and remediate.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "ai-red-teaming-basics",
    title: "AI Red Teaming Basics: How to Break a Model",
    description:
      "AI red teaming basics: what it is, how to run a first adversarial exercise, and the jailbreak and prompt-injection techniques worth knowing.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "responsible-ai-career-skills",
    title: "Responsible AI Careers: Skills You Actually Need",
    description:
      "The skills responsible-AI roles really require, from evaluations and bias audits to governance and ethics, and how to build a credible portfolio.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "deepfakes-detection-and-defence",
    title: "Deepfakes: Detection, Provenance and Defence",
    description:
      "How deepfakes are made, why detection is so hard, and the provenance and procedural defences that actually protect organisations and individuals.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "ai-governance-explained",
    title: "AI Governance Explained: Rules, Risk and Process",
    description:
      "AI governance explained: risk-based regulation, how the major approaches differ, and the internal processes that turn principles into practice.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "model-transparency-and-explainability",
    title: "Model Transparency and Explainability Explained",
    description:
      "Model transparency vs explainability: the main techniques, why modern models resist explanation, and the danger of plausible but false explanations.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "data-privacy-in-ai-systems",
    title: "Data Privacy in AI Systems: Risks and Safeguards",
    description:
      "Data privacy in AI systems: where risks arise across the lifecycle, memorisation and inference threats, and privacy-preserving techniques that help.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "human-in-the-loop-ai-oversight",
    title: "Human-in-the-Loop AI Oversight: What Works",
    description:
      "Human-in-the-loop AI oversight: why nominal review fails, how automation bias undermines it, and what meaningful human oversight actually requires.",
    topic: "AI Safety & Ethics",
    published: "2026-07-27",
  },
  {
    slug: "what-is-prompt-injection",
    title: "What Is Prompt Injection? A Plain-English Guide",
    description:
      "Prompt injection explained in plain English: how attackers hijack AI instructions, why filters fail, and the layered defences that actually reduce risk.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "llm-security-basics",
    title: "LLM Security Basics: Common Attacks and Defences",
    description:
      "A beginner's guide to LLM security: prompt injection, jailbreaks, data leakage, supply chain risks and the defensive habits that keep AI apps safe.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "securing-machine-learning-pipelines",
    title: "Securing Machine Learning Pipelines Step by Step",
    description:
      "How to secure a machine learning pipeline end to end: data poisoning defences, model supply chain checks, hardened serving and practical monitoring.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "ai-incident-response",
    title: "AI Incident Response: How Teams Use AI Under Pressure",
    description:
      "How security teams use AI in incident response: where it speeds triage and investigation, where it misleads, and how to build it into playbooks safely.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "soc-automation-vs-human-analysts",
    title: "SOC Automation vs Human Analysts: Who Wins in 2026?",
    description:
      "SOC automation vs human analysts compared honestly: what machines triage well, where analysts still win, and how to design the hybrid SOC that works.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "cybersecurity-skills-employers-test-2026",
    title: "Cybersecurity Skills Employers Test in 2026",
    description:
      "The cybersecurity skills employers actually test in 2026 interviews: fundamentals, scripting, AI security literacy, cloud defence and communication.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "ai-phishing-attacks",
    title: "AI Phishing Attacks: How to Spot and Stop Them",
    description:
      "AI phishing attacks have made old detection advice obsolete. Learn how attackers use generative AI and which technical and human defences still hold.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "deepfake-fraud-defence",
    title: "Deepfake Fraud Defence: A Practical Guide for Teams",
    description:
      "Deepfake fraud defence for businesses: why detection fails, the verification controls that survive convincing fakes, and how to prepare your team now.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "adversarial-machine-learning",
    title: "Adversarial Machine Learning Explained for Beginners",
    description:
      "Adversarial machine learning explained: evasion, poisoning, model extraction and inference attacks, plus the practical defences that raise attacker costs.",
    topic: "Security",
    published: "2026-07-27",
  },
  {
    slug: "ai-security-engineer-career",
    title: "AI Security Engineer Career Path: Skills and Roadmap",
    description:
      "How to become an AI security engineer: what the role involves, the skill stack from security fundamentals to LLM attacks, and the realistic routes in.",
    topic: "Security",
    published: "2026-07-27",
  },
];

export function getArticle(slug: string): ResearchArticle | undefined {
  return RESEARCH_ARTICLES.find((a) => a.slug === slug);
}
