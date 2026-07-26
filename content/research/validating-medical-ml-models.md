Validation is where most medical machine learning projects quietly fail, and usually not because the model was bad. They fail because the evaluation answered an easier question than the clinical one — a random split instead of a new hospital, an aggregate score instead of a subgroup breakdown, a retrospective dataset instead of a live stream. This is a practical walk through the sequence of checks that separates a promising model from one that can be responsibly deployed.

## Start with the intended use statement, not the data

Before any splitting or metric selection, write down what the model is for in a form specific enough to be falsifiable. Which patients does it apply to, defined by age, setting, presentation and clinical pathway? What input data must be present, and what happens when it is not? At what point in the workflow does the prediction arrive, and what is the clinician expected to do with it? Which outcome is being predicted, over what horizon, and how is that outcome ascertained?

This statement determines everything downstream. It defines the population your validation set must represent, the moment in time from which features may be drawn, and the comparison your model must beat — which is usually not "nothing" but current practice, an existing risk score, or clinical judgement unaided. Teams that skip this step often discover late that their model was trained on a population it will never see, or that it predicts an outcome nobody can act on.

## Internal validation: splits that respect clinical structure

Random row-level splitting is the default in general machine learning and is usually wrong for clinical data, because clinical data is grouped and ordered in ways that leak.

**Group by patient.** If one patient contributes several encounters, images or time windows, all of them must sit on the same side of the split. Otherwise the model can recognise the patient rather than the condition, and the test score is inflated in a way that no amount of cross-validation will reveal.

**Respect time.** Clinical practice, coding conventions, case mix and treatment protocols all change. A temporal split — train on earlier data, test on later — mimics the direction in which the model will actually be used and exposes sensitivity to drift that a random split hides.

**Respect site.** If data comes from multiple hospitals, holding out whole sites is a far more informative internal test than mixing them, because site-specific artefacts are the most common source of non-generalisable learning.

Two leakage checks are worth running mechanically on every project. First, for each feature, confirm it could have been observed strictly before the prediction time — not before the outcome, before the prediction. Discharge-time variables, downstream orders and treatment codes are the usual offenders. Second, look for features that are proxies for the label's ascertainment rather than the condition: a model that learns "this patient had a confirmatory test ordered" has learnt that a clinician was already suspicious.

## External validation across sites, scanners and populations

External validation means evaluating on data the model has never seen from a source it has never been trained on — a different institution, a different equipment fleet, a different country, a different care model. It is the closest available proxy for deployment, and performance drops there are the norm rather than a sign of incompetence.

The useful discipline is to interpret the drop rather than just report it. Compare the input distributions between development and external data: which features shifted, and by how much? Check whether the outcome definition is truly the same, since coding practices and diagnostic thresholds vary between systems. Look at whether the drop is concentrated in particular subgroups or particular ranges of the score. A model whose discrimination holds but whose calibration collapses is often recoverable by recalibrating to the new population; a model whose ranking breaks down has learnt something local and needs rebuilding.

For imaging, external validation should span scanner vendors, acquisition protocols and reconstruction settings, because those are the variables most likely to have been silently memorised. For tabular models, it should span documentation practices and data-capture systems, which shape missingness patterns more than clinicians realise.

## Subgroup analysis, calibration and threshold selection

An aggregate figure can hide a subgroup where the model is unusable. Pre-specify the subgroups you will examine — age bands, sex, relevant ethnicity or ancestry groupings where available and appropriate, comorbidity burden, disease severity, care setting, device or scanner, data completeness — and report performance in each with honest uncertainty. Small subgroups will have wide intervals, and saying so is better than reporting a point estimate as if it were solid.

Calibration deserves separate attention from discrimination. Discrimination asks whether the model ranks patients correctly; calibration asks whether the numbers mean anything. If a clinician is going to treat 0.2 as a one-in-five risk, calibration curves and calibration-in-the-large need to be reported, and they need to be reported per subgroup, because a model can be well calibrated overall while systematically over- or under-predicting in a specific group.

Threshold selection is a clinical decision dressed as a technical one. It follows from the asymmetry between a missed case and a false alarm, from the capacity of the team that will respond, and from the alert burden the workflow can absorb. Report the operating point you intend to use, the expected volume of positives at that point in the target population, and what happens to sensitivity if the threshold is moved to control that volume. Anything less leaves the implementing site to guess.

## Prospective evaluation and post-deployment monitoring

Retrospective validation, however careful, uses data that has already been cleaned by the passage of time. Prospective evaluation runs the model on the live stream — with real latency, real missingness, real edge cases and real integration behaviour — and it routinely surfaces problems that no retrospective analysis found. A silent phase, where the model runs and logs but shows nothing to clinicians, is the standard way to do this without exposing patients to an unproven tool.

Once live, monitoring replaces validation as the primary safeguard. Track input distributions for drift, output distributions for unexpected shifts in flag rate, subgroup performance for divergence, and the operational metrics around the alert itself. Define in advance what would trigger recalibration, retraining or withdrawal, and who has the authority to pull the tool. A model without a documented off-switch and an owner is a governance gap regardless of how well it validated.

## Frequently asked questions

**Is cross-validation enough for a clinical model?**

Cross-validation is a useful tool for internal model selection, but on its own it does not test the thing you need to know. It reuses the same population, sites and time period, so it cannot detect site-specific shortcuts, temporal drift or population shift. Grouped and temporal splits improve it; external validation on unseen sources remains the step that best predicts deployment behaviour.

**What is a reasonable performance drop between internal and external validation?**

There is no universal number, and quoting one would be misleading. What matters is whether performance at the intended operating point remains clinically acceptable, whether the loss is in discrimination or calibration, and whether it is concentrated in a subgroup that the tool is meant to serve. A modest, well-understood, recalibratable drop is a different situation from an unexplained collapse.

**Who should sign off that a medical model is validated?**

In practice, no single person. The credible arrangements involve clinical ownership of the intended use and threshold, technical ownership of the pipeline and monitoring, and an independent review that can say no — plus documentation good enough that someone uninvolved could reconstruct why each decision was made. Regulatory requirements sit on top of this and vary by jurisdiction and risk classification.

## Where to go from here

Validation discipline is a transferable skill: honest splits, calibration, subgroup analysis and drift monitoring matter in any high-stakes domain. The [Machine Learning course](/courses/machine-learning) builds those habits through graded projects, with Nova reviewing your code and your written justification for each choice. To see where your current skills sit before committing time, try the [free 3-minute skill check](/diagnostic).
