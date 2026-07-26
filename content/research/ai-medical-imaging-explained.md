A chest radiograph is, to a computer, a grid of intensity values. The interesting question in medical imaging AI is how a model turns that grid into something a clinician can act on — a flag, a measurement, a sorted worklist — and how much confidence that output deserves. This explainer walks through the mechanics, the data behind them, and the checks that decide whether an imaging model belongs anywhere near patient care.

## What medical imaging AI is actually asked to do

"AI reads scans" hides at least four different tasks, and they have very different difficulty profiles. **Classification** answers a whole-image question: is there evidence of a pneumothorax in this radiograph, yes or no, with some score attached. **Detection and segmentation** localise findings — drawing a box around a suspicious nodule, or outlining an organ pixel by pixel. **Quantification** replaces manual measurement: ventricular volumes on cardiac MRI, lesion diameters over successive scans, bone density estimates. **Triage and prioritisation** does not attempt a diagnosis at all; it reorders the reading queue so studies that look time-critical surface earlier.

That last category is worth separating out, because it is where a lot of deployed systems sit. A triage tool that moves a likely intracranial haemorrhage to the top of a worklist changes the order in which a radiologist works, not the content of the report. The clinical claim is modest and the failure mode is comparatively contained, which is exactly why these products have been easier to introduce than anything claiming to produce a diagnosis autonomously.

## From pixels to predictions: the model families involved

Convolutional neural networks remain the workhorse of the field. Their inductive bias — local receptive fields, weight sharing, translation tolerance — matches image structure well and lets them learn useful features from datasets far smaller than a general-purpose vision model would need. For segmentation, encoder–decoder architectures with skip connections (the U-Net family and its many descendants) are still the default starting point, because the skip connections preserve the fine spatial detail that a pure downsampling encoder throws away.

Transformer-based vision models entered medical imaging later and behave differently: they model long-range relationships across an image more naturally, but they are hungrier for data, which in a domain with expensive labels is a real constraint. The practical response has been self-supervised pretraining — learning general image representations from large volumes of unlabelled scans, then fine-tuning on a small labelled set for the specific task. Hybrid designs that combine convolutional feature extraction with attention layers are common precisely because they hedge between the two.

Three-dimensional data adds its own complications. A CT volume can be treated as a stack of independent slices, as a genuine 3D input, or as a set of orthogonal views, and each choice trades off spatial context against memory and compute. Models that reason over 3D context tend to do better on findings that are only interpretable across slices, at the cost of much heavier training requirements.

## Why training data quality dominates architecture choice

Teams new to the field often over-invest in architecture and under-invest in labels. In medical imaging, the reference standard is rarely clean. If the label comes from a radiology report parsed with text rules, it inherits the report's ambiguity and the parser's mistakes. If it comes from a single reader's annotation, it inherits that reader's thresholds — and inter-reader disagreement on subtle findings is a well-recognised feature of clinical practice, not an anomaly. Models trained on noisy labels can look excellent against equally noisy test labels while being unreliable in use.

Then there is domain shift. Images vary by scanner vendor, acquisition protocol, reconstruction kernel, slice thickness, contrast timing, patient positioning and population case mix. A model that learnt to associate a particular imaging artefact or a particular scanner's noise profile with disease has learnt something real about its training hospital and nothing generalisable. This is why performance so often drops when a model moves to a new site, and why external validation on data from institutions and equipment the model has never seen is the single most informative test available.

## How imaging models fit into a radiology workflow

A model that never reaches a clinician's screen has no clinical effect, so integration is part of the design problem. Most deployments hook into the existing imaging infrastructure — receiving studies from the picture archiving and communication system, returning results as structured findings, overlays, secondary capture images, or worklist priority flags. Latency budgets are real: a triage tool that returns a result after the radiologist has already read the study contributes nothing.

The human-factors side is subtler. Highly sensitive detection tools generate false positives, and false positives cost reader time and attention. Too many, and clinicians start dismissing flags reflexively — the imaging equivalent of alarm fatigue, which erodes the benefit of the tool without removing its cost. There is also the question of anchoring: a prominent AI overlay can influence a reader's own interpretation, in either direction. Well-designed studies of these systems measure the clinician-plus-model pairing rather than the model alone, because that pairing is what actually operates in the hospital.

Throughout, the operating assumption in current practice is support rather than substitution. The model narrows attention, measures consistently, and never gets tired at the end of a long list; the clinician holds the clinical context, the patient history, the differential and the responsibility for the report.

## What credible evaluation looks like before deployment

A single accuracy figure on a held-out split tells you very little. The evaluations that carry weight share several features. They report performance on data from sites, scanners and populations not represented in training. They break results down by subgroup — age, sex, device, disease severity, image quality — because aggregate performance can conceal a subgroup where the model is unreliable. They state the operating threshold explicitly and justify it against the clinical cost asymmetry, since a missed finding and a false alarm rarely carry equal weight. They examine calibration, not just discrimination: whether a score of 0.8 corresponds to anything meaningful in practice. And they include prospective assessment, because retrospective curated datasets are systematically easier than the messy stream of studies a live system receives.

After deployment, monitoring matters as much as validation. Scanner fleets get upgraded, protocols change, referral patterns shift, and a model's input distribution drifts away from what it was tested on. Tracking flag rates, agreement with final reports and subgroup performance over time is how teams notice degradation before anyone else does.

## Frequently asked questions

**Do imaging models replace radiologists?**

Not in the way the framing suggests. Deployed systems handle narrow, well-specified tasks — flagging a candidate finding, measuring a structure, reordering a queue — while interpretation, correlation with clinical history and the final report remain clinical work. The realistic effect is a redistribution of attention within the reading workflow, and reporting on medical AI tends to describe assistive rather than autonomous roles.

**How much data is needed to train a useful imaging model?**

There is no single number, and it depends far more on task difficulty, label quality and the variability of the imaging than on a raw count. Fine-tuning a pretrained model for a well-defined, visually distinctive finding needs far less labelled data than learning a subtle diagnosis from scratch. The more useful question is whether the dataset spans the scanners, protocols and patient populations the model will meet in use.

**Why do published results often exceed real-world performance?**

Because published evaluation sets are usually curated: poor-quality studies excluded, findings confirmed, class balance tidied, and often all data drawn from one or two institutions. Live systems get everything, including truncated series, motion artefacts, unusual anatomy and cases outside the training distribution. The gap is expected, which is why external and prospective validation are treated as prerequisites rather than extras.

## Where to go from here

If you want to build the technical intuition behind these systems — convolutions, segmentation architectures, evaluation design — the [Computer Vision course](/courses/computer-vision) works through them with graded projects that Nova reviews alongside your code. If you would rather find out where your current skills sit first, the [free 3-minute skill check](/diagnostic) gives you a starting point.
