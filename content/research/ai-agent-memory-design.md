Large language models are amnesiacs by design: every API call starts from nothing but the text in front of it. Yet useful agents plainly need to remember — what the user prefers, what happened three sessions ago, which approaches already failed. Agent memory is the engineering discipline that bridges that gap, and its central insight is that memory is not a feature you switch on but an architecture you design.

## Why agents forget, and why it matters

The model's only working memory is its context window, and the window is finite, expensive and rebuilt from scratch on every request. Whatever the application does not explicitly resend, the model has never seen. In short conversations this is invisible; in agentic systems it becomes the binding constraint, because agents *generate* context at a ferocious rate — every tool call returns results, every step adds transcript, and long-running tasks can exhaust even generous windows well before the work is done.

The consequences of unmanaged memory are familiar to anyone who has run agents in practice: the assistant re-asks a question answered an hour ago, retries a strategy that already failed, or loses the constraint stated at the beginning of the session just when it matters most. These are not model failures so much as memory-design failures — the information existed, but nothing carried it to where the model could see it.

## Short-term memory: managing the window

Short-term memory is everything living inside the current context: the system prompt, recent conversation, active task state and fresh tool results. Managing it is a budgeting exercise with a few standard instruments.

Trimming drops the oldest or least relevant material when space runs short — cheap, but brutal, because whatever is trimmed is gone. Summarisation is the gentler alternative: periodically compress completed exchanges into a running précis, keeping recent turns verbatim and older ones as distilled facts. Structured state goes further still, maintaining an explicit, model-readable scratchpad — current goal, decisions made, open questions — that is rewritten as the task progresses rather than accumulated as transcript.

Two rules of thumb serve well. First, protect the invariants: the goal, hard constraints and safety rules should be pinned so no trimming pass can evict them. Second, treat verbose tool output as radioactive — truncate or summarise it on arrival, because a single dumped log file can crowd out everything the agent actually needs to think with.

## Long-term memory: stores and retrieval

Long-term memory lives outside the model entirely — in files, databases or vector stores — and re-enters the context only when retrieved. The dominant pattern is retrieval-based: memories are written as text, embedded, and searched semantically when the agent needs them, exactly like retrieval-augmented generation pointed at the agent's own past instead of at documents.

What gets stored shapes what the agent becomes. Common categories include user preferences and facts ("prefers concise answers", "works in Melbourne"), episodic records of past sessions and their outcomes, and procedural knowledge — approaches that worked, pitfalls already discovered. Some systems let the agent itself decide what is worth remembering, exposing a "save memory" tool; others extract candidate memories automatically after each session.

Writing is the easy half. The hard half is retrieval relevance: surfacing the *right* memory at the right moment without flooding the context with marginally related history. Good systems retrieve sparingly, rank aggressively, and tag memories with metadata — recency, source, confidence — so retrieval can be filtered rather than purely similarity-driven.

## The design trade-offs that actually decide behaviour

Memory design is a series of tensions rather than a checklist, and naming them clarifies most architectural decisions.

**Completeness versus relevance.** Remember everything and retrieval drowns in noise; remember too little and the agent repeats mistakes. Most systems bias towards selective, distilled memories over raw transcripts.

**Freshness versus stability.** Preferences change and facts go stale. Without update and expiry mechanisms, an agent's memory becomes a museum of outdated beliefs — contradicted by the user months ago but still confidently retrieved.

**Persistence versus privacy.** Everything remembered is something stored. Deciding what an agent may retain, for how long, and how a user can inspect and delete it is not compliance garnish; it is core design, especially when memories contain personal detail.

**Memory versus instruction.** A retrieved memory is data, but models can treat remembered text as authoritative. Poisoned or simply wrong memories steer future behaviour, so provenance and the ability to trace "why did the agent believe this?" matter more as memory grows.

## A pragmatic build order

Teams over-engineer memory more often than they under-engineer it. A sensible progression: start with disciplined short-term management — summarisation and a structured scratchpad — because most "memory problems" in single-session agents are really context-budget problems. Add a simple persistent key-value store for explicit user facts next; it is inspectable and hard to get wrong. Introduce semantic retrieval over episodic memory only when cross-session recall demonstrably limits the product, and instrument it: log what was retrieved into each request, so when the agent behaves oddly you can see which memory put the idea in its head.

At every stage, evaluate with scenarios that specifically test recall — "user states a preference in session one; does session five honour it?" — because ordinary task benchmarks barely exercise memory at all.

## Frequently asked questions

**Is a bigger context window a substitute for memory design?**

No. Larger windows delay the problem but do not remove it: cost and latency scale with tokens sent, attention degrades over cluttered contexts, and nothing in a window persists across sessions. Even with very large windows, production agents need summarisation, structured state and external stores — the window changes the budget, not the architecture.

**What is the difference between agent memory and RAG?**

Mechanically they are near-identical — store text, embed it, retrieve by similarity into the context. The difference is the corpus and its lifecycle: RAG retrieves from a curated document collection, while agent memory retrieves from the agent's own accumulating experience, which the system itself writes, updates and expires. Memory therefore adds write-side problems RAG does not have.

**Should the agent decide for itself what to remember?**

Agent-directed memory (a "save this" tool) captures intent well but is inconsistent — models forget to save. Automatic extraction after sessions is more complete but noisier. Many systems combine both, then apply the same bar to each candidate memory: would retrieving this later plausibly change behaviour for the better? If not, it is clutter.

## Where to go from here

Memory design only becomes concrete when you build an agent, watch it forget, and fix it. The [Agentic AI course](/courses/agentic-ai) covers context budgeting, memory stores and retrieval in graded projects, and the [LLM Agent Architect course](/courses/llm-agent-architect) extends it to system-level design — with Nova, Square 1's AI tutor, grading your code and prompts throughout.
