import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/admin/seed-agentic-ai
 * Admin-only endpoint to seed the Agentic AI course infrastructure
 *
 * Requires:
 * - user_email query param matching admin email list
 * - Authorization header with valid JWT
 */

const COURSE_ID = uuidv4();
const COURSE_SLUG = "agentic-ai";
const COURSE_TITLE = "Agentic AI";
const COURSE_COLOR = "#7C3AED";
const COURSE_ICON = "🤖";

const MODULES = [
  {
    order_index: 1,
    title: "Core Fundamentals",
    description: "Agent architecture, reasoning, and memory systems",
    week_number: 1,
    lessons_count: 15,
  },
  {
    order_index: 2,
    title: "Autonomous Decision-Making",
    description: "Tool use, decision frameworks, and human feedback loops",
    week_number: 3,
    lessons_count: 10,
  },
  {
    order_index: 3,
    title: "Basic Deployment & Operations",
    description: "Containerization, monitoring, logging, and basic infrastructure",
    week_number: 5,
    lessons_count: 15,
  },
  {
    order_index: 4,
    title: "Advanced Production Systems & Multi-Agent Coordination",
    description: "Orchestration, multi-region, security, and multi-agent systems",
    week_number: 8,
    lessons_count: 30,
  },
];

const LESSON_TEMPLATES: Record<number, { title: string; objectives: string[] }[]> = {
  1: [
    {
      title: "Agentic Architecture: Perception → Reasoning → Planning → Action",
      objectives: [
        "Understand the fundamental perception-reasoning-planning-action loop",
        "Identify components of an agentic system",
        "Design basic agent workflows",
      ],
    },
    {
      title: "Building an LLM-Powered Agent",
      objectives: ["Create a basic agent that uses an LLM as its brain", "Implement agent decision loops", "Handle agent outputs and actions"],
    },
    {
      title: "Tool Use and Function Calling",
      objectives: ["Teach agents to use tools and APIs", "Implement function calling and tool selection", "Handle tool errors gracefully"],
    },
    {
      title: "Short-Term Memory and Context Management",
      objectives: ["Implement conversation context windows", "Manage token limits and context overflow", "Design effective context summarization"],
    },
    {
      title: "Long-Term Memory and Knowledge Systems",
      objectives: ["Build persistent memory for agents", "Implement vector embeddings for semantic search", "Design knowledge graph integration"],
    },
    {
      title: "Chain-of-Thought and Reasoning Frameworks",
      objectives: ["Implement chain-of-thought reasoning", "Use intermediate reasoning steps", "Evaluate reasoning quality"],
    },
    {
      title: "Reflection and Self-Correction",
      objectives: ["Implement agent self-reflection", "Create feedback loops for improvement", "Handle agent uncertainty and errors"],
    },
    {
      title: "Multi-Step Planning",
      objectives: ["Design agents that plan complex tasks", "Break down problems into steps", "Handle partial failures and replanning"],
    },
    {
      title: "Debugging and Tracing Agent Behavior",
      objectives: ["Understand why agents make decisions", "Trace decision paths through reasoning", "Implement explainability for agents"],
    },
    {
      title: "Structured Output and Parsing",
      objectives: ["Generate structured output from agents", "Parse and validate agent outputs", "Handle parsing failures gracefully"],
    },
    {
      title: "Agent Types: Reactive, Deliberative, and Hybrid",
      objectives: ["Understand reactive agent architecture", "Build deliberative planning agents", "Design hybrid agents combining both approaches"],
    },
    {
      title: "Guardrails and Safety Constraints",
      objectives: ["Implement agent safety constraints", "Create ethical boundaries for agents", "Monitor agent behavior compliance"],
    },
    {
      title: "State Persistence and Versioning",
      objectives: ["Persist agent state to databases", "Version agents and their behavior", "Rollback agents to previous versions"],
    },
    {
      title: "Cost Optimization for Agentic Systems",
      objectives: ["Track token usage and API costs", "Optimize agent efficiency", "Design cost-effective agent workflows"],
    },
    {
      title: "Retrieval-Augmented Generation (RAG) in Agents",
      objectives: ["Implement RAG for grounding decisions", "Build document retrieval systems", "Integrate RAG into agent reasoning"],
    },
  ],
  2: [
    {
      title: "Function Calling and Tool Selection",
      objectives: ["Implement function calling APIs", "Build tool selection logic", "Handle multiple available tools"],
    },
    {
      title: "Handling Uncertainty and Asking for Clarification",
      objectives: ["Detect agent uncertainty", "Request clarification from users", "Handle ambiguous inputs"],
    },
    {
      title: "Agent Personas and Role-Playing",
      objectives: ["Define agent personas and roles", "Implement role-specific behaviors", "Maintain persona consistency"],
    },
    {
      title: "Context-Aware Behavior Adaptation",
      objectives: ["Adapt agent behavior based on context", "Implement context switching", "Design context-sensitive prompts"],
    },
    {
      title: "Reward Modeling and Outcome Optimization",
      objectives: ["Define reward functions for agents", "Optimize agents for specific outcomes", "Handle competing objectives"],
    },
    {
      title: "Real-Time Information Processing",
      objectives: ["Process real-time data feeds", "React to current events", "Handle time-sensitive decisions"],
    },
    {
      title: "Agent Introspection and Explainability",
      objectives: ["Explain agent decisions to stakeholders", "Implement decision reasoning traces", "Build interpretability systems"],
    },
    {
      title: "Learning from Human Feedback",
      objectives: ["Collect human feedback on agent decisions", "Implement feedback loops", "Improve agents based on feedback"],
    },
    {
      title: "Agent Constraints and Resource Limits",
      objectives: ["Implement resource constraints", "Design rate limiting for agents", "Handle resource exhaustion"],
    },
    {
      title: "Decision-Making Under Uncertainty",
      objectives: ["Handle probabilistic decisions", "Implement confidence scoring", "Design risk-aware decision logic"],
    },
  ],
  3: [
    {
      title: "Containerizing Agentic Applications",
      objectives: ["Build Docker containers for agents", "Design containerized agent architectures", "Deploy containers to production"],
    },
    {
      title: "Basic Monitoring for Agent Systems",
      objectives: ["Monitor agent health and availability", "Detect agent failures", "Set up health checks"],
    },
    {
      title: "Logging Agent Decisions",
      objectives: ["Log agent decisions and reasoning", "Implement structured logging", "Analyze decision logs"],
    },
    {
      title: "API Wrappers for Agent Systems",
      objectives: ["Wrap agents as REST APIs", "Design agent API contracts", "Implement request/response handling"],
    },
    {
      title: "Latency and Throughput Optimization",
      objectives: ["Measure agent latency", "Optimize agent response times", "Design for throughput"],
    },
    {
      title: "Rate Limiting and Quota Management",
      objectives: ["Implement rate limiting for agents", "Manage API quotas", "Handle rate limit errors"],
    },
    {
      title: "Conversation History Persistence",
      objectives: ["Persist agent conversations", "Query conversation history", "Archive old conversations"],
    },
    {
      title: "Agent Versioning and Rollout Strategies",
      objectives: ["Version agents and their configurations", "Implement safe rollout strategies", "Manage agent updates"],
    },
    {
      title: "CI/CD for Agentic Systems",
      objectives: ["Build CI/CD pipelines for agents", "Automate testing and deployment", "Implement safe deployments"],
    },
    {
      title: "Cost Attribution and Budgeting",
      objectives: ["Allocate costs to agents and users", "Implement budget tracking", "Design cost-aware systems"],
    },
    {
      title: "Agent Health Checks",
      objectives: ["Implement liveness probes", "Design readiness checks", "Handle unhealthy agents"],
    },
    {
      title: "Observability Dashboards",
      objectives: ["Build observability dashboards", "Visualize agent metrics", "Track agent behavior"],
    },
    {
      title: "Alerting for Agent Anomalies",
      objectives: ["Set up alerting for agent issues", "Define anomaly detection rules", "Implement alert routing"],
    },
    {
      title: "Economics of Running Agents at Scale",
      objectives: ["Understand agent cost structures", "Model scaling costs", "Make cost-benefit decisions"],
    },
    {
      title: "Graceful Degradation",
      objectives: ["Implement fallback behaviors", "Handle partial failures", "Prevent cascading failures"],
    },
  ],
  4: [
    // Lessons 41-55: Production Systems
    {
      title: "Distributed Agent Orchestration",
      objectives: ["Orchestrate agents across machines", "Implement distributed scheduling", "Manage agent dependencies"],
    },
    {
      title: "Agent Queues and Task Scheduling",
      objectives: ["Implement job queues for agents", "Design scheduling strategies", "Handle variable load"],
    },
    {
      title: "Multi-Region Agent Deployment",
      objectives: ["Deploy agents to multiple regions", "Implement geo-routing", "Manage cross-region consistency"],
    },
    {
      title: "Agent Pooling and Resource Management",
      objectives: ["Pool agents for efficiency", "Manage computational resources", "Optimize resource utilization"],
    },
    {
      title: "Load Balancing for Agent Systems",
      objectives: ["Distribute load across agents", "Implement load balancing algorithms", "Handle uneven load distribution"],
    },
    {
      title: "Circuit Breakers and Failure Handling",
      objectives: ["Implement circuit breaker patterns", "Detect and recover from failures", "Prevent cascading failures"],
    },
    {
      title: "Distributed Tracing and Observability",
      objectives: ["Trace requests through distributed systems", "Correlate logs across services", "Debug distributed agent systems"],
    },
    {
      title: "Caching and Memoization Strategies",
      objectives: ["Cache agent outputs", "Implement memoization", "Manage cache invalidation"],
    },
    {
      title: "Connection Pooling and Resource Efficiency",
      objectives: ["Pool database connections", "Manage resource pools", "Optimize resource usage"],
    },
    {
      title: "SLA Monitoring and Compliance",
      objectives: ["Define service level agreements", "Monitor SLA compliance", "Respond to SLA violations"],
    },
    {
      title: "Canary Deployments",
      objectives: ["Deploy agents to canary environments", "Monitor canary metrics", "Gradually roll out changes"],
    },
    {
      title: "Disaster Recovery",
      objectives: ["Plan for disaster scenarios", "Implement recovery procedures", "Test recovery processes"],
    },
    {
      title: "Backup and State Recovery",
      objectives: ["Back up agent state", "Implement recovery mechanisms", "Test backup/restore processes"],
    },
    {
      title: "Security Hardening",
      objectives: ["Secure agent systems against attacks", "Implement access controls", "Audit security compliance"],
    },
    {
      title: "Secret Management and Compliance",
      objectives: ["Manage API keys and secrets", "Implement audit logging", "Ensure regulatory compliance"],
    },
    // Lessons 56-70: Multi-Agent Coordination
    {
      title: "Agent-to-Agent Communication Protocols",
      objectives: ["Design agent communication protocols", "Implement message passing", "Handle protocol failures"],
    },
    {
      title: "Agent Coordination Frameworks",
      objectives: ["Implement coordination frameworks", "Design agent collaboration patterns", "Manage agent interactions"],
    },
    {
      title: "Consensus Mechanisms for Distributed Agents",
      objectives: ["Implement consensus algorithms", "Handle disagreement between agents", "Design voting systems"],
    },
    {
      title: "Task Delegation Between Agents",
      objectives: ["Delegate tasks to agents", "Implement delegation protocols", "Track task status"],
    },
    {
      title: "Hierarchical Agent Structures",
      objectives: ["Design hierarchical agent topologies", "Implement authority relationships", "Manage agent hierarchies"],
    },
    {
      title: "Swarm Intelligence Patterns",
      objectives: ["Implement swarm intelligence", "Design emergent behaviors", "Coordinate swarm agents"],
    },
    {
      title: "Agent Negotiation and Conflict Resolution",
      objectives: ["Implement negotiation protocols", "Resolve agent conflicts", "Design compromise mechanisms"],
    },
    {
      title: "Information Sharing and Knowledge Graphs",
      objectives: ["Share information between agents", "Build knowledge graphs", "Query shared knowledge"],
    },
    {
      title: "Dynamic Team Formation",
      objectives: ["Form agent teams dynamically", "Assign agents to teams", "Dissolve teams when needed"],
    },
    {
      title: "Leader-Follower Patterns",
      objectives: ["Implement leader election", "Design follower behaviors", "Handle leader failures"],
    },
    {
      title: "Emergent Behavior and Self-Organization",
      objectives: ["Design self-organizing systems", "Observe emergent behaviors", "Guide emergent processes"],
    },
    {
      title: "Multi-Agent Problem Solving",
      objectives: ["Solve complex problems with agent teams", "Divide problems among agents", "Integrate solutions"],
    },
    {
      title: "Agent Competition and Markets",
      objectives: ["Design agent-based markets", "Implement competitive dynamics", "Manage agent incentives"],
    },
    {
      title: "Cooperative vs. Competitive Dynamics",
      objectives: ["Balance cooperation and competition", "Design incentive structures", "Manage agent dynamics"],
    },
    {
      title: "Evaluating Multi-Agent System Performance",
      objectives: ["Define multi-agent metrics", "Measure system performance", "Optimize multi-agent systems"],
    },
  ],
};

const PROJECTS = [
  { order_index: 1, title: "Customer Service Agent", difficulty: "intermediate", hours: 8 },
  { order_index: 2, title: "Data Analysis Agent", difficulty: "intermediate", hours: 8 },
  { order_index: 3, title: "Code Generation Assistant", difficulty: "intermediate", hours: 8 },
  { order_index: 4, title: "Task Automation Agent", difficulty: "intermediate", hours: 8 },
  { order_index: 5, title: "Research Assistant", difficulty: "intermediate", hours: 8 },
  { order_index: 6, title: "Decision Support System", difficulty: "intermediate", hours: 8 },
  { order_index: 7, title: "Domain-Specific Chatbot", difficulty: "intermediate", hours: 8 },
  { order_index: 8, title: "Multi-Tool Orchestrator", difficulty: "advanced", hours: 10 },
  { order_index: 9, title: "Interactive Debugging Agent", difficulty: "advanced", hours: 10 },
  { order_index: 10, title: "Real-time Monitoring Agent", difficulty: "advanced", hours: 10 },
  { order_index: 11, title: "Multi-Region Agent Deployment", difficulty: "advanced", hours: 12 },
  { order_index: 12, title: "Multi-Agent Orchestration System", difficulty: "advanced", hours: 12 },
  { order_index: 13, title: "Cost Optimization Engine", difficulty: "advanced", hours: 12 },
  { order_index: 14, title: "Disaster Recovery System", difficulty: "advanced", hours: 12 },
  { order_index: 15, title: "Security Hardening and Compliance", difficulty: "advanced", hours: 12 },
  { order_index: 16, title: "Performance Tuning and Benchmarking", difficulty: "advanced", hours: 12 },
  { order_index: 17, title: "Production Monitoring and Alerting", difficulty: "advanced", hours: 12 },
  { order_index: 18, title: "Production Multi-Agent System", difficulty: "advanced", hours: 20 },
];

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const { createClient: createAdminAuthClient } = await import("@/lib/supabase/server");
    const adminAuthClient = await createAdminAuthClient();
    const { data: { user: adminUser } } = await adminAuthClient.auth.getUser();
    if (!isAdminEmail(adminUser?.email)) {
      return NextResponse.json(
        { error: "Unauthorized: admin email required" },
        { status: 403 }
      );
    }

    const db = createAdminClient();

    // 1. Create course
    const courseRes = await db.from("courses").insert({
      id: COURSE_ID,
      slug: COURSE_SLUG,
      title: COURSE_TITLE,
      description: "Master the creation, deployment, and operation of autonomous AI agents at production scale.",
      icon: COURSE_ICON,
      color: COURSE_COLOR,
      level: "advanced",
      total_modules: MODULES.length,
      total_lessons: 70,
      total_projects: PROJECTS.length,
      status: "active",
      parent_course_id: null,
    });

    if (courseRes.error) throw new Error(`Course creation failed: ${courseRes.error.message}`);

    // 2. Create modules and lessons
    let totalLessonsCreated = 0;
    let totalExercisesCreated = 0;

    for (const module of MODULES) {
      const moduleRes = await db.from("modules").insert({
        course_id: COURSE_ID,
        order_index: module.order_index,
        title: module.title,
        description: module.description,
        week_number: module.week_number,
      }).select("id").single();

      if (moduleRes.error) throw new Error(`Module creation failed: ${moduleRes.error.message}`);

      const moduleId = moduleRes.data.id;
      const lessons = LESSON_TEMPLATES[module.order_index] || [];

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];

        const lessonRes = await db.from("lessons").insert({
          module_id: moduleId,
          course_id: COURSE_ID,
          order_index: i + 1,
          title: lesson.title,
          theory_md: `# ${lesson.title}\n\n_Content to be added_`,
          estimated_minutes: 60,
          learning_objectives: lesson.objectives,
        }).select("id").single();

        if (lessonRes.error) throw new Error(`Lesson creation failed: ${lessonRes.error.message}`);

        totalLessonsCreated++;
        const lessonId = lessonRes.data.id;

        // Create 8 exercises per lesson
        const exercises = [];
        for (let j = 1; j <= 8; j++) {
          exercises.push({
            lesson_id: lessonId,
            order_index: j,
            type: j <= 2 ? "code" : j <= 5 ? "short_answer" : "mcq",
            title: `Exercise ${j}`,
            prompt_md: "_Exercise to be added_",
            marks: 10,
            starter_code: j <= 2 ? "# TODO: Implement" : null,
            language: j <= 2 ? "python" : null,
          });
        }

        const exRes = await db.from("exercises").insert(exercises);
        if (exRes.error) throw new Error(`Exercise creation failed: ${exRes.error.message}`);

        totalExercisesCreated += 8;
      }
    }

    // 3. Create projects
    let totalProjectsCreated = 0;
    for (const project of PROJECTS) {
      const projectRes = await db.from("projects").insert({
        course_id: COURSE_ID,
        order_index: project.order_index,
        title: project.title,
        description_md: `# ${project.title}\n\n_Project description to be added_`,
        difficulty: project.difficulty,
        estimated_hours: project.hours,
        tech_stack: ["Python", "Claude API"],
        requirements: ["Implement agent functionality"],
        milestone_checkpoints: [
          { name: "Planning", description: "Design architecture" },
          { name: "Implementation", description: "Build agent" },
          { name: "Testing", description: "Test behavior" },
          { name: "Deployment", description: "Deploy to production" },
        ],
        rubric: [
          { criterion: "Correctness", weight: 0.3, description: "Agent behaves correctly" },
          { criterion: "Code Quality", weight: 0.2, description: "Clean, readable code" },
          { criterion: "Production-Ready", weight: 0.3, description: "Monitoring and error handling" },
          { criterion: "Documentation", weight: 0.2, description: "Clear documentation" },
        ],
      });

      if (projectRes.error) throw new Error(`Project creation failed: ${projectRes.error.message}`);

      totalProjectsCreated++;
    }

    return NextResponse.json({
      success: true,
      message: "Agentic AI course infrastructure created successfully!",
      summary: {
        course: COURSE_TITLE,
        modules: MODULES.length,
        lessons: totalLessonsCreated,
        exercises: totalExercisesCreated,
        projects: totalProjectsCreated,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
