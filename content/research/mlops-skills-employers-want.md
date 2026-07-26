Job listings for MLOps and ML engineering roles read like tool catalogues, which makes it easy to miss what employers are actually screening for: people who can take models out of notebooks and keep them working in production. The tools change; that underlying capability does not. This guide breaks down the skill areas that appear consistently across MLOps hiring, why each one matters to the business, and how to build evidence you possess them without waiting for permission from a job title.

## The core: software engineering applied to ML

The most consistent signal across MLOps hiring is that engineering fundamentals outrank modelling depth. Employers repeatedly discover that teaching deployment discipline to a strong engineer is easier than teaching engineering discipline to a strong modeller, and their interview processes reflect it.

Concretely, that means fluent Python beyond notebook style — modules, packaging, testing with real coverage, and code that colleagues can review without wincing. It means Git used properly: branches, pull requests, and code review as a habit rather than a formality. It means SQL, which remains the lingua franca of data work everywhere, and enough Linux and shell competence to debug a misbehaving process on a remote machine. And it increasingly means API development — building and consuming HTTP services — because the deployed form of most models is precisely an API.

If your background is data science, this is usually the gap to close first. If your background is software engineering, you are closer to MLOps-ready than you may think; the remaining distance is understanding how ML artefacts differ from ordinary code — that behaviour depends on data, that correctness is statistical, and that a system can degrade without throwing a single error.

## Cloud platforms and infrastructure as code

Production ML lives in the cloud, so cloud literacy is non-negotiable. Employers typically want working competence in at least one major provider — AWS, Azure, or Google Cloud — and the concepts transfer well between them. The specific areas that matter for ML work: compute provisioning (including GPU instances), object storage, identity and access management, networking basics, and the platform's managed ML services.

Two adjacent skills multiply your value here. **Containerisation** — Docker fluency is assumed in nearly every MLOps listing, and Kubernetes appears in most senior ones, because containers are how models and pipelines are packaged and shipped. You do not need to administer clusters on day one, but you should be comfortable deploying to one. **Infrastructure as code** — defining environments in tools like Terraform rather than clicking consoles — signals that you build reproducible systems, which is the entire ethos of the discipline. Teams that have been burned by hand-built, undocumented infrastructure hire specifically to avoid it happening again.

Cost awareness deserves mention as a differentiator. GPU-heavy workloads make ML teams unusually expensive, and candidates who can talk sensibly about right-sizing hardware, spot capacity for training, and utilisation monitoring stand out — it is a skill employers feel directly on their invoices.

## Pipelines, deployment, and the ML lifecycle

This is the heart of the specialisation: the machinery that moves models from experiment to production repeatedly and safely.

- **Experiment tracking and model registries.** Recording what was trained, on what data, with what results — and versioning the resulting artefacts so deployment and rollback are routine. Familiarity with at least one mainstream tracking/registry stack is expected.
- **Pipeline orchestration.** Automating multi-step workflows — data validation, training, evaluation, promotion — with an orchestrator rather than a folder of scripts. Which orchestrator matters less than demonstrating you think in pipelines with gates, not in manual runs.
- **CI/CD adapted to ML.** Automated testing that covers data schemas and model quality thresholds, not just code; progressive rollouts (shadow and canary deployments) that compare a candidate model against the incumbent before it takes real traffic.
- **Model serving.** Wrapping models in services, reasoning about latency versus throughput, batching, and choosing sensibly between serverless platforms, container fleets, and managed endpoints.

Interviewers probe this area with scenario questions — "walk me through how you would ship a retrained model without downtime" — so understanding the *why* behind each pattern matters more than memorising any tool's syntax.

## Monitoring, observability, and the LLM turn

Systems that learn from data fail in ways ordinary software does not: silently, statistically, and often slowly. Employers prize people who instrument for that reality — tracking not just service health (latency, errors, saturation) but model health: input distributions drifting away from training data, prediction distributions shifting, and business metrics decoupling from offline scores. Knowing when retraining is warranted, and building the alerting that triggers it, is a distinctly MLOps competence.

The newest addition to the job description is LLM operations. As products absorb large language models, employers increasingly ask for experience with prompt versioning and evaluation, retrieval pipelines and vector databases, token-cost monitoring, guardrails against prompt injection and unsafe output, and latency engineering for streaming responses. The underlying skills are recognisably MLOps — versioning, evaluation gates, observability, cost control — applied to a new artefact class. Candidates who can bridge both worlds are scarce and correspondingly valuable.

## Building proof without the job title

MLOps has a chicken-and-egg reputation: roles ask for production experience, which you get from roles. The way through is to generate evidence that is inspectable rather than claimed.

Build one project end to end and make it public: data ingestion with validation, tracked training runs, an evaluation gate, a containerised serving API deployed on a real cloud platform, monitoring, and a README that explains your decisions and trade-offs. One complete, honest system beats ten model-only notebooks, because it demonstrates the exact lifecycle employers are hiring for. Where possible, practise the collaborative machinery too — pull requests against your own repos, issues, CI badges that are actually green — since hiring managers read repositories the way they read CVs.

Then let your current role supply the production mileage in miniature: automate a manual retraining process, add drift monitoring to an existing model, containerise a service that runs on someone's machine. "I introduced evaluation gating to our team's workflow" is production experience, whatever your title says.

## Frequently asked questions

**Do I need a machine learning degree for MLOps roles?**

Generally no. Employers ask for understanding of the ML lifecycle — how models are trained, evaluated, and degraded by drift — rather than the mathematics of novel architectures. Demonstrated engineering skill plus practical ML literacy, evidenced by real projects, outweighs credentials for most MLOps positions. Research-adjacent roles are the exception.

**Which cloud platform should I learn first?**

Whichever you have access to or see most in your target job market — competence in one transfers substantially to the others, and hiring managers know it. Depth beats breadth: one platform used to actually deploy and monitor a project is worth more than passing familiarity with all three. Add a second platform's basics later if listings you care about demand it.

**Is Kubernetes mandatory for MLOps?**

Not universally, but it is the most common orchestration layer in serious ML platforms, and senior listings assume it. A pragmatic path: get fluent with Docker first, deploy to simpler container platforms, then learn Kubernetes fundamentals — deployments, services, autoscaling, GPU scheduling — once the problems it solves are real to you. Understanding *why* it exists makes the learning stick.

## Where to go from here

The portfolio that gets MLOps interviews is built one deployed project at a time. The [Machine Learning course](/courses/machine-learning) takes you through the full lifecycle with graded projects — Nova, Square 1's AI tutor, reviews the code you submit. If you are unsure whether your engineering or your ML side needs work first, the [free 3-minute skill check](/diagnostic) will tell you in three minutes.
