Ambient documentation tools have moved into clinical practice faster than most other applications of AI in healthcare, and the reason is straightforward: the task is administrative, a clinician reviews the output before it counts, and the pain being addressed is universally acknowledged. That benign risk profile does not make the technology consequence-free. This is a look at how these systems work and the questions worth asking before adopting one.

## What an AI scribe does between the consultation and the note

The pipeline has three stages, and errors behave differently in each.

**Capture and transcription.** Audio is converted to text, usually with speaker separation so clinician and patient turns can be distinguished. Performance degrades with background noise, overlapping speech, under-represented accents and dense clinical terminology — drug names in particular, where similar-sounding medications differ sharply in effect.

**Summarisation and structuring.** A language model turns the transcript into a clinical note, typically in a familiar structure: presenting complaint, history, examination, assessment, plan. This is generation, not extraction. The model decides what was clinically salient, what to omit, and how to phrase things said hesitantly — editorial decisions that are the substance of what these tools do and the source of their most interesting failure modes.

**Coding and downstream artefacts.** Many products go further — suggesting diagnostic codes, drafting referral letters, populating orders — and each additional artefact inherits upstream errors.

Deployment models vary in ways that dominate the privacy assessment far more than model architecture does: some run on infrastructure the health service controls, others send audio to a vendor's cloud service; some retain recordings, others discard audio once a note is drafted.

## The documentation burden they are meant to address

The problem is real and well described. Clinical documentation consumes a substantial portion of the working day, much of it after hours, and is consistently cited in the literature on clinician burnout. It also intrudes on the consultation: a clinician typing into a record is not fully attending to the person in front of them.

An ambient scribe promises to shift documentation from something written during and after the encounter to something reviewed after it: a shorter documentation tail at the end of the day, more eye contact during consultations, and notes not written from memory hours later.

The plausible costs are less discussed. Review is not free — a note that is fluent but subtly wrong takes longer to correct than a sparse note takes to write. Generated notes tend to be longer than clinician-written ones, adding to the reading burden for the next clinician who opens the record. And clinicians often change how they speak during consultations to feed the tool, which is a real behavioural effect on the encounter. Whether the net balance is favourable depends on specialty and consultation type, and is best answered empirically in your own setting.

## Accuracy failures specific to generated clinical notes

Three failure modes recur.

**Omission.** The most common and least visible error. A relevant negative, an allergy mentioned in passing, a safeguarding concern raised obliquely — any of these can simply not appear. Omissions are hard to catch on review because nothing looks wrong; the reviewer has to remember what was said, which is the burden the tool was meant to remove.

**Fabrication and plausible completion.** Clinical notes have strong conventions, and a model producing text that fits them can supply a normal examination finding that was never performed or a plan detail that follows typical practice rather than what was agreed. These errors are dangerous precisely because they read correctly.

**Misattribution and negation errors.** Confusing patient report with clinician assessment changes clinical meaning materially. Negation and uncertainty are similarly fragile: "denies chest pain", "possible", "discussed but decided against" carry heavy weight, and hedged reasoning flattened into confident statements misrepresents the clinician's actual thinking.

Evaluating a scribe therefore cannot rely on transcription word error rate, which measures the wrong stage. What matters is clinical fidelity at the note level: were all material facts carried through, was anything asserted that did not occur, and is the reasoning represented at the confidence the clinician held. That requires clinicians reading paired transcripts and notes, which is expensive — the main reason comparative evidence on these products is thinner than their adoption rate.

## Consent, recording and data handling

Recording a consultation introduces obligations that typed documentation does not.

Patients generally need to be informed that the consultation will be recorded and processed, and to have a genuine option to decline without disadvantage — which means a workflow that supports proceeding without the tool, not just a notice on the wall. Where third parties are present, the recording captures them too, and consultations involving safeguarding, mental health, sexual health or legal matters warrant particular care, and some services exclude such encounters entirely.

The data questions follow the usual health-privacy contours with an extra wrinkle: audio is unusually rich, carrying voice biometrics, identifiers spoken aloud, background conversation and paralinguistic information about distress. Establish where audio is processed, whether it is retained and for how long, whether it or the transcripts can train the vendor's models, which jurisdiction it sits in, and what happens on contract termination. A vendor's willingness to answer plainly is itself informative.

The audit trail matters as well: if a draft is edited before signing, the record should show what the tool produced and what the clinician changed.

## Attribution, liability and the review problem

The governing principle in current practice is that the clinician who signs the note owns it: the tool drafts, the clinician verifies and takes responsibility. That principle sits in tension with the tool's value proposition, because the time saved comes from reducing the effort of producing the note, while responsible use requires careful reading of a document you did not write.

This is automation complacency in a specific form. A fluent, mostly-correct draft invites light review, and light review is exactly what fails to catch omissions and plausible fabrications. As confidence in the tool grows, review effort tends to fall, so the error rate reaching the record can rise even as the model stays constant.

Designs that take this seriously flag low-confidence passages rather than presenting uniform prose, separate content the model heard from content it inferred, and keep the transcript beside the draft so verification is a comparison rather than a memory exercise. They resist auto-populating codes, medications and orders without explicit confirmation, because errors there propagate beyond the note. Organisations that adopt them sample signed notes for audit rather than assuming review happened.

For teams evaluating adoption, the practical questions are the time saving after review is counted, the proportion of drafts needing substantive correction, and the categories of error seen. Those numbers, gathered locally over a pilot, beat any general claim about the technology.

## Frequently asked questions

**Are AI scribes accurate enough for clinical use?**

They are used on the premise that a clinician reviews and signs the output, which is what makes current accuracy workable rather than the accuracy being sufficient alone. The errors that matter most — omitted details and plausible content that was never said — are the hardest to catch on review, so the strength of that review step, and audit of it, determines whether use is safe in a given setting.

**Do patients have to consent to being recorded?**

Requirements vary by jurisdiction, but informing patients and offering a genuine option to decline is the widely adopted standard, and it needs a workflow that actually supports declining. Particularly sensitive consultations warrant additional care. This is a decision for the service's governance process rather than for individual clinicians to improvise.

**Does using a scribe change who is responsible for the note?**

No. The clinician who signs the record remains accountable for its content — the tool produces a draft, not a record. This is why an audit trail showing what the tool generated and what the clinician changed matters: it supports incident review and shows where the tool needs correcting.

## Where to go from here

The techniques behind these systems — sequence modelling, summarisation, evaluating generated text against a source — are core machine learning skills, and evaluation is the part most teams underinvest in. The [Machine Learning course](/courses/machine-learning) covers them through graded projects, with Nova reviewing both your code and the prompts you write. To see where your current level sits, the [free 3-minute skill check](/diagnostic) takes a few minutes.
