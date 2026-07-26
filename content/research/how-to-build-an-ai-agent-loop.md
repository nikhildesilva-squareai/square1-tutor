Strip away the frameworks and an AI agent is a surprisingly small thing: a loop in which a language model reads a goal, decides on an action, executes it through a tool, observes the result, and repeats until the job is done. Building that loop yourself — before adopting any framework — is the single best way to understand how agents actually work, and where they fail.

## The anatomy of an agent loop

Every agent loop, from a toy script to a production system, cycles through the same four stages:

1. **Observe.** Assemble the context: the goal, the conversation so far, and the results of previous actions.
2. **Reason.** The model decides what to do next — call a tool, ask a clarifying question, or declare the task complete.
3. **Act.** Your code executes the chosen tool with the model's arguments: run a search, query a database, write a file.
4. **Integrate.** The tool's result is appended to the context, and the loop returns to step one.

The model never executes anything itself — it only emits structured requests. Your code is the hands; the model is the planner. This division is what makes agents both powerful and governable: every side effect passes through code you wrote, which means every side effect is a place you can log, validate or refuse.

What distinguishes an agent from a chatbot is exactly this loop. A chatbot produces one response per input. An agent keeps going — chaining actions, reacting to intermediate results, and deciding for itself when it has finished.

## Start with the tool contract

Before writing the loop, define the tools. A tool is a function your code exposes to the model, described by a name, a plain-language description, and a schema for its parameters. The model chooses tools by reading these descriptions, so they are prompts in disguise: vague descriptions produce vague tool choices.

Three rules make tool contracts work. Keep each tool narrow — "search_orders by customer email" beats a generic "query_database" that invites malformed SQL. Make descriptions say *when* to use the tool, not just what it does, including when *not* to use it. And design the return values for a reader with no memory: a tool result should carry enough context to be interpreted on its own, because the model sees only what you put in the transcript.

Start with two or three tools. Agents with sprawling toolkits mis-select constantly; capability grows more safely by widening tools than by multiplying them.

## Write the minimal loop

With tools defined, the core loop is short. In pseudocode:

```
messages = [system_prompt, user_goal]
while not done:
    response = model.generate(messages, tools)
    if response.is_tool_call:
        result = execute(response.tool, response.arguments)
        messages.append(response)
        messages.append(tool_result(result))
    else:
        done = True   # the model answered in plain text
```

The system prompt sets the ground rules: the agent's role, which tools exist, how to behave when uncertain, and what "finished" looks like. The termination condition matters more than it appears — the simplest convention is that a plain-text response (rather than a tool call) signals completion, but you should also give the model an explicit way to say "I cannot complete this", so failure is a first-class outcome instead of an infinite retry.

Run this on a real task early. Watching a transcript of the model choosing tools — sensibly and otherwise — teaches more than any amount of architecture reading.

## Add the safeguards that make it survivable

A naive loop works until it doesn't, and its failure modes are predictable. Production-worthy loops add four defences:

- **Step and budget caps.** Bound the number of iterations, the tokens consumed and the wall-clock time. A confused agent should hit a ceiling and stop with a report, not loop until something external breaks.
- **Error feedback.** When a tool fails, do not crash the loop — return the error message as the tool result. Models are genuinely good at reading an error and correcting course, retrying with fixed arguments or choosing another approach.
- **Result truncation.** Tool outputs can be enormous; cap and summarise them before appending, or a single verbose result will flood the context window and starve later reasoning.
- **Approval gates.** Classify tools by consequence. Reading is free; writing, sending and deleting require either a human confirmation step or hard-coded guards. The model proposes, but policy decides.

These guardrails are not pessimism — they are what allows you to grant the agent more interesting tools later. Autonomy is earned by containment.

## Debug with transcripts, improve with evaluation

When an agent misbehaves, the transcript is the truth. Log every model request and response, every tool call with its arguments, and every result — then read the run end to end. Nearly all agent bugs fall into visible categories: a misleading tool description, a missing piece of context, an over-long history crowding out the goal, or a termination condition the model never quite reaches.

To improve systematically, build a small set of benchmark tasks with known good outcomes and rerun them after every change to prompts, tools or models. Agents are especially prone to whack-a-mole regressions — a description tweak that fixes one task derails another — and a fixed task suite is the only way to see it happening. Grade not just the final answer but the trajectory: did the agent take a reasonable path, or stumble into success expensively?

## Frequently asked questions

**Do I need a framework to build an agent?**

No. The core loop is a few dozen lines against any modern model API that supports tool calling, and building it yourself teaches you exactly what frameworks abstract. Frameworks earn their place later — for multi-agent orchestration, persistence and observability — once you understand the loop they wrap.

**How do I stop an agent looping forever?**

Layer several mechanisms: a hard cap on iterations and spend, an explicit "give up and explain" tool or convention so the model can exit honestly, and detection for repeated identical tool calls, which is the classic signature of a stuck agent. Every run should end in one of three states — success, honest failure or budget exhaustion — never a hang.

**What tasks are agent loops actually good for?**

Tasks that decompose into observable steps with verifiable intermediate results: research and summarisation across sources, code changes checked by tests, data lookups feeding a structured report. Tasks with irreversible high-stakes actions or no way to check progress are poor fits until strong guardrails and human gates are in place.

## Where to go from here

The concepts click when you build and debug a loop of your own against real tasks. The [Agentic AI course](/courses/agentic-ai) takes you from this minimal loop to planning, memory and guardrails through graded projects — with Nova, Square 1's AI tutor, grading your code and prompts. Prefer to benchmark yourself first? Take the [free 3-minute skill check](/diagnostic).
