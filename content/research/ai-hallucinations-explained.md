AI hallucination is the term for when a language model produces information that is fluent, confident and entirely wrong — an invented citation, a fabricated statistic, a plausible-sounding fact that simply is not true. It is one of the most consequential reliability problems in modern AI, and misunderstanding it leads people to trust these systems in exactly the ways they should not. This guide explains what hallucination really is, why it happens, and how to work with models responsibly given that it cannot be fully eliminated.

## What hallucination is — and what it is not

A hallucination is a confident, coherent output that is not grounded in fact or in the source material the model was given. The defining feature is not merely that the answer is wrong, but that it is delivered with the same fluency and apparent authority as a correct answer, offering no visible signal that it is unreliable. A model does not stammer or hedge when it fabricates; it invents a court case, a paper title, an API method or a historical detail in exactly the register of a true statement.

It helps to distinguish hallucination from related failures. A model can be wrong because its training data was wrong — that is repeating a mistake, not hallucinating. It can be wrong because a question is ambiguous and it guessed the wrong reading. Hallucination specifically refers to generating information that has no basis, confabulating detail to fill a gap. The classic examples are invented references and citations, precisely because they look so authoritative and are so easy to check and find false.

Two broad types are worth naming. Factual hallucination is inventing information about the world. Faithfulness hallucination — often more dangerous in practice — is departing from a source the model was explicitly given, for example summarising a document and adding claims the document never made. Systems that retrieve and summarise are especially prone to the second kind.

## Why models hallucinate

To understand why hallucination is stubborn, you have to understand what a language model fundamentally does. It is trained to predict plausible continuations of text. It learns the statistical shape of language extraordinarily well — what a correct-sounding answer looks like — without possessing a separate, checkable store of facts it can consult and cite. Fluency and truth are different targets, and the training objective optimises much harder for the first.

This has a direct consequence: when a model does not know something, it does not have a reliable internal signal that says so. Predicting the most plausible continuation and stating a known fact are, mechanically, the same operation. So faced with a gap, the model generates the most likely-looking completion, which is often a confident fabrication rather than an admission of ignorance. The system is not lying, in the sense of knowing the truth and concealing it; it has no separate representation of what it does and does not know to consult.

Several factors make it worse. Questions about rare or specific facts — an obscure person, a precise number, a niche citation — sit in sparse regions of what the model learnt, where plausible-sounding guesses are more likely than accurate recall. Pressure to be helpful and to always produce an answer works against admitting uncertainty. And training that rewards confident, satisfying responses can inadvertently reward fluent fabrication over honest hedging.

## Why hallucination cannot simply be fixed

It is tempting to assume this is a bug that a better model will eliminate. That is only partly right. Larger and better-trained models hallucinate less on many tasks, and techniques exist to reduce the rate substantially. But the problem is rooted in what these systems are — probabilistic generators of plausible text — rather than in a fixable defect, so mitigation rather than elimination is the realistic goal.

The most effective mitigation is grounding: giving the model authoritative source material at query time and instructing it to answer only from that material, an approach often built into retrieval-augmented systems. This helps considerably, because the model has something real to draw on rather than reaching into its parameters. But it does not fully solve the problem — the model can still misread, over-extend or contradict the sources it was given, which is the faithfulness failure named earlier. Grounding narrows the gap; it does not close it.

Other mitigations include prompting the model to express uncertainty and to cite sources that can be checked, cross-checking outputs against independent tools or a second model, and constraining systems to domains where verification is feasible. Each helps at the margin. None turns a language model into a reliable oracle, and designs that assume otherwise are the ones that fail in production.

## Working responsibly with a system that hallucinates

Because hallucination is intrinsic, the responsible response is design and process, not blind trust. The single most important principle is to match the system's role to the cost of being wrong. Using a model to draft, brainstorm, rephrase or explore — where a human reviews the output and errors are cheap — plays to its strengths. Using it as an unchecked source of facts in a high-stakes setting — legal, medical, financial — is where hallucination causes real damage, and there the design must include verification rather than assuming correctness.

Concrete habits follow. Verify any factual claim that matters, especially specifics like citations, numbers, names and quotations, which are both the most likely to be fabricated and the easiest to check. Prefer grounded systems that answer from provided sources, and then still check that the answer is faithful to those sources. Design interfaces that surface sources and encourage checking rather than presenting output as settled fact. And treat confidence as no signal at all — a model's assured tone tells you nothing about whether it is right, because it uses the same tone for truth and fabrication.

For anyone building on these models, the discipline is to engineer for the failure: assume the model will sometimes fabricate, and make sure the surrounding system catches it before it reaches a consequential decision. This is a solvable engineering problem even though the underlying hallucination is not.

## Frequently asked questions

**Will hallucination go away as models improve?**

It reduces but does not disappear. Better models and techniques like grounding lower the rate meaningfully, but the tendency is rooted in what language models are — systems that predict plausible text without a separate, checkable store of facts. Plan for mitigation, not elimination.

**Does retrieval-augmented generation stop hallucination?**

It helps a lot but is not a complete fix. Giving a model authoritative sources to answer from reduces fabrication about the world, yet the model can still misread or over-extend those sources — the faithfulness failure — and add claims they do not support. Grounded answers still need checking against the source.

**How can I tell when a model is hallucinating?**

You often cannot from the output alone, because fabrications are delivered as confidently as facts. That is the core danger. The reliable approach is not detection by tone but verification of specifics — checking citations, numbers and names against trustworthy sources — and preferring systems that show you their sources.

## Where to go from here

Understanding why models hallucinate — and building systems that catch it — comes from understanding how they generate text in the first place, which the [Artificial Intelligence course](/courses/artificial-intelligence) teaches through graded projects, with Nova reviewing your code and prompts. To gauge your starting point, take the [free 3-minute skill check](/diagnostic).
