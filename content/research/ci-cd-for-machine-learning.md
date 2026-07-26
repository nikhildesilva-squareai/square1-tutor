Software teams solved repeatable delivery years ago: every change runs through automated tests and ships through a pipeline, not from someone's laptop. Machine learning teams are now retrofitting that discipline onto systems where the "change" might be new code, new data, or a new model — and where a build can pass every test yet still be worse than what it replaces. This guide explains how CI/CD concepts translate to ML, what a working pipeline looks like stage by stage, and where the genuinely new problems lie.

## Why ML breaks ordinary CI/CD assumptions

Classic continuous integration rests on a comfortable assumption: behaviour is fully determined by code, so testing the code tests the system. ML violates this in three ways.

First, **behaviour comes from data as much as code**. Retraining the same code on last month's data produces a different model with different behaviour — no diff in version control, different system. Any honest ML pipeline must therefore version and validate data, not just source files.

Second, **correctness is statistical, not binary**. A conventional test asserts an exact outcome; a model is evaluated on aggregate metrics over a dataset. "Passing" becomes "accuracy above a threshold and no regression against the current production model", which requires evaluation infrastructure, held-out datasets, and agreed thresholds — none of which a generic CI template provides.

Third, **the artefact is heavy and expensive to produce**. Compiling code takes minutes and is deterministic; training a model can take hours on costly hardware and involves randomness. Pipelines must decide when retraining is actually warranted, cache aggressively, and control for nondeterminism with fixed seeds where reproducibility matters.

The practical consequence: ML teams run two coupled loops. A fast loop tests code like any software project. A slower loop — sometimes called continuous training — validates data, retrains, evaluates, and promotes models. Confusing the two, or forcing everything through one loop, produces pipelines that are either too slow to run on every commit or too shallow to catch model regressions.

## The anatomy of an ML pipeline

A mature ML delivery pipeline typically contains six stages, each with its own gate.

1. **Code checks.** Linting, unit tests for feature engineering and utility functions, and fast "smoke training" — running the training loop for a few steps on a tiny data sample to catch crashes cheaply. This stage runs on every commit and should finish in minutes.
2. **Data validation.** Before any training run, incoming data is checked against expectations: schema (columns, types), ranges, null rates, and distribution drift relative to previous batches. Silent data corruption is among the most common causes of production model failure, and it is far cheaper to reject a bad batch than to debug the degraded model it produces.
3. **Training.** Executed on dedicated infrastructure, not the CI runner — the pipeline submits a job to GPU capacity and records everything needed to reproduce it: code commit, data version, hyperparameters, environment, and seed.
4. **Evaluation.** The candidate model is scored on held-out datasets and compared against the current production model on the same data. Good evaluation goes beyond one aggregate number: metrics on important data slices (per segment, per class), latency and model-size checks, and behavioural tests — curated inputs with known expected outputs that act like unit tests for the model itself.
5. **Registration.** Candidates that clear evaluation are versioned into a model registry with their evaluation results and lineage attached. The registry is the handoff point between training and deployment, and the thing that makes rollback trivial.
6. **Deployment.** The packaged model rolls out progressively — shadow traffic or a small canary slice first, automated comparison against the incumbent, then graduated promotion. Rollback is a one-step return to the previous registry version.

## Testing data and models, not just code

The novel engineering in ML CI/CD is stages two and four, so they deserve elaboration.

Data tests come in layers. **Schema tests** are cheap and catch integration breakage: a renamed column or changed type upstream fails fast with a clear message. **Statistical tests** catch subtler rot: a feature whose null rate jumped, a category that vanished, a numeric distribution that shifted beyond tolerance. **Leakage checks** — verifying that no feature encodes information unavailable at prediction time and that training and test sets do not overlap — guard against the failure mode that produces beautiful offline metrics and useless production models.

Model evaluation, meanwhile, should be built like a gate, not a report. Define before training what "better" means: which metrics, on which datasets and slices, against which baseline, with what minimum margins. Encode those thresholds in the pipeline so promotion is automatic when they pass and impossible when they fail. This removes the most dangerous step in manual ML delivery — a human eyeballing a metrics table under deadline pressure and deciding it is "probably fine".

## Tooling: assemble, don't chase

The ML tooling landscape is crowded, but the categories are stable, and you need one answer per category rather than every tool per category: a general CI system for the fast loop; a workflow orchestrator for multi-step training pipelines; an experiment tracker to record runs and metrics; data versioning; a model registry; and a serving platform. Several open-source and managed platforms bundle multiple categories, and the major clouds offer integrated ML pipeline services covering most of the list.

Two pieces of advice cut through the noise. Start with the smallest stack that closes the loop — a CI service, an experiment tracker, and a registry cover most early needs; add orchestration when pipelines genuinely have many steps. And prefer boring, well-documented tools over novel ones: pipeline infrastructure is the last place you want churn, because everything downstream depends on it.

## Frequently asked questions

**Do I need to retrain my model on every commit?**

No, and trying to is a common early mistake. Code commits should trigger fast checks and smoke training only. Full retraining belongs on separate triggers: a schedule, the arrival of significant new data, detected drift in production, or an explicit request. The point of separating the fast and slow loops is precisely so that expensive training runs happen when they are justified, not on every push.

**How is CI/CD for ML different from MLOps?**

MLOps is the broader discipline — everything involved in operating ML systems, including data management, monitoring, governance, and team workflow. CI/CD for ML is one core component of it: the automated path a change takes from commit to production. If MLOps is the whole factory, the CI/CD pipeline is the assembly line running through the middle of it.

**What should I build first if I have no pipeline at all?**

Experiment tracking, then evaluation gating. Recording every training run's code, data, parameters, and metrics costs little and immediately ends the "which model was that?" problem. A scripted evaluation that compares any candidate against the current model on a fixed dataset gives you the promotion gate. Automate those two and you have the spine of a pipeline; scheduling, data validation, and progressive delivery attach naturally afterwards.

## Where to go from here

Pipelines make sense once you have felt the pain they remove — which means training, evaluating, and shipping models yourself. The [Machine Learning course](/courses/machine-learning) is built around graded projects that exercise exactly this loop, with Nova, Square 1's AI tutor, reviewing your submissions. If you are stronger on modelling than on the software-delivery side, the [Full Stack Development course](/courses/fullstack-development) fills in the engineering foundations.
