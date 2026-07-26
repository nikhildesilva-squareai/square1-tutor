Bias in clinical models is usually discussed as if it were a property of an algorithm. It is more accurately a property of a pipeline — who ended up in the dataset, how their measurements were taken, what was recorded as the outcome, and who the model is used on afterwards. Understanding where in that chain the problem entered determines whether a remedy will help or merely make the metrics look tidier.

## What bias means in a clinical model, precisely

The word carries at least three distinct meanings in this context, and conflating them makes conversations unproductive.

**Statistical bias** is a systematic difference between what a model estimates and the true quantity — a technical property, measurable given a reference standard.

**Performance disparity** is unequal model quality across groups: worse sensitivity for one population, poorer calibration for another. This is what most fairness auditing measures.

**Harm distribution** is the clinically relevant question: does using this model make care worse for some group than it would have been otherwise? A model with equal metrics across groups can still entrench harm if it faithfully reproduces an inequitable existing pattern. This framing is the one that matters and the hardest to measure, so most practical work proxies it with performance disparity while remembering the proxy is imperfect.

A genuine complication: not all group differences are bias. Disease prevalence and physiology do differ across populations, and a model reflecting a real difference is not thereby unfair. Separating a real clinical difference from an artefact of data collection usually needs clinical input to settle.

## Where bias enters: sampling, measurement, labels and proxies

**Sampling.** Datasets reflect who reaches the institutions that generated them. Populations with poorer access to care are under-represented, and when they do appear they are often captured at later disease stages, in different settings, with more fragmented records.

**Measurement.** Instruments are not neutral. Physiological monitoring devices can perform differently across patient characteristics — differential accuracy of pulse oximetry across skin pigmentation is a well-documented example — and a downstream model inherits that measurement error as if it were signal. Equipment quality also varies between well-resourced and under-resourced settings, so data source can correlate with patient demographics in ways a model will happily exploit.

**Labels.** Clinical labels are recorded decisions, not ground truth. A diagnosis code reflects that a clinician recognised, documented and coded a condition. Where diagnosis is delayed or symptoms dismissed more often in a particular group — which the clinical literature documents for several conditions — a model trained on those labels learns to under-recognise the same group.

**Proxies.** The most consequential failures come from using an available variable as a stand-in for the one you care about. Using healthcare utilisation or spending as a proxy for clinical need is a documented failure pattern, because access and spending differ for reasons unrelated to illness; the resulting model systematically underestimates need in groups that historically received less care. Similar problems arise with proxies for adherence, severity or social risk.

**Deployment.** A model can be unbiased in development and biased in use, by being applied to a population it was not validated on, or by being acted on differently in different settings — a flag that triggers a rapid response in a well-staffed hospital and nothing at all in an understaffed one.

## Why aggregate metrics conceal the problem

A single headline metric averages over the population, so a subgroup can be poorly served without moving the number — particularly if that subgroup is small, and under-represented subgroups are small by definition.

Calibration deserves particular attention because it is frequently ignored. A model can rank patients correctly within every group while systematically under-predicting risk in one of them; under a uniform threshold, that group crosses it less often at the same underlying risk. Reporting calibration per subgroup catches this; discrimination alone does not.

The fairness metrics literature also contains an uncomfortable result worth knowing: several intuitively desirable criteria — equal false negative rates, equal positive predictive value, calibration within groups — cannot generally all hold at once when base rates differ between groups. Fairness in a clinical model is therefore a choice about which error to equalise, justified by clinical consequence, rather than a box to tick.

## Remedies that help, and remedies that only look like they help

**Genuinely useful.** Improving representation in training data, especially by adding sites that serve different populations, addresses the cause rather than the symptom. Auditing the outcome definition — does the label measure the clinical state or a decision about it — frequently uncovers the real problem. Replacing a proxy with a more direct measure of the target, even a noisier one, has produced substantial improvements in documented cases. Reporting subgroup performance with honest uncertainty intervals makes disparities visible early, and group-specific recalibration is often the cheapest effective fix where discrimination holds but calibration diverges.

**Often ineffective or counterproductive.** Simply removing sensitive attributes rarely works, because clinical data is dense with correlates: postcode, insurance status, referral pathway and device type all carry the information. It also removes the ability to measure disparity. Enforcing equal metrics by degrading performance for the better-served group improves a statistic without improving anyone's care. Reweighting can shift where the error lands rather than reducing it, so it needs evaluating against harm. And a fairness audit performed once at launch provides limited assurance, since populations and practices drift.

The historical use of race as a direct input to clinical risk equations, and the subsequent revision of several such equations, illustrates a broader lesson: a variable that improves fit may be standing in for structural factors rather than biology. Whether to include such variables is an active clinical debate, not a settled technical question.

## Who is accountable, and the open disagreements

Several substantive disagreements remain unresolved, and it is more honest to name them than to imply consensus.

Should models be permitted to use group membership when it genuinely improves accuracy, weighed against the risk of entrenching disparity? What is the right comparator — equal performance across groups, or the equity of current practice, which is itself uneven? Should a model that is unequal but better than the status quo for everyone be deployed while a better one is developed, or withheld? And who bears responsibility when a disparity surfaces after release: the developer, the deploying institution, or the body that approved it?

What is less contested is process. Disparities should be looked for deliberately, before release and continuously after; subgroups should be pre-specified rather than chosen after seeing results; someone should have authority to withdraw a tool; and the intended-use statement should say plainly which populations the evidence covers, so a model is not silently extended to patients it was never tested on.

## Frequently asked questions

**Does removing race or sex from the model make it unbiased?**

Generally no. Clinical datasets contain many correlated variables that carry the same information indirectly, so the model can reconstruct what was removed. Worse, without those attributes you lose the ability to measure whether performance differs across groups, so a disparity can persist undetected. Standard practice is to retain the attributes for evaluation purposes while thinking carefully about whether they belong among the inputs.

**Is a biased model always worse than no model?**

Not necessarily, and this is one of the genuine open debates. A model with unequal performance might still improve care for every group relative to current practice, or it might improve care for some while worsening it for others — a different situation entirely. Answering requires measuring harm by subgroup against the realistic alternative, not against an ideal model that does not exist.

**How often should fairness be re-evaluated after deployment?**

Continuously, as part of routine monitoring rather than as a periodic audit, since populations shift, referral patterns change and equipment is replaced. Practical programmes track subgroup performance on the same cadence as other operational metrics and define in advance what would trigger recalibration or withdrawal.

## Where to go from here

Measuring subgroup performance, reading calibration curves and reasoning about error trade-offs are core machine learning skills, not specialist ethics topics. The [Machine Learning course](/courses/machine-learning) builds them through graded projects that Nova reviews alongside your written justification. If you want to gauge your current level first, the [free 3-minute skill check](/diagnostic) is a quick starting point.
