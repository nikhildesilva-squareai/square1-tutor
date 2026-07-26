Drug discovery is an appealing target for machine learning because so much of it is search: search through possible targets, possible molecules, possible modifications, possible failure modes. It is also a domain where the expensive part of the process is the part least amenable to computation. Separating those two facts is the whole of an honest assessment, and this piece attempts one.

## The pipeline AI is being applied to

Bringing a therapeutic to market runs through recognisable stages, and each has a different relationship to machine learning.

**Target identification** asks which biological entity to intervene on — which protein, pathway or mechanism is causally involved in the disease and tractable to modulate. This stage is data-rich (genomics, transcriptomics, proteomics, literature, clinical association data) and is where a great deal of ML effort now sits.

**Hit discovery** searches for molecules that interact with the target at all. Traditionally this meant physical screening of compound libraries; computationally it means virtual screening, docking, and increasingly learnt scoring functions.

**Lead optimisation** iteratively modifies a promising molecule to improve potency, selectivity, stability and safety at once — a multi-objective problem with expensive, noisy evaluation.

**Preclinical development** establishes pharmacokinetics, toxicology and formulation in cell and animal models.

**Clinical trials** test safety and efficacy in humans across escalating phases. This is where most candidates fail and where most of the cost lives.

The important structural observation is that the stages amenable to computation are the earlier, cheaper ones, while the attrition that dominates programme economics happens later. A tenfold acceleration of hit discovery changes a programme's timeline less than it sounds like it should, because the rate-limiting steps are downstream.

## Structure prediction and target-side work

The clearest genuine breakthrough has been in protein structure prediction. Deep learning systems in the AlphaFold line changed a problem that had resisted decades of effort into one where usable predicted structures are routinely available from sequence. This is not a marginal improvement; it altered what is practically accessible to a structural biologist and made structure-informed work possible for targets that had no experimental structure.

What it did not do is make structure-based drug design straightforward. A predicted static structure is not the conformational ensemble a molecule actually encounters, and binding depends on dynamics, water, protonation states and induced fit. Predicted structures also vary in local confidence, and the least confident regions — flexible loops, disordered segments — are often the interesting ones. Binding site, complex and affinity prediction all remain substantially harder than fold prediction.

On the target-identification side, ML integrates heterogeneous evidence — genetic association, expression patterns, pathway membership, text-mined literature — into prioritised hypotheses. This is also where over-claiming is most common: a model can rank hypotheses, but it cannot establish causality in human disease.

## Generative chemistry and the enumeration problem

Generative models for molecules — graph-based, string-based on chemical notations, diffusion models over 3D structures — produce candidate compounds conditioned on desired properties. The technical achievement is real: these systems generate valid, novel, synthetically plausible structures, and can be steered towards multiple property objectives at once.

The framing that "AI explores chemical space" needs qualification, though. The space of drug-like molecules is combinatorially enormous, far beyond exhaustive enumeration, so the value of a generative model is not coverage but the quality of its bias — whether it proposes molecules that are worth making. That quality is bounded by the property predictors used to score candidates, which brings the discussion back to data.

Two constraints shape whether generated molecules matter. **Synthesisability**: a structure no chemist can make efficiently is a drawing, not a candidate. **The evaluation loop**: generative chemistry is only as good as the feedback it receives, which is why credible programmes couple models to automated synthesis and assay platforms rather than iterating purely in silico.

Molecules originating from AI-assisted design have entered clinical testing, a meaningful milestone. Be precise about what it demonstrates: that the design stage can produce candidates good enough to progress, not yet that the approach improves the probability of clinical success. That question is answered by outcomes across many programmes, and the field is still accumulating that evidence.

## Property and toxicity prediction: where data limits bite

Predicting absorption, distribution, metabolism, excretion and toxicity from structure would be transformative, because late failures on safety and pharmacokinetics are expensive. Machine learning is used extensively here and the results are mixed in an instructive way.

Properties that are physically simple and abundantly measured — solubility, lipophilicity, some permeability measures — are predicted reasonably well. Properties that depend on complex biology, involve rare events, or are measured inconsistently across sources are predicted poorly. Idiosyncratic toxicity is the hardest case: the events are rare, mechanistically heterogeneous and often only observed in humans, so the training data barely exists.

The underlying constraint is the shape of pharmaceutical data. Public bioactivity datasets are large but heterogeneous, assembled from assays run under different conditions with different readouts, which introduces systematic noise that caps achievable accuracy regardless of model capacity. Proprietary datasets are cleaner but siloed, and the most informative data — what failed and why — is systematically under-published.

Distribution shift is severe as well. A model trained on historical medicinal chemistry has seen the regions of chemical space that chemists explored, which is exactly not where a novel scaffold sits. Reported performance on random splits of public data is consequently optimistic; scaffold-based and temporal splits give a truer picture and produce noticeably lower numbers.

## Why the clinical bottleneck is largely unmoved

Most candidates fail in clinical trials, and the dominant reasons are lack of efficacy in humans and unacceptable safety findings. Neither is a search problem.

Efficacy failure usually means the target hypothesis was wrong — the mechanism was not causal in the human disease, or modulating it was insufficient. No amount of chemical optimisation rescues a wrong target, and computational methods cannot validate a human disease mechanism. This is why the honest version of the AI drug discovery argument focuses on better target selection, and why that claim takes a decade of clinical outcomes to test.

Where AI is making tangible differences on the clinical side, it is doing so operationally rather than scientifically: identifying eligible patients from record data to accelerate recruitment, refining trial design and site selection, stratifying patients by biomarker to enrich for likely responders, monitoring data quality, and helping process the documentation burden trials generate. These are real efficiency gains, and they are gains in trial execution rather than in the probability that a mechanism works.

The reasonable summary: AI has changed early discovery substantially, is beginning to change trial operations, and has not yet demonstrated a change in the underlying attrition rate. Whether it will is an empirical question that outcomes will settle, not architecture.

## Frequently asked questions

**Has AI actually produced approved medicines?**

Candidates designed with substantial AI involvement have progressed into clinical trials, which is a genuine milestone for the design stage. Whether the approach improves the eventual probability of approval is a separate question that requires clinical outcomes across many programmes to answer, and the field does not yet have that evidence. Claims that treat design-stage speed as equivalent to clinical success are running ahead of what has been shown.

**Does protein structure prediction solve drug design?**

No, though it removed a major obstacle. Reliable predicted structures make structure-informed work possible for targets that lacked experimental structures, which is significant. Binding depends on molecular dynamics, solvation and induced conformational change, and predicting binding affinity accurately remains considerably harder than predicting a fold.

**What limits machine learning in drug discovery most?**

Data, in a specific way. Bioactivity data is heterogeneous across assays and conditions, which caps achievable accuracy; failure data is largely unpublished, so models learn from a biased sample; and the molecules of interest sit outside the chemical space the training data covers. Evaluating with scaffold or temporal splits rather than random ones gives a much more honest picture of how a model will behave on genuinely novel chemistry.

## Where to go from here

The skills underneath this work are mainstream machine learning applied to unusual data: graph representations, multi-objective optimisation, distribution shift and honest validation. The [Machine Learning course](/courses/machine-learning) covers that ground through graded projects that Nova reviews alongside your reasoning. If you want a quick read on where you currently stand, try the [free 3-minute skill check](/diagnostic).
