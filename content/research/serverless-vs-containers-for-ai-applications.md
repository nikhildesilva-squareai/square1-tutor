Every AI application eventually faces the same infrastructure fork: run it on serverless functions that appear on demand and vanish when idle, or in containers you control, schedule, and keep warm. The choice shapes cost, latency, and how much operations work your team inherits — and AI workloads stress both options in ways ordinary web apps do not. This comparison lays out how each model behaves under AI-specific pressures and offers a framework for choosing.

## What each model actually promises

**Serverless functions** — the function-as-a-service offerings of the major clouds — execute your code in response to events, scale from zero to thousands of instances automatically, and bill per invocation and duration. You never see the server. The contract is seductive: no capacity planning, no idle cost, no patching. The constraints are equally real: limits on execution time, memory, and package size; no persistent local state between invocations; and the infamous cold start — the delay while the platform provisions a fresh instance for your code.

**Containers** package your application with its full runtime and run it on infrastructure you manage at some level of abstraction — from a single VM through managed Kubernetes. The container is always "warm" while running, can hold large models in memory indefinitely, can attach GPUs, and imposes no platform ceilings on duration or size. The price is that scaling, health, and utilisation become your problems: an idle container bills like a busy one.

Between the poles sits a middle tier that matters enormously for AI work: **serverless container platforms**, which run standard containers with request-driven autoscaling, including scale-to-zero. They relax the harshest function limits — bigger images, longer requests, in some cases GPU attachment — while keeping the no-idle-cost property, and they have become the pragmatic default for many AI services.

## The AI-shaped problems: model size and cold starts

For conventional web backends, cold starts are a minor nuisance measured in milliseconds. AI changes the arithmetic, because before a model can answer its first request, the runtime must load hundreds of megabytes to many gigabytes of weights into memory — and onto an accelerator if one is involved.

On a serverless function, that loading cost is paid whenever the platform spins up a new instance: after idle periods, and during scale-out under traffic spikes. A small scikit-learn model loading in under a second is a fine serverless citizen. A multi-gigabyte transformer is not — users would intermittently wait many seconds for an answer that normally takes a few hundred milliseconds. Providers offer mitigations (provisioned concurrency, warming strategies), but paying to keep function instances permanently warm erodes exactly the economic advantage that justified serverless in the first place.

Containers dodge the problem structurally: the model loads once at startup, and every subsequent request hits a warm process. The equivalent pain appears only at scale-out — new replicas take time to become ready, so autoscaling must be tuned to anticipate load rather than chase it, and aggressive scale-to-zero configurations reintroduce cold starts through the back door.

The practical heuristic: the larger the model and the tighter the latency budget, the harder the pull towards containers or towards keeping at least one warm instance somewhere.

## GPUs, throughput, and the shape of your traffic

Accelerator access divides the options sharply. Classic serverless functions are CPU-only; container platforms — and some serverless-container tiers — can attach GPUs. If your model needs a GPU to meet latency targets, the realistic choices are GPU containers you manage, a serverless GPU-container offering, or delegating inference entirely to a managed model API and letting someone else own the problem.

Traffic shape drives the economics as much as hardware does. Serverless billing rewards spiky, low-duty-cycle workloads: an internal tool used in bursts, a webhook that fires occasionally, a document-processing endpoint hit a few thousand times a day. Idle time costs nothing, and rare spikes absorb automatically. Containers reward steady load: a constantly busy inference service keeps its hardware utilised, and per-request cost on a well-utilised container fleet undercuts per-invocation serverless pricing at volume. GPU inference adds a batching argument — accelerators are efficient when requests are batched together, and batching requires a long-lived process holding a queue, which is naturally a container pattern.

There is also a workload-length constraint that trumps economics: training jobs, large batch processing, and anything running for many minutes to hours simply exceeds function execution limits. That work belongs on containers, batch services, or dedicated training infrastructure, whatever the rest of the application uses.

## A decision framework

Rather than declaring a winner, map your workload onto these questions:

1. **How big is the model?** Sub-second load time: serverless is viable. Multi-gigabyte: containers, or a managed API.
2. **Does it need a GPU?** If yes, you are choosing among container-based options and specialised serverless-GPU platforms.
3. **What is the traffic shape?** Spiky and idle-heavy favours scale-to-zero platforms; steady and high-volume favours provisioned containers.
4. **How tight is the latency budget?** Strict interactive budgets rule out cold starts on the critical path; batch and asynchronous work barely cares.
5. **How long do requests run?** Long-running generation, training, and batch jobs exceed function limits.
6. **How much operations capacity does the team have?** Managed and serverless options substitute platform fees for engineering time — often the right trade for small teams.

Composite architectures are not a compromise but the norm: a serverless API front door handling validation and orchestration, calling a GPU-backed container service (or managed model endpoint) for heavy inference, with batch work on separate job infrastructure. Each layer then runs on the platform that suits its shape.

## Frequently asked questions

**Can I run LLM inference on serverless functions?**

Self-hosting a large language model inside a classic serverless function is generally impractical — model size exceeds package and memory limits, and cold starts would be measured in tens of seconds. What works well is serverless functions calling LLMs hosted elsewhere: a managed model API or a GPU container service. The function handles request logic; the model runs where the hardware is.

**Is serverless always cheaper because you pay per request?**

No. Per-invocation pricing is higher per unit of compute than well-utilised provisioned capacity. Serverless wins financially when idle time dominates — spiky or low traffic. At sustained high volume, a container fleet you keep busy is usually cheaper. The crossover point depends on duty cycle, so estimate with your real traffic pattern rather than assuming either direction.

**What is the best starting point for a small AI app?**

A serverless container platform, in most cases. You package the app once as a standard container — preserving the option to move to Kubernetes or a VM later — while getting autoscaling, scale-to-zero, and zero server administration now. If the model is too large for that platform's cold starts, split it: keep the app serverless and serve the model from a managed endpoint.

## Where to go from here

Infrastructure judgement comes from shipping things and watching how they behave under real traffic. The [Full Stack Development course](/courses/fullstack-development) has you build and deploy working applications through graded projects — Nova, Square 1's AI tutor, reviews your code as you go. To see which course matches your current level, take the [free 3-minute skill check](/diagnostic).
