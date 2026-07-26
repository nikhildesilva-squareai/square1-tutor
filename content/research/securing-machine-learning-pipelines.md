A machine learning pipeline is a supply chain: data flows in, models are trained and packaged, and predictions flow out into products and decisions. Every stage of that chain can be attacked, and most pipelines were built for speed and iteration rather than security. This guide walks through the pipeline stage by stage and sets out the practical controls that harden each one without grinding development to a halt.

## Start with a threat model, not a tool

Before buying anything or rewriting infrastructure, map your pipeline the way an attacker would. Where does data enter, and who can write to those sources? Where are models and datasets stored, and who has access? What consumes the model's output, and what could a manipulated prediction cause downstream?

Three questions surface most of the risk quickly. First, what is the worst thing a poisoned dataset could make this model do? Second, what could someone do with a stolen copy of the model or its training data? Third, if the serving endpoint returned attacker-chosen outputs, what would break? The answers tell you which controls below deserve priority, because a fraud-detection pipeline, a recommendation system and an internal analytics model justify very different levels of investment.

## Secure the data layer

Training data is the pipeline's most attacked and least defended asset. Data poisoning — injecting crafted records so the trained model learns attacker-friendly behaviour — is viable wherever an attacker can influence what you ingest: public datasets, scraped web content, user-submitted feedback, or third-party feeds.

Practical controls:

- **Track provenance.** Record where every dataset came from, when, and under what licence. You cannot assess the trustworthiness of data you cannot trace.
- **Validate on ingestion.** Enforce schemas, ranges and distribution checks at the point data enters the pipeline. Sudden shifts in label balance or feature distributions deserve investigation before training, not after deployment.
- **Version and hash datasets.** Immutable, content-addressed dataset versions let you detect tampering and reproduce any training run exactly — which is also what you need for incident investigation.
- **Minimise sensitive data.** Strip or pseudonymise personal information before it reaches training storage. Data that is not there cannot leak from a model or a breached bucket.

## Harden training and the model supply chain

Modern teams rarely train from scratch; they fine-tune base models and pull datasets and libraries from public repositories. That is a supply chain, and it deserves supply-chain discipline.

- **Treat model files as executable content.** Some serialisation formats can execute code on load. Prefer safer formats where possible, load unverified weights only in isolated environments, and pin exact versions with checksums.
- **Source models and datasets deliberately.** Prefer well-maintained, widely scrutinised sources, and record what you pulled and why. An unvetted model of unknown provenance in a production pipeline is an unaudited dependency with very high privileges.
- **Lock down training infrastructure.** Training jobs often run with broad access to data stores. Scope credentials per job, isolate training environments from production, and log what each job read and wrote.
- **Protect experiment tracking and artefact stores.** Model registries and experiment trackers hold your crown jewels. Apply the same access control and audit logging you would give a production database.

## Defend the serving and inference layer

Once a model is deployed, it becomes an internet-adjacent service with all the usual API risks plus some model-specific ones.

Standard API hygiene comes first: authentication on every endpoint, rate limiting, input size limits and monitoring. These blunt the model-specific attacks too — model extraction (reconstructing your model by querying it at scale) and membership inference (probing whether specific records were in training data) both require large volumes of queries that sensible rate limits make expensive.

Then add model-aware controls. Validate inputs against expected ranges, since adversarial examples often sit outside natural distributions. Log inputs and predictions so you can investigate anomalies. And constrain what downstream systems do with predictions: a model score should inform a decision boundary you control, not directly trigger irreversible actions without limits or review thresholds.

If the pipeline serves an LLM application, add prompt-injection containment: separate untrusted content from instructions, restrict what tools the model can invoke, and validate outputs before they touch other systems.

## Make monitoring and response routine

Pipelines drift, and attacks on them often look like drift at first. Monitor input distributions, prediction distributions and performance metrics over time, and alert on abrupt changes. A poisoning attack, a data-source compromise and an upstream schema change can all present the same way — and all three deserve a fast response.

Prepare for model incidents the way you prepare for software incidents. Know how to roll back to a previous model version quickly, how to retrain from a known-good dataset snapshot, and who decides to pull a model out of production. Teams that version data and models properly can answer "what changed and when" in minutes; teams that do not can spend weeks on the same question.

Finally, make security part of the pipeline's definition of done. A model does not ship until its data sources are traced, its dependencies are pinned, its endpoint is rate-limited and its rollback path is tested. Encoding that as a checklist in code review or CI keeps the discipline alive after the initial push.

## Frequently asked questions

**Which single control gives the most protection for the least effort?**

Versioning — of datasets, code and model artefacts, with hashes. It is cheap, it enables tamper detection, exact reproduction of any training run, fast rollback, and credible incident investigation. Most other controls work better once versioning is in place, which is why it is the sensible first investment for a team starting from zero.

**Is data poisoning a realistic threat or a research curiosity?**

It is realistic wherever attackers can influence training inputs, which describes any pipeline learning from user behaviour, public content or third-party feeds. Attacks needing precise control over large fractions of data are harder in practice, but low-effort poisoning of feedback loops and scraped sources is well within reach of ordinary adversaries. Provenance tracking and ingestion validation are justified for any pipeline that learns from the outside world.

**Who should own ML pipeline security — the security team or the ML team?**

Both, with explicit ownership per layer. Security teams typically own identity, access, infrastructure and incident process; ML teams own data validation, model provenance and serving behaviour, because they understand the artefacts. The failure mode to avoid is each side assuming the other has it covered. A shared threat model and a joint review before each production launch closes that gap.

## Where to go from here

Securing pipelines well requires fundamentals in both security and applied machine learning, and the fastest way to find your gaps is to test yourself: the [free 3-minute skill check](/diagnostic) will show where you stand. For a structured path through defensive skills with graded, hands-on projects, see the [Cybersecurity course](/courses/cybersecurity).
