An AI bias audit is a structured examination of whether an automated system produces systematically different outcomes for different groups of people, and whether those differences are justifiable. Regulators increasingly expect them, and any team deploying models that touch hiring, lending, healthcare, education or content moderation should be running them regardless. This guide walks through the process step by step, in an order you can actually follow.

## Step 1: Define scope, stakes and protected groups

Before touching data, write down three things. First, exactly which system and which decision you are auditing — "the résumé-screening model's shortlist recommendation", not "our hiring AI". Second, what is at stake for the people affected: a mis-ranked job applicant, a wrongly declined loan, a misdirected medical referral. The stakes determine how much rigour is proportionate.

Third, decide which groups you will compare. Legal frameworks typically name attributes such as sex, race, age and disability, but the relevant groups depend on context: a speech interface should be tested across accents; a medical model across age bands and comorbidities; a credit model across geography, which often proxies for protected attributes. Include intersections where feasible — a system can look fair for women overall and for older applicants overall while failing older women specifically.

Expect a practical obstacle immediately: you may not have demographic labels, because collecting them was avoided for privacy reasons. Options include using properly governed self-reported data, statistically inferred proxies with clearly documented uncertainty, or synthetic test cases. Whatever you choose, record the limitation honestly in the final report.

## Step 2: Choose fairness metrics — and accept the trade-offs

There is no single mathematical definition of fairness, and several common definitions cannot all be satisfied at once except in degenerate cases. The audit's credibility depends on choosing metrics deliberately and saying why.

The most used families are, in plain terms: demographic parity, which asks whether positive outcomes (shortlisted, approved) occur at similar rates across groups; equal opportunity, which asks whether people who genuinely qualify are correctly identified at similar rates across groups; equalised odds, which extends that to error rates of both kinds; and calibration, which asks whether a score of, say, 0.8 means the same thing regardless of group.

Which family matters most is a judgement about the harm. If the harm is wrongly denying qualified people, error-rate parity metrics fit. If the harm is unequal access to an opportunity, selection-rate metrics fit. For generative systems, the framing shifts again: you compare quality, refusal rates, sentiment and stereotype content of outputs across prompts that vary only in group-related details.

Set decision thresholds in advance — for example, the maximum acceptable gap between group error rates — so the audit ends in a verdict rather than a shrug.

## Step 3: Assemble evaluation data and run the tests

Your production test set is rarely enough on its own, because minority groups are often underrepresented in it, making group-level estimates noisy. Supplement it with targeted samples for small groups and with counterfactual test cases: pairs of inputs identical except for a group-relevant detail, such as a name associated with a different gender or ethnicity, where a materially different output is hard to justify.

Then run the system and disaggregate everything. Overall accuracy is the least informative number in a bias audit; the same headline figure can conceal excellent performance for one group and coin-flip performance for another. Produce per-group and, where sample sizes allow, per-intersection tables of selection rates, false positive rates, false negative rates and calibration. Use confidence intervals — small subgroups produce unstable estimates, and reporting a gap without uncertainty invites both false alarm and false comfort.

For language models, script the evaluation: generate outputs across your counterfactual prompt sets, then score them with a rubric covering refusal behaviour, tone, assumption-making and stereotype content. Manual spot-checking alone does not scale and is itself subject to reviewer bias.

## Step 4: Diagnose the sources of any disparity

Finding a gap is the midpoint, not the finish. To fix it — and to know whether it is fixable — trace where it enters. Common sources include: historical bias in training labels (past human decisions encoded past discrimination); representation gaps (too few examples from some groups, so the model generalises badly for them); measurement bias (a proxy variable, like arrest records standing in for offending, that is itself skewed); feature proxies (postcode encoding ethnicity); and deployment mismatch (a model trained in one population applied to another).

The diagnosis dictates the remedy. Label bias calls for relabelling or reweighting; representation gaps call for targeted data collection; proxy features may need removal or constraint, with care, since crude removal can worsen outcomes; some problems are best handled by adjusting decision thresholds per the chosen fairness criterion; and some systems should simply not be deployed for certain decisions at all. That last option must genuinely be on the table, or the audit is theatre.

## Step 5: Document, remediate and repeat

Write the audit up so a non-author can reproduce it: system and version audited, groups compared, metrics and thresholds chosen with rationale, data sources and their limitations, results with uncertainty, diagnosis, remediation actions with owners and deadlines, and an explicit sign-off decision. This documentation is what distinguishes an audit from an exploration, and it is what regulators and internal reviewers will ask for.

Then schedule the next one. Models are retrained, user populations drift, and upstream data pipelines change silently; a bias audit is a snapshot, not a certificate. Mature teams wire disaggregated metrics into routine monitoring so that group-level regressions surface between formal audits, and they re-audit on every significant model or data change.

Finally, close the loop with people. Where feasible, affected users should have a channel to contest decisions, and those contests are themselves audit evidence — a cluster of complaints from one group is a signal no dashboard should override.

## Frequently asked questions

**Do I need demographic data to audit for bias?**

It is difficult to measure group disparities without any group information, but you have options: governed collection of self-reported attributes, inferred proxies with documented uncertainty, counterfactual test cases that vary group signals synthetically, and auditing input features for known proxies. Absence of demographic data does not excuse skipping the audit; it changes the method.

**How often should bias audits run?**

Treat any retraining, major data change or expansion to a new user population as a trigger, with a periodic full audit — commonly annual for high-stakes systems — as a backstop. Continuous disaggregated monitoring between audits catches drift earlier than any calendar.

**Can a biased model ever be acceptable to deploy?**

Sometimes disparities reflect genuine, legitimate differences in the underlying population rather than measurement or label bias, and sometimes a model with a small measured gap still beats the human process it replaces. The point of the audit is to make that judgement explicitly, with numbers and named decision-makers, rather than by default.

## Where to go from here

Running a credible audit means being comfortable with evaluation metrics, data analysis and scripted testing — skills the [Artificial Intelligence course](/courses/artificial-intelligence) builds through graded projects, with Nova reviewing your code along the way. If you want a quick read on your current level first, take the [free 3-minute skill check](/diagnostic).
