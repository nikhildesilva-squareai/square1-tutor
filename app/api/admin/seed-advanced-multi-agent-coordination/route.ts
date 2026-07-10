import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-advanced-multi-agent-coordination
 * Seeds Slice #36: Advanced Multi-Agent Coordination Lessons 56-70 (120 exercises)
 */

interface Lesson {
  order: number;
  title: string;
  theory: string;
  exercises: string[];
}

const ADVANCED_COORDINATION_LESSONS: Lesson[] = [
  {
    order: 56,
    title: "Multi-Agent Communication Patterns",
    theory: `# Multi-Agent Communication Patterns

## Why Multiple Agents?

Single agent has limits:

\`\`\`
Agent 1 (alone):
- Processes sequentially
- Bottleneck: Limited by single LLM throughput
- Perspective: Single viewpoint

Agents 1-3 (team):
- Work in parallel
- Scale: 3× throughput
- Perspectives: Different skills/viewpoints
\`\`\`

## Communication Patterns

**Direct Communication**
\`\`\`
Agent A → Agent B
  "What did you learn about the user?"

Agent B → Agent A
  "User is interested in X and Y"
\`\`\`

**Broadcast**
\`\`\`
Coordinator → All Agents
  "Search for information on topic Z"

All agents search in parallel, report results
\`\`\`

**Queue-Based**
\`\`\`
Agent A puts task in queue
Agent B picks it up when ready
Agent A doesn't wait
\`\`\`

## Implementation

\`\`\`python
class Agent:
    def __init__(self, name, role):
        self.name = name
        self.role = role
        self.inbox = []
        self.knowledge = {}

    def send_message(self, recipient, message):
        recipient.inbox.append({
            "from": self.name,
            "content": message,
            "timestamp": now()
        })

    def receive_messages(self):
        return self.inbox

    def process(self):
        # Do work, send messages to other agents
        for msg in self.receive_messages():
            self.process_message(msg)

        # Do own work
        self.do_work()
\`\`\`

## Message Protocol

\`\`\`python
message = {
    "type": "request" | "response" | "info",
    "from_agent": "search_agent",
    "to_agent": "analysis_agent",
    "content": {
        "query": "Find papers on climate change",
        "context": "User interested in policy implications"
    },
    "timestamp": "2024-01-15T10:32:45Z",
    "requires_response": True
}
\`\`\`

## Synchronization

Agents need to coordinate timing:

\`\`\`
Agent A: "I need data from agents B and C before I continue"

Option 1: Wait
  A.wait_for([B, C])  # Blocking, slow

Option 2: Callback
  B.when_done(lambda result: A.process(result))  # Non-blocking

Option 3: Polling
  loop: check if B and C done → Continue  # Can miss signals
\`\`\``,
    exercises: [
      "Design: Message protocol for 3 agents",
      "Code: Implement inter-agent messaging",
      "Problem: Agent A waiting forever for B",
      "Synchronization: What pattern fits your use case?",
      "Broadcast: Coordinator with N agents",
      "MCQ: Best pattern for your problem?",
      "Scale: What happens with 100 agents?",
      "Debug: Trace messages between agents"
    ]
  },
  {
    order: 57,
    title: "Agent Teams and Role Assignment",
    theory: `# Agent Teams and Role Assignment

## Why Roles?

Each agent specializes:

\`\`\`
General agent:
  Can do anything, master of nothing
  Quality: Mediocre at everything
  Latency: Slow (reasoning about everything)

Specialist agents:
  Search agent: Expert at finding info
  Analysis agent: Expert at synthesizing
  Summarizer: Expert at distilling
  Quality: Excellent (each good at their job)
  Latency: Fast (focused reasoning)
\`\`\`

## Role Types

**Searcher**
- Responsibility: Find information
- Skills: Query formulation, ranking results
- Input: Topic
- Output: Ranked list of information

**Analyzer**
- Responsibility: Deep analysis
- Skills: Critical thinking, finding patterns
- Input: Information
- Output: Insights

**Planner**
- Responsibility: Break down goals
- Skills: Decomposition, sequencing
- Input: Goal
- Output: Action plan

**Executor**
- Responsibility: Perform actions
- Skills: Tool use, error handling
- Input: Plan
- Output: Results

**Coordinator**
- Responsibility: Orchestrate team
- Skills: Task routing, synchronization
- Input: User request
- Output: Delegated tasks

## Assignment

\`\`\`python
def assign_task_to_agent(task, agents):
    if task.type == "search":
        return agents["searcher"]
    elif task.type == "analyze":
        return agents["analyzer"]
    elif task.type == "plan":
        return agents["planner"]
    elif task.type == "execute":
        return agents["executor"]
    else:
        return agents["coordinator"]  # Unsure, ask coordinator
\`\`\`

## Skill Matching

\`\`\`
Task: "Analyze competitor pricing strategy"

Agent 1 (Searcher):
  Skills: Finding data
  Relevance: 60% (could find pricing data, but not analysis)

Agent 2 (Analyzer):
  Skills: Critical analysis, pattern finding
  Relevance: 95% (perfect match)

Assign to: Agent 2
\`\`\`

## Handoff Protocol

\`\`\`
Agent A: "This task is outside my expertise"
Agent A → Coordinator: "Route this to the right agent"

Coordinator: "This is an analysis task, send to Analyzer"
Agent A → Analyzer: "Here's the context, take it from here"

Analyzer: Completes task and reports back to Coordinator
Coordinator → User: Response with complete solution
\`\`\``,
    exercises: [
      "Design: 5 agent roles for your system",
      "Define: Skills and responsibilities for each",
      "Assign: Matching tasks to agents",
      "Code: Task router by agent capability",
      "Problem: Agent overloaded, route to another",
      "Handoff: Design transition protocol",
      "MCQ: Best role structure for 10 agents?",
      "Scale: What happens with specialized agents?"
    ]
  },
  {
    order: 58,
    title: "Consensus and Voting Mechanisms",
    theory: `# Consensus and Voting Mechanisms

## Why Consensus?

One agent might be wrong. Multiple agents more reliable:

\`\`\`
Single agent:
  "Answer: True"
  Confidence: Could be wrong

Three agents:
  Agent 1: "True" (confidence 0.9)
  Agent 2: "True" (confidence 0.85)
  Agent 3: "False" (confidence 0.6)
  Consensus: True (2/3 agree, dissenters low confidence)
  Confidence: Higher
\`\`\`

## Voting Patterns

**Majority Vote**
\`\`\`
3 agents vote:
  A: True
  B: True
  C: False
Result: True (2/3)
\`\`\`

**Confidence-Weighted Vote**
\`\`\`
3 agents vote with confidence:
  A: True (0.9)  → 0.9 points
  B: True (0.8)  → 0.8 points
  C: False (0.5) → -0.5 points (negate opposite vote)
  Total: 1.2 → True
\`\`\`

**Weighted by Accuracy**
\`\`\`
Agent A: 95% accurate historically → weight 0.95
Agent B: 80% accurate historically → weight 0.80
Agent C: 60% accurate historically → weight 0.60

Vote:
  A (weight 0.95): True
  B (weight 0.80): True
  C (weight 0.60): False

Weighted vote: (0.95 + 0.80) vs 0.60 → True
\`\`\`

## Handling Disagreement

\`\`\`
All agents agree (A=B=C):
  ✓ High confidence, proceed

2-1 split (A=B, C differs):
  ✓ Likely correct, but flag it
  "Most agents agreed, but one disagreed. Here's why..."

3-way split (A≠B≠C):
  ❌ Escalate to human
  "Agents disagree significantly. Need human judgment."
\`\`\`

## Code

\`\`\`python
def consensus_vote(agents, question):
    votes = []

    for agent in agents:
        vote = agent.respond(question)
        votes.append({
            "agent": agent.name,
            "answer": vote.answer,
            "confidence": vote.confidence
        })

    # Calculate consensus
    true_weight = sum(v["confidence"] for v in votes if v["answer"])
    false_weight = sum(v["confidence"] for v in votes if not v["answer"])

    if abs(true_weight - false_weight) > 0.5:
        # Clear consensus
        answer = true_weight > false_weight
        confidence = max(true_weight, false_weight) / len(agents)
        return {"answer": answer, "confidence": confidence}
    else:
        # Too split, escalate
        return {"answer": None, "escalate": True, "votes": votes}
\`\`\``,
    exercises: [
      "Implement: Majority voting",
      "Weight: Confidence-weighted voting",
      "Historical: Accuracy-based weights",
      "Disagreement: How to handle 3-way split?",
      "Code: Build voting aggregator",
      "Problem: Agents disagree on critical decision",
      "MCQ: When is voting better than single agent?",
      "Optimize: Minimize number of agents needed"
    ]
  },
  {
    order: 59,
    title: "Agent Cooperation and Competition",
    theory: `# Agent Cooperation and Competition

## Cooperation

Agents work together toward shared goal:

\`\`\`
Goal: Provide best answer to customer

Agent 1 (Search): Find relevant sources
Agent 2 (Analyze): Synthesize sources
Agent 3 (Explain): Explain in customer's language

Each agent enables the next → Cooperation
\`\`\`

## Competition

Agents race to provide best solution:

\`\`\`
Goal: Find optimal solution

Agent 1 (Approach A): Try algorithm X
Agent 2 (Approach B): Try algorithm Y
Agent 3 (Approach C): Try algorithm Z

Fastest/best wins → Competition
\`\`\`

## Hybrid: Cooperate Then Compete

\`\`\`
Phase 1 (Cooperation):
  All agents share knowledge
  "Here's what we all know..."

Phase 2 (Competition):
  Propose different solutions
  "My solution is better because..."

Phase 3 (Cooperation):
  Judge best solution
  Implement together
\`\`\`

## Incentive Alignment

Agents should want to help team:

\`\`\`
❌ Bad incentives:
  "Agent 1 gets 50% bonus if their solution chosen"
  → Agents compete, hide information, sabotage others

✓ Good incentives:
  "All agents split reward if task succeeds"
  → Agents cooperate to maximize team success
\`\`\`

## Code

\`\`\`python
class Team:
    def __init__(self, agents):
        self.agents = agents
        self.shared_knowledge = {}

    def cooperate(self):
        # Share findings
        for agent in self.agents:
            findings = agent.search()
            self.shared_knowledge.update(findings)

    def compete(self):
        # Each agent proposes solution
        proposals = []
        for agent in self.agents:
            proposal = agent.propose_solution(
                shared_knowledge=self.shared_knowledge
            )
            proposals.append(proposal)

        # Vote on best
        best = max(proposals, key=lambda p: p.quality_score)
        return best

    def solve(self, problem):
        self.cooperate()        # Phase 1
        best_solution = self.compete()  # Phase 2
        # Phase 3: Implement together
        return best_solution
\`\`\``,
    exercises: [
      "Design: Cooperation structure for 4 agents",
      "Incentives: How to align interests?",
      "Competition: Agent A vs B vs C - who wins?",
      "Code: Implement cooperation protocol",
      "Problem: Agents hiding information",
      "Hybrid: When cooperation then competition?",
      "MCQ: Pure cooperation or competition?",
      "Measure: Team vs individual agent quality"
    ]
  },
  {
    order: 60,
    title: "Resource Sharing and Load Balancing",
    theory: `# Resource Sharing and Load Balancing

## Shared Resources

Agents compete for limited resources:

\`\`\`
Shared resources:
- API rate limits (10 calls/second total)
- Database connections (100 total)
- GPU memory (8GB total)
- Budget (\$1000/month total)
\`\`\`

## Fair Allocation

\`\`\`
Simple: Equal split
  Agent A: 2.5 calls/sec
  Agent B: 2.5 calls/sec
  Agent C: 2.5 calls/sec
  Agent D: 2.5 calls/sec

Weighted: By importance
  High-priority task: 5 calls/sec
  Normal tasks: 2.5 calls/sec each
  Low-priority: 0 until others done

Dynamic: On-demand
  Agent A needs 4 calls/sec right now → give it
  Agent B can wait → reduce to 1 call/sec
  Dynamically rebalance as demand changes
\`\`\`

## Load Balancer

\`\`\`python
class ResourcePool:
    def __init__(self, api_calls_per_sec=10, agents=4):
        self.total_budget = api_calls_per_sec
        self.per_agent = api_calls_per_sec / agents
        self.allocations = {agent: self.per_agent for agent in agents}

    def allocate(self, agent, requested):
        # Give up to requested, but not more than fair share
        available = min(requested, self.allocations[agent])
        self.allocations[agent] -= available
        return available

    def deallocate(self, agent, amount):
        # Agent is done with some allocation
        self.allocations[agent] += amount

    def refill(self):
        # Every second, reset budgets
        self.allocations = {agent: self.per_agent for agent in self.agents}
\`\`\`

## Starvation Prevention

\`\`\`
Problem: Agent A hogs all resources
Result: Agent B can't make progress

Solution: Minimum guarantee
  No agent gets < 1 call/sec
  Prevents starvation
\`\`\`

## Load Balancing

Route requests to least-busy agent:

\`\`\`python
agents = [
    Agent(load=0.2),  # 20% utilized
    Agent(load=0.8),  # 80% utilized
    Agent(load=0.5)   # 50% utilized
]

def route_to_best():
    return min(agents, key=lambda a: a.load)

# Send new request to least-busy agent
best = route_to_best()  # Agent 1 (20%)
\`\`\``,
    exercises: [
      "Design: Resource allocation for 3 agents",
      "Code: Implement resource pool",
      "Load balance: Route requests to agents",
      "Problem: One agent starving, others thriving",
      "MCQ: Fair allocation strategy?",
      "Monitor: Track resource utilization",
      "Scale: 100 agents, same resources",
      "Optimize: Minimize wait time"
    ]
  },
  {
    order: 61,
    title: "Agent Learning from Collective Experience",
    theory: `# Agent Learning from Collective Experience

## Collective Learning

Each agent learns from others' successes/failures:

\`\`\`
Agent A: "I tried approach X on similar task, worked well"
Agent B: "I tried approach Y, failed"
Agent C: (considering approach Z)
        "Based on team experience, try approach X"
\`\`\`

## Shared Knowledge

\`\`\`python
shared_learnings = {
    "customer_analysis": {
        "approach_X": {"success_rate": 0.95, "attempts": 100},
        "approach_Y": {"success_rate": 0.60, "attempts": 50},
        "approach_Z": {"success_rate": 0.80, "attempts": 30}
    }
}

# Agent C picks best approach for their task
best_approach = max(
    shared_learnings["customer_analysis"].items(),
    key=lambda x: x["success_rate"]
)
# Chooses: approach_X (95% success)
\`\`\`

## Reputation System

Track which agents give good advice:

\`\`\`python
agent_reputation = {
    "Agent A": 0.95,  # Very reliable
    "Agent B": 0.60,  # Less reliable
    "Agent C": 0.88   # Quite reliable
}

# Weight advice by reputation
trusted_advice = weighted_by_reputation(all_advice)
\`\`\`

## Knowledge Sharing

\`\`\`
Agent A discovers:
  "For task X, tool Y is 10× faster than tool Z"

Broadcasts to team:
  "Everyone should use tool Y for task X"

Result: All agents benefit from A's discovery
\`\`\`

## Anti-Patterns

\`\`\`
❌ Agents hide discoveries
   (Each solves same problem independently)

✓ Agents share discoveries
  (All learn from each other)
\`\`\``,
    exercises: [
      "Design: Knowledge sharing system",
      "Reputation: Implement trust scoring",
      "Code: Store and retrieve shared learnings",
      "Problem: Bad agent gives wrong advice",
      "Weight: How much to trust each agent?",
      "Scale: 100 agents sharing knowledge",
      "MCQ: How to prevent harmful knowledge spread?",
      "Measure: Team improvement over time"
    ]
  },
  {
    order: 62,
    title: "Handling Agent Conflicts",
    theory: `# Handling Agent Conflicts

## Conflict Scenarios

\`\`\`
Conflict 1: Different opinions
  Agent A: "Customer will buy this"
  Agent B: "Customer won't buy this"

Conflict 2: Resource contention
  Agent A: "I need 5 API calls"
  Agent B: "I need 5 API calls"
  Pool: Only 8 total available

Conflict 3: Incompatible actions
  Agent A: "Delete file X"
  Agent B: "Don't delete file X"
\`\`\`

## Resolution Strategies

**Voting**
\`\`\`
Ask arbitrator or other agents
Most common opinion wins
\`\`\`

**Priority**
\`\`\`
Agent A (priority 10) vs Agent B (priority 5)
A wins
\`\`\`

**Compromise**
\`\`\`
Agent A wants 5 API calls, B wants 5
Compromise: Both get 4
\`\`\`

**Escalation**
\`\`\`
No automatic resolution possible
Escalate to human decision-maker
\`\`\`

**Separation**
\`\`\`
Keep agents' operations independent
If they can't interfere, no conflict
\`\`\`

## Code

\`\`\`python
def resolve_conflict(agent_a, agent_b, conflict_type):
    if conflict_type == "opinion":
        # Voting
        return ask_arbitrator()

    elif conflict_type == "resource":
        # Compromise or priority
        if agent_a.priority > agent_b.priority:
            return satisfy(agent_a)
        elif agent_b.priority > agent_a.priority:
            return satisfy(agent_b)
        else:
            # Equal priority, compromise
            return compromise(agent_a, agent_b)

    elif conflict_type == "action":
        # Incompatible actions, escalate
        return escalate_to_human(agent_a, agent_b)

    else:
        raise UnknownConflict()
\`\`\`

## Prevention

Better to prevent than resolve:

\`\`\`
1. Clear roles (separate responsibilities)
2. Resource reservation (agent books resources upfront)
3. Communication (agents discuss before acting)
4. Constraints (prevent incompatible states)
\`\`\``,
    exercises: [
      "Identify: 5 conflict types in your system",
      "Design: Resolution strategy for each",
      "Code: Conflict detector",
      "Problem: Two agents giving contradictory advice",
      "Escalation: When to involve human?",
      "Prevention: Design to minimize conflicts",
      "MCQ: Best general strategy?",
      "Simulate: Run conflict scenarios"
    ]
  },
  {
    order: 63,
    title: "Distributed Decision-Making",
    theory: `# Distributed Decision-Making

## Centralized vs Distributed

**Centralized**
\`\`\`
Coordinator makes all decisions
Agent 1, 2, 3: Just execute

Pros: Consistent, controlled
Cons: Bottleneck at coordinator, slow
\`\`\`

**Distributed**
\`\`\`
Each agent makes own decisions
Agents coordinate through messaging

Pros: Scalable, fast, resilient
Cons: Harder to ensure consistency
\`\`\`

## Decision Rights

Give agents autonomy within bounds:

\`\`\`
Agent A (Search):
  Can: Choose search strategy, select sources
  Can't: Modify search results, delete sources

Agent B (Analyze):
  Can: Choose analysis method, synthesis approach
  Can't: Hallucinate data, violate budget

Agent C (Explain):
  Can: Choose explanation format, depth
  Can't: Add information not verified
\`\`\`

## Quorum-Based Decisions

\`\`\`
Decision requires agreement from N of M agents:

"Delete file X" requires:
  2 of 3 security agents to approve

"Spend \$1000" requires:
  3 of 4 finance agents to approve
\`\`\`

## Eventual Consistency

\`\`\`
Not all agents have same knowledge at same time

Agent A (updated): Task is complete
Agent B (outdated): Task still pending
Agent C (updating): Just hearing about it

Solution: Wait for all to sync, or tolerate temporary inconsistency
\`\`\`

## Code

\`\`\`python
class DistributedTeam:
    def make_decision(self, decision_type, requires_quorum=2):
        decision = Decision(decision_type)

        # Collect votes
        for agent in self.agents:
            vote = agent.vote_on(decision)
            decision.votes.append(vote)

        # Check if quorum reached
        agrees = sum(1 for v in decision.votes if v == "yes")

        if agrees >= requires_quorum:
            decision.approved = True
            self.broadcast_decision(decision)
        else:
            decision.rejected = True

        return decision
\`\`\``,
    exercises: [
      "Design: Decision rights for each agent role",
      "Quorum: What threshold for different decisions?",
      "Code: Implement quorum checking",
      "Problem: Inconsistency between agents",
      "Convergence: How long to reach consistency?",
      "MCQ: Centralized vs distributed tradeoff?",
      "Scale: 100 agents, still distributed?",
      "Resilience: What if one agent fails?"
    ]
  },
  {
    order: 64,
    title: "Agent Supervision and Oversight",
    theory: `# Agent Supervision and Oversight

## Autonomous Operation Risks

Without oversight, agents can:
- Make wrong decisions autonomously
- Take expensive actions
- Violate constraints
- Break things

## Supervision Levels

**Level 1: Full Autonomy**
\`\`\`
Agent does work, humans review later (if at all)
Risk: High
Latency: Low
\`\`\`

**Level 2: Autonomous + Monitoring**
\`\`\`
Agent does work
System monitors for anomalies
Escalate if something looks wrong
\`\`\`

**Level 3: Approval Before Action**
\`\`\`
Agent proposes action
Human reviews, approves/rejects
Agent executes approved action
Risk: Low
Latency: High (waiting for human)
\`\`\`

## Automated Oversight

Don't always need human:

\`\`\`python
# Agent wants to delete 1000 files
if num_files > threshold:
    require_human_approval()
elif cost > budget:
    require_human_approval()
elif confidence < 0.8:
    require_human_approval()
else:
    proceed_autonomously()
\`\`\`

## Audit Trails

Keep record for human review:

\`\`\`python
audit_log = {
    "agent": "Agent A",
    "action": "delete_file",
    "file": "old_backup.zip",
    "reason": "Older than 90 days",
    "confidence": 0.95,
    "approved_by": "automatic",
    "timestamp": "2024-01-15T10:32:45Z",
    "reversible": True
}
\`\`\`

## Reversibility

Can we undo the action?

\`\`\`
Highly reversible:
  - Change setting → Revert setting
  - Send message → Delete message
  - Risk: Can do without approval

Hard to reverse:
  - Delete file → Gone forever
  - Transfer money → Can't easily undo
  - Risk: Require approval

Can't reverse:
  - Delete user account → Data lost
  - Publish article → Already public
  - Risk: Require multiple approvals
\`\`\``,
    exercises: [
      "Design: Supervision levels for each agent",
      "Thresholds: When to require human approval?",
      "Code: Implement approval workflow",
      "Audit: Design audit logging",
      "Reversibility: Classify actions by reversibility",
      "Problem: Action was wrong, can we undo?",
      "MCQ: How much autonomy vs oversight?",
      "Monitoring: Alert on anomalies"
    ]
  },
  {
    order: 65,
    title: "Agent Metrics and Health Monitoring",
    theory: `# Agent Metrics and Health Monitoring

## Per-Agent Metrics

Each agent has own performance profile:

\`\`\`
Search Agent:
  - Relevance of results (0-1)
  - Speed (seconds)
  - Cost (API calls)

Analysis Agent:
  - Accuracy of insights
  - Clarity of explanation
  - Time to complete

Coordinator:
  - Throughput (requests/second)
  - Latency (response time)
  - Error rate
\`\`\`

## Health Status

\`\`\`
Green:
  - Metrics within normal range
  - Task completion rate > 95%
  - No recent errors

Yellow:
  - Metrics slightly degraded
  - Task completion 85-95%
  - Some errors but handling them

Red:
  - Metrics very degraded
  - Task completion < 85%
  - Frequent errors
  - Action: Escalate, isolate, or restart
\`\`\`

## Monitoring

\`\`\`python
@background_job(interval=60_seconds)
def check_agent_health():
    for agent in agents:
        metrics = agent.get_metrics()

        if metrics.error_rate > 0.1:
            agent.status = "red"
            alert("Agent failing")
        elif metrics.error_rate > 0.05:
            agent.status = "yellow"
        else:
            agent.status = "green"

        if agent.status == "red":
            escalate_or_restart(agent)
\`\`\`

## Comparisons

Compare agents to detect outliers:

\`\`\`
All agents' latency:
  A: 0.5s
  B: 0.6s
  C: 15s (outlier!)
  D: 0.5s

Agent C is slow, investigate
\`\`\`

## Trending

Track changes over time:

\`\`\`
Agent A latency trend:
  Week 1: 0.5s
  Week 2: 0.6s
  Week 3: 0.8s
  Week 4: 1.2s

Degrading, investigate before it fails
\`\`\``,
    exercises: [
      "Design: Metrics for each agent role",
      "Health status: Classification rules",
      "Code: Implement health checks",
      "Alert: When to alert on degradation?",
      "Comparison: Detect outlier agents",
      "Trending: Plot performance over time",
      "Problem: Agent suddenly slow",
      "Dashboard: Real-time agent status"
    ]
  },
  {
    order: 66,
    title: "Consensus Protocols for Distributed Systems",
    theory: `# Consensus Protocols for Distributed Systems

## The Problem

Agents need to agree on state when they're distributed:

\`\`\`
Agent A thinks: "Task is complete"
Agent B thinks: "Task is incomplete"
Agent C thinks: "Task is complete"

Who's right? How do they converge to agreement?
\`\`\`

## Byzantine Fault Tolerance

Even if some agents are faulty/lying:

\`\`\`
Honest agents: A, B, D (3)
Faulty agent: C (1) - might lie

With 4 agents total:
  A: Yes
  B: Yes
  C: No (faulty)
  D: Yes

Result: Majority (3/4) agree on Yes
\`\`\`

## Paxos Protocol

Classic consensus algorithm:

\`\`\`
Phase 1: Prepare
  Coordinator: "Is anyone higher generation than #5?"
  Agents: "No" or "Yes, generation #6"

Phase 2: Promise
  Coordinator: "Accept proposals for generation #5"
  Agents: "I promise to accept"

Phase 3: Accept
  Coordinator: "Generation #5, value is True"
  Agents: "Accepted"
\`\`\`

## RAFT Protocol

Simpler alternative to Paxos:

\`\`\`
Leader (Agent A) is elected
Leader accepts proposals
Leader replicates to followers (B, C, D)
When majority (3/4) agree → Consensus

If leader fails, elect new leader automatically
\`\`\`

## Code

\`\`\`python
class RaftConsensus:
    def __init__(self, agents):
        self.agents = agents
        self.leader = None
        self.term = 0

    def elect_leader(self):
        # Candidate (A) requests votes
        # Majority (≥N/2+1) vote for A
        # A becomes leader for this term
        pass

    def replicate_log(self, entry):
        # Leader sends to all followers
        # Followers acknowledge
        # When majority ack'd, entry is committed
        pass

    def handle_leader_failure(self):
        # Detect leader is down
        # Trigger new election
        # New leader takes over
        pass
\`\`\`

## When to Use

- Distributed databases (multiple copies of data)
- Agent teams (shared state)
- Multi-replica systems

Don't need consensus for independent operations.`,
    exercises: [
      "Problem: 5 agents disagree on state",
      "Byzantine: Design for faulty agents",
      "Paxos: Trace through protocol",
      "RAFT: Implement leader election",
      "Code: Consensus algorithm",
      "Failure: What if leader dies?",
      "MCQ: Best protocol for your system?",
      "Network partition: Split brain prevention"
    ]
  },
  {
    order: 67,
    title: "State Synchronization Across Agents",
    theory: `# State Synchronization Across Agents

## The Problem

Multiple agents maintain local state:

\`\`\`
Agent A (local state):
  user_preferences: {theme: "dark"}

Agent B (local state):
  user_preferences: {theme: "light"}  # Stale!

Agent C (local state):
  user_preferences: {theme: "dark"}
\`\`\`

## Synchronization Strategies

**Pull-Based**
\`\`\`
Agent B: "What are user preferences?"
Shared store: {theme: "dark"}
Agent B: Updates to match
\`\`\`

**Push-Based**
\`\`\`
User updates preference
Shared store: {theme: "dark"}
Shared store notifies all agents
All agents update simultaneously
\`\`\`

**Event-Based**
\`\`\`
Agent A: "I'm setting theme to dark"
Broadcasts: UserPreferenceChanged event
All agents: Listen and update
\`\`\`

## Conflict Resolution

What if multiple agents change same thing?

\`\`\`
Agent A: Changes theme to dark
Agent B: Changes theme to light
Both happen at same time

Resolution:
1. Last-write-wins: B's change (later timestamp)
2. First-writer-wins: A's change
3. Merge: Combine both changes (if possible)
4. Conflict: Mark as conflicted, escalate to user
\`\`\`

## Versioning

\`\`\`python
state = {
    "value": "theme: dark",
    "version": 5,
    "last_updated": "2024-01-15T10:32:45Z",
    "updated_by": "Agent A"
}

# Agent B checks version before updating
if local_version < received_version:
    update()  # Newer version wins
\`\`\`

## Code

\`\`\`python
class SharedState:
    def __init__(self):
        self.state = {}
        self.versions = {}
        self.subscribers = []

    def update(self, key, value, agent_id):
        if self.should_update(key, value, agent_id):
            self.state[key] = value
            self.versions[key] = (time.time(), agent_id)
            self.notify_subscribers()

    def should_update(self, key, value, agent_id):
        # Check if new version is newer
        current_version = self.versions.get(key, (0, None))
        new_version = (time.time(), agent_id)

        return new_version > current_version
\`\`\``,
    exercises: [
      "Design: Sync strategy for your agents",
      "Problem: Stale state in agent B",
      "Conflict: Two agents change simultaneously",
      "Code: Implement pull-based sync",
      "Event: Publish-subscribe pattern",
      "Versioning: Track changes with versions",
      "Consistency: Eventual vs strong consistency",
      "Scale: Sync across 100 agents"
    ]
  },
  {
    order: 68,
    title: "Failure Recovery and Resilience",
    theory: `# Failure Recovery and Resilience

## Failure Modes

\`\`\`
Agent crash:
  Agent A dies mid-task
  Other agents don't know

Message loss:
  Agent A sends message to B
  Message gets lost on network

Network partition:
  Agent A can't reach Agent B
  But both are still running

Incorrect result:
  Agent did work but produced wrong result
  Other agents relied on it
\`\`\`

## Recovery Strategies

**Checkpointing**
\`\`\`
Before doing work:
  Save state to disk/database

After failure:
  Restore from checkpoint
  Resume from where stopped
\`\`\`

**Redundancy**
\`\`\`
Multiple agents doing same work

Agent A fails
Agent B already has same result
No loss
\`\`\`

**Retry with Backoff**
\`\`\`
Try sending message: Fail
Wait 1 second, retry: Fail
Wait 2 seconds, retry: Fail
Wait 4 seconds, retry: Success!
\`\`\`

## Dead Letter Queue

\`\`\`
Messages that can't be delivered:
  → Sent to dead letter queue
  → Human/admin reviews
  → Manually retry when issue is fixed
\`\`\`

## Code

\`\`\`python
class ResilientAgent:
    def __init__(self, name):
        self.name = name
        self.checkpoint_path = f"/checkpoints/{name}"

    def save_checkpoint(self):
        state = self.get_state()
        with open(self.checkpoint_path, "w") as f:
            json.dump(state, f)

    def recover_from_checkpoint(self):
        if os.path.exists(self.checkpoint_path):
            with open(self.checkpoint_path, "r") as f:
                state = json.load(f)
            self.restore_state(state)

    def send_with_retry(self, message, max_retries=5):
        for attempt in range(max_retries):
            try:
                self.send(message)
                return  # Success

            except NetworkError:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    sleep(wait_time)
                else:
                    # Final failure, send to dead letter queue
                    self.dead_letter_queue.add(message)
\`\`\`

## Testing Failures

\`\`\`python
def test_agent_crash_recovery():
    agent = ResilientAgent("test")
    agent.save_checkpoint()

    # Simulate crash
    agent.stop()

    # Restart
    agent.start()
    agent.recover_from_checkpoint()

    # Should be in same state as before crash
    assert agent.state == saved_state
\`\`\``,
    exercises: [
      "Design: Failure recovery plan",
      "Checkpointing: Implement save/restore",
      "Redundancy: Multiple agents doing same work",
      "Retry: Exponential backoff implementation",
      "Dead letter: Queue for failed messages",
      "Problem: Agent crashed, other agents waiting",
      "Test: Simulate failures and recovery",
      "Monitor: Detect and recover automatically"
    ]
  },
  {
    order: 69,
    title: "Emergent Behaviors and Swarm Dynamics",
    theory: `# Emergent Behaviors and Swarm Dynamics

## Emergence

Simple rules + many agents = Complex behaviors:

\`\`\`
Ants (simple):
  - Follow pheromones
  - Drop pheromones
  - Move randomly sometimes

Colony (complex):
  - Self-organizes to find food
  - Adapts to obstacles
  - Optimizes foraging
\`\`\`

## Swarm Algorithms

**Particle Swarm Optimization**
\`\`\`
Each agent (particle):
  - Has velocity, position
  - Moves toward best solution found
  - Influenced by neighbors

Together:
  - Swarm converges on global optimum
  - Without central coordination
\`\`\`

**Ant Colony Optimization**
\`\`\`
Each agent (ant):
  - Follows pheromone trails
  - Deposits pheromones along path
  - Explores randomly

Together:
  - Swarm finds shortest paths
  - Adapts to changing environment
\`\`\`

## Emergent Patterns

\`\`\`
Flocking:
  Each bird (agent) follows 3 rules:
  1. Avoid others (separation)
  2. Match speed of neighbors (alignment)
  3. Move toward center of neighbors (cohesion)

Result: Flocks form, move gracefully
\`\`\`

## Benefits

\`\`\`
✓ Scalable (doesn't need central coordinator)
✓ Resilient (losing one agent barely affects swarm)
✓ Adaptable (swarm adjusts to new conditions)

❌ Hard to predict exact behavior
❌ Hard to debug ("why did swarm do that?")
\`\`\`

## Code

\`\`\`python
class SwarmAgent:
    def __init__(self, position):
        self.position = position
        self.velocity = random_direction()
        self.best_position = position
        self.best_value = float('inf')

    def update(self, swarm_best):
        # Pull toward personal best
        cognitive = 2 * random() * (self.best_position - self.position)

        # Pull toward swarm best
        social = 2 * random() * (swarm_best - self.position)

        # Update velocity
        self.velocity = 0.7 * self.velocity + cognitive + social

        # Move
        self.position += self.velocity

        # Evaluate
        value = evaluate(self.position)
        if value < self.best_value:
            self.best_position = self.position
            self.best_value = value
\`\`\``,
    exercises: [
      "Simulate: Particle swarm optimization",
      "Ant colony: Implement pheromone trails",
      "Flocking: 3-rule bird simulation",
      "Emergence: What patterns form?",
      "Code: Build simple swarm algorithm",
      "Problem: Swarm converged to wrong optimum",
      "Predict: What will swarm do?",
      "Apply: Use swarm for your problem"
    ]
  },
  {
    order: 70,
    title: "Production Multi-Agent Systems Architecture",
    theory: `# Production Multi-Agent Systems Architecture

## System Design

\`\`\`
┌─────────────────────────────────────────┐
│         Load Balancer / Router          │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ↓            ↓            ↓
  Agent A      Agent B      Agent C
  (Search)   (Analysis)  (Coordinator)
    │            │            │
    └────────────┴────────────┘
                 │
    ┌────────────┼────────────┐
    ↓            ↓            ↓
 Postgres    Redis Cache   Message Queue
  (State)    (Hot Data)    (Communication)
\`\`\`

## Components

**Load Balancer**
- Routes requests to least-busy agent
- Health checks
- Failover

**Agents**
- Specialized roles
- Autonomous operation within bounds
- Report metrics

**State Store**
- Shared state (database)
- Consistency management
- Audit logs

**Cache**
- Fast access to hot data
- Reduces database load

**Message Queue**
- Async communication
- Resilience (no lost messages)
- Ordering guarantees

## Deployment

\`\`\`
Dev:
  Single machine
  All agents in same process
  In-memory state

Production:
  Multiple machines
  Each agent on separate machine
  Distributed database
  Message queue for communication
\`\`\`

## Monitoring

\`\`\`
Metrics:
  - Throughput (requests/sec)
  - Latency (response time)
  - Error rate
  - Resource usage (CPU, memory)

Logging:
  - All agent decisions
  - All state changes
  - All errors

Alerting:
  - Error rate > 5%
  - Latency p99 > 10s
  - Agent not responding
  - Resource exhaustion
\`\`\`

## Testing

\`\`\`
Unit tests:
  Each agent independently

Integration tests:
  Agents working together

Chaos tests:
  Agents failing, recovering
  Network partitions
  Message delays

Load tests:
  1000s of concurrent requests
  How does system degrade?
\`\`\`

## Scaling

\`\`\`
Add more agents:
  Load balancer distributes requests

Bottleneck at database:
  Add read replicas
  Implement caching

Bottleneck at message queue:
  Add more partitions

Bottleneck at agent:
  Specialize agents further
  Optimize code
\`\`\``,
    exercises: [
      "Design: Multi-agent system architecture",
      "Deploy: From single to distributed system",
      "Monitoring: Metrics and alerting setup",
      "Testing: Test multi-agent interactions",
      "Scale: Handle 100× more traffic",
      "Problem: One agent is bottleneck",
      "Implement: Full production system",
      "Case study: Analyze real multi-agent system"
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

    // Get the Agentic AI course and Module 4
    const courseRes = await db
      .from("courses")
      .select("id")
      .eq("slug", "agentic-ai")
      .single();

    if (courseRes.error) {
      throw new Error(`Course not found: ${courseRes.error.message}`);
    }

    const courseId = courseRes.data.id;

    const moduleRes = await db
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("order_index", 4)
      .single();

    if (moduleRes.error) {
      throw new Error(`Module 4 not found: ${moduleRes.error.message}`);
    }

    const moduleId = moduleRes.data.id;

    // Get all lessons in Module 4
    const lessonsRes = await db
      .from("lessons")
      .select("id, order_index")
      .eq("course_id", courseId)
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });

    if (lessonsRes.error) {
      throw new Error(`Lessons query failed: ${lessonsRes.error.message}`);
    }

    let lessonsUpdated = 0;
    let exercisesUpdated = 0;

    // Update each lesson
    for (let i = 0; i < lessonsRes.data.length && i < ADVANCED_COORDINATION_LESSONS.length; i++) {
      const lesson = lessonsRes.data[i];
      const lessonData = ADVANCED_COORDINATION_LESSONS[i];

      // Update lesson
      await db
        .from("lessons")
        .update({
          title: lessonData.title,
          theory_md: lessonData.theory,
        })
        .eq("id", lesson.id);

      lessonsUpdated++;

      // Delete old exercises and insert new ones
      await db.from("exercises").delete().eq("lesson_id", lesson.id);

      const exercises = lessonData.exercises.map((prompt, idx) => ({
        lesson_id: lesson.id,
        order_index: idx + 1,
        type: idx < 2 ? "code" : idx < 5 ? "short_answer" : "mcq",
        title: `Exercise ${idx + 1}`,
        prompt_md: prompt,
        marks: 10,
        starter_code: idx < 2 ? "# TODO: Implement" : null,
        language: idx < 2 ? "python" : null,
      }));

      await db.from("exercises").insert(exercises);
      exercisesUpdated += exercises.length;
    }

    return NextResponse.json({
      success: true,
      message: "Slice #36 complete: 15 Multi-Agent Coordination lessons + 120 exercises!",
      summary: {
        lessonsUpdated,
        exercisesUpdated,
        lessonsCreated: lessonsUpdated,
        exercisesCreated: exercisesUpdated,
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
