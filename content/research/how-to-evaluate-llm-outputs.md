Anyone can get an impressive answer out of a large language model once. The hard part is knowing whether your system produces good answers reliably — across hundreds of inputs, after every prompt change, and under the messy queries real users actually send. Evaluating LLM outputs is the discipline that separates demos from products, and it is far more tractable than it first appears.

## Why "it looks good to me" fails

LLM outputs are fluent by construction, and fluency is persuasive. A confident, well-structured answer *feels* correct even when it contains a fabricated detail, a subtle logic error or a quietly ignored instruction. Eyeballing a handful of responses therefore systematically overestimates quality — you notice the polish and miss the defects.

The deeper problem is non-determinism and drift. The same prompt can yield different outputs across runs; a prompt tweak that fixes one case silently breaks three others; a model version upgrade shifts behaviour across the board. Without a repeatable measurement process, you cannot tell whether any change made things better or worse. Evaluation is to LLM systems what testing is to software: not a final quality gate, but the feedback loop that makes improvement possible at all.

## Start with a golden set

The foundation of practical LLM evaluation is a golden set: a fixed collection of representative inputs, each paired with a reference answer or an explicit description of what a good response must contain. Thirty to a hundred well-chosen cases is enough to start; breadth matters more than volume. Include the easy cases, the ambiguous ones, the adversarial ones, and the ones where the correct behaviour is to refuse or say "I don't know".

Golden sets earn their keep in two ways. First, they make comparisons honest: every prompt variant, model swap or pipeline change is scored against the same cases, so improvements are measured rather than felt. Second, they enable regression testing: rerun the set after every change, and a fix that breaks previously passing cases announces itself immediately instead of surfacing in production.

Treat the set as a living asset. When a real-world failure appears, add it. When the product's scope grows, extend it. A golden set that never changes slowly stops resembling reality.

## Define what "good" means with a rubric

"Is this output good?" is unanswerable until you decompose it. A rubric breaks quality into named criteria that can each be judged separately — typically some subset of:

- **Correctness** — are the factual claims and reasoning right?
- **Faithfulness** — for grounded systems, does the answer stay within the supplied sources?
- **Completeness** — does it address the whole question, not just the easy half?
- **Format compliance** — does it follow the required structure, schema or length?
- **Tone and safety** — is it appropriate for the audience and free of prohibited content?

Write the rubric down, with a short description of what each score level looks like. This matters even if a single person does all the grading, because explicit criteria stop your standards drifting between Monday and Friday — and it becomes essential the moment grading is shared between multiple humans or delegated to a model.

## Choose the right grading method per criterion

No single grading method covers everything; strong evaluation pipelines mix three.

**Programmatic checks** handle everything objective: does the output parse as valid JSON, does it contain the required sections, is it under the length cap, does the extracted number match the reference? These checks are free, instant and incorruptible — automate every criterion that can be reduced to code.

**LLM-as-judge** uses a model, guided by your rubric, to grade qualities code cannot capture: relevance, faithfulness to sources, helpfulness of tone. It scales to thousands of cases cheaply, but it is a measurement instrument that itself needs calibration. Judges show known biases — favouring longer answers, favouring the first option in a pairwise comparison, or grading their own model family generously — so validate the judge against human-graded examples before trusting its scores, and re-check periodically.

**Human review** remains the anchor. Humans catch what both code and judges miss, and they define the ground truth that calibrates everything else. Because human time is the scarcest resource, spend it strategically: grading the golden set's reference answers, auditing samples of judge decisions, and reviewing the cases where automated methods disagree.

## Make evaluation continuous, not ceremonial

A one-off evaluation before launch decays immediately. The practices that keep quality visible over time are mundane and powerful: run the golden set automatically on every prompt or model change, track scores over time so drift is a chart rather than a surprise, and sample production traffic regularly for human audit, feeding failures back into the golden set.

Two habits repay special attention. Log the *full assembled prompt* alongside every graded output, because most mysterious failures turn out to be context problems — truncated history, missing retrieval results — visible only in what the model actually received. And when a score drops, resist fixing the symptom case in isolation; rerun the whole set and confirm the fix holds globally. Whack-a-mole prompt patching is how evaluation discipline quietly dies.

## Frequently asked questions

**How large does an evaluation set need to be?**

Smaller than most people fear. A few dozen carefully chosen cases will catch the majority of regressions and support meaningful comparisons between variants. Scale up when you need finer distinctions or per-category breakdowns. Coverage of distinct scenarios — including refusal and edge cases — matters far more than raw count.

**Can I trust an LLM to grade another LLM's outputs?**

Yes, within limits, and only after calibration. Give the judge an explicit rubric, check its agreement against human-graded examples, and stay alert to known biases such as length preference and position preference in comparisons. Used this way, LLM-as-judge is a scalable proxy for human judgement — not a replacement for ever checking its work.

**What is the difference between correctness and faithfulness?**

Correctness asks whether a claim is true in the world; faithfulness asks whether it is supported by the sources the model was given. A grounded answer can be faithful but incorrect (the source was wrong) or correct but unfaithful (true, but not from the provided material). RAG systems should measure both, because their failure modes differ.

## Where to go from here

Evaluation skills develop fastest when your own work is graded against explicit rubrics — which is exactly how Square 1's courses operate: Nova, the AI tutor, grades your code and prompts on graded projects. Start with the [free 3-minute skill check](/diagnostic), or go deep on evaluation-driven development in the [LLM Agent Architect course](/courses/llm-agent-architect).
