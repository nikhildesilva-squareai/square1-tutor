Retrieval-augmented generation (RAG) is a technique that lets a large language model answer questions using documents it was never trained on. Instead of relying only on what the model memorised during training, a RAG system fetches relevant text at question time and passes it to the model as context. The result is answers grounded in your own data — policies, product documentation, research notes — rather than the model's general recollection of the internet.

## Why LLMs need retrieval in the first place

Large language models are trained once, on a fixed snapshot of text, and then deployed. That creates three practical problems. First, the model knows nothing about events, products or documents that appeared after its training cut-off. Second, it knows nothing about your private data — internal wikis, contracts, support tickets — because that data was never in the training set. Third, when a model is asked about something it half-remembers, it tends to produce a fluent, confident answer anyway, which is how hallucinations happen.

Retraining the model every time your documents change is impractical for almost everyone. RAG sidesteps the problem: rather than teaching the model new facts, you hand it the relevant facts at the moment it needs them. The model's job shifts from *recalling* information to *reading and synthesising* information, which is something transformers are genuinely good at.

## How a RAG pipeline works, step by step

A typical RAG system has two phases: an indexing phase done ahead of time, and a query phase done on every request.

During indexing, your documents are split into chunks — passages of a few hundred tokens each. Each chunk is converted into an embedding, a numerical vector that captures its meaning, and stored in a vector database alongside the original text.

At query time, the pipeline runs roughly like this:

1. The user's question is converted into an embedding using the same model.
2. The vector database returns the chunks whose embeddings sit closest to the question's embedding — semantically similar passages, even if they share no exact keywords.
3. The top chunks are assembled into a prompt, together with the question and instructions such as "answer only from the provided context".
4. The LLM generates an answer grounded in those chunks, ideally citing which passage supports which claim.

Every design decision in that pipeline matters: how big the chunks are, how many you retrieve, how you rank them, and how firmly the prompt instructs the model to stay within the supplied context.

## Chunking, embeddings and retrieval quality

Most RAG failures are retrieval failures, not generation failures. If the right passage never reaches the model, no amount of clever prompting will save the answer.

Chunk size is the first lever. Chunks that are too small lose surrounding context — a sentence about "the limit" is useless if the paragraph defining the limit was split into a different chunk. Chunks that are too large dilute the embedding, making it a blurry average of several topics, and waste context window space when retrieved.

Retrieval strategy is the second lever. Pure vector similarity struggles with exact identifiers — part numbers, error codes, names — where old-fashioned keyword search excels. Many production systems therefore use hybrid retrieval, combining keyword and vector search, and then apply a reranking step that re-scores the candidates against the question before the best few are passed to the model.

Finally, metadata filtering keeps retrieval honest: restricting search to the right product version, date range or access level prevents the model from confidently answering from an outdated or unauthorised document.

## Where RAG breaks down

RAG is powerful but not magic, and it fails in recognisable ways. If the corpus does not contain the answer, the system either admits ignorance (good) or the model falls back on its training data and speculates (bad) — which is why the prompt should explicitly permit "I don't know". If two documents contradict each other, retrieval will happily surface both, and the model may blend them into a plausible-sounding hybrid.

Questions that require reasoning *across* many documents — "summarise how our refund policy changed over three years" — strain simple RAG, because top-k retrieval returns isolated fragments rather than a coherent timeline. And answers are only as fresh as the index: if documents change but the embeddings are not rebuilt, the system serves stale content with full confidence.

None of these are reasons to avoid RAG. They are reasons to evaluate it properly: build a set of representative questions with known correct answers, and measure whether the right chunks are retrieved and whether the final answer is faithful to them.

## When RAG is the right choice

RAG is usually the first thing to reach for when your problem is *knowledge* — the model needs access to facts it does not have. It shines when the underlying data changes often, when answers must be traceable to a source document, and when you cannot or should not bake private data into model weights.

It is the wrong tool when your problem is *behaviour* — you want the model to adopt a specific style, format or skill. That is the territory of prompting and fine-tuning. Many real systems combine the approaches: a fine-tuned or well-prompted model for tone and structure, with RAG supplying the facts.

If you want to build one properly, start small: a single folder of documents, a simple chunking scheme, and a test set of twenty real questions. Iterate on retrieval before touching the prompt.

## Frequently asked questions

**Does RAG stop hallucinations completely?**

No. RAG substantially reduces hallucinations about your domain by giving the model source material, but the model can still misread a passage, blend contradictory sources, or speculate when retrieval comes back empty. Grounding instructions, citation requirements and a proper evaluation set narrow the gap further; nothing eliminates it entirely.

**Do I need a vector database to build RAG?**

Not necessarily. For small corpora, an in-memory index or even hybrid keyword search can work well. Dedicated vector databases earn their keep when you have large document sets, need metadata filtering, or must update the index continuously. Start with the simplest retrieval that answers your test questions correctly.

**Is RAG cheaper than fine-tuning?**

Usually, yes, for knowledge-heavy use cases. RAG avoids training runs entirely; its costs are embedding, storage and slightly longer prompts. Fine-tuning has upfront training cost and must be repeated when facts change. But RAG adds per-query retrieval latency and infrastructure, so the comparison depends on query volume and how often your data changes.

## Where to go from here

The fastest way to learn RAG is to build and evaluate one, not just read about it. The [Generative AI course](/courses/generative-ai) covers retrieval, grounding and evaluation with graded projects, and Nova — Square 1's AI tutor — grades your code and prompts as you go. Not sure where you sit today? Take the [free 3-minute skill check](/diagnostic) first.
