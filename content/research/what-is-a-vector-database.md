Every AI application that "understands" meaning — semantic search, recommendation engines, chatbots that answer questions about your documents — relies on the same underlying trick: turning text, images, or audio into lists of numbers called embeddings, then finding which lists are close to each other. A vector database is the storage system purpose-built for that job. This guide explains what these systems do, how similarity search works under the hood, and when you actually need one.

## Embeddings: the idea that makes it all work

An embedding is a numerical representation of a piece of content, produced by a machine learning model. Feed the sentence "How do I reset my password?" into an embedding model and you get back a vector — an ordered list of numbers, commonly several hundred to a few thousand of them. The remarkable property is that the model places semantically similar content near each other in this numerical space. "How do I reset my password?" and "I forgot my login credentials" produce vectors that sit close together, even though they share almost no words.

This solves a problem that has frustrated search engineers for decades. Keyword search matches strings, so it misses synonyms, paraphrases, and translations entirely. Embedding-based search matches meaning. The same principle extends beyond text: image models embed pictures so that visually similar images cluster together, and multimodal models place a photo of a beach and the phrase "sandy coastline" near each other in a shared space.

Once your content is embedded, every retrieval question becomes a geometry question: given a query vector, which stored vectors are nearest to it? Answering that question quickly, over millions or billions of vectors, is what vector databases exist to do.

## What a vector database actually does

A vector database stores embeddings alongside the original content (or references to it) and metadata, and provides fast approximate nearest-neighbour search over them. The core operations are simple: insert vectors with attached metadata, and query with a vector to get back the top-k most similar entries.

The engineering challenge is scale. Comparing a query against every stored vector — brute-force search — is exact but grows linearly with collection size. Beyond a few hundred thousand vectors, that becomes too slow for interactive use. Vector databases therefore build **approximate nearest neighbour (ANN) indexes**, data structures that trade a small amount of accuracy for enormous speed gains. The most widely used family, graph-based indexes such as HNSW, connect vectors into a navigable network so a query can hop towards its neighbourhood in a handful of steps rather than scanning everything. Other approaches partition the space into clusters or compress vectors so more of them fit in memory.

Beyond indexing, mature vector databases add the features you would expect from any database: metadata filtering (find similar documents, but only from this year and this author), hybrid search that blends keyword and vector scores, access control, replication, and backups. The filtering point matters more than beginners expect — most real applications need "similar AND matching these conditions", and how efficiently a system combines the two differs significantly between products.

## Where vector databases show up in real systems

The application that pushed vector databases into the mainstream is **retrieval-augmented generation (RAG)**. Large language models know nothing about your private documents and can fabricate answers when asked. RAG addresses both problems: you embed your documents into a vector database, embed each user question, retrieve the most relevant passages, and hand them to the LLM as context for its answer. The quality of a RAG system depends heavily on retrieval quality, which makes the vector store and the chunking strategy — how you split documents before embedding — central design decisions rather than plumbing details.

Other common uses include:

- **Semantic search** over knowledge bases, support tickets, and product catalogues, where phrasing varies but intent matters.
- **Recommendations**, by embedding users and items into the same space and retrieving items near a user's vector.
- **Deduplication and clustering**, finding near-identical documents or images at scale.
- **Anomaly detection**, flagging events whose embeddings sit far from everything seen before.

## Choosing between the main options

The market splits into three broad camps, and the right choice depends on scale and operational appetite rather than feature checklists.

**Libraries and embedded stores** run inside your application process. They are ideal for prototypes, small collections, and single-machine workloads: no server to operate, minimal setup, and honest performance for collections that fit in memory.

**Dedicated vector databases** — open-source systems you self-host or their managed cloud equivalents — earn their place when collections grow into the many millions of vectors, when multiple services need shared access, or when you need replication and horizontal scaling.

**Vector extensions to general-purpose databases**, most prominently the pgvector extension for PostgreSQL, deserve serious consideration for teams already running the parent database. Keeping vectors next to relational data means one system to operate, transactional consistency between embeddings and source records, and familiar tooling. For small-to-medium collections, this is often the most pragmatic choice, and it postpones adding a new piece of infrastructure until scale genuinely demands it.

Whichever you pick, evaluate with your own data: recall against a brute-force baseline, query latency at your expected collection size, filtered-query performance, and the cost of re-embedding everything when you inevitably change embedding models.

## Common pitfalls when starting out

A few mistakes recur across nearly every first vector-search project. Mixing embeddings from different models in one collection produces meaningless similarity scores, because each model defines its own space — vectors are only comparable when produced by the same model version. Chunking documents carelessly — too large, and retrieved passages bury the answer in noise; too small, and they lack context — degrades RAG quality more than most tuning. Ignoring the distance metric (cosine similarity, dot product, or Euclidean distance) can silently break results, since indexes and embedding models make assumptions about which is appropriate. And treating retrieval quality as fixed rather than measurable leaves easy gains unclaimed: a small labelled set of queries with known correct results turns tuning from guesswork into engineering.

## Frequently asked questions

**Do I need a vector database for every AI project?**

No. If your collection is small — thousands of items — an in-memory brute-force search with a numerical library is exact, trivially simple, and fast enough. Reach for real vector infrastructure when collection size, query volume, or operational requirements (persistence, sharing, filtering) outgrow that. Starting simple also lets you validate that semantic search actually improves your product before investing in infrastructure.

**How is a vector database different from a regular database?**

A conventional database answers exact questions: rows where a column equals a value, sorted, joined, aggregated. A vector database answers proximity questions: which stored items are most similar to this one? The index structures, query semantics, and accuracy trade-offs are fundamentally different — ANN search is deliberately approximate. Many systems now straddle the line, which is why extensions like pgvector exist, but the query paradigms remain distinct.

**What affects the quality of vector search results most?**

The embedding model, ahead of everything else. A well-chosen model that matches your domain and language does more for relevance than any index tuning. After that: chunking strategy for documents, metadata filtering to constrain the candidate set, and hybrid keyword-plus-vector scoring for queries containing names, codes, or rare terms that embeddings handle poorly.

## Where to go from here

Vector search sits at the boundary of machine learning and backend engineering, and building one small RAG or semantic-search project teaches more than any amount of reading. The [Machine Learning course](/courses/machine-learning) covers embeddings and retrieval with graded, hands-on projects — Nova, Square 1's AI tutor, gives feedback on your code. If you want to gauge your starting point first, take the [free 3-minute skill check](/diagnostic).
