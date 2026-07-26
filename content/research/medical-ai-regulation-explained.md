Regulation is often described as the obstacle slowing medical AI down. More accurately, regulators have been adapting frameworks built for physical devices — manufactured once, then sold — to software that can be modified weekly and behaves differently depending on the data it meets. This piece explains how current arrangements work, what evidence they ask for, and which questions remain unresolved.

## When software becomes a regulated medical device

The threshold question is intended purpose. Across major jurisdictions, software falls into medical device regulation when it is intended for a medical purpose — diagnosis, prevention, monitoring, prediction, prognosis or treatment of disease. Intent triggers the framework, not technical sophistication, which is why a simple rule-based calculator can be regulated while a complex model built for administrative use is not.

The consequence teams underestimate: what you claim your product does determines how it is regulated, and marketing language implying diagnostic capability can pull a product into scope its evidence base does not support.

Several categories sit outside or at the edge. Software purely for administrative purposes — scheduling, billing, resource forecasting — generally falls outside, as do systems that display or store data without interpreting it. Wellness products making non-medical claims often fall outside, though that line is thin and actively policed. Clinical decision support is the most contested territory: many jurisdictions treat support tools more lightly where a clinician can independently review the basis of the recommendation, and more heavily where the tool effectively drives management. That carve-out has been revised repeatedly, so read the current text rather than a summary.

## Risk classification and what it demands

Every major framework scales scrutiny to risk using similar logic: the significance of the information the software provides to a clinical decision, and the seriousness of the situation it is used in. Software informing a non-serious decision sits low; software driving management in a critical situation sits high.

Classification determines the route to market. Lower-risk products may require self-assessment plus declaration; higher-risk products require review by a regulator or notified body, clinical evidence and formal quality management — design controls, lifecycle risk management, traceability, post-market surveillance and incident reporting, all extending well beyond the initial submission.

For AI products, several of these bite in particular ways. Risk management has to address model-specific hazards — degradation on out-of-distribution inputs, subgroup underperformance, over-reliance by users. Traceability has to cover training data provenance, preprocessing, model version and threshold as a bundle, because changing any one changes behaviour. Post-market surveillance has to include monitoring for performance drift, which for conventional devices has no real analogue.

## The evidence regulators look for

The core question is whether the product performs as claimed, for the population claimed, in the setting claimed. That decomposes into analytical performance (does the software measure, detect or classify with characterised accuracy and reproducibility), clinical validation (does that output correspond to something clinically meaningful in the target population), and clinical utility where claimed (does using it improve care — which needs a study design capable of showing that, not accuracy figures).

Reviewers have become notably more sophisticated about dataset questions. Expect scrutiny of whether test data is genuinely independent of training data, whether it comes from sites and equipment not used in development, whether the population matches the intended use, and whether performance is broken down by clinically relevant subgroups. Aggregate metrics without subgroup analysis attract questions, and so does an unexplained threshold: the operating point is part of the product.

Human factors evidence matters more than teams anticipate. If the intended use assumes a clinician will review and can override, regulators may want evidence about how outputs are presented, whether users understand the confidence conveyed, and whether the design invites over-reliance. Where the safety case depends on a human in the loop, the quality of that loop is part of the device.

Transparency documentation is a growing expectation: a plain description of what the model was trained on, its known limitations, where evidence is thin, and when performance is expected to degrade. This is the piece most useful to a procurement team, and the piece most often written last.

## The change problem: models that learn after clearance

The deepest structural tension is that traditional device regulation assumes a fixed product. Software that is retrained, recalibrated or continuously updated breaks that assumption, and every regulator is working through it.

The general position is that changes affecting safety or performance require assessment before implementation, which effectively rules out unsupervised continuous learning in deployed high-risk products. The pragmatic response is to pre-specify a change envelope: what modifications will be made, by what method, against what criteria — so changes inside the pre-agreed envelope do not each need a fresh submission. Approaches along these lines are the most active area of medical AI regulatory policy.

The implication for teams is architectural. If you intend to update a model after release, design for it: version everything jointly, be able to reproduce any historical prediction, define acceptance criteria before training a new version, keep a rollback path, and monitor granularly enough to detect degradation in a subgroup rather than only in aggregate.

Drift is the related problem without a clean answer. An unchanged model can still degrade because its inputs change — new scanners, revised protocols, shifting case mix. Obligations to monitor exist; when observed drift constitutes a reportable change in device performance is not fully settled.

## Overlapping regimes and the open debates

Medical AI now sits under several regimes at once. Device regulation governs safety and performance; data protection law governs the lawful basis for using patient data and individual rights; horizontal AI legislation — of which the European Union's is the most developed example — adds obligations on risk management, data governance, documentation and human oversight for high-risk systems, layered on top of device requirements rather than replacing them. Professional regulation governs clinician conduct, and liability law determines who answers when something goes wrong.

Several disagreements remain unresolved. Whether pre-market evidence requirements are calibrated correctly, given that the most informative evidence is generated in real use. How to allocate responsibility between developer, deploying institution and clinician when a model contributes to a harm — an allocation that most legal systems have not settled. Whether transparency obligations should extend to disclosing training data composition, which developers resist on commercial grounds and clinicians want for exactly that reason. How to regulate general-purpose models repurposed for clinical use by someone other than their developer, where the intended-purpose test becomes difficult to apply. And whether the pace of approval frameworks can keep up with a technology whose capabilities shift on a shorter cycle than regulatory guidance is revised.

None of these has a settled answer, and anyone claiming otherwise is describing a preference rather than the law.

## Frequently asked questions

**Is all clinical AI regulated as a medical device?**

No — it depends on intended purpose. Software intended for diagnosis, prognosis, monitoring or treatment generally falls within device regulation, while purely administrative tools generally do not. Clinical decision support is the contested middle: several jurisdictions treat it more lightly where a clinician can independently review the basis for the recommendation, and that boundary has been revised more than once.

**Can a deployed medical AI model keep learning from new data?**

Not freely. Current frameworks require changes affecting safety or performance to be assessed before they take effect, which precludes unsupervised continuous learning in higher-risk products. The emerging accommodation is to pre-specify the change, the method and the acceptance criteria, so modifications inside that envelope proceed under existing authorisation.

**Does regulatory clearance mean a model will work in my hospital?**

Not on its own. Clearance reflects evidence for a stated intended use in a stated population, generated at particular sites with particular equipment. If your case mix, scanners or care pathways differ, local evaluation before and after go-live remains necessary — which is why transparency documentation about training data and known limitations is the most practically useful part of a submission.

## Where to go from here

Much of what regulators now ask for — independent test data, subgroup analysis, justified thresholds, calibration, monitoring for drift — is simply good machine learning practice written into requirements. The [Machine Learning course](/courses/machine-learning) builds those habits through graded projects that Nova reviews alongside your written reasoning. If you would like to see where your current skills sit, the [free 3-minute skill check](/diagnostic) is a short starting point.
