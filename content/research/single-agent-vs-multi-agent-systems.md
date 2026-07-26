One of the earliest architectural forks in any agentic AI project is deceptively simple: should this be one agent with many tools, or several agents working together? Multi-agent designs dominate conference talks and framework demos, but in practice a single capable agent is the right starting point far more often than the hype suggests. The interesting question is not which architecture is fashionable, but what each one actually buys you — and at what cost.

## What the two architectures really mean

A single-agent system is one model instance running one loop: it holds the entire task context, chooses among its tools, and carries the job from start to finish. Complexity lives in the toolkit and the prompt, not in coordination.

A multi-agent system splits the work across multiple model instances with distinct roles — a planner delegating to specialists, a researcher handing findings to a writer, a generator paired with a critic. Each agent has its own context, prompt and often its own tools; some orchestration layer routes messages between them.

The definitional point that trips people up: multiple *tools* do not make multiple *agents*. A single agent calling a search tool, a database tool and a code-execution tool is still one agent — one locus of reasoning, one context, one transcript. Multi-agent means multiple independent reasoning loops that must communicate, and that communication is where both the benefits and the costs originate.

## The real case for a single agent

Single agents win on three fronts: coherence, debuggability and cost.

Coherence, because one context holds everything. The agent that read the file is the same agent that edits it; nothing learned in step two is lost by the time step nine needs it. Hand-offs between agents, by contrast, compress rich context into brief messages, and detail dies in that compression — the multi-agent equivalent of a game of telephone.

Debuggability, because there is one transcript to read. When a single agent fails, you trace one sequence of decisions. When a five-agent pipeline fails, you must work out which agent went wrong, whether the fault was its reasoning or the summary it received, and how the error propagated downstream.

Cost, because coordination is not free. Every inter-agent message is more model calls and more tokens, and orchestration overhead frequently exceeds the useful work for tasks that never needed splitting. Modern models with large context windows and disciplined tool design can carry remarkably complex tasks alone — the honest default is one agent until it demonstrably breaks.

## Where multi-agent genuinely earns its complexity

Multi-agent architecture stops being decoration and starts being engineering when specific pressures appear.

**Context isolation.** Some sub-tasks generate huge intermediate context — trawling dozens of documents, say — that would drown the main task. A sub-agent can absorb that volume and return only distilled findings, protecting the primary context budget.

**Genuinely different configurations.** When parts of the workflow need different system prompts, different toolsets, different models, or different permission levels — a cheap fast model for triage, a stronger one for synthesis; a read-only researcher and a write-capable executor — separation along those boundaries is natural rather than forced.

**Adversarial separation.** A reviewer that critiques the generator's work is more reliable when it is a separate instance without the generator's context and its accumulated rationalisations. Fresh eyes are an architectural property.

**Parallelism.** Independent sub-tasks — checking ten sources, testing ten hypotheses — can run concurrently, trading tokens for wall-clock time.

Notice what is absent from this list: "the task is complicated". Complexity alone argues for a better single agent. It is *conflicting requirements* — for isolation, configuration, independence or concurrency — that argue for multiplicity.

## The costs multi-agent designs must pay

Every benefit above is bought with coordination machinery, and the machinery fails in its own characteristic ways. Hand-off loss: an orchestrator's one-paragraph brief omits the constraint that mattered, and the specialist confidently solves the wrong problem. Duplicated or contradictory work: two agents touch the same resource with inconsistent assumptions. Error laundering: a wrong claim from one agent arrives at the next as trusted input, stripped of the uncertainty that surrounded it — and errors compound across every hop.

Evaluation gets harder too. A single agent is graded on outcome and trajectory; a multi-agent system additionally needs grading on its interfaces — was the delegation clear, was the summary faithful, did the orchestrator integrate results correctly? Teams adopting multi-agent architectures early often discover they have traded one hard problem (building a good agent) for several (building good agents *and* a good organisation for them).

## A practical decision path

Start with one agent, built well: sharp tool definitions, a clear system prompt, budgets and guardrails, and an evaluation set of representative tasks. Push it until you hit a wall you can name — context overflow from bulky sub-tasks, a genuine need for different permissions or models across workflow stages, a reviewer that keeps agreeing with the author, or sub-tasks that beg to run in parallel.

Then split along that named boundary and nothing more. One orchestrator with one or two sub-agents solves most real cases; elaborate agent societies rarely survive contact with production. After each split, re-run your evaluation set — the architecture change has to pay for itself in measured task success, not in diagram elegance. If the scores do not move, the complexity was cosmetic, and the honest move is to fold it back in.

## Frequently asked questions

**Is a multi-agent system smarter than a single agent?**

Not inherently. Both are built from the same underlying models, so multiplying agents does not add intelligence — it redistributes context and specialisation. Multi-agent designs outperform when isolation, differing configurations or parallelism genuinely matter, and underperform when coordination overhead and hand-off loss outweigh those gains.

**Does using many tools mean I have a multi-agent system?**

No. One reasoning loop with many tools is a single agent, and that is a strength: all knowledge stays in one context. You cross into multi-agent territory only when separate model instances, each running its own loop, must exchange information to complete the task.

**What breaks first when tasks are split across agents?**

Context transfer. Each hand-off compresses everything one agent knows into a short message, and whatever fails to survive that compression is lost to the rest of the pipeline. Most multi-agent failures trace back to a brief that omitted a constraint or a summary that flattened an important nuance.

## Where to go from here

Architectural judgement comes from building both patterns and comparing them on real tasks. The [Agentic AI course](/courses/agentic-ai) has you construct single- and multi-agent systems in graded projects, and the [LLM Agent Architect course](/courses/llm-agent-architect) goes deeper on orchestration and evaluation at the system level.
