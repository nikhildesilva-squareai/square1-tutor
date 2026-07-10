import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-advanced-projects-7-10
 * Seeds Projects 7-10 specifications (4 advanced core projects)
 */

interface Project {
  title: string;
  description_md: string;
  difficulty: "intermediate" | "advanced";
  estimated_hours: number;
  tech_stack: string[];
  requirements: string[];
  milestone_checkpoints: string[];
  rubric: Array<{ criterion: string; weight: number; description: string }>;
}

const ADVANCED_PROJECTS: Project[] = [
  {
    title: "Multi-Agent Workflow Orchestrator",
    description_md: `# Multi-Agent Workflow Orchestrator

## Overview

Build a production-grade system that orchestrates multiple specialized AI agents to solve complex problems. Each agent handles a specific role (search, analyze, plan, execute), communicating and coordinating to break down complex tasks.

## Real-World Context

Companies like Anthropic, OpenAI, and enterprises use multi-agent systems for:
- Research workflows (search + analyze + summarize)
- Business process automation (validate + process + audit)
- Data analysis pipelines (extract + transform + visualize)

Your system will handle:
- Agent communication and message passing
- Dependency management (agent A waits for agent B)
- Error handling and recovery across agents
- Progress tracking and monitoring

## Learning Goals

Students will learn:
- Designing modular agent architectures
- Inter-agent communication patterns
- Coordinating async operations
- Managing shared state across agents
- Building resilient multi-agent systems

## Technical Requirements

### Core Components

**Agent Coordinator**
- Routes tasks to appropriate agent
- Manages agent lifecycle and communication
- Tracks workflow progress
- Handles failures and retries

**Specialized Agents (minimum 3)**
- Search Agent: Finds information
- Analysis Agent: Synthesizes findings
- Planning Agent: Creates action plans
- Executor Agent: Takes actions

**Communication Layer**
- Message queue or pub-sub system
- Request-response or event-based messaging
- Message validation and error handling

**State Management**
- Shared workflow state
- Agent state persistence
- Audit logging of decisions

### Technology Stack

Required:
- Python 3.9+
- Claude API or compatible LLM
- Async/await (asyncio)

Choose one:
- Message Queue: Redis, RabbitMQ, or in-memory queue
- Framework: LangChain, AutoGen, or custom

Optional:
- Database: PostgreSQL for persistence
- Monitoring: Prometheus + Grafana
- Visualization: Streamlit for UI

## Acceptance Criteria

### Phase 1: Agent Architecture
- Implement 3+ specialized agents with clear roles
- Each agent can accept inputs and produce outputs
- Agents have clear interfaces (input/output schemas)
- Unit tests for each agent

### Phase 2: Coordinator & Communication
- Central coordinator routes tasks to agents
- Agents can communicate asynchronously
- Message passing with validation
- Error handling for failed messages

### Phase 3: Workflow Management
- Support sequential agent chains (Agent A → Agent B → Agent C)
- Support parallel agent execution
- Track progress through workflow
- Handle agent failures with fallback strategies

### Phase 4: Real-World Scenario
- Implement one complete end-to-end workflow
  - Example: "Analyze competitor and create recommendation"
  - Steps: Search competitors → Analyze findings → Create plan
- Demo with 5+ test cases
- Performance metrics (latency, token usage, cost)

### Phase 5: Production Readiness
- Comprehensive error handling
- Monitoring and logging
- Cost tracking
- Documentation and examples

## Milestone Checkpoints

1. **Agent Foundation** (Week 1)
   - Design agent interfaces
   - Implement search + analysis agents
   - Basic testing

2. **Coordination System** (Week 2)
   - Build coordinator
   - Implement message queue
   - Test agent communication

3. **Workflow Orchestration** (Week 3)
   - Support complex workflows
   - Error recovery
   - Progress tracking

4. **Real-World Integration** (Week 4)
   - End-to-end workflow implementation
   - Performance optimization
   - Documentation

## Rubric

| Criterion | Weight | Excellent | Good | Acceptable |
|-----------|--------|-----------|------|------------|
| **Architecture Design** | 25% | Clear agent separation, extensible design | Well-structured but some coupling | Functional but monolithic |
| **Agent Communication** | 25% | Robust messaging, error handling, monitoring | Working messages, basic error handling | Messages work but fragile |
| **Workflow Management** | 25% | Handles complex flows, parallelization, recovery | Handles most flows, basic recovery | Sequential only, limited error handling |
| **Production Quality** | 25% | Comprehensive logging, monitoring, docs | Good tests and docs | Minimal tests, lacking docs |

## Deliverables

- Working multi-agent orchestration system
- 3+ specialized agents
- Example workflows (sequential, parallel, conditional)
- Unit + integration tests (80%+ coverage)
- Documentation with architecture diagrams
- Performance report (latency, cost, token usage)`,
    difficulty: "advanced",
    estimated_hours: 32,
    tech_stack: ["Python 3.9+", "Claude API", "AsyncIO", "Redis or RabbitMQ"],
    requirements: [
      "3+ specialized agents with different roles",
      "Asynchronous agent communication",
      "Error handling and recovery across agents",
      "Progress tracking and monitoring",
      "End-to-end workflow demonstration"
    ],
    milestone_checkpoints: [
      "Week 1: Agent architecture and interfaces defined",
      "Week 2: Coordination system and message passing working",
      "Week 3: Complex workflows with error recovery",
      "Week 4: Production-ready with full monitoring"
    ],
    rubric: [
      { criterion: "Architecture Design", weight: 25, description: "Agent separation, extensibility, design patterns" },
      { criterion: "Agent Communication", weight: 25, description: "Message passing, error handling, reliability" },
      { criterion: "Workflow Management", weight: 25, description: "Complex workflows, parallelization, recovery" },
      { criterion: "Production Quality", weight: 25, description: "Testing, monitoring, documentation, performance" }
    ]
  },
  {
    title: "Real-Time Streaming Analytics Agent",
    description_md: `# Real-Time Streaming Analytics Agent

## Overview

Build an AI agent that processes continuous data streams in real-time, making intelligent decisions on incoming data. Think stock price analysis, sensor monitoring, social media trend detection, or IoT data processing.

## Real-World Context

Organizations process streaming data:
- Financial firms: Trade alerts based on price movements
- Retailers: Real-time inventory analytics
- IoT companies: Sensor anomaly detection
- Social media: Trend analysis and moderation
- Healthcare: Patient monitoring and alerts

Your agent will:
- Ingest streaming data (simulated or real)
- Apply ML/AI analysis continuously
- Trigger alerts and actions
- Handle backpressure (data arrives faster than processing)
- Maintain state across streams (rolling averages, patterns)

## Learning Goals

Students will learn:
- Streaming data architecture patterns
- Handling backpressure and buffer management
- Real-time decision making with latency constraints
- Windowing and aggregation strategies
- Cost optimization at scale

## Technical Requirements

### Core Components

**Data Stream Ingestion**
- Simulate or connect to real data source
- Handle multiple concurrent streams
- Manage buffer and backpressure
- Track data freshness

**Analytics Agent**
- Process streaming data
- Maintain state across windows
- Apply pattern detection
- Generate alerts

**Action Executor**
- Execute decisions based on analytics
- Manage rate limiting
- Log actions for audit trail
- Handle action failures

**Monitoring & Metrics**
- Track throughput (events/sec)
- Monitor latency (p50, p99)
- Alert on anomalies
- Cost tracking

### Technology Stack

Required:
- Python 3.9+
- Claude API
- Streaming library: Kafka, Kinesis, or simple queue

Choose one:
- Streaming Framework: Apache Flink, Spark, or custom
- Time-Series DB: InfluxDB, TimescaleDB, or Redis
- Visualization: Grafana or Streamlit

## Acceptance Criteria

### Phase 1: Data Streaming
- Ingest data from source (simulated or real)
- Support 100+ events/second
- Buffer management with backpressure handling
- Data freshness tracking

### Phase 2: Analytics Agent
- Analyze streaming data in real-time
- Maintain rolling state (last 100 events, averages, trends)
- Detect patterns and anomalies
- Generate structured alerts

### Phase 3: Actions & Decisions
- Execute actions based on alerts
- Rate limiting and deduplication
- Audit logging of all decisions
- Error recovery

### Phase 4: Real-World Scenario
- Implement complete end-to-end example
  - Example: Stock price monitoring with trade alerts
  - Steps: Ingest prices → Detect patterns → Generate alerts → Execute trades
- Process 10,000+ events successfully
- Handle stream interruptions gracefully

### Phase 5: Production Ready
- Comprehensive monitoring and alerting
- Performance optimization (latency < 500ms for decision)
- Cost analysis and optimization
- Documentation and runbooks

## Milestone Checkpoints

1. **Streaming Foundation** (Week 1)
   - Data ingestion working
   - Buffer management implemented
   - 100+ events/sec throughput

2. **Analytics Engine** (Week 2)
   - Real-time analysis working
   - Pattern detection
   - Alert generation

3. **Decision Making** (Week 3)
   - Actions based on alerts
   - Rate limiting
   - Audit logging

4. **Production Deployment** (Week 4)
   - End-to-end scenario
   - Performance tuning
   - Monitoring and docs

## Rubric

| Criterion | Weight | Excellent | Good | Acceptable |
|-----------|--------|-----------|------|------------|
| **Data Ingestion** | 20% | High throughput, backpressure handling, resilient | Good throughput, handles backpressure | Basic streaming, fragile |
| **Analytics Engine** | 30% | Accurate patterns, maintains state, efficient | Works correctly, some inefficiencies | Basic analysis, state issues |
| **Real-Time Decisions** | 25% | Low latency (<500ms), reliable actions | Acceptable latency, mostly reliable | High latency, unreliable |
| **Production Quality** | 25% | Monitoring, logging, docs, performance optimized | Good monitoring and docs | Minimal monitoring, lacks docs |

## Deliverables

- Streaming data ingestion system
- Real-time analytics agent
- Action executor with rate limiting
- Monitoring dashboard
- End-to-end scenario (10,000+ events)
- Performance report (throughput, latency, cost)
- Deployment documentation`,
    difficulty: "advanced",
    estimated_hours: 30,
    tech_stack: ["Python 3.9+", "Claude API", "Kafka/Kinesis", "AsyncIO"],
    requirements: [
      "High-throughput data streaming (100+ events/sec)",
      "Real-time pattern detection and analysis",
      "Backpressure and buffer management",
      "Alert generation and action execution",
      "Comprehensive monitoring and metrics"
    ],
    milestone_checkpoints: [
      "Week 1: Streaming foundation with 100+ events/sec",
      "Week 2: Analytics engine with pattern detection",
      "Week 3: Actions and decision making",
      "Week 4: Production deployment with monitoring"
    ],
    rubric: [
      { criterion: "Data Ingestion", weight: 20, description: "Throughput, backpressure handling, resilience" },
      { criterion: "Analytics Engine", weight: 30, description: "Pattern detection, state management, efficiency" },
      { criterion: "Real-Time Decisions", weight: 25, description: "Latency (<500ms), reliability, action execution" },
      { criterion: "Production Quality", weight: 25, description: "Monitoring, logging, documentation, optimization" }
    ]
  },
  {
    title: "Domain Expert System",
    description_md: `# Domain Expert System

## Overview

Build a specialized AI agent that becomes an expert in a specific domain (medical, legal, finance, technical support, etc.). The agent uses fine-tuning, knowledge bases, and specialized prompting to provide accurate, domain-specific advice.

## Real-World Context

Enterprises deploy domain experts for:
- Medical diagnosis support (doctors + AI system)
- Legal document analysis and advice
- Financial investment recommendations
- Technical support (specialized domain knowledge)
- Customer service (product-specific expertise)

Your system will:
- Maintain a domain-specific knowledge base
- Use retrieval-augmented generation (RAG)
- Apply specialized reasoning
- Cite sources and maintain accuracy
- Provide confidence levels on recommendations

## Learning Goals

Students will learn:
- Building domain-specific knowledge bases
- Fine-tuning for specialized domains
- RAG (Retrieval-Augmented Generation)
- Evaluation and accuracy metrics
- Handling expert disagreement

## Technical Requirements

### Core Components

**Knowledge Base**
- Domain documents and references
- Structured knowledge (taxonomy, relationships)
- Search and retrieval system (vector or keyword)
- Citation and source tracking

**Expert Agent**
- Fine-tuned or specialized model
- Domain-specific prompting
- Confidence scoring
- Multi-source reasoning

**Verification System**
- Fact checking against knowledge base
- Citation verification
- Accuracy metrics
- Expert validation

**Evaluation Framework**
- Accuracy scoring
- Hallucination detection
- Bias and fairness checks
- Domain expert validation

### Technology Stack

Required:
- Python 3.9+
- Claude API (with potential fine-tuning)
- Vector database: Pinecone, Weaviate, or local

Choose one:
- Fine-tuning library: OpenAI, Anthropic SDKs
- RAG Framework: LangChain, LlamaIndex
- Evaluation: MLflow or custom

## Acceptance Criteria

### Phase 1: Knowledge Base
- Collect 50+ domain-specific documents
- Build searchable knowledge base
- Implement retrieval system
- Test retrieval accuracy (80%+ relevant results)

### Phase 2: Expert Agent
- Implement domain-specific agent
- Integrate with knowledge base
- Generate accurate, cited responses
- Confidence scoring on answers

### Phase 3: Verification
- Fact-check responses against knowledge base
- Detect and prevent hallucinations
- Track accuracy metrics
- Handle uncertain cases gracefully

### Phase 4: Real-World Evaluation
- Evaluate on 50+ test cases from domain
- Compare against baseline (general model)
- Get expert validation on sample answers
- Achieve 85%+ accuracy on domain questions

### Phase 5: Production Deployment
- Comprehensive testing and validation
- Monitoring and accuracy tracking
- User feedback integration
- Documentation for domain experts

## Milestone Checkpoints

1. **Knowledge Base** (Week 1)
   - 50+ documents collected and indexed
   - Search working (80%+ precision)
   - Citation system working

2. **Expert Agent** (Week 2)
   - Agent integrated with knowledge base
   - Generates cited, accurate responses
   - Confidence scoring implemented

3. **Verification** (Week 3)
   - Hallucination detection working
   - Accuracy metrics calculated
   - Test cases showing 80%+ accuracy

4. **Expert Validation** (Week 4)
   - Domain expert reviews answers
   - Feedback incorporated
   - Final evaluation on 50+ cases

## Rubric

| Criterion | Weight | Excellent | Good | Acceptable |
|-----------|--------|-----------|------|------------|
| **Knowledge Base** | 20% | Comprehensive, well-organized, searchable, cited | Good coverage, searchable, mostly cited | Basic coverage, limited search |
| **Expert Agent** | 30% | Accurate, cited answers, confidence scoring | Mostly accurate, some citations, scoring | Basic accuracy, minimal citations |
| **Verification** | 25% | Detects hallucinations, accurate scoring, reliable | Detects most issues, reasonable scoring | Basic verification, unreliable |
| **Production Quality** | 25% | Expert validation, comprehensive docs, monitoring | Good testing and docs | Minimal validation, lacking docs |

## Deliverables

- Domain-specific knowledge base (50+ documents)
- Expert agent system with RAG
- Verification and hallucination detection
- Accuracy evaluation (85%+ on test cases)
- Expert validation report
- Monitoring dashboard for accuracy
- Complete documentation`,
    difficulty: "advanced",
    estimated_hours: 28,
    tech_stack: ["Python 3.9+", "Claude API", "Vector DB", "LangChain or LlamaIndex"],
    requirements: [
      "50+ domain-specific documents in knowledge base",
      "RAG system with citation tracking",
      "Fine-tuned or specialized agent",
      "Hallucination detection and prevention",
      "85%+ accuracy on domain test cases"
    ],
    milestone_checkpoints: [
      "Week 1: Knowledge base with 50+ documents indexed",
      "Week 2: Expert agent with citations and confidence scoring",
      "Week 3: Verification system with hallucination detection",
      "Week 4: Expert validation and 85%+ accuracy achieved"
    ],
    rubric: [
      { criterion: "Knowledge Base", weight: 20, description: "Coverage, organization, searchability, citations" },
      { criterion: "Expert Agent", weight: 30, description: "Accuracy, citations, confidence scoring, domain fit" },
      { criterion: "Verification", weight: 25, description: "Hallucination detection, accuracy metrics, reliability" },
      { criterion: "Production Quality", weight: 25, description: "Expert validation, documentation, monitoring" }
    ]
  },
  {
    title: "Autonomous Planning & Execution Engine",
    description_md: `# Autonomous Planning & Execution Engine

## Overview

Build an AI agent that autonomously plans and executes complex multi-step goals without human intervention. The agent decomposes goals into subgoals, creates plans, executes them, handles failures, and adapts to changing conditions.

## Real-World Context

Autonomous systems are deployed for:
- Robotics and automation (manufacturing, warehouse robots)
- Business process automation (invoice processing, hiring workflows)
- Research automation (lab experiments, literature reviews)
- Software development (automated refactoring, testing)
- Data engineering (ETL pipelines, data quality checks)

Your system will:
- Accept high-level goals
- Decompose into actionable steps
- Plan execution strategy
- Execute with error handling
- Adapt to failures and constraints
- Maintain safety boundaries

## Learning Goals

Students will learn:
- Goal decomposition and planning algorithms
- Hierarchical reasoning (goal → subgoals → tasks)
- Constraint satisfaction and resource management
- Failure detection and recovery
- Safety and guardrail enforcement

## Technical Requirements

### Core Components

**Goal Decomposer**
- Accept high-level goals
- Break into subgoals recursively
- Estimate resource requirements
- Identify dependencies

**Planner**
- Create execution plans
- Order tasks correctly
- Allocate resources
- Estimate time and cost

**Executor**
- Execute tasks sequentially/parallel
- Monitor progress
- Handle failures with recovery
- Update plan if needed

**Safety & Constraints**
- Enforce execution boundaries
- Prevent irreversible actions without approval
- Cost and resource limits
- Rollback strategies

### Technology Stack

Required:
- Python 3.9+
- Claude API
- State machine or planning library

Choose one:
- Planning: PDDL, hierarchical task planning
- State Management: SQLite or Redis
- Execution: Job queue (Celery, RQ) or custom

## Acceptance Criteria

### Phase 1: Goal Decomposition
- Parse high-level goals
- Decompose into subgoals recursively
- Dependency analysis
- Resource estimation (time, cost, constraints)

### Phase 2: Planning
- Create execution plans from goal trees
- Handle sequential and parallel tasks
- Constraint satisfaction
- Cost optimization

### Phase 3: Execution
- Execute plans sequentially
- Monitor progress and resource usage
- Detect failures early
- Implement recovery strategies

### Phase 4: Adaptive Execution
- Handle plan failure and replan
- Adapt to constraint changes
- Update estimates based on actual progress
- Complete successfully despite issues

### Phase 5: Safety & Production
- Enforce execution constraints
- Require approval for irreversible actions
- Comprehensive logging and audit trail
- Rollback strategies for failures

## Milestone Checkpoints

1. **Goal Decomposition** (Week 1)
   - Parse goals and identify subgoals
   - Recursive decomposition working
   - Dependency graph created

2. **Planning** (Week 2)
   - Generate valid execution plans
   - Constraint satisfaction
   - Cost optimization

3. **Execution** (Week 3)
   - Execute plans successfully
   - Monitor and report progress
   - Basic error handling

4. **Advanced Execution** (Week 4)
   - Handle failures with recovery
   - Replan when needed
   - Safety constraints enforced
   - Production-ready monitoring

## Rubric

| Criterion | Weight | Excellent | Good | Acceptable |
|-----------|--------|-----------|------|------------|
| **Goal Decomposition** | 25% | Accurate subgoals, dependencies clear, realistic estimates | Good decomposition, dependencies identified | Basic decomposition, incomplete |
| **Planning** | 25% | Optimal plans, constraints satisfied, resource aware | Valid plans, constraints mostly met | Basic plans, constraint issues |
| **Execution** | 25% | Reliable execution, good error handling, monitoring | Mostly works, basic error handling | Executes but fragile |
| **Adaptive & Safe** | 25% | Handles failures, replans, enforces constraints | Handles some failures, basic safety | Limited failure handling |

## Deliverables

- Goal decomposition system
- Hierarchical planner
- Reliable executor with error handling
- Adaptive replanning system
- Safety constraint enforcement
- Complex goal execution examples (5+ scenarios)
- Monitoring dashboard
- Documentation with architecture`,
    difficulty: "advanced",
    estimated_hours: 32,
    tech_stack: ["Python 3.9+", "Claude API", "State Machine", "Task Queue"],
    requirements: [
      "Recursive goal decomposition",
      "Hierarchical task planning",
      "Multi-step execution with error handling",
      "Adaptive replanning on failure",
      "Safety constraints and approval gates"
    ],
    milestone_checkpoints: [
      "Week 1: Goal decomposition and dependency analysis",
      "Week 2: Planning with constraint satisfaction",
      "Week 3: Execution with monitoring",
      "Week 4: Adaptive execution with safety"
    ],
    rubric: [
      { criterion: "Goal Decomposition", weight: 25, description: "Accuracy, dependencies, resource estimation" },
      { criterion: "Planning", weight: 25, description: "Plan validity, constraint satisfaction, optimization" },
      { criterion: "Execution", weight: 25, description: "Reliability, error handling, monitoring" },
      { criterion: "Adaptive & Safe", weight: 25, description: "Replanning, safety constraints, production ready" }
    ]
  }
];

export async function POST(request: NextRequest) {
  try {
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

    // Get the Agentic AI course
    const courseRes = await db
      .from("courses")
      .select("id")
      .eq("slug", "agentic-ai")
      .single();

    if (courseRes.error) {
      throw new Error(`Course not found: ${courseRes.error.message}`);
    }

    const courseId = courseRes.data.id;

    // Get projects 7-10 (order_index 7-10)
    const projectsRes = await db
      .from("projects")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .gte("order_index", 7)
      .lte("order_index", 10)
      .order("order_index", { ascending: true });

    if (projectsRes.error) {
      throw new Error(`Projects query failed: ${projectsRes.error.message}`);
    }

    let projectsUpdated = 0;

    // Update each project with full specifications
    for (let i = 0; i < projectsRes.data.length && i < ADVANCED_PROJECTS.length; i++) {
      const project = projectsRes.data[i];
      const projectData = ADVANCED_PROJECTS[i];

      // Build rubric JSON
      const rubric = projectData.rubric.map((r, idx) => ({
        order_index: idx + 1,
        criterion: r.criterion,
        weight: r.weight,
        description: r.description
      }));

      const updateRes = await db
        .from("projects")
        .update({
          title: projectData.title,
          description_md: projectData.description_md,
          difficulty: projectData.difficulty,
          estimated_hours: projectData.estimated_hours,
          tech_stack: projectData.tech_stack,
          requirements: projectData.requirements,
          milestone_checkpoints: projectData.milestone_checkpoints,
          rubric: rubric
        })
        .eq("id", project.id);

      if (updateRes.error) {
        throw new Error(
          `Failed to update project ${project.title}: ${updateRes.error.message}`
        );
      }

      projectsUpdated++;
    }

    return NextResponse.json({
      success: true,
      message: `Projects 7-10 specifications complete: ${projectsUpdated} projects updated!`,
      summary: {
        projectsUpdated,
        projectTitles: ADVANCED_PROJECTS.map(p => p.title)
      }
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
