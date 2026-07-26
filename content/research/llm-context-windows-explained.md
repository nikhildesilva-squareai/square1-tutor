Every large language model has a context window: a hard limit on how much text it can consider at once. Everything — your instructions, the conversation so far, retrieved documents, and the answer being generated — must fit inside it. Understanding how context windows work explains a surprising amount of everyday LLM behaviour, from "forgotten" instructions to ballooning API bills.

## What a context window actually is

LLMs do not read words; they read tokens. A token is a chunk of text — often a whole short word, sometimes part of a longer one, sometimes punctuation. As a rough rule of thumb for English, a token averages about three-quarters of a word, so a thousand tokens is in the region of seven hundred and fifty words. Code, non-English languages and unusual formatting typically consume more tokens per character.

The context window is the maximum number of tokens the model can attend to in a single forward pass. It is not memory in the human sense: the model has no persistent recollection between requests. Each API call stands alone, and "conversation memory" in a chat interface is simply the application resending previous messages inside the window every turn. Once a conversation grows beyond the limit, something has to be dropped or compressed — and whatever is dropped is, for the model, gone.

The window is shared between input and output. If a model has a large window but you fill nearly all of it with input, there is little room left for the answer.

## Why long context is not free

Modern models advertise very large context windows, and it is tempting to treat them as a solved problem: just paste everything in. Three costs argue against that.

The first is money. Most API pricing is per token, for both input and output. A prompt that carries an entire document collection on every request costs many times more than one that carries only the relevant passages, and the difference compounds with every turn of a conversation.

The second is latency. Processing more input tokens takes longer, so bloated prompts make every response slower — a real problem in interactive products.

The third is attention quality. A model's ability to use information is not uniform across a huge window. Long, cluttered contexts make it easier for the model to latch onto the wrong passage, conflate similar sections, or overlook a single crucial sentence buried mid-document. A model can technically "fit" a whole book and still reason poorly about page four hundred. More context is not automatically better context; *relevant* context is better context.

## How running out of context shows up in practice

Context exhaustion rarely announces itself. Instead you see symptoms. A chatbot that was told at the start of a session to "always answer in French" quietly drifts back to English once the early messages scroll out of the resent history. A coding assistant loses track of a function it edited an hour ago. A summariser produces a fluent summary of the second half of a document because the first half was truncated before it reached the model.

When you hit odd behaviour in a long session, the first diagnostic question should be: what was actually inside the window on that request? Logging the final assembled prompt — not just the user's latest message — is one of the most valuable habits in LLM engineering, because the prompt the model saw is frequently not the prompt you imagined it saw.

## Practical strategies for working within the limit

Good systems treat the context window as a budget and spend it deliberately. Several techniques recur across production applications:

- **Summarisation.** Instead of resending an entire conversation, periodically compress older turns into a short running summary and keep only recent messages verbatim. Key facts survive; filler does not.
- **Retrieval.** Rather than pasting whole documents, store them outside the model and retrieve only the passages relevant to the current question — the core idea behind retrieval-augmented generation.
- **Structured trimming.** Decide explicitly what must never be dropped (system instructions, safety rules, task definition) and what is expendable (greetings, resolved sub-tasks), instead of truncating blindly from the top.
- **Positioning.** Place critical instructions and the most important reference material where they are hard to miss — typically at the start of the prompt and restated near the question — rather than buried mid-context.
- **Output budgeting.** Cap expected output length and leave genuine headroom for it, so the answer is not squeezed or cut off.

None of these is exotic. Together they routinely make the difference between a demo that works once and a product that works all day.

## Context windows, agents and memory

The limit bites hardest in agentic systems, where a model runs in a loop, calling tools and accumulating results. Every tool response — a file listing, a web page, a query result — lands in the context, and loops that run for many steps can exhaust even generous windows quickly.

Agent frameworks therefore lean heavily on context management: truncating verbose tool output, summarising completed steps, and writing durable facts to an external store the agent can search later instead of carrying everything forward. This is the practical boundary between *context* (what fits in the window right now) and *memory* (what is stored outside and retrieved on demand). Designing that boundary well is one of the core skills of agent engineering.

## Frequently asked questions

**Is a bigger context window always better?**

Bigger windows enable genuinely new use cases — long documents, large codebases, extended sessions. But per-request cost and latency scale with what you actually send, and stuffing a window with irrelevant text can degrade answer quality. The best systems use large windows selectively rather than filling them by default.

**Do tokens map one-to-one to words?**

No. Tokenisation splits text into sub-word units, and the mapping varies by model and by language. Common English words are often single tokens; rare words, code and non-Latin scripts split into more pieces. When budgeting, use the provider's tokeniser to count precisely rather than estimating from word counts.

**Why does the model forget instructions from earlier in a chat?**

Usually because those instructions are no longer in the window — the application trimmed old messages to make room — or because they are buried under so much intervening text that they lose salience. Restating critical instructions in the system prompt, or re-injecting them each turn, is the standard fix.

## Where to go from here

Context management is a foundational skill for anyone building with LLMs, and it is best learned by hitting the limits yourself in real projects. The [Generative AI course](/courses/generative-ai) builds that foundation with graded, hands-on work, while the [Agentic AI course](/courses/agentic-ai) tackles context and memory budgeting inside agent loops specifically.
