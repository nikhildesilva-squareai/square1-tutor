Health records are among the most tightly regulated categories of personal data anywhere, and machine learning wants exactly what regulation restricts: large volumes of granular, longitudinal, identifiable detail. Most privacy failures in health AI are not dramatic breaches but ordinary process gaps — a dataset copied to a laptop, a de-identification step that was weaker than assumed, a model that memorised more than intended. This piece maps the practical terrain teams have to navigate.

## Why health data is treated differently from other personal data

Data protection regimes in most jurisdictions single out health information for stronger protection than ordinary personal data, and the reasoning is consistent across them. Health data is unusually revealing about a person's life, it cannot be reissued the way a compromised card number can, and disclosure carries durable consequences for employment, insurance, relationships and reputation. The asymmetry is permanent: a diagnosis exposed today stays exposed.

For teams, the practical upshot is that the default answer to "can we use this data for that?" is no until a lawful basis, an approved purpose and documented safeguards exist. Purpose limitation is enforced: data gathered to deliver care is not automatically available to train a model, even inside the same organisation.

There is also a trust dimension above compliance: secondary uses that would surprise patients, even lawful ones, carry reputational risk for the institution. The legal question and the public-acceptability question are not the same question.

## De-identification and its limits

De-identification is the workhorse control, and it is routinely over-trusted. Removing direct identifiers — names, record numbers, contact details — is straightforward. The difficulty is quasi-identifiers: combinations of attributes that are individually unremarkable and jointly unique. Dates of service, postcode, age, rare diagnoses, unusual medication combinations and long event sequences all narrow the field of candidate individuals quickly. Re-identification research has repeatedly demonstrated that small attribute combinations can single people out of large datasets, particularly where an external dataset can be linked against.

Modality matters too. Free-text clinical notes leak identifiers in places automated scrubbing misses: names in the middle of a narrative, references to an employer or a relative, distinctive circumstances of an injury. Imaging carries identifiers in DICOM metadata, in burned-in annotations on the pixels themselves, and structurally — a head CT or MRI contains enough facial anatomy to reconstruct a recognisable surface, which is why defacing steps exist for neuroimaging. Genomic data is effectively unmaskable, since a genome is an identifier by construction.

The sensible framing is that de-identification reduces risk rather than eliminating it, and the residual risk depends on what an adversary could link against. That is why de-identification is normally paired with access controls, contractual restrictions on re-identification attempts, secure environments and audit logging rather than treated as sufficient on its own.

## Consent, secondary use and the governance path to data access

Consent in health AI is genuinely complicated, because the model of consent that works for a single clinical procedure fits research and product development poorly. Specific consent for a defined study is clear but does not scale to future uses that were not foreseeable at the time. Broad consent for research covers more but requires ongoing governance to define what falls inside it. Waivers, where they exist, typically rest on a public-interest argument plus demonstrable safeguards and impracticability of individual consent, and they are granted by an oversight body rather than assumed by the team.

For commercial development the bar is higher, particularly where data leaves the custodian organisation. Data access agreements typically specify the permitted purpose, retention period, security controls, prohibitions on re-identification and onward transfer, and what happens to derived artefacts — including trained models — when the agreement ends.

The practical route to access almost always runs through an institutional governance process — an ethics or research committee, a data custodian, a privacy impact assessment, and increasingly a specific review of algorithmic risk. Engaging early is where you find out whether the data can leave the institution at all, which shapes the entire technical architecture.

## Techniques that reduce data movement

Because moving data is the riskiest step, a family of approaches tries to avoid it.

**Federated learning** trains a shared model by exchanging model updates rather than records: each site trains locally and only parameter updates are aggregated. This genuinely reduces exposure and can make multi-site collaboration feasible where pooling is not. It is not a privacy guarantee on its own — updates can leak information about training data — so it is usually combined with secure aggregation and noise addition. It also brings real difficulties: heterogeneous data across sites, uneven volumes, version coordination and training infrastructure at every participant.

**Differential privacy** adds calibrated noise so that any single record has bounded influence on the output. It fits aggregate statistics and query interfaces well; at the noise levels considered strong, the accuracy cost in small clinical datasets is harder to justify.

**Synthetic data** generates artificial records that preserve statistical structure. It is useful for development, testing and sharing pipelines, and a poor substitute for real data in final validation. It is also not automatically private: generators can reproduce distinctive real records, so evaluating the generator is part of the work.

**Trusted research environments** take the opposite approach — bring the analyst to the data. Researchers work inside a controlled environment with no bulk export, and only reviewed outputs leave.

## Privacy risks that live in the model, not the dataset

Once trained, a model can itself be a disclosure channel. Membership inference attacks try to determine whether a specific individual's record was in the training data — which, for a model trained on a disease-specific cohort, may reveal the diagnosis. Model inversion attempts to reconstruct representative training inputs. Large models trained on free text can memorise and later reproduce distinctive passages, including identifying detail. The risk rises with model capacity, with repeated exposure to unique records, and with unrestricted query access.

The practical controls are mostly familiar: deduplicate and scrub training text rather than relying on the model to forget, avoid over-training on small unique cohorts, restrict and log inference access, filter outputs where reproduction is plausible, and treat model artefacts with the same classification as the data they were trained on. Sending patient data to a third-party inference service adds a processing relationship that needs its own legal basis, contractual terms and assurance that inputs are not retained or used for further training.

Deletion is the awkward corner. Removing a withdrawn patient's record from a dataset is straightforward; removing their contribution from a trained model is not, short of retraining. Decide your position on this before it is asked of you.

## Frequently asked questions

**Is de-identified health data safe to use freely?**

De-identification substantially reduces risk but does not make data risk-free, and most regulators treat the residual risk as real. Combinations of dates, location, age and rare conditions can narrow a record to a small number of individuals, and notes and images carry identifiers in less obvious places. Standard practice is to layer de-identification with access controls, contractual prohibitions on re-identification, secure environments and logging.

**Does federated learning remove the need for data governance?**

No. It reduces data movement, which is a meaningful improvement, but the model updates it exchanges can carry information about the underlying records, so it is usually paired with additional protections. Each participating site still needs a lawful basis for local training, and the collaboration still needs agreements covering purpose, security, publication and what happens to the resulting model.

**Can patient data be sent to a hosted AI service?**

Only within a governance framework that permits it — which means a lawful basis, an agreement with the provider covering processing, retention and further training, an assessment of where data is stored and under whose jurisdiction, and institutional approval. Some organisations permit it under specific contractual terms; others prohibit external transfer entirely and require self-hosted models. This is a decision for the data custodian, not the engineering team.

## Where to go from here

Handling data responsibly is part of the craft of building models, not a separate compliance chore — and the technical habits behind it are learnable. The [Machine Learning course](/courses/machine-learning) works through data handling, leakage and evaluation with graded projects that Nova reviews. If you want a quick sense of your current level first, the [free 3-minute skill check](/diagnostic) takes a few minutes.
