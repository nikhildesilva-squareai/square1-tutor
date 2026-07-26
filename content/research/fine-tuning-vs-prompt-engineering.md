Fine-tuning and prompt engineering are the two main ways to shape how a large language model behaves, and they are frequently confused. Prompting changes what you *ask*; fine-tuning changes the *model itself*. Choosing between them is one of the most consequential early decisions in an LLM project, because it determines cost, iteration speed and how hard your system is to maintain.

## What each approach actually changes

Prompt engineering works entirely at inference time. You write instructions, supply examples, define output formats and set constraints — all inside the request. The model's weights never change; you are steering a general-purpose model with increasingly precise directions. Techniques range from simple ("respond only in JSON") to sophisticated: few-shot examples, role definitions, step-by-step reasoning scaffolds, and structured templates assembled programmatically.

Fine-tuning, by contrast, continues the model's training on your own dataset — typically hundreds to many thousands of example input–output pairs. The weights are updated so that the desired behaviour becomes the model's default rather than something you must request every time. Most practitioners today use parameter-efficient methods, which adjust a small fraction of the network and keep training affordable, but the principle is the same: the behaviour moves from the prompt into the model.

A useful mental model: prompting is briefing a capable generalist before each task; fine-tuning is sending them on a training programme so the briefing becomes unnecessary.

## Where prompt engineering wins

Prompting has three structural advantages: speed, transparency and reversibility. You can test a new prompt in seconds, read exactly what the model was told, and roll back a bad change instantly. There is no training pipeline, no dataset curation, and no risk of degrading the base model's general abilities.

It is remarkably capable. Modern instruction-tuned models follow detailed prompts well, and a large share of "we need to fine-tune" conversations end when a carefully engineered prompt — clear task definition, a handful of well-chosen examples, explicit format rules — turns out to solve the problem. Because prompts are just text, they also version-control cleanly and can be reviewed like code.

The costs are per-request rather than upfront. Long prompts with many examples consume tokens on every call, adding latency and expense at scale. And prompts have a ceiling: some behaviours — a very specific house style, a niche output schema, reliable handling of domain jargon — remain stubbornly inconsistent no matter how the instructions are phrased.

## Where fine-tuning wins

Fine-tuning earns its cost when you need consistent, specialised behaviour at volume. Once trained, the model produces your format, tone or task-specific reasoning without lengthy instructions, which shortens prompts, cuts per-request token cost and reduces latency. For high-throughput production systems, those savings can outweigh the training investment.

It also reaches behaviours prompting cannot reliably hit. Teaching a model a rigid domain-specific output structure, a distinctive brand voice, or a classification scheme with subtle boundary cases tends to work far better with hundreds of curated examples baked into the weights than with the same examples squeezed into every prompt. A smaller fine-tuned model can sometimes match a larger prompted model on a narrow task, which matters when serving costs dominate.

The trade-offs are real. Fine-tuning needs a quality dataset — noisy or biased examples are faithfully learned. Iteration is slow: every change means retraining and re-evaluating. Behaviour changes are opaque compared with editing visible instructions. And crucially, fine-tuning is poor at adding *facts*: it teaches patterns of behaviour, not a reliable database of knowledge. Models fine-tuned on factual material still hallucinate; knowledge problems are usually better served by retrieval.

## A practical decision path

Most teams should follow an escalation ladder rather than a one-off choice:

1. **Start with prompting.** Invest properly — task definition, constraints, worked examples, output schema. Measure results on a fixed test set, not by eyeballing single responses.
2. **Add retrieval if the gap is knowledge.** If failures are "the model doesn't know X", no amount of fine-tuning is the right first answer; ground the model in your documents instead.
3. **Fine-tune if the gap is behaviour.** If a well-engineered prompt still fails on format, style or task consistency — and you have (or can build) a clean dataset of correct examples — fine-tuning is justified.
4. **Re-evaluate on the same test set.** The comparison only means something if both approaches are scored against identical cases.

The approaches also combine: a fine-tuned model still needs a prompt, and disciplined prompting on top of tuned weights is common in production. The question is rarely "which one", but "how much of each, and in what order".

## Common mistakes to avoid

The most expensive mistake is fine-tuning too early — spending weeks on data collection and training to fix a problem that two days of systematic prompt iteration would have solved. The mirror-image mistake is prompt sprawl: endlessly patching a prompt with special cases until it becomes a fragile thousand-line document, when a small fine-tune would have made the behaviour native.

Two subtler traps: first, fine-tuning on a narrow dataset can erode general capability, so tuned models need evaluation beyond the target task. Second, teams often change the prompt and the model at the same time, making it impossible to attribute improvements. Change one variable at a time, and keep an evaluation set that outlives any individual experiment.

## Frequently asked questions

**Can fine-tuning teach a model new facts?**

Not reliably. Fine-tuning shapes behaviour — style, format, task patterns — but models tuned on factual documents still misremember and hallucinate details. For knowledge problems, retrieval-augmented generation is usually the better fit, because facts are supplied verbatim at question time and can be updated without retraining.

**How much data does fine-tuning need?**

It depends on how far the target behaviour is from what the base model already does. Narrow formatting or classification tasks can improve with hundreds of high-quality examples; broader behavioural changes typically need thousands. Quality dominates quantity: a small, clean, consistent dataset beats a large noisy one.

**Is prompt engineering still a real skill now that models follow instructions well?**

Yes — arguably more so, because the ceiling has risen. Production prompting is less about magic phrases and more about specification: decomposing tasks, choosing examples, defining schemas, handling edge cases and testing systematically. It looks more like software engineering than wordplay.

## Where to go from here

The judgement about when to prompt, retrieve or tune only develops through practice on real tasks with real evaluation. The [Generative AI course](/courses/generative-ai) covers prompting and adaptation techniques through graded projects — Nova, Square 1's AI tutor, grades both your code and your prompts. If you want to gauge your starting point first, take the [free 3-minute skill check](/diagnostic).
