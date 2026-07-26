Serving a large language model to ten users is a tutorial; serving it to ten thousand is a systems design problem. Inference at scale sits at the intersection of GPU economics, queueing theory, and user experience, and the design decisions interact in ways that surprise teams coming from conventional web scaling. This article works through the architecture of scaled LLM inference — what makes it hard, the techniques that buy back performance, and the observability that keeps the whole thing honest.

## Why LLM inference scales differently

Conventional web requests are short, cheap, and uniform; LLM requests are none of these. Three properties reshape the scaling problem.

First, **generation is sequential**. A response is produced token by token, each step depending on the last, so a single request occupies resources for the full duration of its output — seconds to minutes, not milliseconds. Capacity planning must think in concurrent long-lived generations, not requests per second.

Second, **the memory bill grows with context**. Beyond the model weights themselves, each active request maintains a KV cache — stored intermediate attention values for every token in its context — that grows with prompt length and generation length. On busy servers, this per-request cache, not the weights, is what exhausts GPU memory and caps concurrency. Long-context features multiply the pressure.

Third, **work per request is wildly variable**. A three-word answer and a two-thousand-token essay differ enormously in cost, and you rarely know which you are getting when the request arrives. Load balancing and autoscaling built on request counts alone will misjudge actual load; token throughput is the truer currency.

These properties explain why two latency metrics dominate LLM serving: **time to first token** (how long before the user sees anything — the responsiveness people feel, since responses stream) and **inter-token latency** (how fast text flows once started). Architectures are designed and tuned against both, not against a single response-time number.

## The core efficiency levers

A handful of techniques, now standard in mature inference engines, determine most of the throughput difference between naive and optimised serving.

**Continuous batching** is the biggest single win. GPUs are efficient when processing many sequences at once, but requests arrive raggedly and finish at different times. Naive batching waits to assemble a batch, runs it to completion, then starts the next — leaving the GPU underused as sequences finish early. Continuous batching instead admits new requests into the running batch at every generation step, as slots free up. The effect on throughput is transformative, which is why purpose-built inference servers implement it and generic web serving stacks struggle to compete.

**KV cache management** comes next. Paged-attention approaches manage cache memory in small blocks — much as operating systems page memory — eliminating fragmentation and allowing far more concurrent sequences per GPU. Prefix caching extends the idea: when many requests share a long common prefix (a system prompt, few-shot examples, a document under discussion), the cache for that prefix is computed once and shared.

**Quantisation** shrinks the model itself, storing weights at reduced numerical precision. Smaller weights mean less memory bandwidth per token and more room for cache — typically a large serving win for a small, measurable quality cost that must be validated against your own evaluation set, not assumed.

**Speculative decoding** attacks sequential latency: a small draft model proposes several tokens cheaply, and the large model verifies them in one parallel pass, accepting the correct prefix. When the draft model guesses well, generation speeds up materially with no quality change.

## Architecture above the engine

The inference engine handles one replica; scaling is what happens around it.

Routing deserves more design than it usually gets. A load balancer that spreads requests evenly by count will overload replicas that happen to hold long generations, so token-aware or least-loaded routing performs better. Session affinity earns its keep with prefix caching — steering a user's follow-up turns to the replica already holding their conversation's cache. Above routing sits admission control: a queue with backpressure, per-client rate and token limits, and honest rejection when saturated. An overloaded LLM service that accepts everything degrades for everyone; one that queues transparently and sheds excess load protects both latency and cost.

Autoscaling needs LLM-appropriate signals. CPU utilisation is meaningless; even GPU utilisation misleads. The signals that track real capacity are concurrent sequences, KV cache occupancy, queue depth, and time-to-first-token degradation. Scaling out is also slow — new replicas must pull a many-gigabyte model and warm up — so policies must scale early on leading indicators and keep enough headroom to ride out spikes, with the cost of that headroom weighed explicitly.

Two further patterns appear in mature deployments. **Disaggregated serving** separates the prefill phase (processing the prompt — compute-bound, parallel) from the decode phase (generating tokens — memory-bound, sequential) onto different hardware pools, letting each scale to its own bottleneck. **Model routing** accepts that not every request needs the flagship: a classifier or heuristic sends simple requests to a small, cheap model and reserves the large one for genuinely hard cases, cutting fleet cost substantially at constant perceived quality — provided the routing decision is itself evaluated and monitored.

## Observability: the part that keeps you honest

Scaled inference without measurement drifts into either waste or degradation, and often both. A serving stack needs three layers of telemetry.

**Request-level metrics:** time to first token and inter-token latency as percentile distributions (tail latency is where users suffer), queue wait time, tokens in and out per request, and rejection/timeout rates. **Fleet-level metrics:** KV cache occupancy, batch size achieved, token throughput per GPU, and cost per thousand tokens served — the number that connects engineering decisions to the bill. **Quality signals:** sampled output evaluation, error and refusal rates, and drift in prompt or output length distributions, because a change in how the system is used silently changes how it performs and what it costs.

Correlating these layers is where the insight lives: a tail-latency regression traced to cache saturation from a new long-context feature; a cost spike explained by a shifted traffic mix defeating the model router. Build dashboards around questions like these before scale forces the issue at an inconvenient hour.

## Frequently asked questions

**When should I move from a managed LLM API to my own inference infrastructure?**

When volume is high and steady enough to keep GPUs well utilised, when a scoped task lets a smaller self-hosted model match the quality you need, or when data constraints require it. Self-hosting at scale means owning everything in this article — batching, cache management, routing, autoscaling, observability — so the economics must cover that engineering, not just the hardware.

**What is the single highest-impact optimisation for LLM serving?**

Adopting an inference engine with continuous batching and paged KV cache management, rather than serving through a generic web framework. That one decision typically dominates all subsequent tuning. After it: quantisation validated against your evaluation set, then prefix caching if your workload shares long prompts.

**How do I reduce time to first token?**

Prefill speed and queueing dominate it. Shorten prompts where possible, cache shared prefixes so they are not recomputed, keep enough replica headroom that requests are not waiting in queue, and stream output so users see tokens the moment they exist. If prefill itself is the bottleneck at healthy load, quantisation and more prefill compute — or disaggregated serving — are the levers.

## Where to go from here

The concepts here reward hands-on practice: even serving a small open model on one GPU teaches batching, caching, and latency trade-offs vividly. The [Machine Learning course](/courses/machine-learning) builds the foundations with graded projects reviewed by Nova, Square 1's AI tutor. If you want to locate your starting point first, take the [free 3-minute skill check](/diagnostic).
