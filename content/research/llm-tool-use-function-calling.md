Tool use — often called function calling — is the mechanism that lets a large language model do things instead of merely saying things. The model cannot browse, query a database or send an email itself; what it can do is emit a structured request asking your code to do so. That handshake between model and code underpins every AI agent, and understanding it precisely is a prerequisite for building anything agentic.

## How function calling actually works

The flow is simpler than the terminology suggests. Alongside your prompt, you send the model a list of available tools, each described by a name, a natural-language description and a parameter schema (typically JSON Schema). The model then has a choice: reply with ordinary text, or reply with a tool call — a structured object naming a tool and supplying arguments that fit its schema.

Crucially, nothing executes automatically. The model's tool call is a *request*. Your application receives it, validates it, runs the actual function, and sends the result back to the model as a new message. The model reads that result and continues — perhaps answering the user, perhaps requesting another tool. The model plans; your code acts; the transcript records the exchange.

This design has a security consequence worth internalising early: because every action passes through your code, every action is interceptable. Validation, permission checks, rate limits and audit logs all live at that boundary, which is exactly where they belong.

## Tool definitions are prompts in disguise

The model decides which tool to call — and whether to call one at all — by reading your tool descriptions. They are not documentation for humans; they are instructions for the model, and they reward the same care as any prompt.

Good definitions share a few habits. The description states *when* the tool applies, not merely what it does: "Look up a customer's current subscription by email. Use only when the user asks about their own account" steers selection far better than "Queries the subscription table". Parameter descriptions include formats, units and allowed values, because the model will guess at anything unspecified. And each tool does one narrow thing — a model choosing between five specific tools is far more accurate than one aiming a single all-purpose tool with a dozen optional parameters.

Return values deserve equal thought. The model sees only what you send back, so results should be self-describing and compact: labelled fields rather than bare numbers, an explicit "no results found" rather than an empty string, and errors returned as readable messages the model can act on — models are notably good at reading an error and retrying with corrected arguments.

## From one call to a loop

A single tool call is useful; the power arrives with iteration. Multi-step tool use — call a tool, read the result, decide the next call — is what turns a chat model into an agent. The application keeps a running transcript: user goal, model tool calls, tool results, repeated until the model responds with a final answer.

Iteration raises design questions that single calls avoid. How many steps are allowed before you halt a runaway loop? What happens when a tool result is enormous — do you truncate or summarise it before it floods the context window? Should some tools be freely usable while others (anything that writes, sends or deletes) require human confirmation? Production systems answer all three explicitly: step budgets, result truncation and consequence-based approval gates are standard equipment, not optional extras.

## MCP and the move to standard tool protocols

Historically, every application defined its tools ad hoc, and every integration between a model and an external system was bespoke. Standardised tool protocols — the Model Context Protocol (MCP) being the prominent example — change that economics. Instead of each app hand-wiring its own connectors, a system exposes its capabilities through a standard server interface, and any compatible model application can discover and use those tools at runtime.

The protocol details matter less than the architectural shift: tools become an ecosystem rather than a per-project chore. An agent can connect to a file-system server, a database server and a ticketing server from different authors and treat them uniformly — discovering each server's tool list, schemas and descriptions dynamically.

The shift also raises the stakes on trust. When tools arrive from external servers, their descriptions and outputs are third-party content sitting inside your model's context — which makes provenance, permissioning and treating tool output as *data rather than instructions* central design concerns. Learning to reason about that boundary is quickly becoming a core agent-engineering skill.

## Common failure modes and how to defend against them

Tool-using systems fail in recognisable patterns. The model calls the wrong tool because two descriptions overlap — fix the descriptions, not the model. It hallucinates arguments — enforce schemas strictly and reject invalid calls with a clear error, which the model usually corrects on retry. It calls a tool when it should have just answered, or answers from memory when it should have called a tool — both are steered by sharper "use when / don't use when" guidance in descriptions and the system prompt.

The subtlest failure is prompt injection through tool results: a retrieved web page or document containing text like "ignore your instructions and…". Because tool results enter the same context as everything else, the model may treat embedded imperatives as genuine. Defences are layered rather than absolute: sanitise and truncate results, instruct the model that tool output is data, keep dangerous capabilities behind approval gates, and never let untrusted content flow into high-consequence actions unreviewed.

## Frequently asked questions

**Is function calling the same thing as an agent?**

Function calling is the mechanism; an agent is the pattern built on it. One tool call answering one question is plain function calling. An agent wraps that mechanism in a loop — repeated calls, accumulated results, self-directed stopping — plus the budgets and guardrails that make the loop safe to run.

**Does the model ever execute code or call APIs directly?**

No. The model only emits structured text describing the call it wants. Your application (or a framework acting for it) performs the execution and returns results. That separation is what lets you validate arguments, enforce permissions and log every side effect.

**How many tools can I give a model before selection degrades?**

There is no universal number, but selection quality drops as toolkits grow and descriptions crowd the context. Practical mitigations: keep descriptions sharply differentiated, group related operations into one well-parameterised tool, and expose only the subset of tools relevant to the current task rather than the full catalogue on every request.

## Where to go from here

Tool use is best learned by wiring real tools to a real model and watching the transcripts. The [LLM Agent Architect course](/courses/llm-agent-architect) covers tool design, MCP-style protocols and injection defences through graded projects — Nova, Square 1's AI tutor, grades your code and prompts along the way. Or start by finding your level with the [free 3-minute skill check](/diagnostic).
