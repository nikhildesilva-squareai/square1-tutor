RAG and fine-tuning are the two standard answers to the same complaint: "the model doesn't know our stuff." They solve it in fundamentally different ways — retrieval-augmented generation supplies knowledge at question time, while fine-tuning bakes patterns into the model's weights — and picking the wrong one is a common and expensive detour in LLM projects.

## Two different theories of the problem

RAG treats the gap as a *library* problem. The model is a capable reader that simply lacks the right documents, so the system stores your content externally, searches it per query, and pastes the most relevant passages into the prompt. The model's weights never change; its knowledge is whatever the retriever hands it, refreshed as often as the index is rebuilt.

Fine-tuning treats the gap as a *training* problem. The model has not internalised your domain's vocabulary, style or task patterns, so you continue its training on curated examples until the desired behaviour becomes default. The knowledge and habits live inside the weights, available without any retrieval step.

The crucial asymmetry: RAG is strong at *facts* and weak at *behaviour*; fine-tuning is strong at *behaviour* and unreliable at *facts*. A fine-tuned model exposed to your documentation during training will still misquote it, because training instils tendencies rather than verbatim recall. A RAG system, conversely, can quote your documents precisely but will not spontaneously adopt your house style from them.

## Comparing the practical costs

The cost profiles differ in shape, not just size. RAG's costs are ongoing and infrastructural: an embedding pipeline, a search index, re-indexing when documents change, and longer prompts on every request because retrieved passages ride along with each question. Latency also grows, since retrieval happens before generation.

Fine-tuning's costs are front-loaded and human: assembling a clean dataset of example inputs and outputs, running training, and evaluating the result — then repeating the entire cycle whenever requirements shift. After training, per-request costs can actually *fall*, because a tuned model needs shorter prompts and can sometimes be a smaller model altogether.

Maintenance is where the difference bites hardest. When facts change, a RAG system needs a re-index — often minutes. A fine-tuned model needs new data and a new training run. If your knowledge changes weekly, encoding it in weights means your model is permanently out of date.

## Failure modes on each side

RAG fails when retrieval fails. If chunking splits a concept across passages, if the query's wording does not match the document's, or if the corpus simply lacks the answer, the model receives poor context — and either admits ignorance or improvises. RAG systems also inherit their corpus's contradictions: retrieve two conflicting policy versions and the model may blend them. These failures are at least *inspectable*: you can log what was retrieved and see exactly what the model was given.

Fine-tuning fails more quietly. A model trained on narrow data can lose general capability, overfit to the phrasing of its training examples, or learn its dataset's biases with perfect fidelity. Because the change is distributed across weights rather than visible in a prompt, diagnosing *why* a tuned model behaves oddly is genuinely hard. And the hallucination problem does not go away: a model fine-tuned on your knowledge base sounds more like your knowledge base, which can make its confabulations more convincing, not less.

## How to decide: a short checklist

Ask four questions about your use case:

1. **Does the answer need to cite current, changing information?** If yes, RAG — freshness and traceability are its home turf.
2. **Is the problem tone, format or task behaviour rather than missing facts?** If yes, fine-tuning (after you have genuinely exhausted prompting).
3. **Do answers need to be auditable back to a source document?** RAG gives you citations by construction; weights give you nothing to point at.
4. **Is per-request cost at high volume the binding constraint?** A fine-tuned smaller model with short prompts may beat a RAG pipeline hauling passages on every call.

If your answers point both ways, that is normal — and it is why the combination is so common in production: fine-tune (or carefully prompt) for behaviour, retrieve for facts. A support assistant might be tuned to your response style and escalation rules while pulling live product details from an index. The approaches are complements far more often than competitors.

## Evaluate before you commit

Whichever route you lean towards, the deciding evidence should come from a fixed evaluation set: a few dozen representative queries with known good answers, scored the same way for every variant you try. Run your baseline prompt-only system, a RAG prototype, and — only if behaviour gaps persist — a fine-tuned variant against the same set.

This sounds obvious and is skipped constantly. Teams routinely choose an architecture from blog posts, spend weeks implementing it, and discover the simpler alternative would have scored comparably. A day spent building an evaluation harness is the cheapest insurance in LLM engineering, and it converts the RAG-versus-fine-tuning debate from opinion into measurement.

## Frequently asked questions

**Can I use RAG and fine-tuning together?**

Yes, and mature systems often do. Fine-tuning handles stable behaviour — voice, structure, domain conventions — while RAG supplies volatile facts at query time. The split keeps training data small and stable, and lets knowledge update without touching the model.

**Which is faster to get working?**

Almost always RAG. A basic retrieval pipeline over a modest document set can be prototyped in days, and every component is inspectable while you debug. Fine-tuning is gated on dataset preparation, which is usually the slowest, most human-intensive step in the whole process.

**Does fine-tuning eliminate hallucinations about my domain?**

No. Fine-tuning makes a model *sound* fluent in your domain, but it does not give verbatim recall of documents, and confident-but-wrong answers persist. Grounding responses in retrieved text, with instructions to stay within it, is the more direct hallucination mitigation for factual queries.

## Where to go from here

The best way to internalise this trade-off is to build both on the same task and compare them against one evaluation set. The [Generative AI course](/courses/generative-ai) walks through retrieval, adaptation and evaluation with graded projects, and the [free 3-minute skill check](/diagnostic) will show you which foundations to shore up first.
