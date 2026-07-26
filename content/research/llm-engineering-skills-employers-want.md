Job listings that mention LLMs have multiplied across software, data and product roles, but the titles are chaotic: AI engineer, LLM engineer, GenAI developer, applied AI specialist. Underneath the noise, the skills employers screen for are surprisingly consistent — and they are learnable. This is a map of what actually gets tested in interviews and used on the job, and how to build credible evidence for each.

## Prompting as engineering, not incantation

The baseline expectation has shifted. Employers no longer care whether you know clever phrasings; they care whether you can treat a prompt as a specification. That means decomposing a task into instructions, constraints and examples; defining output schemas the downstream code can parse; handling edge cases and refusal behaviour explicitly; and iterating against a test set rather than by vibes.

Interviewers probe this with questions like "your prompt works on the happy path but fails on ambiguous inputs — walk me through your process". A candidate who answers with a debugging methodology — inspect the failing cases, isolate the variable, change one thing, re-measure — stands out immediately from one who answers with prompt folklore. Being able to explain *why* few-shot examples work, when they help and when they bloat cost, signals depth beyond recipes.

## Retrieval and grounding: the RAG skill set

Because most commercial LLM work involves connecting models to proprietary data, retrieval-augmented generation is the single most requested applied skill. The employable version goes well past "I connected a vector database": it includes chunking strategy and its trade-offs, embedding selection, hybrid keyword-plus-vector retrieval, reranking, metadata filtering, and — critically — diagnosing whether a bad answer came from retrieval or generation.

That last skill is the differentiator. Production RAG debugging is mostly retrieval debugging, and candidates who instinctively ask "what chunks did the model actually receive?" demonstrate they have operated a real system rather than followed a tutorial. Familiarity with grounding techniques — instructing models to stay within sources, produce citations, and admit when the context lacks an answer — rounds out the set.

## Evaluation: the scarcest skill in the market

Ask hiring managers what is hardest to find and the answer is rarely prompting — it is evaluation. Most candidates can build an LLM feature; few can prove it works and keep proving it after every change. The skill set includes building golden sets of representative cases, writing rubrics that decompose "good" into gradeable criteria, mixing programmatic checks with LLM-as-judge grading (and knowing the judge's biases), and wiring evaluation into the development loop so regressions surface automatically.

This maps directly to business risk: an unevaluated LLM feature is a liability, and employers know it. In interviews, expect questions like "how would you know your chatbot got worse after a model upgrade?" A concrete answer — fixed test set, per-criterion scores, tracked over time — is worth more than any framework name-dropping. If you build one habit before applying, build this one.

## Agents, tool use and system design

As products move from single completions to multi-step workflows, employers increasingly test agentic fundamentals: how tool calling works mechanically, how to design tool schemas a model can use reliably, how an agent loop terminates, and what budgets and guardrails keep autonomy safe. Awareness of standardised tool protocols such as MCP is becoming a plus, as is a clear-eyed view on when multi-agent architectures are justified — interviewers often use "would you use multiple agents here?" to separate engineering judgement from hype-following.

Around the agent sits ordinary software engineering, and it still dominates day-to-day work: API integration, error handling and retries, latency and cost budgeting, logging full prompts and responses for debugging, and caching. Employers repeatedly emphasise that LLM engineering is engineering first — candidates who treat the model as one unreliable component in a system, to be wrapped in validation and fallbacks, interview far better than those who treat it as magic.

## Security awareness and the judgement layer

Prompt injection has made security literacy a hiring criterion. Candidates should be able to explain why untrusted content in a context window is dangerous, how injection travels through retrieved documents and tool results, and what layered defences look like: sanitisation, least-privilege tools, approval gates for consequential actions, and separating instructions from data. You need not be a security specialist; you must not be naive.

The final layer is judgement: knowing when to prompt versus fine-tune versus retrieve, when a smaller cheaper model suffices, when an LLM is the wrong tool entirely. This is what separates mid-level from senior in this field, and it only develops through building — which is also how you evidence it. A portfolio of two or three projects with visible evaluation (a test set in the repo, scores in the README, an honest failure-modes section) beats a certificate list in nearly every screening process, because it demonstrates exactly the habits employers are trying to hire.

## Frequently asked questions

**Do I need machine learning research skills to work with LLMs?**

For most applied roles, no. Employers building products on top of foundation models need engineering skills — prompting, retrieval, evaluation, integration, security — rather than the ability to train models from scratch. Research-adjacent roles exist but are a small fraction of the market. Solid software fundamentals plus the LLM-specific skill set above covers the majority of listings.

**Which programming language should I focus on?**

Python dominates the LLM tooling ecosystem and is the safest primary choice; TypeScript is a strong second given how much LLM product work happens in web stacks. More important than the language is fluency with APIs, JSON schemas, async patterns and testing — the daily substrate of LLM engineering.

**How do I demonstrate these skills without prior AI job experience?**

Build small systems that show the full loop: a RAG application with a documented evaluation set, an agent with visible guardrails and budget handling, a write-up of failure modes you found and fixed. Evidence of evaluation discipline is the strongest signal you can send, precisely because most applicants lack it.

## Where to go from here

The skills above compound fastest when your work is graded against explicit standards — which is how Square 1's courses are built: projects are graded, and Nova, the AI tutor, grades your code and prompts. Benchmark yourself with the [free 3-minute skill check](/diagnostic), then build the portfolio through the [LLM Agent Architect course](/courses/llm-agent-architect).
