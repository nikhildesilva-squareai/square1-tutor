import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-autonomous-decision-making
 * Seeds Slice #33: Autonomous Decision-Making Lessons 16-25 (80 exercises)
 */

interface Lesson {
  order: number;
  title: string;
  theory: string;
  exercises: string[];
}

const DECISION_MAKING_LESSONS: Lesson[] = [
  {
    order: 16,
    title: "Function Calling and Tool Selection",
    theory: `# Function Calling and Tool Selection

## What is Function Calling?

Instead of the LLM executing tools directly, it **decides which tools to call** and the agent executes them.

\`\`\`
LLM thinks: "I need to check the weather"
LLM outputs: "Call get_weather(city='NYC')"
Agent executes: get_weather('NYC') → Returns result
LLM sees result: "The weather is sunny"
\`\`\`

## Why This Matters

1. **Safety**: LLM can't execute arbitrary code
2. **Accuracy**: Agent verifies tool exists before calling
3. **Auditability**: Can log exactly which tools were called
4. **Control**: Can restrict which tools are available

## Tool Definition

Each tool needs clear definition:

\`\`\`python
{
    "name": "get_weather",
    "description": "Get current weather for a city",
    "parameters": {
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "City name"},
            "units": {"type": "string", "enum": ["C", "F"]}
        },
        "required": ["city"]
    }
}
\`\`\`

## Tool Selection Strategy

**Simple**: One tool obviously fits
\`\`\`
"What's the weather?" → Use get_weather
\`\`\`

**Multiple tools**: LLM must choose best one
\`\`\`
"Tell me about Nike" → Search Wikipedia? Google? News? Company API?
Agent gives options: LLM chooses best source
\`\`\`

**No tools fit**: Escalate or respond with knowledge
\`\`\`
"What's your favorite color?" → No tools needed, respond directly
\`\`\`

## Handling Tool Errors

What if tool call fails?

\`\`\`python
try:
    result = get_weather("NYC")
except NotFound:
    return {"error": "City not found", "suggestion": "Try a different city"}
\`\`\`

LLM sees error and can:
- Retry with different parameters
- Try a different tool
- Escalate to human

## Real-World Example

E-commerce agent:

\`\`\`
Customer: "Show me red shoes under \$100"

Tools available:
1. search_inventory(color, category, price_max)
2. get_trending()
3. check_discount()

LLM chooses: search_inventory(color="red", category="shoes", price_max=100)
Returns: 5 matching shoes
LLM: "Found 5 red shoes under \$100..."
\`\`\``,
    exercises: [
      "Design: Write tool definitions for a travel booking agent",
      "Code: Implement tool executor with validation",
      "Problem: Agent chose wrong tool - trace why",
      "MCQ: When should agent ask user to clarify vs just try?",
      "Analyze: 3 customer queries - which tools to call?",
      "Code: Error handling for failed tool calls",
      "Design: How to tell LLM about new tools?",
      "Trace: Follow tool selection through multi-tool scenario"
    ]
  },
  {
    order: 17,
    title: "Handling Uncertainty and Asking for Clarification",
    theory: `# Handling Uncertainty and Asking for Clarification

## The Problem

Agent encounters ambiguous or incomplete information:

\`\`\`
User: "Book me a flight"
Missing info: Origin? Destination? When? How many passengers?

Agent options:
A) Guess (bad - wrong flight booked)
B) Ask for clarification (good)
C) Use defaults (risky)
\`\`\`

## Detecting Uncertainty

LLM should recognize when it doesn't have enough info:

\`\`\`python
uncertainty_prompt = """
Before executing, check:
- Do you have all required information?
- Are there any ambiguities?
- Could the user mean something else?

If uncertain, ask for clarification instead of guessing.
"""
\`\`\`

## Asking Clearly

Bad clarification:
- "What?"
- "I need more info"

Good clarification:
- "I'd like to book a flight. To help better, could you tell me: Where are you flying from?"
- "For the 'budget', do you mean monthly or annual?"
- "I found 3 restaurants matching 'Italian'. Which area of the city?"

## Confidence Scoring

Track how confident agent is:

\`\`\`python
{
    "intent": "book_flight",
    "confidence": 0.95,
    "missing_fields": ["destination"],
    "ambiguous_fields": ["budget"],
    "action": "ask_for_clarification"
}
\`\`\`

## Decision Tree

\`\`\`
Is information complete?
  ├─ Yes (confidence > 0.9) → Execute
  ├─ Mostly (confidence 0.7-0.9) → Ask about missing fields
  └─ No (confidence < 0.7) → Ask user to rephrase or provide more context
\`\`\`

## Real Example

Support agent:

\`\`\`
User: "I want a refund"

Agent detects uncertainty:
- Which order? (missing)
- Refund reason? (missing)
- Full or partial? (missing)

Agent asks:
"I can help with your refund. Could you provide:
1. Your order number or date of purchase?
2. What's the reason for the refund?

This helps me process it faster."
\`\`\`

## Never Assume

❌ Bad: Process refund for "most recent order"
✓ Good: "I found 3 orders in the last month. Which one?"`,
    exercises: [
      "Write: Clarification prompts for 3 scenarios",
      "Code: Implement confidence scoring",
      "Problem: Agent guessed wrong - how to fix?",
      "MCQ: Confidence threshold for action vs clarify?",
      "Detect: Which info is missing in user requests?",
      "Code: Decision tree for uncertainty handling",
      "Design: Clarification flow for complex booking",
      "Trace: Follow agent asking for clarification"
    ]
  },
  {
    order: 18,
    title: "Agent Personas and Role-Playing",
    theory: `# Agent Personas and Role-Playing

## What is a Persona?

A consistent identity that shapes how the agent behaves.

\`\`\`
Persona: "You are a friendly but professional support agent"

Impact on behavior:
- Tone: Warm but professional
- Patience: High (explains things clearly)
- Humor: Light, appropriate
- Boundaries: Respectful
\`\`\`

## Why Personas Matter

Same request, different personas:

**Professional banker persona:**
"Your account has been overdrawn. Remedial action is required."

**Friendly support persona:**
"Looks like your balance dipped below zero. No worries - let's get that sorted out!"

Both convey same info, but tone shapes user experience.

## Defining a Persona

\`\`\`python
persona = {
    "role": "Technical Support Engineer",
    "expertise": "Cloud infrastructure, AWS, debugging",
    "tone": "Patient, methodical, no jargon without explanation",
    "boundaries": "Won't help with billing/sales - escalate",
    "values": "User success, root-cause analysis",
    "examples": [
        "Good: Let me walk through debugging this error step-by-step",
        "Bad: Your code is broken. Fix it."
    ]
}
\`\`\`

## Encoding in System Prompt

\`\`\`
You are Maya, a customer success manager with 10 years
of SaaS experience. You're empathetic, detail-oriented,
and committed to helping customers succeed.

Your communication style:
- Warm and professional
- Patient with technical and non-technical customers
- You ask clarifying questions before offering solutions
- You celebrate customer wins

You handle: Account questions, onboarding help, best practices
You escalate to: Billing, technical bugs, feature requests
\`\`\`

## Consistency

Persona must remain consistent:

❌ First message: "Hey there! Happy to help 😊"
❌ Second message: "INSUFFICIENT DATA FOR MEANINGFUL ANSWER"

✓ Consistent tone across all messages

## Testing Personas

Same request, different personas - do responses feel authentic?

Request: "How do I optimize my queries?"

**DBA persona response:**
"Query optimization depends on several factors. Let me walk you through indexing strategy, execution plans, and common pitfalls..."

**Startup founder persona response:**
"Quick wins first: add indexes to your hot tables, cache frequently-accessed data. Then we can dig into the gnarly stuff."

Both correct, different emphasis based on persona.`,
    exercises: [
      "Design: Create 3 different support agent personas",
      "Write: System prompt for a technical mentor",
      "Compare: Same request with 3 different personas",
      "Code: Persona configuration structure",
      "Problem: Persona inconsistency - detect and fix",
      "Role-play: Support agent in 3 scenarios",
      "MCQ: Which persona for technical vs non-technical users?",
      "Analyze: How does persona affect user satisfaction?"
    ]
  },
  {
    order: 19,
    title: "Context-Aware Behavior Adaptation",
    theory: `# Context-Aware Behavior Adaptation

## What is Context Awareness?

Agent adapts its behavior based on:
- **User**: Is this an expert or novice?
- **Situation**: Is this urgent or routine?
- **History**: Have we talked before?
- **Goal**: What is the user trying to achieve?

\`\`\`
Same question from 2 different users:

Novice: "How do I query my database?"
Agent: "Let me walk through the basics with an example..."

Expert: "How do I query my database?"
Agent: "For complex joins, consider materialized views or..."
\`\`\`

## Context Signals

\`\`\`python
context = {
    "user_expertise": "intermediate",
    "is_urgent": True,
    "conversation_history_length": 5,
    "previous_topics": ["authentication", "deployment"],
    "time_of_day": "evening",
    "user_goal": "deploy_to_production"
}
\`\`\`

## Adapting Responses

**Expertise level:**
- Novice: Explain basics, provide examples
- Expert: Skip basics, focus on advanced topics

**Urgency:**
- Urgent: Direct answer, short explanation
- Routine: More detailed, educational

**History:**
- New user: Introduce context
- Returning: Reference past conversations

**Goal:**
- Learning: Teach
- Problem-solving: Solve then teach
- Quick answer: Direct response

## Implementation

\`\`\`python
def adapt_response(user_context, base_response):
    if user_context.expertise == "novice":
        add_examples(base_response)

    if user_context.is_urgent:
        shorten_explanation(base_response)

    if user_context.has_history:
        reference_previous(base_response)

    return base_response
\`\`\`

## Real Examples

**E-commerce scenario:**

Returning customer: "I want to reorder"
Agent: "Great! Your last order (3 books on Python) was \$45.99. Reorder?"

New customer: "I want to reorder"
Agent: "I'd be happy to help you place a new order. What would you like?"

**Support scenario:**

Frustrated user (angry): "Why isn't this working?!"
Agent: "I understand this is frustrating. Let's fix it fast. Can you..."

Curious user: "Why doesn't this work?"
Agent: "Good question! Here's what's happening under the hood..."

## Detecting Context

\`\`\`python
def detect_context(user_input, history):
    expertise = estimate_expertise(history)
    tone = detect_tone(user_input)
    urgency = detect_urgency(user_input, time_since_last_interaction)
    is_returning = len(history) > 0

    return Context(expertise, tone, urgency, is_returning)
\`\`\``,
    exercises: [
      "Design: Context model for a customer support agent",
      "Code: Context detection from user input",
      "Adapt: Rewrite 3 responses for different expertise levels",
      "Problem: Wrong context detected - debug",
      "MCQ: What context signals matter most?",
      "Trace: Show how context shapes agent behavior",
      "Compare: Same answer, adapted for 3 contexts",
      "Implement: Behavior adaptation algorithm"
    ]
  },
  {
    order: 20,
    title: "Reward Modeling for Agents",
    theory: `# Reward Modeling for Agents

## What is Reward?

A signal that tells agent: "This was good" or "This was bad"

\`\`\`
Good reward: User satisfied with answer → +1
Bad reward: User had to escalate to human → -1
Neutral: User read answer but didn't use it → 0
\`\`\`

## Simple Rewards vs Complex

**Simple** (easy to measure):
- User clicked "thumbs up" → +1
- User clicked "thumbs down" → -1

**Complex** (harder but more meaningful):
- User solved their problem
- User learned something
- User came back later (loyalty)

## Reward for Different Goals

**Goal: Solve customer problems**
\`\`\`
+1: Problem solved
-1: Problem unsolved, escalated
0: Customer didn't try solution
\`\`\`

**Goal: Teach users**
\`\`\`
+1: User asked follow-up questions (engaged)
-1: User confused or didn't engage
0: User read but no follow-up
\`\`\`

**Goal: Minimize support cost**
\`\`\`
+1: Self-service resolution, no escalation
-1: Escalated to expensive human support
0: Partial resolution, follow-up needed
\`\`\`

## Implementing Rewards

\`\`\`python
def calculate_reward(action, outcome):
    if outcome == "success":
        return 1.0
    elif outcome == "failure":
        return -1.0
    elif outcome == "partial":
        return 0.5
    else:
        return 0.0

# Use reward to improve
for attempt in attempts:
    reward = calculate_reward(attempt.action, attempt.outcome)
    if reward > threshold:
        store_as_good_pattern(attempt)
    else:
        avoid_in_future(attempt)
\`\`\`

## Multi-Objective Rewards

Real agents optimize for multiple things:

\`\`\`python
total_reward = (
    0.5 * problem_solved +
    0.3 * user_satisfied +
    0.2 * efficiency
)
\`\`\`

## Reward Bias

Watch out for:

**Wrong signal:**
- Measuring clicks instead of satisfaction
- Measuring response time instead of correctness
- Measuring length of response instead of helpfulness

**Right signal:**
- Did user achieve their goal?
- Would they recommend this to others?
- Did they need to escalate?

## Learning from Rewards

\`\`\`
High reward pattern:
  Input: "How do I...?"
  Response style: Step-by-step with examples
  Outcome: User succeeded → +1

Low reward pattern:
  Input: "How do I...?"
  Response style: Just the answer with no explanation
  Outcome: User confused → -1

Agent learns: Detailed explanations work better
\`\`\``,
    exercises: [
      "Design: Reward function for 3 different agents",
      "Code: Implement multi-objective reward calculation",
      "Analyze: What reward signals are we measuring?",
      "MCQ: Which signal better measures success?",
      "Problem: Reward is misaligned with goal - fix",
      "Trace: Show how agent optimizes for reward",
      "Compare: Simple vs complex rewards - tradeoffs?",
      "Implement: Reward-based learning loop"
    ]
  },
  {
    order: 21,
    title: "Real-Time Information Processing",
    theory: `# Real-Time Information Processing

## The Challenge

Agent needs current info, but LLM training data is old.

\`\`\`
User: "What's the stock price of AAPL?"
LLM thinks: "Based on my training data from April 2024..."
User: "That's outdated!"
\`\`\`

## Solution: Real-Time Data Streams

Connect agent to live data sources:

\`\`\`
Real-time sources:
- Stock prices (APIs)
- Weather (Weather API)
- News (News API)
- Traffic (Google Maps)
- Sports scores (Sports APIs)
- Social media trends (Twitter/X API)
\`\`\`

## Processing Pipeline

\`\`\`
User question → Detect what real-time data needed
              → Fetch from API
              → Pass to LLM with fresh data
              → LLM responds with current info
\`\`\`

## Example: Stock Agent

\`\`\`
User: "Should I buy AAPL?"

Agent:
1. Detects: Need current stock info
2. Fetches: Price, change, volume from API
3. Passes to LLM: "Current AAPL: \$180, up 2.5%"
4. LLM responds: "Based on current metrics..."
\`\`\`

## Handling Data Delays

Real-time data has latency:

\`\`\`python
# Stock price API might be 15 minutes delayed
data = fetch_stock_price("AAPL")
if data.age > 30_minutes:
    warn_user("Data is delayed")

# Trade with caution
result = analyze(data)
result.confidence = 0.7  # Lower confidence = delayed data
\`\`\`

## Multi-Source Real-Time Data

\`\`\`
News agent combining:
- News API (headlines)
- Twitter API (trending)
- Company earnings (Yahoo Finance)
- Analyst ratings (seeking alpha)

All fetched and merged in <2 seconds
\`\`\`

## Error Handling

\`\`\`
What if API is down?
- Cached data fallback
- Error message to user
- Try alternative source

Example:
- Primary: Weather API
- Fallback: Another weather service
- Last resort: "I can't access live weather right now"
\`\`\`

## Rate Limiting

\`\`\`python
# Can't call stock API for every message
# Solution: Cache and reuse

cache = {
    "AAPL": {
        "price": 180.50,
        "timestamp": now,
        "ttl": 60_seconds
    }
}

if cache["AAPL"].is_fresh():
    use_cached = True
else:
    fetch_new_data()
\`\`\``,
    exercises: [
      "Design: Real-time data pipeline for news agent",
      "Code: Fetch and cache stock data",
      "Problem: API is down - handle gracefully",
      "MCQ: How fresh does data need to be?",
      "Implement: Multi-source data merger",
      "Trace: Follow real-time data flow",
      "Benchmark: Speed of real-time updates",
      "Analyze: Which APIs to integrate?"
    ]
  },
  {
    order: 22,
    title: "Agent Introspection and Explainability",
    theory: `# Agent Introspection and Explainability

## The Problem

Agent makes a decision, but why?

\`\`\`
Agent: "I'm rejecting your loan application"
User: "Why???"
Agent: "Uh... neural networks are complex"
\`\`\`

## Explainability

Agent should explain its reasoning:

\`\`\`
Agent: "I'm rejecting your loan application because:
1. Your credit score is below our threshold (you: 620, threshold: 650)
2. Your debt-to-income ratio is too high (you: 45%, acceptable: 40%)

You could reapply if:
- You pay down \$X in debt, OR
- You wait 6 months to improve credit score"
\`\`\`

## Introspection Prompt

\`\`\`python
introspect_prompt = """
After making a decision, explain:
1. What information did you consider?
2. Why did you weight it that way?
3. What assumptions did you make?
4. What could make you change your mind?

Be concise but complete.
"""
\`\`\`

## Levels of Explanation

**Level 1: What** (weakest)
"I rejected your application"

**Level 2: Why**
"Your credit score is too low"

**Level 3: How** (strongest)
"Your credit score of 620 is below our 650 threshold. Here's why this matters: [explanation]. To approve you, you'd need to [specific actions]"

## Tracing Reasoning

\`\`\`python
decision = {
    "action": "approve_loan",
    "confidence": 0.95,
    "reasoning_path": [
        "User income: \$150K (strong positive)",
        "Credit score: 750 (strong positive)",
        "Employment history: 5 years (positive)",
        "Debt-to-income: 25% (positive)"
    ],
    "decision_factors": {
        "income": {"weight": 0.4, "signal": "positive"},
        "credit": {"weight": 0.4, "signal": "positive"},
        "stability": {"weight": 0.2, "signal": "positive"}
    }
}
\`\`\`

## Building Trust

Users trust explainable agents:

\`\`\`
❌ Black box: "System says no"
✓ Explainable: "You need to pay down debt, then reapply"

Users can then:
- Understand the requirement
- Take action to improve
- Know when to reapply
\`\`\`

## Detecting Unexplainable Decisions

\`\`\`python
if confidence < 0.7:
    escalate_to_human("Decision too uncertain to explain confidently")
\`\`\``,
    exercises: [
      "Write: Explanation for agent decision",
      "Code: Build introspection system",
      "Problem: Agent can't explain itself - debug",
      "MCQ: Level of detail users need?",
      "Implement: Reasoning trace logging",
      "Analyze: Is this decision explainable?",
      "Compare: 3 explanation styles",
      "Design: Explainability for complex decision"
    ]
  },
  {
    order: 23,
    title: "Learning from Human Feedback",
    theory: `# Learning from Human Feedback

## Feedback Loop

\`\`\`
Agent takes action
    ↓
Human provides feedback
    ↓
Agent learns from feedback
    ↓
Agent improves behavior
\`\`\`

## Types of Feedback

**Explicit** (user tells us directly):
- "That answer was wrong" → thumbs down
- "That was helpful" → thumbs up
- "Actually, I meant X" → correction

**Implicit** (we infer from behavior):
- User didn't use the answer → unhelpful
- User asked follow-up → unclear
- User came back later → trust built

## Implementing Feedback

\`\`\`python
feedback = {
    "interaction_id": "conv_123",
    "user_rating": 5,  # 1-5 stars
    "comment": "Exactly what I needed!",
    "action_taken": "recommended_book",
    "outcome": "user_purchased"
}

# Store for learning
store_feedback(feedback)

# Analyze patterns
if feedback.rating >= 4 and recommendation_similar_to(past_successful):
    reinforce_this_pattern()
\`\`\`

## Learning Strategies

**Pattern matching:**
- User likes detailed explanations for topic X
- So future X questions get more detail

**Personalization:**
- This user prefers concise answers
- Next time: shorter responses

**Generalization:**
- Many users struggled with explanation Y
- Improve explanation system-wide

## Handling Negative Feedback

\`\`\`
❌ Ignore it
✓ Learn from it

User: "Your answer was wrong"
Agent should:
1. Acknowledge: "I made an error"
2. Understand: "Here's what went wrong"
3. Prevent: "I'll be more careful about X"
\`\`\`

## Privacy in Feedback

\`\`\`
When storing feedback:
- Only store what's needed to learn
- Don't store sensitive details
- Anonymize where possible
\`\`\`

## Measuring Improvement

\`\`\`python
def measure_improvement():
    old_satisfaction = get_average_rating(before_change)
    new_satisfaction = get_average_rating(after_change)

    if new_satisfaction > old_satisfaction:
        improvement_successful()
    else:
        revert_change()
\`\`\``,
    exercises: [
      "Design: Feedback collection system",
      "Code: Store and analyze feedback",
      "Problem: Negative feedback - how to use it?",
      "MCQ: Explicit vs implicit feedback?",
      "Implement: Learning from feedback loop",
      "Trace: Show agent improving over time",
      "Compare: Before and after learning",
      "Build: Personalization from user feedback"
    ]
  },
  {
    order: 24,
    title: "Agent Constraints and Resource Limits",
    theory: `# Agent Constraints and Resource Limits

## Why Constraints?

Without them, agents can:
- Spend unlimited budget
- Process forever (infinite loops)
- Access restricted data
- Break policies

## Types of Constraints

**Financial:**
- Max API spend per conversation
- Max tokens per request
- Max pricing per output

**Temporal:**
- Max time per decision
- Timeout after N seconds
- Rate limiting (requests/minute)

**Resource:**
- Max memory usage
- Max API calls
- Max database queries

**Policy:**
- Can't access PII
- Can't promise things agent can't deliver
- Can't escalate without reason

## Implementing Constraints

\`\`\`python
agent_config = {
    "max_token_budget": 10000,
    "max_api_calls": 20,
    "max_time_seconds": 30,
    "max_cost_dollars": 1.00,
    "accessible_tools": ["search", "calculate", "lookup"],
    "forbidden_actions": ["delete", "modify_user_data"]
}
\`\`\`

## Handling Constraint Violation

\`\`\`
Agent exceeds token budget
    ↓
Agent detects limit
    ↓
Agent says: "I'm running out of tokens. Here's my best answer so far."
    ↓
Agent stops and returns
\`\`\`

## Example: Cost Limit

\`\`\`python
spent = 0
budget = 1.00

for action in plan:
    cost = estimate_cost(action)
    if spent + cost > budget:
        return "Plan too expensive. Here's what I can do: [partial plan]"

    execute(action)
    spent += cost
\`\`\`

## Graceful Degradation

When hitting limits, agent should:
- Still provide partial answer
- Explain the constraint
- Suggest alternatives

\`\`\`
User: "Summarize all 10,000 documents"
Agent: "That would exceed my token budget. I can:
1. Summarize the top 100 by relevance
2. Sample 10% (1,000 docs)
3. Focus on one category

Which would help?"
\`\`\`

## Monitoring Constraints

\`\`\`python
def monitor():
    tokens_used = 4500
    tokens_budget = 10000

    if tokens_used > tokens_budget * 0.8:
        warn("Approaching token limit")

    if tokens_used > tokens_budget:
        error("Token limit exceeded")
\`\`\``,
    exercises: [
      "Design: Constraint model for 3 agents",
      "Code: Implement resource limit checker",
      "Problem: Agent exceeds budget - handle",
      "MCQ: Which constraints most important?",
      "Trace: Agent hitting multiple limits",
      "Implement: Graceful degradation",
      "Compare: Hard vs soft constraints",
      "Analyze: What constraints does YOUR agent need?"
    ]
  },
  {
    order: 25,
    title: "Decision-Making Under Uncertainty",
    theory: `# Decision-Making Under Uncertainty

## The Reality

Agents rarely have perfect information.

\`\`\`
Uncertain data:
- Incomplete (missing fields)
- Conflicting (sources disagree)
- Probabilistic (weather prediction)
- Changing (stock price)
\`\`\`

## Confidence Scoring

Track how confident agent is:

\`\`\`python
decision = {
    "recommendation": "Approve loan",
    "confidence": 0.92,  # 92% sure
    "uncertainty_sources": [
        "Employment history missing (10 days of data)",
        "Credit score updated yesterday (might change)"
    ]
}
\`\`\`

## Handling Low Confidence

**High confidence (>0.9):**
- Make decision autonomously
- Proceed with confidence

**Medium confidence (0.7-0.9):**
- Make decision but flag uncertainty
- Suggest verification steps

**Low confidence (<0.7):**
- Escalate to human
- Ask for more information

## Decision Under Risk

\`\`\`
Should I approve this loan?

Best case: Good customer, earns \$200K, pays back
Worst case: Fraudster, defaults, lose \$50K

Decision depends on:
- Probability of each scenario
- Cost of being wrong
\`\`\`

## Bayesian Thinking

Use prior knowledge + new evidence:

\`\`\`python
prior_probability = 0.1  # 10% of apps are fraudulent
new_evidence = "Uses VPN"  # Suspicious
likelihood = 0.8  # 80% of fraud uses VPN

posterior = bayesian_update(prior, likelihood, evidence)
# Result: 30% chance of fraud (higher than 10%)
\`\`\`

## Scenario Planning

When uncertain, explore multiple futures:

\`\`\`
Best case: Customer pays back on time
Plan A: Let's approve

Worst case: Customer defaults
Plan B: We lose \$50K

Most likely: Customer pays back late
Plan C: Chase payment, add fee

Unlikely: Customer disputes charge
Plan D: Escalate to legal

Decision: Which risk can we tolerate?
\`\`\`

## Asking for More Information

\`\`\`
Agent: "I'm not confident enough to decide alone.
Could you clarify:
1. Your current employment status?
2. How stable is your income?
3. Have you had past loan defaults?

This info would help me make a better decision."
\`\`\`

## Avoiding Common Mistakes

\`\`\`
❌ Pretend certainty when uncertain
✓ Communicate uncertainty clearly

❌ Ignore unlikely but catastrophic scenarios
✓ Account for tail risks

❌ Always choose safe option
✓ Balance risk with opportunity
\`\`\``,
    exercises: [
      "Score: Assign confidence to 5 decisions",
      "Code: Implement confidence-based routing",
      "Problem: Low confidence situation - handle",
      "MCQ: When to escalate vs decide?",
      "Bayesian: Update prior with new evidence",
      "Scenarios: Plan for multiple futures",
      "Trace: Decision-making under uncertainty",
      "Analyze: What makes you uncertain?"
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

    // Get the Agentic AI course and Module 2
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
      .eq("order_index", 2)
      .single();

    if (moduleRes.error) {
      throw new Error(`Module 2 not found: ${moduleRes.error.message}`);
    }

    const moduleId = moduleRes.data.id;

    // Get all lessons in Module 2
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
    for (let i = 0; i < lessonsRes.data.length && i < DECISION_MAKING_LESSONS.length; i++) {
      const lesson = lessonsRes.data[i];
      const lessonData = DECISION_MAKING_LESSONS[i];

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
      message: "Slice #33 complete: 10 Decision-Making lessons + 80 exercises!",
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
