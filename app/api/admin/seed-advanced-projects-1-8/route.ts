import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-advanced-projects-1-8
 * Seeds Advanced Project Kits: 7 Advanced + 1 Capstone (8 total)
 */

interface AdvancedProject {
  title: string;
  description_md: string;
  difficulty: "advanced" | "expert";
  estimated_hours: number;
  tech_stack: string[];
  requirements: string[];
  milestone_checkpoints: string[];
  rubric: Array<{ criterion: string; weight: number; description: string }>;
}

const ADVANCED_PROJECT_KITS: AdvancedProject[] = [
  {
    title: "Adaptive Learning Agent",
    description_md: `# Adaptive Learning Agent

## Overview

Build an AI tutor that adapts to individual student learning styles, paces lessons based on performance, and personalizes content. This project teaches personalization and adaptive systems.

## Real-World Applications
- EdTech platforms (Duolingo, Coursera)
- Corporate training systems
- Personalized education assistants

## Key Concepts
- Student profiling and preference detection
- Adaptive pacing and difficulty selection
- Learning style analysis
- Content personalization
- Performance-based recommendations

## Technical Requirements
- Student modeling system
- Adaptive content selection algorithm
- Performance tracking
- Learning analytics
- Personalization engine

## Acceptance Criteria
- Profiles 5+ learning dimensions
- Adjusts difficulty based on performance
- Personalizes 80%+ of content
- Tracks learning metrics
- Demonstrates 20%+ improvement in student engagement`,
    difficulty: "advanced",
    estimated_hours: 40,
    tech_stack: ["Python 3.9+", "Claude API", "Machine Learning", "Analytics"],
    requirements: [
      "Student modeling and profiling",
      "Adaptive content selection",
      "Performance-based pacing",
      "Learning style detection",
      "Analytics and reporting"
    ],
    milestone_checkpoints: [
      "Week 1: Student profile system",
      "Week 2: Content adaptation algorithm",
      "Week 3: Performance analytics",
      "Week 4: Personalization engine",
      "Week 5: Integration and testing"
    ],
    rubric: [
      { criterion: "Student Modeling", weight: 25, description: "Profiles learning styles, preferences, strengths" },
      { criterion: "Adaptation", weight: 30, description: "Dynamic difficulty, pacing, content selection" },
      { criterion: "Analytics", weight: 25, description: "Learning metrics, performance tracking, insights" },
      { criterion: "Production Quality", weight: 20, description: "Testing, documentation, deployment ready" }
    ]
  },
  {
    title: "Multi-Modal Agent",
    description_md: `# Multi-Modal Agent

## Overview

Build an agent that processes and understands multiple modalities: text, images, audio, and video. This teaches multimodal AI integration and content understanding.

## Real-World Applications
- Document processing systems
- Video analysis platforms
- Accessibility assistants
- Content moderation

## Key Concepts
- Vision-language models
- Audio processing
- Video understanding
- Cross-modal reasoning
- Multimodal synthesis

## Technical Requirements
- Image processing and analysis
- Audio transcription
- Video understanding
- Text analysis
- Cross-modal reasoning engine

## Acceptance Criteria
- Processes images, audio, video, text
- Understands content across modalities
- Generates insights from mixed inputs
- Provides cross-modal summaries
- Achieves 85%+ accuracy on modality detection`,
    difficulty: "advanced",
    estimated_hours: 45,
    tech_stack: ["Python 3.9+", "Claude API", "Computer Vision", "Audio Processing"],
    requirements: [
      "Image analysis and understanding",
      "Audio transcription and analysis",
      "Video processing",
      "Cross-modal reasoning",
      "Multimodal content synthesis"
    ],
    milestone_checkpoints: [
      "Week 1: Image processing",
      "Week 2: Audio and video handling",
      "Week 3: Cross-modal reasoning",
      "Week 4: Integration",
      "Week 5: Testing and optimization"
    ],
    rubric: [
      { criterion: "Modality Support", weight: 30, description: "Handles images, audio, video, text effectively" },
      { criterion: "Understanding", weight: 25, description: "Accurate content analysis per modality" },
      { criterion: "Cross-Modal", weight: 25, description: "Reasoning across modalities, synthesis" },
      { criterion: "Production Quality", weight: 20, description: "Robust, documented, tested" }
    ]
  },
  {
    title: "Autonomous Code Reviewer",
    description_md: `# Autonomous Code Reviewer

## Overview

Build an AI system that reviews code for bugs, security issues, performance, and best practices. This teaches code understanding and quality assurance automation.

## Real-World Applications
- GitHub/GitLab integrations
- Enterprise code review
- Security scanning
- Quality assurance

## Key Concepts
- Code analysis and parsing
- Security vulnerability detection
- Performance analysis
- Best practice enforcement
- Automated feedback generation

## Technical Requirements
- Code parsing and analysis
- Security scanning
- Performance profiling
- Best practices database
- Report generation

## Acceptance Criteria
- Detects 80%+ of common bugs
- Identifies security issues
- Suggests performance improvements
- Enforces style guide
- Generates actionable feedback`,
    difficulty: "advanced",
    estimated_hours: 38,
    tech_stack: ["Python 3.9+", "Claude API", "AST Parsing", "Security Tools"],
    requirements: [
      "Code analysis engine",
      "Security vulnerability detection",
      "Performance analysis",
      "Best practices enforcement",
      "Feedback generation"
    ],
    milestone_checkpoints: [
      "Week 1: Code parsing and analysis",
      "Week 2: Bug and security detection",
      "Week 3: Performance analysis",
      "Week 4: Feedback generation",
      "Week 5: Integration and testing"
    ],
    rubric: [
      { criterion: "Code Analysis", weight: 25, description: "Parses code, identifies patterns accurately" },
      { criterion: "Issue Detection", weight: 30, description: "Finds bugs, security issues, performance" },
      { criterion: "Feedback Quality", weight: 25, description: "Actionable, specific, helpful suggestions" },
      { criterion: "Production Quality", weight: 20, description: "Robust, tested, documented" }
    ]
  },
  {
    title: "Real-Time Collaboration Agent",
    description_md: `# Real-Time Collaboration Agent

## Overview

Build a real-time collaborative AI assistant that works with multiple users simultaneously, maintains shared context, and coordinates team activities. This teaches distributed systems and collaboration.

## Real-World Applications
- Team chat with AI assistant
- Collaborative document editing
- Remote team coordination
- Virtual team meetings

## Key Concepts
- Shared context management
- User synchronization
- Real-time updates
- Conflict resolution
- Team coordination

## Technical Requirements
- WebSocket/real-time communication
- Shared state management
- User presence tracking
- Message broadcasting
- Conflict resolution

## Acceptance Criteria
- Supports 10+ simultaneous users
- Maintains shared context
- Real-time updates (<100ms latency)
- Handles concurrent edits
- Coordinates team activities`,
    difficulty: "advanced",
    estimated_hours: 48,
    tech_stack: ["Python 3.9+", "Claude API", "WebSocket", "Distributed State"],
    requirements: [
      "Real-time communication",
      "Shared state management",
      "User presence and awareness",
      "Conflict resolution",
      "Team coordination"
    ],
    milestone_checkpoints: [
      "Week 1: Real-time infrastructure",
      "Week 2: Shared context management",
      "Week 3: Multi-user coordination",
      "Week 4: Conflict resolution",
      "Week 5: Testing at scale"
    ],
    rubric: [
      { criterion: "Real-Time", weight: 25, description: "Low latency, responsive, synchronization" },
      { criterion: "Scalability", weight: 25, description: "Supports many users, doesn't degrade" },
      { criterion: "Coordination", weight: 30, description: "Manages team context, resolves conflicts" },
      { criterion: "Reliability", weight: 20, description: "No data loss, consistent state" }
    ]
  },
  {
    title: "Federated Learning Agent",
    description_md: `# Federated Learning Agent

## Overview

Build an AI system that learns from distributed data sources without centralizing sensitive data. This teaches privacy-preserving machine learning.

## Real-World Applications
- Healthcare AI (patient data privacy)
- Financial services (data protection)
- Regulated industries (compliance)
- IoT systems (edge learning)

## Key Concepts
- Federated learning
- Privacy preservation
- Distributed training
- Model aggregation
- Differential privacy

## Technical Requirements
- Distributed learning framework
- Privacy mechanisms
- Model aggregation
- Secure communication
- Performance monitoring

## Acceptance Criteria
- Trains without centralizing data
- Maintains 95%+ accuracy
- Provides privacy guarantees
- Aggregates models correctly
- Scales to 10+ participants`,
    difficulty: "advanced",
    estimated_hours: 50,
    tech_stack: ["Python 3.9+", "Claude API", "PyTorch Federated", "Privacy"],
    requirements: [
      "Federated training setup",
      "Privacy preservation",
      "Model aggregation",
      "Secure communication",
      "Privacy analysis"
    ],
    milestone_checkpoints: [
      "Week 1: Federated framework setup",
      "Week 2: Privacy mechanisms",
      "Week 3: Model aggregation",
      "Week 4: Distributed training",
      "Week 5: Privacy analysis and testing"
    ],
    rubric: [
      { criterion: "Privacy", weight: 30, description: "Data stays private, privacy guarantees met" },
      { criterion: "Accuracy", weight: 25, description: "Maintains model accuracy despite distribution" },
      { criterion: "Aggregation", weight: 25, description: "Correctly combines distributed models" },
      { criterion: "Scalability", weight: 20, description: "Handles many participants efficiently" }
    ]
  },
  {
    title: "Reasoning with Constraints Agent",
    description_md: `# Reasoning with Constraints Agent

## Overview

Build an AI system that solves complex problems with multiple constraints (resource limits, rules, dependencies). This teaches constraint satisfaction and optimization.

## Real-World Applications
- Supply chain optimization
- Resource allocation
- Scheduling systems
- Logistics
- Manufacturing

## Key Concepts
- Constraint satisfaction
- Optimization
- Trade-off analysis
- Resource allocation
- Complex reasoning

## Technical Requirements
- Constraint modeling
- Search algorithms
- Optimization engine
- Trade-off analysis
- Solution verification

## Acceptance Criteria
- Models complex constraints
- Finds feasible solutions
- Optimizes objectives
- Analyzes trade-offs
- Verifies constraint satisfaction`,
    difficulty: "advanced",
    estimated_hours: 42,
    tech_stack: ["Python 3.9+", "Claude API", "Constraint Solvers", "Optimization"],
    requirements: [
      "Constraint modeling and representation",
      "Constraint satisfaction algorithms",
      "Optimization",
      "Trade-off analysis",
      "Solution verification"
    ],
    milestone_checkpoints: [
      "Week 1: Constraint representation",
      "Week 2: Basic constraint solving",
      "Week 3: Optimization",
      "Week 4: Complex constraint handling",
      "Week 5: Testing and validation"
    ],
    rubric: [
      { criterion: "Constraint Modeling", weight: 25, description: "Accurately represents complex constraints" },
      { criterion: "Problem Solving", weight: 30, description: "Finds feasible solutions consistently" },
      { criterion: "Optimization", weight: 25, description: "Optimizes within constraints" },
      { criterion: "Verification", weight: 20, description: "Validates solutions against constraints" }
    ]
  },
  {
    title: "Causal Reasoning Agent",
    description_md: `# Causal Reasoning Agent

## Overview

Build an AI system that understands cause-and-effect relationships and uses causal reasoning for better predictions and explanations. This teaches causal inference and reasoning.

## Real-World Applications
- Medical diagnosis
- Root cause analysis
- Policy evaluation
- Business intelligence
- Scientific research

## Key Concepts
- Causal graphs and models
- Intervention analysis
- Counterfactual reasoning
- Causal inference
- Explanability

## Technical Requirements
- Causal graph construction
- Causal inference algorithms
- Counterfactual generation
- Intervention analysis
- Explanation generation

## Acceptance Criteria
- Builds causal models
- Performs interventions
- Generates counterfactuals
- Identifies root causes
- Provides causal explanations`,
    difficulty: "advanced",
    estimated_hours: 45,
    tech_stack: ["Python 3.9+", "Claude API", "Causal Libraries", "Bayesian Methods"],
    requirements: [
      "Causal graph construction",
      "Causal inference",
      "Counterfactual reasoning",
      "Intervention analysis",
      "Explanation generation"
    ],
    milestone_checkpoints: [
      "Week 1: Causal graph modeling",
      "Week 2: Causal inference algorithms",
      "Week 3: Counterfactual reasoning",
      "Week 4: Intervention analysis",
      "Week 5: Explanation and testing"
    ],
    rubric: [
      { criterion: "Causal Modeling", weight: 25, description: "Accurately models causal relationships" },
      { criterion: "Inference", weight: 30, description: "Performs causal inference correctly" },
      { criterion: "Reasoning", weight: 25, description: "Generates valid counterfactuals" },
      { criterion: "Explanation", weight: 20, description: "Explains causal relationships clearly" }
    ]
  },
  {
    title: "Capstone: Production AI System",
    description_md: `# Capstone Project: Production AI System

## Overview

Build a complete, production-grade AI system that combines concepts from all courses. This is a comprehensive capstone that demonstrates mastery of agentic AI.

## Project Requirements

Choose ONE real-world problem and build a complete solution:
- Problem definition and analysis
- Agent architecture design
- Implementation with best practices
- Testing and evaluation
- Deployment and monitoring
- Documentation and presentation

## Real-World Problem Examples

1. **Healthcare**: AI diagnostics assistant
2. **Finance**: Investment recommendation system
3. **E-Commerce**: Personalized shopping agent
4. **Education**: Comprehensive tutoring system
5. **Enterprise**: Business process automation
6. **Environmental**: Sustainability analyzer
7. **Your own domain**: Any real-world problem

## Key Requirements

- **Architecture**: Multi-agent system with specialized roles
- **Features**: Advanced features (learning, adaptation, real-time, etc.)
- **Quality**: Production-grade code, tests, monitoring
- **Innovation**: Novel approach or application
- **Impact**: Measurable improvement or value

## Scope & Effort

- **Complexity**: Expert level
- **Duration**: 8 weeks full-time (or part-time equivalent)
- **Team**: Solo or small team (2-3 people)
- **Deliverables**: Code, documentation, demo, evaluation results

## Evaluation Criteria

1. **Problem Understanding** (15%): Clear problem definition, real-world value
2. **Architecture** (20%): Well-designed system, good design decisions
3. **Implementation** (25%): Production-quality code, best practices
4. **Testing & Evaluation** (20%): Comprehensive testing, measured results
5. **Innovation** (10%): Creative solution, novel approach
6. **Presentation** (10%): Clear documentation and demo

## Deliverables

- Complete source code (GitHub repo)
- Comprehensive documentation
- Test suite (80%+ coverage)
- Performance report
- Deployment guide
- 10-minute demo video or live presentation
- Blog post or paper on lessons learned

## Success Metrics

- Working system that solves the stated problem
- 90%+ test coverage
- Performance benchmarks documented
- Positive impact measurement
- Production-ready code quality
- Clear documentation for future developers

## Next Steps After Capstone

- Deploy to production
- Gather user feedback
- Iterate and improve
- Publish as open-source
- Write about your experience
- Continue advancing AI skills`,
    difficulty: "advanced",
    estimated_hours: 160,
    tech_stack: [
      "Python 3.9+",
      "Claude API",
      "Production Stack (Your choice)",
      "Testing & Monitoring",
      "Deployment Platform"
    ],
    requirements: [
      "Real-world problem with clear value",
      "Multi-agent architecture",
      "Advanced features (learning/adaptation/real-time)",
      "Production-grade implementation",
      "Comprehensive testing (80%+ coverage)",
      "Monitoring and metrics",
      "Complete documentation",
      "Deployment capability"
    ],
    milestone_checkpoints: [
      "Week 1: Problem definition and proposal",
      "Week 2: Architecture design and review",
      "Week 3-4: Core system implementation",
      "Week 5-6: Advanced features and optimization",
      "Week 7: Testing, evaluation, and monitoring setup",
      "Week 8: Documentation, demo, and presentation"
    ],
    rubric: [
      { criterion: "Problem & Value", weight: 15, description: "Real-world problem, clear value, well-defined" },
      { criterion: "Architecture", weight: 20, description: "Well-designed system, good decisions, scalable" },
      { criterion: "Implementation", weight: 25, description: "Production-quality, best practices, maintainable" },
      { criterion: "Testing & Eval", weight: 20, description: "Comprehensive testing, measured results, monitoring" },
      { criterion: "Innovation", weight: 10, description: "Creative solution, novel approach" },
      { criterion: "Documentation", weight: 10, description: "Clear docs, demo, presentation, sharable" }
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

    // Get advanced projects 11-18 (already created as templates)
    const advProjectsRes = await db
      .from("projects")
      .select("id, order_index")
      .eq("course_id", courseId)
      .gte("order_index", 11)
      .lte("order_index", 18)
      .order("order_index", { ascending: true });

    if (advProjectsRes.error) {
      throw new Error(`Advanced projects query failed: ${advProjectsRes.error.message}`);
    }

    let projectsUpdated = 0;

    for (let i = 0; i < advProjectsRes.data.length && i < ADVANCED_PROJECT_KITS.length; i++) {
      const project = advProjectsRes.data[i];
      const projectData = ADVANCED_PROJECT_KITS[i];

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
          `Failed to update project ${projectData.title}: ${updateRes.error.message}`
        );
      }

      projectsUpdated++;
    }

    return NextResponse.json({
      success: true,
      message: `Advanced project kits complete: ${projectsUpdated} projects updated!`,
      summary: {
        projectsUpdated,
        advancedProjects: 7,
        capstoneProject: 1,
        totalProjects: projectsUpdated,
        projectTitles: ADVANCED_PROJECT_KITS.map(p => p.title)
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
