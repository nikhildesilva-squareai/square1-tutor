Triage is the first consequential decision in an emergency department, and it is made under the worst possible conditions: minimal information, no diagnosis, constant interruption, and a queue that keeps growing. Proposals to support it with machine learning are therefore reasonable and also unusually sensitive, because errors at this step propagate through everything that follows. This comparison sets out what established triage systems do well, what AI genuinely adds, and where the trade-offs sit.

## How traditional triage works and what it optimises for

Conventional triage runs on structured scales applied by experienced nurses — the Australasian Triage Scale, the Emergency Severity Index, the Manchester system and their national equivalents all follow the same logic. A patient is assessed briefly on presenting complaint, observations and clinical appearance, then assigned a category that determines target time to clinical assessment. The scales are deliberately coarse, because their purpose is not diagnosis but ordering.

Two features of this design are easy to overlook. First, the scales are built to fail safely: ambiguity is meant to push a patient into a more urgent category, not a less urgent one. Second, a large part of the decision is not in the scale at all. It sits in the assessor's pattern recognition — the patient who looks unwell in a way the observations do not yet reflect, the carer's account that reframes the presentation, the subtle change in a patient seen an hour earlier. That judgement is real, it draws on information no dataset captures, and it is also variable between assessors and degrades under fatigue and crowding.

Traditional triage's known weaknesses are consistency and throughput: different assessors give different categories to similar presentations, and under pressure the assessment compresses. These are precisely the weaknesses a statistical model is well placed to address.

## What AI adds to the triage decision

Machine learning models for triage typically take the structured data available at presentation — vital signs, age, arrival mode, presenting complaint text, and where available prior history from the record — and output either a predicted acuity category or a risk estimate for a downstream outcome such as admission, escalation to critical care, or early deterioration.

The most useful reframing is that these models often predict something different from what the scale measures. A nurse assigns a category; a model estimates the probability of an outcome. The difference cuts both ways. An outcome-based prediction can surface a patient whose observations are reassuring but whose feature combination is associated with deterioration. Equally, it knows nothing about other clinical reasons for urgency — pain control, safeguarding concerns, psychosocial risk — which matter to triage and are largely invisible to admission-prediction models.

Three genuine contributions stand out. Consistency: a model applies the same function at 3am as at 3pm. Breadth of input: it can incorporate prior record data that an assessor has no time to review. Continuous re-scoring: it can update as new observations arrive for patients already waiting, which is where deterioration in the waiting room actually happens and where human re-assessment is thinnest.

## Head-to-head on consistency, context, speed and accountability

**Consistency.** Models win clearly. Identical inputs produce identical outputs, and the sources of variation are documented rather than idiosyncratic. The caveat is that consistency is not correctness — a model can be reliably wrong in a systematic way, which is arguably more dangerous than being randomly wrong, because it is harder to notice.

**Contextual judgement.** Human assessors win, and by a wide margin on the cases that matter most. Appearance, behaviour, the account of a family member, an unusual social situation, a language barrier handled with improvisation — none of this is available to a model reading structured fields. Presenting-complaint free text carries some of it, which is why text-aware models tend to outperform purely tabular ones, but a triage note is a compressed summary of an encounter, not the encounter.

**Speed and scale.** Models win on marginal cost: once running, they can re-score every waiting patient continuously, which traditional triage cannot.

**Accountability.** Traditional triage has an unambiguous decision-maker. AI-assisted triage complicates this if the design is careless: if a model's category is accepted by default, responsibility becomes diffuse in exactly the setting where it needs to be clear. The designs that hold up keep the assessor as the decision-maker and treat the model output as an additional input, with disagreements recorded rather than silently resolved.

**Equity.** This one does not resolve cleanly either way. Human triage carries documented variability that can track patient characteristics in ways nobody intends. Models trained on historical decisions and outcomes can absorb those same patterns and apply them uniformly, which converts inconsistent bias into consistent bias. Neither option is automatically fairer, and the only way to know is to measure subgroup performance in the specific setting.

## Where AI triage sits in practice today

The deployments that have been easiest to justify are the least autonomous. Continuous deterioration scoring for patients already waiting — flagging someone whose repeat observations have drifted — adds a safety net without touching the initial category. Second-opinion prompts that surface when a model's estimate diverges sharply from the assigned category leave the decision with the nurse while catching potential under-triage. Operational forecasting of arrival volumes to plan staffing is triage-adjacent and carries no individual clinical risk.

Fully automated triage without a clinician in the loop is a much harder proposition, and not primarily for technical reasons. The scales exist inside a professional accountability structure; the initial assessment is itself a clinical encounter in which observations are taken and a patient is physically seen; and the failure mode of under-triage is severe.

## Evaluating a triage tool before it reaches a waiting room

The questions that matter most for a triage model are slightly different from general clinical AI.

Ask what it predicts, precisely. A model predicting admission is not a model predicting acuity, and conflating them will misalign the tool with the decision it is meant to support. Ask about under-triage specifically: aggregate accuracy is nearly irrelevant here, because the costs are wildly asymmetric, and the number that matters is how often genuinely urgent patients are placed in low-urgency categories. Ask whether it was validated in a department resembling yours — case mix, catchment, referral pathways and available specialties change base rates substantially. Ask what happens when data is missing, since at triage it frequently is, and a model that quietly imputes a normal value for an unmeasured observation is making a clinical assumption.

Then ask the workflow questions. Who sees the output, at what moment, and what are they expected to do with it? What flag volume per shift does the department have capacity to respond to? What triggers withdrawal of the tool? Silent-mode running before go-live answers most of these cheaply and without patient exposure.

## Frequently asked questions

**Can AI replace triage nurses?**

Current deployments do not, and the reasons are structural rather than a matter of model quality. Triage involves physically assessing a patient, taking observations, weighing information that never reaches a database, and holding professional accountability for the decision. What models do well is add consistency and continuous re-scoring around that assessment, which is why assistive designs — deterioration alerts, divergence prompts, flow forecasting — are the ones in use.

**Is an AI triage model more objective than a nurse?**

More consistent, not necessarily more objective. A model trained on historical data reproduces the patterns in that data, including any inequities in how patients were previously assessed or treated, and applies them uniformly. Consistency makes bias easier to measure but does not remove it, so subgroup performance testing in the actual deployment setting is essential rather than optional.

**What is the most important metric for a triage model?**

Performance on the under-triage side — how often patients who turn out to need urgent care are placed in lower-urgency categories — rather than overall accuracy. The cost of missing an urgent patient far exceeds that of over-prioritising a stable one, so the threshold should follow from that asymmetry.

## Where to go from here

If you want to work with the machinery behind these systems — risk models, threshold selection, subgroup evaluation, calibration under class imbalance — the [Machine Learning course](/courses/machine-learning) covers it through graded projects that Nova reviews line by line. Not sure where to start? The [free 3-minute skill check](/diagnostic) will tell you.
