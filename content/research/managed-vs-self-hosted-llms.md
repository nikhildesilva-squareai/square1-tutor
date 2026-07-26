Every team building on large language models eventually confronts the build-versus-rent question in its modern form: call a managed API from a model provider, or run open-weight models on infrastructure you control? The decision touches cost, privacy, latency, capability, and how many engineers you are willing to dedicate to keeping GPUs happy. This comparison works through each dimension honestly — including the ways the obvious answer changes as you scale.

## What each option really means

**Managed LLMs** are models accessed through a provider's API. You send a prompt over HTTPS, tokens come back, and you pay per token processed. Everything behind the endpoint — GPU fleets, model weights, serving optimisation, scaling, and much of the safety tooling — is the provider's problem. Frontier-quality models are effectively only available this way.

**Self-hosted LLMs** are open-weight models — of which capable options now exist at many sizes — running on hardware you rent or own, served by an inference engine you configure. "Self-hosted" spans a spectrum: a small quantised model on a single cloud GPU, a production vLLM cluster with autoscaling, or a managed-Kubernetes deployment that outsources some of the pain. In every variant, you own the operational stack: model selection, serving software, GPU capacity, updates, and monitoring.

The framing to resist is "which is better?" — they are different products. Managed APIs sell capability and convenience; self-hosting sells control. The correct question is which constraints bind for your application.

## Capability, control, and customisation

On raw capability, managed frontier models retain the edge for the hardest tasks — complex reasoning, nuanced instruction following, broad world knowledge. Open-weight models have closed much of the gap and, on well-scoped tasks, a mid-sized open model often performs indistinguishably from a frontier one, particularly after fine-tuning on your domain. The honest test is empirical: build an evaluation set from your actual task and measure, because generic leaderboards routinely mispredict performance on specific workloads.

Control cuts the other way. Self-hosting gives you a model that never changes without your consent — no silent behaviour shifts when a provider updates or retires a version, which matters enormously once you have tuned prompts and built evaluations against specific behaviour. You control decoding parameters at a granularity APIs may not expose, can fine-tune freely, and are immune to provider rate limits and capacity fluctuations. With managed APIs you accept deprecation schedules and usage policies in exchange for continuous capability improvements arriving with zero effort on your side.

Data governance is often the deciding factor before capability is even discussed. Self-hosting keeps prompts and outputs entirely within your infrastructure — decisive for regulated industries, strict data-residency requirements, or genuinely sensitive material. Managed providers offer enterprise controls and no-training commitments that satisfy many compliance regimes, but some organisations' constraints (or their customers' contracts) rule out third-party processing regardless.

## The economics: tokens versus GPUs

The cost structures are fundamentally different shapes, and the difference explains most real-world switching decisions.

Managed APIs are pure variable cost: near-zero at low volume, scaling linearly with usage. This is ideal while exploring — you pay cents to prototype and nothing while idle. Self-hosting is dominated by fixed cost: GPU capacity bills by the hour whether or not requests arrive, and serving a model well requires enough capacity for peak load. On top sits the substantial and easily underestimated cost of engineering time to build and operate the stack.

The consequence is a crossover pattern. At low or spiky volume, the API is dramatically cheaper — idle GPUs are expensive furniture. At high, steady volume, well-utilised self-hosted capacity can undercut per-token pricing, sometimes substantially, especially when a smaller fine-tuned model replaces a large general one for a narrow task. Where the crossover sits depends on utilisation above all: a GPU fleet running near capacity around the clock amortises beautifully; the same fleet at low utilisation is a money fire. Teams routinely discover their "cheaper" self-hosted deployment costs more than the API bill it replaced, once true utilisation and engineering time are counted.

Latency has its own economics. Self-hosting removes a network hop and queueing you cannot see, and colocating the model beside your application can win real milliseconds for latency-critical products. But providers' serving stacks are aggressively optimised, and a modest self-hosted setup can easily be slower than the API it replaces. Measure; do not assume.

## Operations: the hidden line item

Calling an API well requires retry logic, timeout handling, cost monitoring, and prompt versioning — real engineering, but familiar engineering. Self-hosting adds a second, specialised discipline: inference serving. That means choosing and tuning an engine, managing GPU memory and batching behaviour, handling model updates and security patches, capacity planning, on-call response when the fleet misbehaves, and re-evaluating quality after every quantisation or engine upgrade.

None of this is exotic any more — the open-source serving ecosystem is mature — but it is ongoing work that competes with product development. A useful rule: self-hosting is realistic when at least one engineer can treat inference infrastructure as a core responsibility rather than a side quest. Below that threshold, reliability quietly becomes the product's weakest link.

## A decision framework, and the hybrid default

Work through these questions in order:

1. **Do compliance or data-residency constraints prohibit third-party processing?** If yes, self-host (or use dedicated/private deployments from providers); the rest is detail.
2. **Do you need frontier-level capability on open-ended tasks?** If yes, managed APIs.
3. **Is your task narrow and high-volume?** Evaluate a fine-tuned open model; this is self-hosting's strongest economic case.
4. **Is your volume steady enough to keep GPUs utilised?** If not, per-token pricing is your friend.
5. **Can you staff the operations?** If not, the comparison is theoretical.

In practice, mature teams increasingly land on hybrids: a managed frontier model for complex, low-volume paths; a self-hosted or small managed model for high-volume, well-scoped tasks; routing logic choosing per request. Designing your application behind a model-agnostic interface — so any call can be redirected as economics and capabilities shift — is worth doing from day one, because they will shift.

## Frequently asked questions

**Is a self-hosted LLM more private by definition?**

It removes third-party processing, which is a real and sometimes decisive difference. But privacy is a property of the whole system: a self-hosted model with sloppy logging, open network access, or weak access control can be less safe in practice than a managed API used under enterprise terms. Self-hosting relocates responsibility; it does not discharge it.

**Are open-weight models good enough to replace API models?**

For many scoped tasks — classification, extraction, summarisation, domain-specific assistance — yes, often after light fine-tuning, and the gap continues to narrow. For the most demanding open-ended reasoning, frontier managed models still lead. The only trustworthy answer for your case comes from evaluating candidate models on your own task data.

**What is the lowest-risk way to try self-hosting?**

Pick one high-volume, well-scoped workload with an existing evaluation set. Deploy a quantised open model on a single rented GPU using an off-the-shelf inference server, run it in shadow mode against your current API path, and compare quality, latency, and true cost — including the hours it consumed. That experiment costs little and replaces speculation with your own numbers.

## Where to go from here

These trade-offs become intuitive once you have built against both kinds of model yourself. The [Machine Learning course](/courses/machine-learning) grounds the fundamentals with graded projects — Nova, Square 1's AI tutor, reviews your code and prompts as you build. If you want a quick read on where your skills stand today, take the [free 3-minute skill check](/diagnostic).
