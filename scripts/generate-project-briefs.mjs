#!/usr/bin/env node
/**
 * Generates rich project briefs for all Square 1 AI projects.
 * Updates: Supabase description_md + GitHub README
 *
 * Run: node scripts/generate-project-briefs.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const OWNER = "nikhildesilva-squareai";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const projects = JSON.parse(readFileSync(join(__dirname, "projects-data.json"), "utf8"));

// ─── Course context ──────────────────────────────────────────────────────────

const COURSE_CONTEXT = {
  "AI Product Management": {
    intro: "This project is part of the **AI Product Management** course, where you'll learn to lead AI product teams, define strategy, and bring AI-powered products to market.",
    skills: ["product strategy", "stakeholder communication", "data-driven decision making", "AI ethics and governance"],
    careerLink: "AI Product Manager, Technical Product Manager, Product Strategist",
  },
  "Artificial Intelligence": {
    intro: "This project is part of the **Artificial Intelligence** course, where you'll implement classic AI algorithms from search and planning to game-playing agents.",
    skills: ["algorithm design", "heuristic search", "constraint satisfaction", "adversarial game trees"],
    careerLink: "AI Engineer, Research Scientist, Algorithm Developer",
  },
  "Computer Vision": {
    intro: "This project is part of the **Computer Vision** course, where you'll build systems that can see, understand, and process visual information.",
    skills: ["image processing", "object detection", "deep learning for vision", "real-time video analysis"],
    careerLink: "Computer Vision Engineer, ML Engineer, Perception Engineer",
  },
  "Cybersecurity": {
    intro: "This project is part of the **Cybersecurity** course, where you'll learn to identify, exploit, and defend against security vulnerabilities.",
    skills: ["network security", "cryptography", "penetration testing", "secure coding practices"],
    careerLink: "Security Engineer, Penetration Tester, Security Analyst",
  },
  "Data Science": {
    intro: "This project is part of the **Data Science** course, where you'll turn raw data into insights, visualisations, and predictive models.",
    skills: ["exploratory data analysis", "statistical modelling", "data visualisation", "ETL pipelines"],
    careerLink: "Data Scientist, Data Analyst, Analytics Engineer",
  },
  "DevOps Engineering": {
    intro: "This project is part of the **DevOps Engineering** course, where you'll automate infrastructure, build CI/CD pipelines, and manage production systems at scale.",
    skills: ["containerisation", "infrastructure as code", "monitoring and observability", "deployment automation"],
    careerLink: "DevOps Engineer, SRE, Platform Engineer",
  },
  "Drone Technology": {
    intro: "This project is part of the **Drone Technology** course, where you'll build autonomous flight systems, navigation algorithms, and computer vision for UAVs.",
    skills: ["control systems", "GPS navigation", "sensor fusion", "autonomous decision making"],
    careerLink: "Drone Engineer, Robotics Engineer, Autonomous Systems Developer",
  },
  "Full Stack Development": {
    intro: "This project is part of the **Full Stack Development** course, where you'll build production-grade web applications from database to UI.",
    skills: ["frontend development", "backend APIs", "database design", "deployment and DevOps"],
    careerLink: "Full Stack Developer, Software Engineer, Web Developer",
  },
  "Game Development": {
    intro: "This project is part of the **Game Development** course, where you'll build complete games with physics, AI, and player engagement mechanics.",
    skills: ["game loops and physics", "sprite animation", "AI opponents", "state management"],
    careerLink: "Game Developer, Gameplay Programmer, Indie Game Creator",
  },
  "Generative AI": {
    intro: "This project is part of the **Generative AI** course, where you'll build applications powered by large language models and AI generation capabilities.",
    skills: ["prompt engineering", "RAG architectures", "streaming responses", "AI safety and guardrails"],
    careerLink: "AI Engineer, LLM Application Developer, GenAI Specialist",
  },
  "LLM Agent Architect": {
    intro: "This project is part of the **LLM Agent Architect** course, where you'll design and build autonomous AI agents that reason, plan, and use tools.",
    skills: ["agent architectures", "tool use and function calling", "multi-step reasoning", "evaluation frameworks"],
    careerLink: "AI Agent Developer, LLM Engineer, AI Systems Architect",
  },
  "Machine Learning": {
    intro: "This project is part of the **Machine Learning** course, where you'll build, train, and deploy ML models that learn from data.",
    skills: ["supervised and unsupervised learning", "model evaluation", "feature engineering", "model deployment"],
    careerLink: "ML Engineer, Data Scientist, Applied Scientist",
  },
};

// ─── Per-project detailed brief content ──────────────────────────────────────

const PROJECT_BRIEFS = {
  // ── AI PRODUCT MANAGEMENT ─────────────────────────────────────────────────
  "AI Product Spec Document": {
    overview: "In this project, you'll write a production-quality Product Requirements Document (PRD) for an AI-powered feature. You'll choose a real product (e.g., a food delivery app, a fitness tracker, or an HR tool) and define an AI feature that solves a genuine user problem. The PRD should be detailed enough that an engineering team could start building from it.",
    objectives: ["Structure a PRD with problem statement, user stories, acceptance criteria, and success metrics", "Define AI-specific requirements including data needs, model constraints, and fallback behaviour", "Conduct competitive analysis and identify differentiation", "Create wireframes or user flow diagrams for your proposed feature"],
    approach: "Start by identifying a real product you use daily. Find a pain point that AI could solve. Research how competitors address this (or don't). Write the PRD section by section: problem → users → solution → requirements → metrics → risks.",
    deliverables: ["Complete PRD document (5-10 pages)", "User persona profiles (at least 2)", "Feature prioritisation matrix (MoSCoW or RICE)", "Wireframes or flow diagrams", "Success metrics with baseline and target values"],
    tips: ["Use the PRFAQ format (Press Release + FAQ) to test if your feature is compelling", "Interview at least 2 potential users before finalising requirements", "Include edge cases: what happens when the AI is wrong?", "Define clear fallback UX for when the model fails or is uncertain"],
    evaluation: ["Clarity and specificity of requirements (no vague statements)", "Completeness of the PRD (all sections present and detailed)", "Realistic success metrics with measurable KPIs", "Quality of user research and competitive analysis"],
  },
  "Competitive Analysis Report": {
    overview: "Analyse 5 AI-powered products in a specific market vertical (e.g., AI writing tools, AI customer service, AI recruiting). Create a comprehensive report that identifies market gaps, compares features, evaluates pricing strategies, and recommends a competitive positioning strategy.",
    objectives: ["Evaluate AI products across multiple dimensions (features, UX, pricing, AI quality)", "Identify market whitespace and unmet user needs", "Create comparison frameworks and scoring rubrics", "Develop actionable strategic recommendations"],
    approach: "Pick a specific AI market segment. Sign up for free trials of 5 competitors. Use each product for at least 30 minutes. Document strengths, weaknesses, pricing, and AI capabilities. Synthesise findings into a strategic framework.",
    deliverables: ["Feature comparison matrix with scoring", "SWOT analysis for each competitor", "Market positioning map (2x2 matrix)", "Pricing analysis with tier comparison", "Strategic recommendations (2-3 pages)"],
    tips: ["Actually USE the products — screenshots of real interactions are gold", "Test edge cases: how does each product handle unusual inputs?", "Look at review sites (G2, Capterra) for real user sentiment", "Include publicly available metrics (funding, headcount, growth) where possible"],
    evaluation: ["Depth of analysis (not just surface-level feature lists)", "Quality of strategic insights and recommendations", "Evidence-based conclusions with supporting data", "Professional presentation and clear structure"],
  },
  "User Research Plan": {
    overview: "Design a comprehensive user research plan for an AI product. You'll create interview scripts, survey questions, persona templates, and a research timeline. The plan should be ready to execute — a product team should be able to pick it up and start conducting research immediately.",
    objectives: ["Design a mixed-methods research plan (qualitative + quantitative)", "Write effective interview scripts that avoid leading questions", "Create survey instruments with proper question design", "Develop user personas grounded in research hypotheses"],
    approach: "Start by defining your research questions. What do you need to learn? Then choose appropriate methods (interviews for depth, surveys for breadth, usability tests for behaviour). Write your instruments, pilot test them, and create a research timeline.",
    deliverables: ["Research plan document with objectives, methods, and timeline", "Semi-structured interview guide (15-20 questions)", "Survey questionnaire (20-30 questions with proper scales)", "3 proto-personas based on research hypotheses", "Recruitment screener for participants"],
    tips: ["Use open-ended questions in interviews: 'Tell me about a time when...' not 'Do you like...'", "Include a Likert scale section in your survey for quantitative analysis", "Plan for 5-8 interview participants — quality over quantity", "Add a screener question to filter out non-target users"],
    evaluation: ["Research questions are specific, measurable, and actionable", "Interview script avoids leading questions and bias", "Survey design follows best practices (no double-barrelled questions, proper scales)", "Personas are grounded in data hypotheses, not stereotypes"],
  },
  "AI Ethics Review Framework": {
    overview: "Create a practical framework that product teams can use to evaluate AI features for ethical risks. The framework should cover bias detection, fairness metrics, transparency requirements, and accountability structures. It should be usable — not a theoretical paper, but a working checklist and scoring system.",
    objectives: ["Identify common ethical risks in AI systems (bias, privacy, transparency, accountability)", "Create a scoring rubric for evaluating AI features against ethical criteria", "Design a review process that integrates into product development workflows", "Document case studies of AI ethics failures and lessons learned"],
    approach: "Study existing frameworks (EU AI Act, NIST AI RMF, Google's AI Principles). Identify the practical gaps — what's missing for day-to-day product teams? Create a lightweight checklist and scoring system. Test it against 2-3 real AI products.",
    deliverables: ["Ethics review checklist (30+ items across 5 categories)", "Scoring rubric with severity levels and remediation guidance", "Process flow diagram showing when/how to conduct reviews", "2-3 case study analyses using your framework", "One-page executive summary for leadership buy-in"],
    tips: ["Focus on PRACTICAL ethics, not philosophy — what can a PM actually do?", "Include data-specific checks: what training data was used? Is it representative?", "Test your framework on ChatGPT, Midjourney, or another public AI product", "Include a 'red team' checklist: what could go wrong for vulnerable users?"],
    evaluation: ["Framework is comprehensive yet practical (not a 50-page academic paper)", "Scoring rubric is specific and actionable", "Case studies demonstrate real-world application", "Process integrates into existing product development workflows"],
  },
  "Go-to-Market Strategy": {
    overview: "Develop a complete go-to-market (GTM) strategy for launching an AI product. You'll define target segments, positioning, pricing, distribution channels, launch timeline, and success metrics. Choose a real AI product concept and create a strategy that could actually be executed.",
    objectives: ["Define target market segments with sizing and prioritisation", "Create compelling positioning and messaging frameworks", "Design a pricing strategy with competitive justification", "Plan launch phases with specific milestones and KPIs"],
    approach: "Start with market segmentation (who needs this?). Then positioning (why us?). Then pricing (how much?). Then channels (where to sell?). Then timeline (when and how?). Each section should reference data and competitive context.",
    deliverables: ["Market segmentation analysis with TAM/SAM/SOM", "Positioning statement and messaging matrix", "Pricing model with 2-3 tier options and justification", "Channel strategy with acquisition cost estimates", "90-day launch plan with weekly milestones"],
    tips: ["Use the 'Jobs to be Done' framework for segmentation", "Write 3 different positioning statements and test which resonates", "Research competitor pricing on G2/Capterra for benchmarking", "Include a 'Day 1' checklist: what needs to be true before launch?"],
    evaluation: ["Market sizing is data-backed and realistic", "Positioning is differentiated and specific (not generic)", "Pricing has clear rationale and competitive context", "Launch plan is detailed enough to execute"],
  },
  "Product Roadmap": {
    overview: "Build a 12-month product roadmap for an AI product with quarterly OKRs, feature prioritisation, and resource planning. The roadmap should balance innovation (new AI capabilities) with reliability (infrastructure, testing, monitoring). Show how you'd sequence features to maximise user value while managing technical risk.",
    objectives: ["Create a time-bound roadmap with clear quarterly themes", "Define OKRs that are measurable and aligned to business goals", "Prioritise features using a structured framework (RICE, ICE, or MoSCoW)", "Plan for AI-specific considerations: data pipelines, model training, evaluation"],
    approach: "Start with the product vision (12-month north star). Break it into quarterly themes. For each quarter, define 2-3 OKRs. Then list candidate features and prioritise them. Map features to quarters based on priority, dependencies, and resource constraints.",
    deliverables: ["12-month roadmap visualisation (timeline or swimlane format)", "Quarterly OKRs (2-3 per quarter, each with 3-4 key results)", "Feature prioritisation matrix with scores and rationale", "Dependency map showing feature relationships", "Resource estimation for each major initiative"],
    tips: ["Use the 'Now/Next/Later' framework if exact dates feel premature", "Include 'AI debt' items: model retraining, data quality, monitoring", "Reserve 20% capacity for unplanned work and technical debt", "Show the 'cut list': features you considered but deprioritised, and why"],
    evaluation: ["Roadmap is realistic (not a wish list of 50 features)", "OKRs are specific, measurable, and time-bound", "Prioritisation framework is consistently applied", "AI-specific considerations are addressed (not just traditional software features)"],
  },
  "Stakeholder Presentation": {
    overview: "Create and deliver a board-level presentation on AI product strategy. The presentation should tell a compelling story with data, address executive concerns (cost, risk, timeline), and make a clear recommendation with supporting evidence. Build the full slide deck with speaker notes.",
    objectives: ["Structure a compelling executive narrative (situation → complication → resolution)", "Visualise data effectively for non-technical audiences", "Address common executive concerns: ROI, risk, timeline, competition", "Practice concise, confident delivery (speaker notes for each slide)"],
    approach: "Start with the story arc: What's the situation? What's changing? What should we do? Support each point with data. Anticipate objections and address them proactively. Keep slides visual — no walls of text.",
    deliverables: ["10-15 slide presentation deck", "Speaker notes for each slide (what you'd say)", "Executive summary (1-page handout)", "Appendix with detailed data and backup slides", "Q&A preparation document (10 anticipated questions with answers)"],
    tips: ["Use the Minto Pyramid: lead with the recommendation, then support it", "One idea per slide — if you need two bullet points, you might need two slides", "Include a 'So what?' test for every data point: why should executives care?", "Practice the 'elevator pitch' version: can you summarise in 60 seconds?"],
    evaluation: ["Story arc is clear and compelling", "Data is well-visualised and supports the narrative", "Executive concerns are proactively addressed", "Speaker notes demonstrate deep understanding of the material"],
  },
  "AI Metrics Dashboard Design": {
    overview: "Design a product analytics dashboard specifically for AI-powered products. Unlike traditional dashboards, this must include AI-specific metrics: model accuracy, confidence distributions, fallback rates, latency, data drift, and user trust indicators. Create the full design in Figma with interactive prototyping.",
    objectives: ["Define AI-specific KPIs beyond traditional product metrics", "Design an intuitive dashboard layout that surfaces actionable insights", "Create interactive Figma prototypes with realistic data", "Document metric definitions, data sources, and calculation methods"],
    approach: "Start by listing all metrics that matter for an AI product. Group them into categories (model performance, user experience, business impact, system health). Sketch dashboard layouts. Choose the most important 5-7 metrics for the main view. Design detail views for drill-down.",
    deliverables: ["Figma dashboard design (main view + 2-3 detail views)", "Metric definitions document (what, why, how to calculate, data source)", "Interactive prototype with clickable drill-downs", "Alert thresholds and escalation criteria for each metric", "Design rationale document explaining layout decisions"],
    tips: ["Study dashboards from Datadog, Grafana, and Amplitude for inspiration", "Use sparklines for trends, not just current values", "Include a 'model health' section: is the AI getting better or worse over time?", "Design for 3 audiences: executive (summary), PM (trends), engineer (details)"],
    evaluation: ["Dashboard includes AI-specific metrics (not just pageviews and clicks)", "Layout is intuitive and action-oriented", "Metric definitions are precise and measurable", "Design is professional and follows data visualisation best practices"],
  },
  "Build vs Buy Analysis": {
    overview: "Create a comprehensive build vs buy decision framework for AI capabilities. Analyse the trade-offs of building an in-house AI system versus buying/licensing from vendors. Apply your framework to a real scenario (e.g., should a fintech build its own fraud detection or use a vendor?) with detailed cost modelling over 3 years.",
    objectives: ["Create a structured decision framework for build vs buy analysis", "Build a financial model comparing TCO over 3 years", "Evaluate non-financial factors: control, customisation, vendor risk, team capability", "Make a clear recommendation with sensitivity analysis"],
    approach: "Define the evaluation criteria (cost, control, time-to-market, quality, risk). Research vendor options and get real pricing. Estimate build costs (team, infrastructure, data, maintenance). Model total cost of ownership over 3 years. Apply your framework and make a recommendation.",
    deliverables: ["Decision framework template (reusable for future decisions)", "3-year TCO comparison model (spreadsheet)", "Vendor evaluation scorecard (3-5 vendors)", "Risk analysis for each option", "Final recommendation with sensitivity analysis"],
    tips: ["Include hidden costs: ML engineer salaries, data labelling, ongoing model maintenance", "Factor in opportunity cost: what else could the team build?", "Vendor risk: what happens if they raise prices, get acquired, or shut down?", "Include a hybrid option: buy the foundation, build the customisation layer"],
    evaluation: ["Framework is comprehensive and reusable", "Financial model is detailed and realistic (not back-of-napkin)", "Non-financial factors are systematically evaluated", "Recommendation is clear with supporting evidence and sensitivity analysis"],
  },
  "Full AI Product Launch": {
    overview: "This is your capstone project. Plan and execute a complete AI product launch from concept to post-launch retrospective. You'll combine everything you've learned: market research, PRD, roadmap, GTM strategy, ethics review, metrics, and stakeholder communication into a single cohesive launch plan.",
    objectives: ["Synthesise all PM skills into one end-to-end project", "Create a launch playbook that could be used by a real product team", "Conduct a retrospective analysis with data-driven insights", "Demonstrate executive communication and strategic thinking"],
    approach: "Choose an AI product concept. Work through each phase: Discovery (research, personas) → Definition (PRD, roadmap) → Go-to-Market (positioning, pricing, launch plan) → Launch (execution checklist) → Retrospective (what worked, what didn't, lessons learned).",
    deliverables: ["Complete launch playbook (15-25 pages)", "Executive summary presentation (10 slides)", "Launch checklist with owners and deadlines", "Post-launch retrospective with metrics analysis", "Lessons learned document"],
    tips: ["This is your portfolio centrepiece — make it polished and professional", "Use a real company's product launch as a reference (research their blog posts, announcements)", "Include cross-functional coordination: engineering, design, marketing, sales, support", "The retrospective can be hypothetical, but base it on realistic scenarios"],
    evaluation: ["Comprehensiveness: all launch phases are covered", "Quality: each section is detailed enough to execute", "Professionalism: presentation-ready materials", "Strategic thinking: demonstrates understanding of AI product challenges"],
  },
};

// ─── Generate brief for projects without specific briefs ─────────────────────

function generateGenericBrief(p) {
  const cc = COURSE_CONTEXT[p.course_title] || {};
  const techList = (p.tech_stack || []).join(", ");
  const diffText = p.difficulty === "beginner" ? "introductory" : p.difficulty === "intermediate" ? "intermediate-level" : "advanced";

  const overview = `In this ${diffText} project, you'll build a **${p.title}** using ${techList}. ${p.description_md} This is a hands-on project where you'll write real code, solve real problems, and build something you can showcase in your portfolio.`;

  const objectives = generateObjectives(p);
  const approach = generateApproach(p);
  const deliverables = generateDeliverables(p);
  const tips = generateTips(p);
  const evaluation = generateEvaluation(p);

  return { overview, objectives, approach, deliverables, tips, evaluation };
}

function generateObjectives(p) {
  const base = [];
  const tech = (p.tech_stack || []).map(t => t.toLowerCase());
  const title = p.title.toLowerCase();

  // Python-based
  if (tech.some(t => t.includes("python"))) base.push("Write clean, well-structured Python code following PEP 8 conventions");
  if (tech.some(t => t.includes("flask"))) base.push("Build a REST API with Flask including proper error handling and validation");
  if (tech.some(t => t.includes("fastapi"))) base.push("Build a modern async API with FastAPI, automatic docs, and type validation");
  if (tech.some(t => t.includes("pygame"))) base.push("Create an interactive application with Pygame including game loops and event handling");
  if (tech.some(t => t.includes("pytorch") || t.includes("cnn") || t.includes("lstm"))) base.push("Train and evaluate a neural network model with PyTorch");
  if (tech.some(t => t.includes("scikit"))) base.push("Build, evaluate, and compare machine learning models with scikit-learn");
  if (tech.some(t => t.includes("opencv"))) base.push("Process and analyse images/video in real-time with OpenCV");
  if (tech.some(t => t.includes("pandas"))) base.push("Clean, transform, and analyse data with Pandas DataFrames");
  if (tech.some(t => t.includes("streamlit"))) base.push("Build an interactive data dashboard with Streamlit");
  if (tech.some(t => t.includes("anthropic"))) base.push("Integrate with the Anthropic Claude API for AI-powered features");

  // Web-based
  if (tech.some(t => t.includes("next"))) base.push("Build a production-grade web application with Next.js and TypeScript");
  if (tech.some(t => t.includes("supabase"))) base.push("Implement authentication and database operations with Supabase");
  if (tech.some(t => t.includes("stripe"))) base.push("Integrate Stripe payments with subscription management");

  // DevOps
  if (tech.some(t => t.includes("docker"))) base.push("Containerise applications with Docker and multi-stage builds");
  if (tech.some(t => t.includes("kubernetes"))) base.push("Deploy and manage applications on Kubernetes clusters");
  if (tech.some(t => t.includes("terraform"))) base.push("Define infrastructure as code with Terraform modules");
  if (tech.some(t => t.includes("github actions"))) base.push("Automate CI/CD pipelines with GitHub Actions workflows");

  // Difficulty-based
  if (p.difficulty === "beginner") base.push("Follow software engineering best practices: version control, documentation, testing");
  if (p.difficulty === "intermediate") base.push("Handle edge cases, error conditions, and performance optimisation");
  if (p.difficulty === "advanced") base.push("Architect a production-ready system with scalability and maintainability in mind");

  base.push("Write a comprehensive README with setup instructions, usage examples, and architecture overview");
  return base.slice(0, 5);
}

function generateApproach(p) {
  const title = p.title.toLowerCase();
  const tech = (p.tech_stack || []).map(t => t.toLowerCase());

  if (tech.some(t => t.includes("pygame"))) {
    return "Start by setting up Pygame and creating the game window. Build the core game loop (input → update → render). Add game objects one at a time — get each working before adding the next. Add collision detection, scoring, and polish last. Test each feature as you build it.";
  }
  if (tech.some(t => t.includes("flask") || t.includes("fastapi"))) {
    return "Start with the project skeleton and database schema. Build the API endpoints one at a time, starting with the simplest (list/get) before moving to complex operations (create/update/delete). Add authentication, then validation, then error handling. Write tests for each endpoint.";
  }
  if (tech.some(t => t.includes("next"))) {
    return "Start with `npx create-next-app` and set up your project structure. Build the data model and database schema first. Create the API routes, then the UI pages. Start with a working prototype before adding polish, authentication, and advanced features.";
  }
  if (tech.some(t => t.includes("pytorch") || t.includes("scikit") || t.includes("cnn") || t.includes("lstm"))) {
    return "Start with data exploration — understand your dataset before building models. Clean and preprocess the data. Build a simple baseline model first. Then iterate: try different architectures, tune hyperparameters, and evaluate with proper metrics. Finally, build a deployment interface.";
  }
  if (tech.some(t => t.includes("docker") || t.includes("kubernetes"))) {
    return "Start with a working application locally. Write the Dockerfile and test it. Build the container orchestration configuration. Add monitoring and logging. Test failure scenarios. Document the setup and deployment process thoroughly.";
  }
  if (tech.some(t => t.includes("opencv"))) {
    return "Start by reading and displaying images/video. Build the core processing pipeline step by step. Test with different inputs (varying lighting, angles, sizes). Add real-time processing capabilities. Optimise for performance. Build a clean interface for demonstration.";
  }
  if (tech.some(t => t.includes("anthropic"))) {
    return "Start by getting a basic API call working. Build the core AI interaction loop. Add conversation management and context handling. Implement tool use or RAG as needed. Add error handling and rate limiting. Build the user interface around the working AI backend.";
  }

  return "Break the project into small, testable pieces. Build the core functionality first — get the minimum viable version working before adding features. Test each component independently. Document your decisions and trade-offs as you go.";
}

function generateDeliverables(p) {
  const base = ["Working application with all requirements implemented", "Clean, well-documented source code on GitHub", "README with setup instructions, screenshots, and usage guide"];

  const tech = (p.tech_stack || []).map(t => t.toLowerCase());
  if (tech.some(t => t.includes("pytest") || t.includes("unittest") || t.includes("test"))) base.push("Test suite with reasonable coverage");
  if (tech.some(t => t.includes("docker"))) base.push("Docker configuration for easy deployment");
  if (tech.some(t => t.includes("pytorch") || t.includes("scikit"))) base.push("Model evaluation report with metrics and visualisations");
  if (p.difficulty === "advanced") base.push("Architecture decision document explaining key design choices");

  return base;
}

function generateTips(p) {
  const tips = [];
  const tech = (p.tech_stack || []).map(t => t.toLowerCase());

  tips.push("Commit early and often — the AI reviewer can see your commit history and values incremental progress");
  tips.push("Write your README as you build, not at the end — it helps clarify your thinking");

  if (tech.some(t => t.includes("python"))) tips.push("Use virtual environments (`python -m venv venv`) to manage dependencies cleanly");
  if (tech.some(t => t.includes("next") || t.includes("node"))) tips.push("Use TypeScript for better code quality — the type system catches bugs before runtime");
  if (tech.some(t => t.includes("pytorch") || t.includes("scikit"))) tips.push("Start with a small dataset for fast iteration, then scale up once your pipeline works");
  if (tech.some(t => t.includes("docker"))) tips.push("Use `.dockerignore` to keep images small — exclude `node_modules`, `.git`, and test data");
  if (tech.some(t => t.includes("opencv"))) tips.push("Test with diverse inputs: different lighting conditions, angles, and image sizes");
  if (tech.some(t => t.includes("anthropic"))) tips.push("Implement proper error handling for API rate limits, timeouts, and unexpected responses");
  if (tech.some(t => t.includes("flask") || t.includes("fastapi"))) tips.push("Use environment variables for configuration — never hardcode secrets or API keys");
  if (p.difficulty === "advanced") tips.push("Consider scalability: what would need to change if this had 10x the users?");

  tips.push("The AI reviewer checks for: code quality, error handling, documentation, and whether all requirements are met");
  return tips.slice(0, 5);
}

function generateEvaluation(p) {
  const criteria = [
    "Code quality: clean, readable, well-structured code with proper naming conventions",
    "Completeness: all requirements are implemented and functional",
    "Documentation: README is comprehensive with setup instructions and usage examples",
  ];

  if (p.difficulty === "intermediate" || p.difficulty === "advanced") {
    criteria.push("Error handling: edge cases are handled gracefully, not with crashes");
  }
  if (p.difficulty === "advanced") {
    criteria.push("Architecture: code is modular, extensible, and follows SOLID principles");
  }

  criteria.push("Git history: regular commits with meaningful messages showing progressive development");
  return criteria;
}

// ─── Build full markdown brief ───────────────────────────────────────────────

function buildMarkdown(p) {
  const cc = COURSE_CONTEXT[p.course_title] || {};
  const brief = PROJECT_BRIEFS[p.title] || generateGenericBrief(p);
  const techList = (p.tech_stack || []).join(" · ");
  const milestones = p.milestone_checkpoints || [];

  let md = `## Overview\n\n${brief.overview}\n\n${cc.intro || ""}\n\n`;

  md += `## What You'll Learn\n\n`;
  for (const obj of brief.objectives) md += `- ${obj}\n`;
  md += `\n`;

  md += `## Tech Stack\n\n${techList}\n\n`;

  md += `## Approach\n\n${brief.approach}\n\n`;

  if (milestones.length > 0) {
    md += `## Milestones\n\n`;
    for (const m of milestones) {
      md += `### ${m.step}. ${m.title}\n${m.desc}\n\n`;
    }
  }

  md += `## Deliverables\n\n`;
  for (const d of brief.deliverables) md += `- ${d}\n`;
  md += `\n`;

  md += `## Tips & Guidance\n\n`;
  for (const t of brief.tips) md += `- ${t}\n`;
  md += `\n`;

  md += `## How You'll Be Evaluated\n\n`;
  md += `The AI reviewer will analyse your actual source code and evaluate:\n\n`;
  for (const e of brief.evaluation) md += `- **${e.split(":")[0]}**:${e.split(":").slice(1).join(":") || ""}\n`;
  md += `\n`;

  if (cc.careerLink) {
    md += `## Career Relevance\n\nThis project builds skills directly applicable to roles like: **${cc.careerLink}**.\n`;
  }

  return md.trim();
}

// ─── Generate README for GitHub ──────────────────────────────────────────────

function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildReadme(p) {
  const cc = COURSE_CONTEXT[p.course_title] || {};
  const brief = PROJECT_BRIEFS[p.title] || generateGenericBrief(p);
  const techList = (p.tech_stack || []).join(" · ");
  const slug = toSlug(p.title);
  const tech = (p.tech_stack || []).map(t => t.toLowerCase());
  const milestones = p.milestone_checkpoints || [];

  const diffBadge = p.difficulty === "beginner" ? "![Beginner](https://img.shields.io/badge/difficulty-beginner-22C55E)" :
    p.difficulty === "intermediate" ? "![Intermediate](https://img.shields.io/badge/difficulty-intermediate-F59E0B)" :
    "![Advanced](https://img.shields.io/badge/difficulty-advanced-EF4444)";

  const courseBadge = `![${p.course_title}](https://img.shields.io/badge/course-${encodeURIComponent(p.course_title).replace(/-/g, "--")}-0056CE)`;
  const hoursBadge = `![${p.estimated_hours} hours](https://img.shields.io/badge/estimated-${p.estimated_hours}h-lightgrey)`;

  let readme = `# ${p.title}\n\n${diffBadge} ${courseBadge} ${hoursBadge}\n\n`;
  readme += `> **Square 1 AI** starter template — ${p.course_title}\n\n`;

  readme += `## Overview\n\n${brief.overview}\n\n`;
  if (cc.intro) readme += `${cc.intro}\n\n`;

  readme += `## What You'll Learn\n\n`;
  for (const obj of brief.objectives) readme += `- ${obj}\n`;
  readme += `\n`;

  readme += `## Tech Stack\n\n`;
  for (const t of p.tech_stack || []) readme += `\`${t}\` `;
  readme += `\n\n`;

  readme += `## Requirements\n\n`;
  for (const r of p.requirements || []) readme += `- [ ] ${r}\n`;
  readme += `\n`;

  readme += `## Approach\n\n${brief.approach}\n\n`;

  if (milestones.length > 0) {
    readme += `## Milestones\n\n`;
    for (const m of milestones) {
      readme += `### ${m.step}. ${m.title}\n${m.desc}\n\n`;
    }
  }

  readme += `## Deliverables\n\n`;
  for (const d of brief.deliverables) readme += `- ${d}\n`;
  readme += `\n`;

  readme += `## Tips & Guidance\n\n`;
  for (const t of brief.tips) readme += `- ${t}\n`;
  readme += `\n`;

  readme += `## How You'll Be Evaluated\n\n`;
  readme += `The AI reviewer will analyse your actual source code and evaluate:\n\n`;
  for (const e of brief.evaluation) readme += `- **${e.split(":")[0]}**:${e.split(":").slice(1).join(":") || ""}\n`;
  readme += `\n`;

  readme += `## Getting Started\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `# Clone this template\n`;
  readme += `git clone https://github.com/${OWNER}/starter-${slug}.git\n`;
  readme += `cd starter-${slug}\n\n`;

  if (tech.some(t => t.includes("python") || t.includes("flask") || t.includes("fastapi") || t.includes("pygame") || t.includes("pytorch") || t.includes("opencv") || t.includes("pandas") || t.includes("scikit") || t.includes("anthropic"))) {
    readme += `# Set up Python environment\npython -m venv venv\nsource venv/bin/activate  # On Windows: venv\\\\Scripts\\\\activate\npip install -r requirements.txt\n\n# Run\npython main.py\n`;
  } else if (tech.some(t => t.includes("next"))) {
    readme += `# Install dependencies\nnpm install\n\n# Run dev server\nnpm run dev\n`;
  } else if (tech.some(t => t.includes("node") || t.includes("express"))) {
    readme += `# Install dependencies\nnpm install\n\n# Run\nnpm start\n`;
  } else if (tech.some(t => t.includes("docker") || t.includes("kubernetes"))) {
    readme += `# Build and run\ndocker-compose up --build\n`;
  } else {
    readme += `# Follow the project instructions\n`;
  }
  readme += `\`\`\`\n\n`;

  readme += `## Submission\n\n`;
  readme += `1. Complete the project following all requirements above\n`;
  readme += `2. Push your code to your own **public** GitHub repository\n`;
  readme += `3. Go to [Square 1 AI](https://square1-tutor.vercel.app/projects) and submit your repo URL\n`;
  readme += `4. Our AI will review your actual code and give you a score with line-level feedback\n\n`;

  if (cc.careerLink) {
    readme += `## Career Relevance\n\nThis project builds skills directly applicable to roles like: **${cc.careerLink}**.\n\n`;
  }

  readme += `---\n\nBuilt with [Square 1 AI](https://square1ai.com) | Learn. Build. Get Hired.\n`;

  return readme;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe", ...opts }).trim();
  } catch (e) {
    return (e.stderr || e.message || "").trim();
  }
}

async function main() {
  console.log(`Generating briefs for ${projects.length} projects...\n`);

  // Phase 1: Generate SQL updates for description_md
  const sqlStatements = [];
  for (const p of projects) {
    const md = buildMarkdown(p);
    const escaped = md.replace(/'/g, "''");
    sqlStatements.push(`UPDATE projects SET description_md = '${escaped}' WHERE id = '${p.id}';`);
  }

  // Write SQL file for reference
  writeFileSync(join(__dirname, "update-briefs.sql"), sqlStatements.join("\n\n"));
  console.log(`Generated SQL for ${sqlStatements.length} projects → scripts/update-briefs.sql`);

  // Phase 2: Update GitHub READMEs
  const TEMP_DIR = join(process.env.TEMP || "/tmp", "s1-readme-update");
  if (existsSync(TEMP_DIR)) rmSync(TEMP_DIR, { recursive: true });
  mkdirSync(TEMP_DIR, { recursive: true });

  let updated = 0, failed = 0;

  for (const p of projects) {
    const slug = `starter-${toSlug(p.title)}`;
    const repoDir = join(TEMP_DIR, slug);

    console.log(`  UPDATE  ${slug}...`);

    // Clone the repo
    const cloneResult = run(`git clone --depth 1 https://github.com/${OWNER}/${slug}.git "${repoDir}" 2>&1`);
    if (cloneResult.includes("fatal") || cloneResult.includes("error")) {
      console.log(`    SKIP (clone failed)`);
      failed++;
      continue;
    }

    // Write new README
    const readme = buildReadme(p);
    writeFileSync(join(repoDir, "README.md"), readme);

    // Configure git
    run('git config user.email "hello@square1ai.com"', { cwd: repoDir });
    run('git config user.name "Square 1 AI"', { cwd: repoDir });

    // Commit and push
    run("git add README.md", { cwd: repoDir });
    const commitResult = run(`git commit -m "Add detailed project brief and guidelines"`, { cwd: repoDir });
    if (commitResult.includes("nothing to commit")) {
      console.log(`    SKIP (no changes)`);
      continue;
    }

    const pushResult = run("git push", { cwd: repoDir });
    if (pushResult.includes("fatal") || pushResult.includes("error")) {
      console.log(`    FAIL (push failed)`);
      failed++;
    } else {
      updated++;
      console.log(`    OK`);
    }
  }

  // Cleanup
  rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log(`\nGitHub READMEs: Updated ${updated}, Failed ${failed}`);
  console.log(`\nNext: Run the SQL in scripts/update-briefs.sql against Supabase to update description_md`);
}

main().catch(console.error);
