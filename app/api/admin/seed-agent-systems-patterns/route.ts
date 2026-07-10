import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/seed-agent-systems-patterns
 * Seeds Slice #37: Agent Systems & Patterns Lessons 26-35 (80 exercises)
 */

interface Lesson {
  order: number;
  title: string;
  theory: string;
  exercises: string[];
}

const AGENT_SYSTEMS_LESSONS: Lesson[] = [
  {
    order: 26,
    title: "Persistence and State Management",
    theory: `# Persistence and State Management

## The Problem

Agent runs, does work, then... what? Is the state lost?

\`\`\`
Without persistence:
  Agent starts conversation
  Agent learns user preferences
  Agent stops
  Next time: "Who are you?"
  User frustrated

With persistence:
  Agent saves state: user_id, preferences, history
  Agent stops
  Next time: Loads state, remembers everything
\`\`\`

## What to Persist?

\`\`\`python
state = {
    "user_id": "user_123",
    "conversation_history": [...],
    "learned_preferences": {"likes_short_responses": True},
    "context": {"current_task": "planning vacation"},
    "tokens_spent": 1234,
    "interactions_count": 42,
    "last_updated": "2024-01-15T10:32:45Z"
}
\`\`\`

## Storage Options

**In-Memory (Fast, Lost on Restart)**
\`\`\`python
agent_state = {}  # Dies when server stops
\`\`\`

**File System (Persistent, Slow)**
\`\`\`python
with open(f"agents/{agent_id}.json", "w") as f:
    json.dump(state, f)  # Survives restart, slower
\`\`\`

**Database (Persistent, Fast)**
\`\`\`python
db.update("agent_states", state)  # Both persistent and fast
\`\`\`

**Cache + Database (Best)**
\`\`\`python
# Hot data in cache (fast access)
cache.set(agent_id, state, ttl=3600)

# Periodically persist to database
every_10_minutes:
    db.save(agent_id, state)
\`\`\`

## Snapshots

Save checkpoints periodically:

\`\`\`python
@background_job(interval=300_seconds)  # Every 5 minutes
def snapshot_agent_state():
    for agent in active_agents:
        snapshot = {
            "agent_id": agent.id,
            "state": agent.get_state(),
            "timestamp": now(),
            "version": agent.version
        }
        db.insert("snapshots", snapshot)
\`\`\`

Later: Can restore to any snapshot

## Versioning

Track changes over time:

\`\`\`python
versions = [
    {"v": 1, "preferences": {...}, "timestamp": "10:00"},
    {"v": 2, "preferences": {...}, "timestamp": "10:05"},  # Updated
    {"v": 3, "preferences": {...}, "timestamp": "10:10"}   # Updated again
]

# Rollback: "Revert to version 2"
\`\`\`

## Memory Efficiency

Don't save everything forever:

\`\`\`python
def cleanup_old_state():
    # Keep conversation history, but summarize
    if len(conversation) > 1000:
        summary = summarize_conversation(conversation)
        old_messages = conversation[:-50]  # Keep last 50
        state["conversation_summary"] = summary
        state["conversation_history"] = old_messages
\`\`\``,
    exercises: [
      "Design: What state should your agent persist?",
      "Code: Implement file-based state persistence",
      "Database: Store agent state in database",
      "Snapshots: Create and restore from snapshot",
      "Problem: Agent state corrupted - recover",
      "Versioning: Implement version history",
      "MCQ: When to persist vs keep in memory?",
      "Scale: Persist state for 1M agents efficiently"
    ]
  },
  {
    order: 27,
    title: "Caching Strategies",
    theory: `# Caching Strategies

## Why Cache?

Same requests happen repeatedly:

\`\`\`
User 1: "What's the weather in NYC?"
  → Call weather API (\$0.001)

User 2: "What's the weather in NYC?"
  → Call weather API again (\$0.001)

User 3: "What's the weather in NYC?"
  → Call weather API again (\$0.001)

Total: \$0.003 for same answer 3 times
\`\`\`

**With caching:**
\`\`\`
User 1: "What's the weather in NYC?"
  → Call API (\$0.001), cache result

User 2: "What's the weather in NYC?"
  → Return cached result (free!)

User 3: "What's the weather in NYC?"
  → Return cached result (free!)

Total: \$0.001 for same answer 3 times
\`\`\`

## Cache Types

**Exact Match Cache**
\`\`\`python
cache = {
    "What's the weather in NYC?": "Sunny, 72°F"
}

# Only helps if exact same question asked
\`\`\`

**Semantic Cache**
\`\`\`python
# "What's the weather in NYC?"
# "NYC weather?"
# "How's the weather in New York?"
# All should hit same cache

# Use embeddings to find similar queries
query_embedding = embed("NYC weather?")
similar = find_similar_cached_queries(query_embedding)
if similar and confidence > 0.9:
    return cached_result
\`\`\`

**LRU Cache (Least Recently Used)**
\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(x):
    # If called with x=5 before, returns cached result
    # If cache full (128 items), removes least recently used
    return x ** 2
\`\`\`

## Cache Invalidation

When to clear cache:

\`\`\`
❌ "Cache invalidation is one of the hardest problems in CS"

✓ Strategies:
  1. Time-based: Expire after 1 hour
  2. Event-based: Clear when data changes
  3. Manual: Admin clears cache
  4. LRU: Automatically evict old entries
\`\`\`

## Code

\`\`\`python
class SmartCache:
    def __init__(self, ttl=3600):
        self.cache = {}
        self.ttl = ttl
        self.timestamps = {}

    def get(self, key):
        if key not in self.cache:
            return None

        # Check if expired
        age = time.time() - self.timestamps[key]
        if age > self.ttl:
            del self.cache[key]
            return None

        return self.cache[key]

    def set(self, key, value):
        self.cache[key] = value
        self.timestamps[key] = time.time()

    def invalidate(self, key):
        if key in self.cache:
            del self.cache[key]
\`\`\``,
    exercises: [
      "Design: Caching strategy for your agent",
      "Implement: Simple dictionary cache",
      "Semantic: Build embedding-based cache",
      "LRU: Use @lru_cache decorator",
      "Invalidation: Time-based vs event-based",
      "Problem: Stale cache causing wrong answers",
      "Measure: Cache hit rate and savings",
      "Multi-tier: L1 (memory) + L2 (database) cache"
    ]
  },
  {
    order: 28,
    title: "Integration with External Systems",
    theory: `# Integration with External Systems

## Common Integrations

Agents rarely work in isolation. They integrate with:

\`\`\`
Databases: Query user data
APIs: Fetch real-time info (weather, stocks)
File systems: Read/write documents
Email: Send notifications
Payment processors: Process transactions
Analytics: Log events
Search engines: Find information
\`\`\`

## API Integration Pattern

\`\`\`python
def call_external_api(endpoint, params):
    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()  # Raise on 4xx/5xx
        return response.json()

    except requests.ConnectionError:
        log("API unreachable")
        return cached_fallback()

    except requests.Timeout:
        log("API timeout")
        return partial_response()

    except ValueError:  # JSON parse error
        log("API returned malformed JSON")
        raise
\`\`\`

## Retry Logic

APIs fail sometimes:

\`\`\`python
def call_with_retry(fn, max_retries=3):
    for attempt in range(max_retries):
        try:
            return fn()
        except TemporaryError:  # Network hiccup
            wait = 2 ** attempt  # 1s, 2s, 4s
            sleep(wait)

    raise FatalError("Max retries exceeded")
\`\`\`

## Rate Limiting

Don't overwhelm external APIs:

\`\`\`python
limiter = RateLimiter(calls_per_second=10)

for item in items:
    limiter.acquire()  # Wait if needed
    result = call_api(item)
\`\`\`

## Data Mapping

Convert between formats:

\`\`\`python
# External API returns:
{
    "temp_celsius": 22,
    "humidity_percent": 65
}

# Agent needs:
{
    "temperature": 22,
    "humidity": 0.65  # percentage → decimal
}

# Mapper:
def map_weather_api(response):
    return {
        "temperature": response["temp_celsius"],
        "humidity": response["humidity_percent"] / 100
    }
\`\`\`

## Error Handling

\`\`\`python
try:
    user_data = fetch_from_database(user_id)
except DatabaseError:
    user_data = fetch_from_cache(user_id)
except CacheError:
    user_data = default_user()  # Fallback

# Never crash, always have a fallback
\`\`\``,
    exercises: [
      "API: Integrate with REST API",
      "Database: Query database from agent",
      "Error handling: Retry + fallback",
      "Rate limiting: Don't overwhelm API",
      "Problem: API is down, agent should degrade",
      "Mapping: Convert between data formats",
      "Async: Call multiple APIs concurrently",
      "Testing: Mock external systems"
    ]
  },
  {
    order: 29,
    title: "Batch Processing and Streaming",
    theory: `# Batch Processing and Streaming

## Batch Processing

Process many items at once:

\`\`\`
Sequential (slow):
  For each of 1000 items:
    Process item → 1 second
    Total: 1000 seconds

Batch (fast):
  Process 100 items together → 10 seconds
  Repeat 10 times
  Total: 100 seconds
\`\`\`

## Batching Pattern

\`\`\`python
def process_batch(items):
    # Group items
    batches = [items[i:i+100] for i in range(0, len(items), 100)]

    results = []
    for batch in batches:
        # Process batch together (faster)
        batch_results = llm.process_together(batch)
        results.extend(batch_results)

    return results
\`\`\`

## Streaming

Process data as it arrives (don't wait for all):

\`\`\`
Without streaming:
  API call → Wait for full response → Process
  User waits entire time

With streaming:
  API call → Start receiving tokens → Show tokens to user
  User sees response forming in real-time
\`\`\`

## Code

\`\`\`python
# Without streaming (wait for all)
response = llm.complete(prompt)
print(response)  # Print all at once

# With streaming (show as it arrives)
stream = llm.complete_stream(prompt)
for token in stream:
    print(token, end="", flush=True)  # Shows immediately
\`\`\`

## Backpressure

Don't let input outpace processing:

\`\`\`
Input queue: 10,000 items
Processing: 100 items/second
Queue depth grows: 10,000 - 100 = 9,900/sec

Solution: Slow down input or speed up processing
\`\`\`

## Trade-offs

\`\`\`
Batch:
  ✓ Faster (amortizes overhead)
  ✗ Higher latency for last item in batch

Streaming:
  ✓ Lower latency
  ✗ More overhead per item

Choose based on use case:
  - Analytics: Batch (speed matters)
  - Chat: Streaming (latency matters)
\`\`\``,
    exercises: [
      "Batch: Group 1000 items, process efficiently",
      "Streaming: Show output as it generates",
      "Code: Implement batching pipeline",
      "Backpressure: Handle input faster than processing",
      "Problem: Queue is growing indefinitely",
      "Memory: Streaming to avoid loading all in memory",
      "MCQ: When to batch vs stream?",
      "Benchmark: Speed comparison batch vs stream"
    ]
  },
  {
    order: 30,
    title: "Token and Context Window Management",
    theory: `# Token and Context Window Management

## The Constraint

LLMs have a limit on input + output:

\`\`\`
Claude 3.5 Sonnet: 200K tokens (input)
GPT-4: 128K tokens (input)
GPT-3.5: 4K tokens (input) - VERY LIMITED

100 tokens ≈ 75 words

If you exceed limit:
  ❌ Error
  ❌ API rejects request
  ❌ No response
\`\`\`

## Counting Tokens

\`\`\`python
import tiktoken

encoding = tiktoken.encoding_for_model("gpt-4")

text = "This is a test"
tokens = encoding.encode(text)
print(len(tokens))  # e.g., 5 tokens

# Rule of thumb: 1 token ≈ 0.75 words
estimated = len(text.split()) * 0.75
\`\`\`

## Token Management

\`\`\`python
def fit_in_context(text, max_tokens=4000):
    tokens = count_tokens(text)

    if tokens <= max_tokens:
        return text  # Fits!

    if tokens > max_tokens * 1.5:
        # Way too big, summarize heavily
        return summarize(text, max_tokens=max_tokens//2)

    if tokens > max_tokens:
        # Slightly over, truncate
        return text[:max_tokens]

    return text
\`\`\`

## Conversation History

Keep recent history, summarize old:

\`\`\`python
conversation = [
    {"role": "user", "content": "What's the weather?"},
    {"role": "assistant", "content": "Sunny..."},
    ... (50 messages) ...
    {"role": "user", "content": "Help me!"}
]

# Too many tokens to fit

# Solution:
recent = conversation[-20:]  # Last 20 messages
old = conversation[:-20]     # First 30 messages
summary = summarize(old)

new_conversation = [
    {"role": "system", "content": f"Previous summary: {summary}"},
    ... recent messages ...
]
\`\`\`

## Budget Allocation

\`\`\`python
max_context = 4000

# Allocate budget:
system_prompt = 500 tokens
context = 1500 tokens
user_input = 500 tokens
reserved_for_output = 1500 tokens

total = 500 + 1500 + 500 + 1500 = 4000 ✓
\`\`\`

## Efficiency Tips

\`\`\`
- Use shorter variable names in large contexts
- Remove unnecessary whitespace
- Use bullet points instead of prose
- Truncate examples (show 1-2, not 10)
- Summarize, don't quote
\`\`\``,
    exercises: [
      "Count: Tokens in your typical prompt",
      "Budget: Allocate tokens for your use case",
      "Truncate: Fit text into context window",
      "History: Manage conversation history",
      "Summarize: Condense old context",
      "Problem: Hit token limit mid-response",
      "Efficiency: Reduce prompt by 50%",
      "Measure: Compare token usage before/after"
    ]
  },
  {
    order: 31,
    title: "Prompt Engineering and Optimization",
    theory: `# Prompt Engineering and Optimization

## What is Prompt Engineering?

Crafting inputs to LLMs for best results:

\`\`\`
Bad prompt:
  "Help me"
  → Unclear what help needed

Good prompt:
  "I'm building a weather agent. Help me design the tools it needs."
  → Clear context, specific ask

Excellent prompt:
  "I'm building a weather agent that answers questions about current weather.
   The agent will have these tools: [list].

   What additional tools would improve the agent?
   Consider: data accuracy, response latency, user experience.

   Format as: [Tool name]: [why useful]"
  → Context, specific, format, constraints
\`\`\`

## Key Principles

**Clarity**
- Clear instruction > vague instruction
- Show, don't tell

**Specificity**
- "Summarize" → "Summarize in 1-2 sentences for a busy executive"
- "Analyze" → "Analyze for bias and factual accuracy"

**Examples**
- "Respond in JSON" + example beats "Respond in JSON"
- "Reply in the style of:" + example beats just saying it

**Constraints**
- "Keep under 100 words"
- "Use only technical terms"
- "Avoid mentioning prices"

## Pattern: Few-Shot Learning

Show examples of desired behavior:

\`\`\`python
prompt = """
You are a helpful assistant.

Examples:
Q: What's 2+2?
A: 4

Q: What's the capital of France?
A: Paris

Now answer this question:
Q: What's 5+3?
A:"""

# Model learns from examples and responds: 8
\`\`\`

## Iteration

Test and improve:

\`\`\`
Prompt v1: "Summarize this"
  Result: Too long, unclear

Prompt v2: "Summarize in 2 sentences, focus on main point"
  Result: Better, but missing key detail

Prompt v3: "Summarize in 2-3 sentences. Include: main finding, why it matters"
  Result: Perfect
\`\`\`

## Common Techniques

\`\`\`
1. Chain-of-thought: "Think step by step"
2. Role-playing: "You are a software architect"
3. Constraints: "Be concise. Use bullet points."
4. Format specification: "Return JSON with keys: x, y, z"
5. Few-shot examples: Show 2-3 examples
\`\`\``,
    exercises: [
      "Craft: Write prompt for your use case",
      "Examples: Add 3 few-shot examples",
      "Iterate: Improve prompt through testing",
      "Compare: Good vs excellent prompt",
      "Concise: Remove words, keep meaning",
      "Format: Specify output format clearly",
      "Constraints: What rules should agent follow?",
      "Test: Measure prompt quality (consistency, accuracy)"
    ]
  },
  {
    order: 32,
    title: "Fine-tuning and Customization",
    theory: `# Fine-tuning and Customization

## Why Fine-tune?

Customize LLM for your specific domain:

\`\`\`
General GPT-4:
  Good at many things
  Mediocre at domain-specific tasks
  Your domain: Customer support for SaaS

Fine-tuned GPT-4:
  Trained on 1000 customer support conversations
  Understands your domain
  Better, faster responses
  Can use smaller model (cheaper)
\`\`\`

## Fine-tuning Data

\`\`\`python
# Prepare training data
training_data = [
    {
        "messages": [
            {"role": "user", "content": "How do I reset my password?"},
            {"role": "assistant", "content": "Go to settings..."}
        ]
    },
    {
        "messages": [
            {"role": "user", "content": "I'm getting an error"},
            {"role": "assistant", "content": "Try..."}
        ]
    },
    ... (1000 more examples) ...
]

# Quality matters more than quantity
# 100 excellent examples > 1000 mediocre examples
\`\`\`

## Fine-tuning vs Few-Shot

\`\`\`
Few-shot (in-context learning):
  "Here are 3 examples... now answer this"
  Fast: No training needed
  Cheap: Only tokens
  Flexible: Easy to change

Fine-tuning:
  Train on 100s of examples
  Slow: Takes time to train
  Expensive: Training cost + inference cost
  Specialized: Better for domain
\`\`\`

Use few-shot first. Only fine-tune if:
- Performance isn't good enough
- Need to save tokens (smaller prompt)
- Have lots of training data

## Customization Without Fine-tuning

\`\`\`python
# System prompt customization
system_prompt = """
You are a support agent for our SaaS platform.
Our product has these features: [list]
Our users are: [description]
Response style: Friendly, concise, solution-focused
Always offer to escalate if not resolved
"""

# RAG (Retrieval-Augmented Generation)
# Give context without fine-tuning
context = search_knowledge_base(user_query)
prompt = f"Using this knowledge base: {context}\nAnswer: {user_query}"

# This is often better than fine-tuning!
\`\`\`

## Code

\`\`\`python
# OpenAI fine-tuning example
import openai

# Prepare data
with open("training_data.jsonl", "w") as f:
    for example in training_data:
        f.write(json.dumps({"messages": example["messages"]}) + "\n")

# Upload
file = openai.File.create(
    file=open("training_data.jsonl"),
    purpose="fine-tune"
)

# Fine-tune
job = openai.FineTuningJob.create(
    training_file=file.id,
    model="gpt-3.5-turbo"
)

# Use fine-tuned model
response = openai.ChatCompletion.create(
    model=job.fine_tuned_model,
    messages=messages
)
\`\`\``,
    exercises: [
      "Prepare: Create fine-tuning dataset",
      "Compare: Few-shot vs fine-tuned performance",
      "Cost: When is fine-tuning worth it?",
      "Code: Fine-tune a model",
      "Evaluate: Test quality on validation set",
      "Problem: Model overfitting to training data",
      "Iterate: Improve with more/better data",
      "Deploy: Use fine-tuned model in production"
    ]
  },
  {
    order: 33,
    title: "Composition and Workflow Orchestration",
    theory: `# Composition and Workflow Orchestration

## Agent Composition

Combine agents to build complex workflows:

\`\`\`
Single agent limitations:
  Agent can't be expert in everything
  Slow (doing everything sequentially)
  Fragile (one failure breaks everything)

Composed agents:
  Search agent (expert at finding info)
  + Analyzer (expert at synthesis)
  + Explainer (expert at clarity)
  = Powerful system
\`\`\`

## Workflow Types

**Sequential**
\`\`\`
Agent A → Output → Agent B → Output → Agent C → Final result
\`\`\`

**Parallel**
\`\`\`
Agent A ──┐
Agent B ──┼→ Merge → Agent C → Final result
Agent C ──┘
\`\`\`

**Conditional**
\`\`\`
If condition_A:
  Agent A → Agent B
Else:
  Agent A → Agent C
\`\`\`

**Looping**
\`\`\`
Agent A → Check result → If not good → Agent A again
       └─→ If good → Done
\`\`\`

## Code

\`\`\`python
class Workflow:
    async def execute(self, input):
        # Step 1: Search in parallel
        sources = await asyncio.gather(
            self.search_agent.find(input),
            self.api_agent.fetch(input)
        )

        # Step 2: Analyze results
        analysis = await self.analyzer.analyze(sources)

        # Step 3: Check confidence
        if analysis.confidence > 0.9:
            return analysis.result

        # Step 4: If low confidence, ask user for clarification
        clarification = await self.ask_user(analysis.question)
        final = await self.analyzer.re_analyze(analysis, clarification)

        return final
\`\`\`

## Tools

Frameworks for orchestration:
- LangChain (LLM chains)
- Airflow (data workflows)
- Temporal (distributed workflows)
- N8N (visual workflows)

## Debugging

\`\`\`python
# Log each step
for step in workflow.steps:
    print(f"Executing {step.name}")
    input = step.input
    output = await step.execute(input)
    print(f"  Result: {output}")

# See exactly what happened at each stage
\`\`\``,
    exercises: [
      "Design: Workflow for your problem",
      "Sequential: Agent → Agent → Result",
      "Parallel: Multiple agents at once",
      "Conditional: Route based on conditions",
      "Looping: Retry until success",
      "Code: Implement workflow orchestration",
      "Async: Make parallel steps fast",
      "Debug: Trace workflow execution"
    ]
  },
  {
    order: 34,
    title: "Data Validation and Cleaning",
    theory: `# Data Validation and Cleaning

## The Problem

Garbage in, garbage out:

\`\`\`
Dirty input:
  "the wheather in NYC is: ☀️👍🏡"

Agent processes directly:
  "I see weather symbols... not sure what this means"

Clean input:
  "The weather in NYC is sunny"

Agent processes confidently:
  "Sunny weather in NYC, 72°F"
\`\`\`

## Validation Rules

\`\`\`python
def validate_input(user_input):
    # Type check
    if not isinstance(user_input, str):
        raise TypeError("Input must be string")

    # Length check
    if len(user_input) < 1 or len(user_input) > 10000:
        raise ValueError("Input too short or too long")

    # Pattern check
    if contains_only_emoji(user_input):
        raise ValueError("Input appears to be only emoji")

    # Sanitization
    cleaned = remove_excessive_whitespace(user_input)
    cleaned = remove_special_chars(cleaned)

    return cleaned
\`\`\`

## Schema Validation

Define what valid output looks like:

\`\`\`python
from pydantic import BaseModel, validator

class WeatherResponse(BaseModel):
    location: str
    temperature: float  # Must be number
    condition: str  # "sunny", "rainy", etc.

    @validator('temperature')
    def temp_in_range(cls, v):
        if v < -100 or v > 150:
            raise ValueError('Temperature unrealistic')
        return v

# If response doesn't match schema → error
response = WeatherResponse(
    location="NYC",
    temperature=72,
    condition="sunny"
)
\`\`\`

## Cleaning Operations

\`\`\`
Lowercase: "NYC" → "nyc"
Trim whitespace: "  hello  " → "hello"
Remove duplicates: "aaabbbccc" → "abc"
Standardize: "New York City" → "NYC"
Remove special chars: "hello@123" → "hello123"
Spell check: "wether" → "weather"
\`\`\`

## Fallback Handling

\`\`\`python
def get_clean_input():
    try:
        # Try to validate
        return validate_and_clean(user_input)
    except ValidationError:
        # Fall back
        return ask_user_to_rephrase()
\`\`\``,
    exercises: [
      "Validate: Check input meets requirements",
      "Schema: Define expected output format",
      "Clean: Remove noise from data",
      "Problem: Invalid input, handle gracefully",
      "Pydantic: Build schema validator",
      "Test: Edge cases and malformed input",
      "Rules: Define validation rules for your domain",
      "Pipeline: Validation → Cleaning → Processing"
    ]
  },
  {
    order: 35,
    title: "Evaluation and Benchmarking",
    theory: `# Evaluation and Benchmarking

## Why Evaluate?

You think change X improves agent. Prove it:

\`\`\`
Claim: "Better prompt = better answers"

Control: Old prompt
  Quality score: 7.2 / 10

Treatment: New prompt
  Quality score: 8.1 / 10

Result: +0.9 improvement (statistically significant?)
\`\`\`

## Metrics

**Accuracy**
\`\`\`
Correct answers / Total answers
80% of answers correct
\`\`\`

**Relevance**
\`\`\`
Is answer relevant to question?
1-5 scale or yes/no
\`\`\`

**Latency**
\`\`\`
How long for response?
Goal: < 2 seconds
\`\`\`

**Cost**
\`\`\`
API cost per query
\$0.05 per query acceptable?
\`\`\`

## Benchmarks

Standard test cases:

\`\`\`python
benchmark = [
    {
        "query": "What's 2+2?",
        "expected_answer": "4",
        "agent_answer": "4",
        "correct": True
    },
    {
        "query": "Who won the 2020 Olympics?",
        "expected_answer": "Tokyo won the bid",
        "agent_answer": "Olympics were held in Tokyo",
        "correct": True  # Close enough
    },
    ...
]

correct = sum(1 for case in benchmark if case["correct"])
accuracy = correct / len(benchmark)
\`\`\`

## A/B Testing

Compare two versions:

\`\`\`
Group A (Control): 100 queries, accuracy 85%
Group B (Treatment): 100 queries, accuracy 88%

Is 88% better than 85%?
  With 100 samples: Maybe (could be random)
  With 10,000 samples: Probably yes
\`\`\`

## Continuous Evaluation

\`\`\`python
@daily
def evaluate_agent():
    results = agent.process(test_cases)
    metrics = calculate_metrics(results)

    if metrics.accuracy < 0.8:
        alert("Accuracy dropped below 80%")

    log_metrics(metrics)
\`\`\`

## Code

\`\`\`python
def evaluate(agent, test_cases):
    results = []

    for test_case in test_cases:
        start = time.time()
        answer = agent.respond(test_case["query"])
        latency = time.time() - start

        correct = check_correctness(answer, test_case["expected"])
        relevant = check_relevance(answer, test_case["query"])

        results.append({
            "correct": correct,
            "relevant": relevant,
            "latency": latency
        })

    # Calculate metrics
    accuracy = sum(1 for r in results if r["correct"]) / len(results)
    avg_latency = sum(r["latency"] for r in results) / len(results)

    return {
        "accuracy": accuracy,
        "latency": avg_latency
    }
\`\`\``,
    exercises: [
      "Metric: Define 3 metrics for your agent",
      "Benchmark: Create test cases",
      "Evaluate: Measure current performance",
      "Baseline: What's good performance?",
      "A/B test: Compare two versions",
      "Problem: Accuracy dropped, debug why",
      "Automate: Set up continuous evaluation",
      "Report: Dashboard showing metrics over time"
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

    // Get the Agentic AI course and Module 2 (second half)
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

    // Get lessons 26-35 in Module 2 (second batch)
    const lessonsRes = await db
      .from("lessons")
      .select("id, order_index")
      .eq("course_id", courseId)
      .eq("module_id", moduleId)
      .gte("order_index", 26)
      .lte("order_index", 35)
      .order("order_index", { ascending: true });

    if (lessonsRes.error) {
      throw new Error(`Lessons query failed: ${lessonsRes.error.message}`);
    }

    let lessonsUpdated = 0;
    let exercisesUpdated = 0;

    // Update each lesson
    for (let i = 0; i < lessonsRes.data.length && i < AGENT_SYSTEMS_LESSONS.length; i++) {
      const lesson = lessonsRes.data[i];
      const lessonData = AGENT_SYSTEMS_LESSONS[i];

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
      message: "Slice #37 complete: 10 Agent Systems & Patterns lessons + 80 exercises!",
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
