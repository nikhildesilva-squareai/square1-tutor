Health-tech hiring managers screen for something narrower than "machine learning experience". They are looking for people who can handle messy clinical data without producing a leaked model, who understand why validation in this domain is different, and who can work alongside clinicians without either deferring entirely or talking past them. This is a practical map of the skills that matter, organised by how much they differentiate a candidate.

## The roles that exist, and what they are responsible for

The job titles overlap confusingly, so it helps to look at the work instead.

**Clinical data scientist / clinical ML engineer.** Builds and validates predictive models on record data, imaging or signals. Spends more time on cohort definition, feature availability and evaluation design than on model architecture. Usually works closely with a clinical lead who owns the question.

**Machine learning engineer (health platform).** Owns the pipelines, training infrastructure, inference services and monitoring. In regulated products this role carries a heavy documentation and reproducibility burden — being able to reconstruct exactly which model version produced which output is a functional requirement, not a nicety.

**Clinical informatics specialist.** Sits between the electronic record and the analytics layer. Knows how data is captured in practice, which fields are trustworthy, what coding conventions mean, and where interoperability standards do and do not help.

**Regulatory / quality engineer for software as a medical device.** Translates development work into the evidence and documentation that clearance and post-market surveillance require. Increasingly this role needs genuine ML fluency, because the questions regulators ask are technical.

**Applied research scientist.** Works on methods — segmentation, representation learning, multimodal fusion, uncertainty quantification — usually alongside clinical collaborators, with publication expectations.

## Core technical skills that transfer directly

Certain foundations are assumed and get tested rather than discussed. Python with the standard scientific stack, and enough software engineering to write code someone else can run: version control, environments, tests, reproducible pipelines. SQL that goes beyond joins — window functions, temporal logic, cohort extraction from event tables — because clinical data lives in relational systems and the extraction step is where most errors originate.

On the modelling side, depth beats breadth. Gradient-boosted trees and regularised regression handle a large share of tabular clinical prediction and are often preferred for tractability, so knowing them well, including their calibration behaviour, is more valuable than a shallow acquaintance with many architectures. For imaging roles, convolutional and encoder–decoder architectures, segmentation losses, augmentation strategy and the practicalities of 3D data. For signals, time-series handling, windowing and the specific problem of irregular sampling.

Statistics carries more weight here than in most ML settings. Survival analysis appears constantly because clinical outcomes are censored, class imbalance is the norm, missingness is informative rather than a nuisance, and confidence intervals on subgroup performance are expected in any serious evaluation. Candidates who reason about uncertainty rather than reporting point estimates stand out quickly.

## The health-specific skills that separate candidates

Everything above gets you screened in. These are what distinguish a strong candidate.

**Leakage detection as a reflex.** The ability to look at a feature list and immediately ask whether each item would truly have been available at prediction time — before the outcome, before the clinician acted, before the confirmatory test was ordered. This single habit prevents the most common category of invalidating error, and interviewers probe for it directly.

**Cohort and outcome definition.** Turning a clinical question into an operational definition: inclusion and exclusion criteria, index time, prediction window, how the outcome is ascertained from available data and what that ascertainment misses. This is where clinical and technical judgement meet, and it is difficult to fake.

**Validation design.** Grouped splits by patient, temporal splits, site-held-out validation, external validation, calibration, pre-specified subgroup analysis, threshold selection from clinical cost asymmetry. Being able to explain why a random split is inappropriate is close to a shibboleth in this field.

**Fluency with clinical data structures.** How observations, orders, results, medications and diagnoses relate in a record system; what interoperability standards represent; why timestamps are unreliable in specific ways; how coding practices differ between institutions and change over time.

**Working with clinicians.** Asking questions that respect their time, presenting results without overclaiming, understanding that a model which does not fit the workflow will not be used regardless of its metrics, and being able to say clearly what a model does not do. Communication here is a technical skill, because the failure mode is a model built for a question nobody asked.

## Regulatory and governance literacy you are expected to have

You do not need to be a regulatory specialist, but you are expected to know the shape of the landscape. That means understanding that software intended for a medical purpose can be regulated as a device, that the level of oversight scales with the risk of the intended use, and that the intended-use statement is therefore a consequential engineering artefact rather than marketing text. It means knowing that changes to a deployed model may need to be managed under a change-control process rather than shipped continuously, which has real implications for how you architect retraining.

On the data side, expect questions about lawful basis, purpose limitation, de-identification and its limits, and the difference between the technical possibility of moving data and the permission to do so. Familiarity with how ethics or governance committees assess a proposal is useful, as is knowing what a data access agreement typically constrains — purpose, retention, security, re-identification prohibition, and what happens to derived models when the agreement ends.

Requirements differ by jurisdiction, so learn the framework where you intend to work. What transfers is the underlying logic: document the intended use, evidence the claim, control changes, monitor after release.

## Building a portfolio without access to patient data

The obvious obstacle for someone entering the field is that the interesting data is inaccessible. Several routes work around it.

Open datasets exist for medical imaging, physiological signals and de-identified critical care records, generally under access conditions worth reading carefully. Public challenges provide well-defined tasks with established baselines, which makes your result interpretable to an assessor. Failing that, a rigorous methodological project on a non-clinical dataset still demonstrates the skills that matter, because the discipline is what is being assessed.

What makes a portfolio project persuasive in this field is rarely the model. It is the write-up: a clear intended use, an explicit cohort definition, a justified split strategy, a threshold chosen with stated reasoning, calibration and subgroup results with uncertainty, and an honest limitations section naming what would need to be true before the thing could be used. Reviewers read that section first, and a strong metric with no discussion of generalisability signals inexperience regardless of the number.

## Frequently asked questions

**Do I need a clinical background to work in health AI?**

No, and most people in these roles do not have one. What is required is enough domain literacy to avoid category errors — understanding how the data was generated, what a diagnosis code actually represents, why timing matters — plus the habit of checking assumptions with a clinical collaborator rather than resolving them yourself. Teams are usually built to pair technical and clinical expertise deliberately.

**Which is more useful to learn first, tabular modelling or medical imaging?**

Tabular and time-series work on record data covers a larger share of open roles, and the skills it builds around cohort definition, leakage and validation transfer to every other modality. Imaging is a strong specialisation with a distinct toolkit and is worth pursuing if the work interests you specifically. Learning validation discipline on tabular problems first tends to make imaging work better, not the reverse.

**How much does regulatory knowledge matter for a first role?**

Enough to demonstrate awareness rather than expertise. Being able to explain what an intended-use statement is, why it constrains validation, and why deployed models need change control will distinguish you from candidates who treat health AI as ordinary ML with sensitive data. Depth can be built on the job, usually alongside a quality or regulatory colleague.

## Where to go from here

If the tabular and validation side is where you want to build, the [Machine Learning course](/courses/machine-learning) covers it through graded projects with Nova reviewing your code and reasoning. If imaging is the draw, the [Computer Vision course](/courses/computer-vision) works through the architectures and evaluation practices that clinical imaging work is built on.
