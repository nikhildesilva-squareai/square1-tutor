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
  pdf: string;          // path under /public
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
];

export function getArticle(slug: string): ResearchArticle | undefined {
  return RESEARCH_ARTICLES.find((a) => a.slug === slug);
}
