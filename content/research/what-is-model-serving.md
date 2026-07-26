Training a machine learning model produces a file full of learned parameters — and a file on a laptop helps nobody. Model serving is the discipline of turning that trained artefact into a live system that can answer prediction requests reliably, quickly, and at whatever scale your users demand. This explainer covers what serving actually involves, the architectural patterns you will encounter, and the vocabulary that job postings and documentation assume you know.

## Model serving in plain terms

At its simplest, model serving means wrapping a trained model in a program that listens for requests and returns predictions. A client — a web app, a mobile app, another backend service — sends input data over the network, the serving system runs the model on that input, and the prediction comes back as a response. The pattern will feel familiar if you have ever built or consumed a web API, because that is essentially what it is: an API whose logic happens to be a neural network or a gradient-boosted ensemble rather than hand-written rules.

What makes serving its own discipline is everything around that simple loop. The model must be loaded into memory efficiently, often onto specialised hardware. Requests must be validated, transformed into the exact numerical format the model expects, and batched together when throughput matters. Responses must come back within a latency budget. The whole system must survive traffic spikes, hardware failures, and — most distinctively — the routine replacement of the model itself as newer versions are trained.

## Online, batch, and streaming: the three serving modes

Not every prediction needs to happen the moment a user clicks. Serving systems generally fall into three modes, and choosing the wrong one is a common and expensive beginner mistake.

**Online (real-time) serving** answers individual requests synchronously, typically within tens to hundreds of milliseconds. Fraud checks at payment time, product recommendations on page load, and chatbot responses all demand this mode. It is the most operationally demanding: you pay for infrastructure that sits ready around the clock, and latency constraints shape every design decision.

**Batch serving** runs the model over large volumes of data on a schedule — nightly churn scores for every customer, weekly demand forecasts per store. Nothing waits on the result in real time, so you can use cheap, interruptible compute, process millions of records in one efficient pass, and shut everything down afterwards. If your use case tolerates predictions being hours old, batch is almost always simpler and cheaper.

**Streaming serving** sits between the two: the model consumes a continuous flow of events — sensor readings, clickstream data, transactions — and emits predictions as data arrives. It suits monitoring and alerting scenarios where predictions must be fresh but are not tied to a specific user request.

## The anatomy of a serving system

A production serving stack, whatever tools it is built from, tends to contain the same layers.

- **The model artefact.** The trained model exported in a portable format so the serving process does not need the training code. Common choices include framework-native formats and interchange formats such as ONNX.
- **The inference server.** The process that loads the artefact and executes predictions. Teams either write their own using web frameworks like FastAPI, or adopt dedicated inference servers that offer batching, multi-model hosting, and hardware optimisation out of the box.
- **Pre- and post-processing.** Raw inputs must be transformed into model-ready tensors using the same logic used at training time. Skew between training-time and serving-time preprocessing is one of the most common causes of silently degraded predictions.
- **The API layer.** Authentication, input validation, rate limiting, and versioned endpoints, exactly as in conventional backend engineering.
- **Scaling and routing.** Load balancers and autoscalers that add replicas under load, plus routing rules that let you run two model versions side by side.
- **Observability.** Logs, latency metrics, and — unique to ML — monitoring of the predictions themselves, so you notice when input data drifts away from what the model was trained on.

## Latency, throughput, and the batching trade-off

Two numbers dominate serving conversations. Latency is how long one request takes; throughput is how many requests the system completes per second. They pull against each other in an important way.

Accelerators like GPUs are most efficient when they process many inputs at once. Dynamic batching exploits this: the server holds incoming requests for a few milliseconds, groups them, and runs one large inference pass instead of many small ones. Throughput rises dramatically — but every request now waits for its batch to fill, so worst-case latency grows. Tuning the maximum batch size and the batching window against your latency budget is a core serving skill, and the right answer differs between a chatbot (users notice every 100 milliseconds) and an internal scoring service (nobody notices a second).

Model-level optimisations reduce both numbers at once. Quantisation stores parameters at lower numerical precision, shrinking memory use and speeding up computation, usually with minimal accuracy loss. Distillation trains a smaller model to imitate a larger one. Compilation tools fuse operations for the target hardware. These techniques are frequently the difference between a model that is too slow to ship and one that comfortably meets its budget.

## How model updates reach production safely

Serving would be simpler if models never changed, but the entire point of ML systems is that they improve. Mature teams treat a model rollout like a code deployment, with guardrails.

A **model registry** stores versioned artefacts with metadata about how each was trained and evaluated. Deployments pull from the registry rather than from someone's laptop. New versions go out via **canary releases** — a small percentage of traffic hits the new model while metrics are compared against the incumbent — or **shadow deployments**, where the new model receives copies of live traffic and its predictions are logged but not returned to users. Both patterns exist because offline evaluation numbers, however good, never fully predict behaviour on live data. Rollback must be a one-step operation, which is only possible when previous versions remain packaged and ready in the registry.

## Frequently asked questions

**Is model serving the same thing as deployment?**

They overlap but are not identical. Deployment is the act of releasing a model into a production environment; serving is the ongoing system that hosts it and answers requests. You deploy a model into a serving system. In casual usage the terms blur, but the distinction matters when reading documentation: serving frameworks solve hosting and inference, while deployment tooling solves packaging, release, and rollback.

**Can I serve a model without knowing Kubernetes?**

Yes. A model wrapped in a small FastAPI or Flask application and run on a single cloud virtual machine or a platform-as-a-service is a legitimate serving setup for low-traffic applications. Kubernetes earns its complexity when you need many replicas, multiple models, GPU scheduling, and zero-downtime rollouts — not before. Learn the simple path first; the concepts transfer directly.

**Do large language models change how serving works?**

The fundamentals hold, but LLMs add wrinkles. They generate output token by token, so responses are streamed rather than returned whole; memory management for attention caches becomes a first-class concern; and cost per request is high enough that batching, quantisation, and caching stop being optimisations and become requirements. Purpose-built LLM inference servers exist precisely because of these differences.

## Where to go from here

Serving concepts only stick once you have shipped a model behind a real endpoint and watched it handle requests. The [Machine Learning course](/courses/machine-learning) includes graded projects that take models from training through to working prediction services, with Nova reviewing your code along the way. Not sure whether to start with ML fundamentals or engineering skills? Take the [free 3-minute skill check](/diagnostic) and find out.
