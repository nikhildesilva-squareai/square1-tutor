import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-all-core-lessons
 * Seeds ALL 15 Core Fundamentals lessons (Slice #32) with complete content
 */

interface Lesson {
  order: number;
  title: string;
  theory: string;
  exercises: string[];
}

const CORE_LESSONS: Lesson[] = [
  {
    order: 1,
    title: "Agentic Architecture: Perception → Reasoning → Planning → Action",
    theory: `# Agentic Architecture

## The PRPA Loop

Every agent follows: Perception → Reasoning → Planning → Action

**Perception**: Observe the environment (user input, API responses, data)
**Reasoning**: Think about what you observed (what's the problem?)
**Planning**: Decide what to do (what actions will solve it?)
**Action**: Execute your plan (call APIs, make decisions)

## Example: Customer Service

User: "My order arrived damaged"
↓
Perception: Customer has order, wants return
Reasoning: Need to verify order, check policy, authorize return
Planning: Look up order → Check policy → Process return
Action: Call APIs to execute plan

## Key Principle

Agents are autonomous systems that make decisions based on perception. Better perception = better decisions.`,
    exercises: [
      "Identify PRPA stages in: 'Book a flight from NYC to LA'",
      "Code: Implement simple PRPA loop function",
      "Reactive vs Deliberative: When to use each approach",
      "MCQ: Agent Memory Importance - What happens without it?",
      "Agent Quality Metrics: Compare two agents' performance",
      "Code: Design AgentState class with conversation history",
      "Perception Limitations: Give 3 examples where limited perception fails",
      "MCQ: Why is planning (before action) important?"
    ]
  },
  {
    order: 2,
    title: "Building an LLM-Powered Agent",
    theory: `# Building an LLM-Powered Agent

## The LLM as the Brain

An LLM (Claude, GPT-4, etc.) serves as the agent's reasoning engine.

**What it does:**
- Understands natural language
- Reasons through problems
- Decides which actions to take
- Generates explanations

**Agent's job:**
1. Collect information (perception)
2. Feed to LLM for reasoning
3. Parse response to extract actions
4. Execute those actions
5. Feed results back to LLM

## Basic Agent Loop

\`\`\`python
def agent_loop(user_message, max_iterations=10):
    messages = [{"role": "user", "content": user_message}]

    for i in range(max_iterations):
        # Get LLM's reasoning
        response = llm.invoke(messages)

        # Check if done
        if response.is_final():
            return response.final_answer

        # Execute action
        action = parse_action(response)
        result = execute_action(action)

        # Feed back to LLM
        messages.append({"role": "assistant", "content": response.text})
        messages.append({"role": "user", "content": f"Result: {result}"})

    return "Max iterations reached"
\`\`\`

## Common Pitfalls

1. **Hallucination**: LLM makes up information
   - Fix: Constrain to real API responses only

2. **Infinite loops**: Same action repeated
   - Fix: Track conversation history, try different actions

3. **Token overflow**: Long conversations cost more
   - Fix: Summarize old messages, keep recent context

4. **Slow responses**: Too much reasoning
   - Fix: Route simple queries directly, use agent loop only for complex tasks`,
    exercises: [
      "Code: Implement basic agent loop with mock LLM",
      "Write system prompt for WiFi troubleshooting agent",
      "MCQ: Hallucination risk - what should agent do when uncertain?",
      "Code: Parse LLM response to extract tool calls",
      "Cost vs Quality tradeoff: Simple vs agent response",
      "Code: Token counter and cost estimator",
      "Debugging: Agent stuck in loop - how to fix?",
      "MCQ: What's the purpose of system prompts?"
    ]
  },
  {
    order: 3,
    title: "Tool Use and Function Calling",
    theory: `# Tool Use and Function Calling

## Why Tools Matter

Agents can't do everything themselves. Tools let them:
- Look up information (databases, APIs)
- Take actions (send emails, process payments)
- Interact with external systems
- Solve real-world problems

## How It Works

Agent doesn't execute tools - it decides WHICH tools to call.

\`\`\`
LLM thinks: "I need to check the user's order status"
LLM outputs: "I'll call get_order(order_id=123)"
Agent executes: get_order(123) → {"status": "shipped", ...}
Agent returns result to LLM
LLM continues reasoning with the new info
\`\`\`

## Defining Tools

Each tool needs:
- Name: what it does
- Description: when to use it
- Parameters: what inputs it takes
- Return: what it gives back

\`\`\`python
tools = {
    "get_order": {
        "description": "Look up order details by ID",
        "parameters": {"order_id": "string"},
        "returns": {"status", "items", "total"}
    }
}
\`\`\`

## Best Practices

1. **Keep tools simple** - One job each
2. **Clear descriptions** - So LLM knows when to use them
3. **Validate inputs** - Check before executing
4. **Handle errors gracefully** - Return helpful error messages
5. **Log everything** - For debugging agent behavior`,
    exercises: [
      "Design tools for a restaurant booking agent",
      "Code: Implement tool executor that validates inputs",
      "MCQ: When should agent ask for clarification vs guess?",
      "Parse LLM output to extract tool calls and parameters",
      "Code: Tool definition with validation and error handling",
      "Trace: Follow agent reasoning through 3 tool calls",
      "Design: Tools for a data analysis agent",
      "MCQ: Tool naming - which names are clearest?"
    ]
  },
  {
    order: 4,
    title: "Short-Term Memory and Context Management",
    theory: `# Short-Term Memory and Context Management

## The Problem

LLMs have fixed context windows (e.g., Claude has 200K tokens).
Long conversations eventually overflow.

## Solution: Context Management

Keep the conversation focused and recent:

\`\`\`
Recent Messages: [Keep all recent messages]
Summary: [Compress old messages into key facts]
Long-term Facts: [Important facts that came up early]
\`\`\`

## Token Budget

Example with 4K context window:
- System prompt: 500 tokens
- Available for conversation: 3500 tokens
- Long conversation needs trimming

## Strategies

1. **Keep recent messages** - Last 10-20 turns
2. **Summarize context** - "User's goal is X, constraints are Y"
3. **Progressive summarization** - Update summary every 10 turns
4. **Smart truncation** - Remove least important messages

## Implementation

\`\`\`python
def manage_context(messages, max_tokens=3500):
    if token_count(messages) > max_tokens:
        # Keep recent 20 messages
        recent = messages[-20:]

        # Summarize older messages
        old_summary = summarize(messages[:-20])

        return [
            {"role": "system", "content": old_summary},
            *recent
        ]
    return messages
\`\`\``,
    exercises: [
      "Calculate tokens: How many turns fit in 4K context?",
      "Code: Implement progressive message summarization",
      "MCQ: When should agent summarize vs trim?",
      "Design: Context strategy for 24-hour support agent",
      "Code: Token counter for conversation history",
      "Trace: Show how context shrinks as conversation grows",
      "Problem: Agent forgot something from 50 turns ago - fix it",
      "MCQ: Cost impact of long conversations?"
    ]
  },
  {
    order: 5,
    title: "Long-Term Memory and Knowledge Systems",
    theory: `# Long-Term Memory and Knowledge Systems

## Beyond Conversation

Short-term memory (conversation history) isn't enough.
Agents need to remember:
- User preferences learned over time
- Knowledge discovered in past conversations
- Important facts for future use

## Two Approaches

### 1. Vector Embeddings + Semantic Search

Convert information to vectors, store and retrieve by meaning:

\`\`\`
User prefers vegetarian food → embedding
Later: "What should I eat?" → find similar embeddings
Result: Recommend vegetarian restaurants
\`\`\`

### 2. Structured Knowledge Graph

Store facts as relationships:

\`\`\`
User -- prefers --> vegetarian
User -- allergic_to --> peanuts
Restaurant -- serves --> vegetarian
\`\`\`

## Implementation Pattern

\`\`\`python
class Agent:
    def __init__(self):
        self.conversation_history = []  # Short-term
        self.embeddings_db = VectorDB()  # Long-term semantic
        self.knowledge_graph = Graph()   # Long-term facts

    def remember(self, fact):
        # Store in both places
        embedding = embed(fact)
        self.embeddings_db.add(embedding, fact)
        self.knowledge_graph.add(fact)

    def recall(self, query):
        # Search long-term memory
        similar = self.embeddings_db.search(query)
        facts = self.knowledge_graph.query(query)
        return similar + facts
\`\`\`

## Real-World Example

User asks agent about diet over 10 conversations:
- Conv 1: "I'm vegetarian"
- Conv 5: "I'm allergic to peanuts"
- Conv 10: "What's a good restaurant?"

Agent recalls: Vegetarian + no peanuts → recommends appropriately`,
    exercises: [
      "Design: Long-term memory for personal assistant agent",
      "Code: Implement vector embedding storage and retrieval",
      "MCQ: When to use embeddings vs knowledge graph?",
      "Trace: Show how agent uses remembered facts",
      "Code: Query knowledge graph for related facts",
      "Problem: Agent forgot important fact - how to fix?",
      "Design: Memory system for customer support",
      "Code: Prune old memories when database grows too large"
    ]
  },
  {
    order: 6,
    title: "Chain-of-Thought and Reasoning Frameworks",
    theory: `# Chain-of-Thought and Reasoning Frameworks

## The Problem

Direct answers are often wrong. Better: think step-by-step.

**Bad**: "What's 17 × 24?" → "408" ❌
**Good**:
- Step 1: 17 × 20 = 340
- Step 2: 17 × 4 = 68
- Step 3: 340 + 68 = 408 ✓

## Chain-of-Thought (CoT)

Force the LLM to show its reasoning:

\`\`\`python
system_prompt = """
Think step-by-step.
Show your reasoning before giving the answer.
"""

# LLM now outputs:
# "Step 1: The user wants...
#  Step 2: I need to...
#  Step 3: Therefore..."
\`\`\`

## More Advanced: Tree-of-Thought

Explore multiple reasoning paths:

\`\`\`
Question: Should we launch this product?

Path A: Financial analysis
  - Revenue potential: High
  - Cost of launch: Medium
  - Conclusion: Worth it

Path B: Market analysis
  - Market demand: High
  - Competition: Medium
  - Conclusion: Good timing

Path C: Technical feasibility
  - Build time: 2 months
  - Resource cost: High
  - Conclusion: Feasible

Final: Weigh all paths → Launch ✓
\`\`\`

## Implementation

\`\`\`python
def chain_of_thought(question, depth=3):
    # First: Generate multiple thinking paths
    paths = []
    for i in range(depth):
        path = llm.think(question, perspective=i)
        paths.append(path)

    # Second: Evaluate paths
    scores = [evaluate(p) for p in paths]

    # Third: Synthesize best answer
    best = paths[scores.index(max(scores))]
    return best
\`\`\``,
    exercises: [
      "Compare: Direct answer vs chain-of-thought",
      "Code: Implement prompt that forces step-by-step reasoning",
      "Problem: Agent makes wrong decision - fix with CoT",
      "Design: Tree-of-Thought for hiring decision",
      "MCQ: When is CoT essential vs overkill?",
      "Trace: Follow agent's reasoning through 3 steps",
      "Code: Extract reasoning from LLM response",
      "Analyze: Which reasoning path was most helpful?"
    ]
  },
  {
    order: 7,
    title: "Reflection and Self-Correction",
    theory: `# Reflection and Self-Correction

## The Loop

Good agents don't just act - they reflect and improve:

\`\`\`
Action → Result → Reflect → Better Action
\`\`\`

## Self-Reflection Prompt

\`\`\`python
reflect_prompt = """
You just took this action: {action}
The result was: {result}

Did this work well? Why or why not?
What would you do differently next time?
"""
\`\`\`

## Error Recovery

When something fails:

\`\`\`
Attempt 1: Call API → Error
Reflect: "API returned 404. Resource doesn't exist."
Attempt 2: Search for resource first, then call API
Result: Success ✓
\`\`\`

## Learning Loop

\`\`\`python
attempts = []
for i in range(max_attempts):
    action = decide_action()
    result = execute(action)

    if success(result):
        return result

    # Learn from failure
    reflection = reflect_on(action, result)
    attempts.append({
        "action": action,
        "result": result,
        "reflection": reflection
    })

    # Use reflection to inform next attempt
    context = format_attempts(attempts)
    # Include context in next decision
\`\`\`

## Real-World Example

Support agent handling refund:
1. Check refund policy → Policy doesn't match situation
2. Reflect: "This is an edge case not covered by standard policy"
3. Escalate to manager with reasoning
4. Learn: Add this edge case to knowledge base`,
    exercises: [
      "Write: Reflection prompt for customer service",
      "Trace: Follow agent through 3 attempts with reflection",
      "Code: Implement error recovery with reflection",
      "MCQ: When to retry vs escalate?",
      "Design: Learning loop for task automation",
      "Problem: Agent keeps making same mistake - fix",
      "Code: Extract and store learnings for future",
      "Analyze: What did agent learn from failure?"
    ]
  },
  {
    order: 8,
    title: "Multi-Step Planning",
    theory: `# Multi-Step Planning

## Simple vs Complex Tasks

**Simple**: Single action solves it
- "What's the weather?" → Check API → Done

**Complex**: Multiple steps with dependencies
- "Plan my week" → Set goals → Schedule tasks → Check conflicts → Adjust

## Planning Algorithm

\`\`\`
1. Understand the goal
   "I want to read 10 books this month"

2. Break into sub-goals
   - Read 2-3 books per week
   - Dedicate 1 hour daily
   - Keep track of progress

3. Identify dependencies
   - Can't read without books (need to acquire first)
   - Can't track without system (need app/notebook)

4. Create timeline
   - Week 1: Get books + setup system
   - Week 2-4: Read + track

5. Handle failures
   - If busy week: extend timeline
   - If can't find books: adjust targets
\`\`\`

## Planning Prompt

\`\`\`python
planning_prompt = """
Goal: {goal}

Break this into steps:
1. What sub-goals are needed?
2. What dependencies exist?
3. What could go wrong?
4. How would you handle each risk?

Create a detailed plan with timeline.
"""
\`\`\`

## Implementation

\`\`\`python
def multi_step_plan(goal):
    # Step 1: Break goal into sub-goals
    subgoals = llm.decompose(goal)

    # Step 2: Find dependencies
    dependencies = find_dependencies(subgoals)

    # Step 3: Order by dependencies
    ordered = topological_sort(subgoals, dependencies)

    # Step 4: Add timelines and milestones
    plan = add_timelines(ordered)

    return plan
\`\`\``,
    exercises: [
      "Decompose: Break 'Launch a product' into steps",
      "Code: Implement topological sort for task ordering",
      "Dependency graph: Draw dependencies for complex goal",
      "Problem: Task blocked by dependency - replan",
      "MCQ: When to replan vs push through?",
      "Trace: Follow agent through 5-step plan",
      "Code: Detect and handle circular dependencies",
      "Design: Plan for 'Migrate from Postgres to MySQL'"
    ]
  },
  {
    order: 9,
    title: "Debugging and Tracing Agent Behavior",
    theory: `# Debugging and Tracing Agent Behavior

## The Challenge

Why did the agent make that decision?
Without visibility, debugging is impossible.

## Tracing Strategy

Log every decision point:

\`\`\`python
def trace_agent(user_input):
    print(f"INPUT: {user_input}")

    # Perception
    context = gather_context(user_input)
    print(f"CONTEXT: {context}")

    # Reasoning
    reasoning = llm.think(user_input, context)
    print(f"REASONING: {reasoning}")

    # Planning
    plan = llm.plan(reasoning)
    print(f"PLAN: {plan}")

    # Action
    for step in plan:
        print(f"ACTION: {step}")
        result = execute(step)
        print(f"RESULT: {result}")

    return final_response
\`\`\`

## Key Things to Log

1. **Input** - What did the user ask?
2. **Context** - What info did agent gather?
3. **Reasoning** - What did agent think about?
4. **Plan** - What actions did it decide on?
5. **Actions** - What was actually executed?
6. **Results** - What happened?
7. **Decisions** - Why this action vs alternatives?

## Debugging Example

Agent books wrong restaurant:

\`\`\`
INPUT: "Book Italian near Downtown"
CONTEXT: Found 3 Italian restaurants
REASONING: "User wants Italian, so I should book Italian"
ACTION: Book first restaurant
RESULT: Booked Mexican restaurant! ❌

Problem: Context included wrong restaurant type
Fix: Verify restaurant type before booking
\`\`\`

## Visualization Tools

\`\`\`python
# Create trace tree
{
  "input": "Book restaurant",
  "reasoning_steps": [
    "User wants food",
    "Italian cuisine",
    "Downtown location"
  ],
  "actions": [
    {"type": "search", "query": "Italian Downtown"},
    {"type": "filter", "criteria": "rating > 4.0"},
    {"type": "book", "restaurant": "Pietro's"}
  ],
  "result": "Success"
}
\`\`\``,
    exercises: [
      "Design: Logging system for agent decisions",
      "Trace: Follow agent through 3 decisions with logs",
      "Code: Implement execution trace printer",
      "Problem: Agent chose wrong tool - trace why",
      "MCQ: What to log vs skip?",
      "Analyze: Trace shows unexpected reasoning - fix it",
      "Code: Parse agent reasoning from LLM output",
      "Visualize: Draw decision tree from agent trace"
    ]
  },
  {
    order: 10,
    title: "Structured Output and Parsing",
    theory: `# Structured Output and Parsing

## The Problem

LLM output is text. Downstream systems need structured data.

**Bad**: "The price is around 50 dollars maybe"
**Good**: {"price": 50.00, "currency": "USD", "confidence": 0.85}

## JSON Schema

Define exactly what you want:

\`\`\`python
schema = {
    "type": "object",
    "properties": {
        "restaurant_name": {"type": "string"},
        "cuisine": {"type": "string"},
        "price_range": {"type": "integer", "minimum": 1, "maximum": 5},
        "availability": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["restaurant_name", "cuisine"]
}
\`\`\`

## Constraining LLM Output

Tell the LLM to output JSON:

\`\`\`python
prompt = """
User asked: {user_request}

Respond with ONLY valid JSON matching this schema:
{schema}

Do not include any other text.
"""
\`\`\`

## Parsing and Validation

\`\`\`python
def parse_structured_output(response, schema):
    try:
        data = json.loads(response)
        # Validate against schema
        jsonschema.validate(data, schema)
        return data
    except json.JSONDecodeError:
        # Try to extract JSON from text
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            return parse_structured_output(match.group(), schema)
        raise ValueError(f"Could not parse: {response}")
\`\`\`

## Real-World Example

Restaurant booking agent:

\`\`\`
User: "Book a table for 4 at Italian places"

LLM Output:
{
  "action": "search_restaurants",
  "criteria": {
    "cuisine": "italian",
    "party_size": 4
  },
  "restaurant_name": "Pietro's",
  "booking": {
    "date": "2024-01-20",
    "time": "19:00",
    "party_size": 4
  }
}

Agent parses → Books restaurant ✓
\`\`\``,
    exercises: [
      "Design: JSON schema for restaurant booking",
      "Code: Write parsing function with validation",
      "MCQ: Structured vs free-form output tradeoff?",
      "Problem: LLM output doesn't match schema - fix",
      "Code: Implement schema validation",
      "Trace: Follow parsing from LLM to database",
      "Design: Schema for product recommendation",
      "Test: Parse 5 variations of output format"
    ]
  },
  {
    order: 11,
    title: "Agent Types: Reactive, Deliberative, and Hybrid",
    theory: `# Agent Types: Reactive, Deliberative, and Hybrid

## Reactive Agents

**What**: Respond immediately to stimuli
**How**: Input → Action (no planning)

\`\`\`
User: "What's the weather?"
Agent: (Check API immediately)
Response: "Sunny, 72°F"
\`\`\`

**Pro**: Fast, simple
**Con**: Can't handle complex situations, no foresight

## Deliberative Agents

**What**: Think first, then act
**How**: Input → Plan → Action

\`\`\`
User: "Plan my year"
Agent: (Think through all steps, break into sub-goals, create timeline)
Response: (Detailed plan with milestones)
\`\`\`

**Pro**: Handles complex goals, considers consequences
**Con**: Slow, can overthink

## Hybrid Agents

**What**: Choose approach based on situation
**How**: If simple → React, If complex → Deliberate

\`\`\`python
def hybrid_agent(request):
    complexity = estimate_complexity(request)

    if complexity < THRESHOLD:
        return reactive_response(request)
    else:
        return deliberative_response(request)
\`\`\`

**Pro**: Best of both worlds
**Con**: Need to detect complexity

## Decision Matrix

| Agent Type | Simple Task | Complex Task |
|-----------|-------------|--------------|
| Reactive | ✓ Fast | ✗ Wrong |
| Deliberative | ✓ Correct (slow) | ✓ Correct |
| Hybrid | ✓ Fast | ✓ Correct |

## Examples

**Reactive**: Chatbots, quick Q&A, status checks
**Deliberative**: Project planning, strategic decisions
**Hybrid**: Customer service (simple → react, escalation → deliberate)`,
    exercises: [
      "Compare: Reactive vs Deliberative for 3 tasks",
      "Code: Complexity estimator for hybrid routing",
      "Design: Hybrid system for support agent",
      "MCQ: When is pure reactive sufficient?",
      "Trace: Show hybrid agent choosing approach",
      "Problem: Reactive agent failing - switch to hybrid",
      "Code: Implement threshold-based routing",
      "Benchmark: Compare speed/accuracy of each type"
    ]
  },
  {
    order: 12,
    title: "Guardrails and Safety Constraints",
    theory: `# Guardrails and Safety Constraints

## Why Guardrails Matter

Without constraints, agents can:
- Break company policy (refund someone who doesn't qualify)
- Cost money (process payment for wrong amount)
- Violate security (expose sensitive data)
- Make bad decisions (promise what they can't deliver)

## Types of Guardrails

### 1. Rule-Based (Hard Constraints)

\`\`\`python
# Can't refund more than 50% of original price
if refund_amount > original_price * 0.5:
    return "Refund exceeds policy limit"

# Only certain roles can approve discounts
if current_user.role != "manager":
    return "Only managers can approve discounts"
\`\`\`

### 2. Policy-Based (Soft Constraints)

\`\`\`python
system_prompt = """
REFUND POLICY:
- Items within 30 days: Full refund
- Items 30-60 days: 50% refund
- Items over 60 days: No refund

Follow this policy strictly.
If customer requests exception, escalate to manager.
Never make exceptions on your own.
"""
\`\`\`

### 3. Verification-Based (Check Before Acting)

\`\`\`python
def safe_refund(order_id, amount):
    # Always verify before executing
    order = get_order(order_id)

    # Check 1: Order exists?
    if not order:
        return "Order not found"

    # Check 2: Within policy?
    if not within_refund_window(order):
        return "Outside refund window"

    # Check 3: Amount reasonable?
    if amount > order.total:
        return "Refund exceeds order total"

    # All checks pass
    return process_refund(order_id, amount)
\`\`\`

## Implementation Pattern

\`\`\`python
class GuardrailedAgent:
    def __init__(self):
        self.rules = load_rules()
        self.policies = load_policies()

    def can_execute(self, action):
        # Check all guardrails
        for rule in self.rules:
            if not rule.check(action):
                return False, rule.error_message

        for policy in self.policies:
            if not policy.permits(action):
                return False, policy.error_message

        return True, None

    def execute_safely(self, action):
        allowed, error = self.can_execute(action)
        if not allowed:
            return {"status": "blocked", "reason": error}
        return execute(action)
\`\`\`

## Real-World Example

Travel booking agent:

\`\`\`
GUARDRAILS:
✓ Can book flights within 365 days
✓ Can cancel bookings within 48 hours
✓ Can't book if customer has unpaid balance
✓ Automatic escalation for bookings > $5000

Booking attempt: Flight for $6000
→ Blocked by "booking > $5000" rule
→ Escalated to manager
→ Manager approves
→ Booking proceeds
\`\`\``,
    exercises: [
      "Design: Guardrails for payment processing",
      "Code: Implement rule checker with priority",
      "Problem: Agent violated policy - add guardrail",
      "Write: Policy prompt for support agent",
      "Code: Verification checks before refund",
      "MCQ: Hard rule vs soft policy - which to use?",
      "Trace: Show guardrail blocking unsafe action",
      "Audit: What guardrails should protect this agent?"
    ]
  },
  {
    order: 13,
    title: "State Persistence and Versioning",
    theory: `# State Persistence and Versioning

## Why Persistence Matters

If agent state isn't saved:
- Can't resume interrupted conversations
- Can't debug past behavior
- Can't roll back to working version
- Risk losing work

## What to Save

\`\`\`python
agent_state = {
    "conversation_id": "conv-123",
    "messages": [...],  # Full conversation history
    "decisions": [...], # Actions taken
    "learned_facts": {...},  # Things agent learned
    "user_preferences": {...},  # What agent learned about user
    "version": "1.2.3"  # Agent version
}
\`\`\`

## Database Schema

\`\`\`sql
CREATE TABLE agent_states (
    id UUID PRIMARY KEY,
    agent_id VARCHAR,
    conversation_id VARCHAR,
    state JSONB,  -- Full state snapshot
    version VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE agent_versions (
    id UUID PRIMARY KEY,
    agent_id VARCHAR,
    version VARCHAR,
    prompt_hash VARCHAR,
    tools JSONB,
    created_at TIMESTAMP
);
\`\`\`

## Rollback Example

Version 1.0: Agent overly generous with refunds
Version 1.1: Fixed, more restrictive
Version 1.2: Balanced approach

If version 1.2 has bug:
\`\`\`python
rollback_agent("my-agent", to_version="1.1")
# All new conversations use 1.1
# Old conversations kept for audit
\`\`\`

## Implementation

\`\`\`python
class PersistentAgent:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        self.version = get_latest_version(agent_id)
        self.state = load_state(agent_id)

    def save_state(self):
        db.save({
            "agent_id": self.agent_id,
            "state": self.state,
            "version": self.version,
            "timestamp": now()
        })

    def process_message(self, message):
        response = self.agent.handle(message)

        # Update state
        self.state["messages"].append(message)
        self.state["messages"].append(response)

        # Save immediately
        self.save_state()

        return response
\`\`\`

## Audit Trail

Every decision is traceable:

\`\`\`
Decision: Process $50 refund
Agent Version: 1.2
User: john@example.com
Timestamp: 2024-01-20 15:30:00
Reasoning: "Item within 30-day window, policy allows full refund"
Result: Refund processed
\`\`\``,
    exercises: [
      "Design: Database schema for agent state",
      "Code: Save and load agent state",
      "Problem: Need to rollback agent version - how?",
      "Code: Implement audit trail logging",
      "Trace: Follow state changes through conversation",
      "MCQ: What triggers a state save?",
      "Design: Versioning strategy for agent updates",
      "Implement: Rollback function for agent versions"
    ]
  },
  {
    order: 14,
    title: "Cost Optimization for Agentic Systems",
    theory: `# Cost Optimization for Agentic Systems

## Where Cost Comes From

\`\`\`
API Calls: $X per 1000 tokens
Multi-turn Reasoning: High token count
Long Conversations: More context = more tokens
Failed Attempts: Retry costs money
\`\`\`

## Token Counting

1 token ≈ 4 characters (rough estimate)

\`\`\`
"What's the weather?" = ~5 tokens
Full customer service conversation = ~5000 tokens
\`\`\`

## Cost Reduction Strategies

### 1. Token Minimization

\`\`\`python
# Bad: Provide full database
context = fetch_all_customers()  # 50K tokens!

# Good: Provide only relevant data
context = search_customers(query, limit=5)  # 500 tokens
\`\`\`

### 2. Caching

\`\`\`python
@cache
def get_faq(question):
    # Cache FAQ answers
    # Repeated questions cost 0 tokens
    return search_faq(question)
\`\`\`

### 3. Routing

\`\`\`python
if is_simple_question(question):
    # Direct answer (no agent loop)
    return template_response(question)
else:
    # Full agent reasoning
    return agent_response(question)
\`\`\`

### 4. Batch Processing

\`\`\`python
# Bad: Process 100 requests individually
for request in requests:
    process(request)  # 100 API calls

# Good: Process in batches
for batch in batch(requests, size=10):
    process_batch(batch)  # 10 API calls
\`\`\`

## Cost Tracking

\`\`\`python
def track_cost(function):
    def wrapper(*args, **kwargs):
        start_tokens = get_token_count()
        result = function(*args, **kwargs)
        end_tokens = get_token_count()

        tokens_used = end_tokens - start_tokens
        cost = tokens_used / 1000 * COST_PER_1K_TOKENS

        log_cost({
            "function": function.__name__,
            "tokens": tokens_used,
            "cost": cost
        })

        return result
    return wrapper
\`\`\`

## Real-World Optimization

Before:
- 5000 tokens per request
- \$0.01 per request
- 10k requests/day = \$100/day

After optimization:
- 1000 tokens per request (cache + routing)
- \$0.002 per request
- 10k requests/day = \$20/day

**80% cost reduction** ✓`,
    exercises: [
      "Calculate: Cost of 1000 requests at current efficiency",
      "Code: Implement token counter",
      "Analyze: Identify high-cost operations",
      "Strategy: Design cost optimization for chatbot",
      "Code: Implement caching decorator",
      "Problem: Agent is too expensive - 5 optimization ideas",
      "Cost tracking: Log costs per operation",
      "Compare: Cost before vs after optimization"
    ]
  },
  {
    order: 15,
    title: "Retrieval-Augmented Generation (RAG) in Agents",
    theory: `# Retrieval-Augmented Generation (RAG) in Agents

## The Problem

Agent has to reason from knowledge in training data.
Can't know about:
- New information (recent events)
- Internal company data (customer history)
- Real-time data (stock prices, weather)

## Solution: RAG

Retrieve relevant information → Feed to LLM → Generate response

\`\`\`
User Question
    ↓
Search Knowledge Base
    ↓
Retrieve Relevant Docs
    ↓
Feed to LLM with Context
    ↓
LLM Generates Better Answer
\`\`\`

## Implementation

\`\`\`python
def rag_agent(question):
    # Step 1: Retrieve relevant documents
    docs = knowledge_base.search(question, top_k=5)

    # Step 2: Format as context
    context = format_docs(docs)

    # Step 3: Augment prompt with context
    prompt = f"""
    Context:
    {context}

    Question: {question}

    Answer based on the context above.
    """

    # Step 4: Get answer from LLM
    answer = llm.generate(prompt)

    return answer
\`\`\`

## Knowledge Base Types

### 1. Document Store (Full Text Search)
- FAQ documents
- Help articles
- Policies

### 2. Vector Store (Semantic Search)
- Convert docs to embeddings
- Find "similar" documents
- Better than keyword search

### 3. Graph Store (Relationship Query)
- Entity relationships
- Knowledge graphs
- "What products does customer X like?"

## Real-World Example

Customer Support Agent:

\`\`\`
Customer: "I want to return my phone"

RAG Process:
1. Search knowledge base for "return policy"
   → Find: Return Policy (30-day window)
   → Find: Return Process (4 steps)
   → Find: Refund Timeline (5-7 days)

2. Augment LLM context:
   "Return policy allows 30-day returns.
    Process: 1. Verify order, 2. Create return label,
    3. Ship back, 4. Issue refund after inspection"

3. LLM responds with accurate, grounded answer:
   "Sure! We accept returns within 30 days.
    Here's the process..."
\`\`\`

## Comparison

Without RAG: Hallucination risk, outdated info
With RAG: Grounded, current, accurate answers`,
    exercises: [
      "Design: RAG system for customer support",
      "Code: Implement document search and retrieval",
      "Code: Convert documents to vector embeddings",
      "Problem: Agent gave outdated answer - add RAG",
      "Compare: Answers with vs without RAG context",
      "Code: Format retrieved docs as context",
      "Benchmark: Accuracy with vs without RAG",
      "Implement: Multi-source RAG (documents + APIs)"
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

    // Get the Agentic AI course and Module 1
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
      .eq("order_index", 1)
      .single();

    if (moduleRes.error) {
      throw new Error(`Module not found: ${moduleRes.error.message}`);
    }

    const moduleId = moduleRes.data.id;

    // Get all lessons in order
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
    for (let i = 0; i < lessonsRes.data.length && i < CORE_LESSONS.length; i++) {
      const lesson = lessonsRes.data[i];
      const lessonData = CORE_LESSONS[i];

      // Update lesson with full content
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
      message: "All 15 Core Fundamentals lessons created with full content!",
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
