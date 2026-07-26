A model that lives in a notebook is an experiment; a model behind an endpoint is a product. Deployment is where those two worlds meet, and it is the step most self-taught practitioners have never actually done end to end. This guide walks through the full journey — from a trained model file to a monitored, updatable service — using patterns that scale down to a weekend project and up to production.

## Step 1: Export the model and pin its world

Deployment begins before any server exists. The trained model must be saved as a self-contained artefact that another machine can load without your notebook's state. Every major framework provides a native export path; interchange formats such as ONNX add portability across frameworks and runtimes.

The artefact alone is not enough. Two other things must travel with it. First, the **preprocessing logic**: the model expects inputs transformed exactly as they were during training — the same scaling, encoding, tokenisation, and feature order. The most reliable approach is to package preprocessing and model together in a single pipeline object or a shared code module, so serving cannot drift from training. Second, the **environment**: pin exact library versions in a requirements file, because a model saved under one version of a framework may load subtly differently, or not at all, under another.

Give every exported artefact a version identifier and record how it was produced — which data, which code commit, which hyperparameters. Future you, debugging a production issue at speed, will need to answer "which model is actually running?" in seconds.

## Step 2: Wrap it in an API

The near-universal serving pattern is a small web service with a prediction endpoint. In Python, FastAPI has become the default choice: it is quick to write, validates incoming data against declared schemas, and generates interactive documentation automatically.

The service does four things: load the model once at startup (never per request — loading is slow), validate and transform the incoming payload, run inference, and return a structured response. Two details separate a robust wrapper from a fragile one. Validate inputs strictly at the boundary — reject wrong types, missing fields, and out-of-range values with clear errors, because a model will happily produce nonsense from nonsense rather than complain. And include a health-check endpoint that confirms the model is loaded, which every orchestration platform and load balancer will rely on.

Test the service locally with realistic payloads, including malformed ones, before it goes anywhere near a server. A short script that replays a few hundred held-out examples through the local endpoint and compares responses against the model's offline predictions catches an entire class of preprocessing-skew bugs early.

## Step 3: Containerise it

A container image packages your service, its dependencies, and its runtime into one reproducible unit that behaves identically on your laptop and in the cloud. For ML services, Docker is the standard, and the Dockerfile is usually short: start from a slim base image, install pinned dependencies, copy the code and model artefact, and define the startup command.

Two ML-specific considerations deserve attention. Model files can be large, so decide whether the model is baked into the image (simple, immutable, but images get heavy and every model update rebuilds the image) or downloaded from object storage at startup (lighter images, models updatable independently, but a new failure mode at boot). Either is legitimate; choose deliberately. And if you need GPU inference, base your image on the appropriate CUDA-enabled parent image and confirm the host runtime exposes the GPU to containers.

## Step 4: Choose where it runs

There is no single correct home for a model service; there is a gradient of control versus convenience.

- **A single virtual machine** is the simplest real deployment: rent a small instance, run the container, put a reverse proxy in front. Entirely adequate for internal tools and low-traffic applications, and the best learning environment because nothing is hidden.
- **Platform-as-a-service and serverless containers** — the managed container platforms offered by the major clouds — take the server away: you push an image, they handle scaling, TLS, and rollouts, and can scale to zero when idle. Excellent for spiky or modest traffic; watch cold-start latency if your model is large.
- **Kubernetes** earns its complexity when you operate many services or models, need GPU scheduling and fine-grained autoscaling, or already have a platform team running it. It is not a rite of passage; adopt it when the simpler options genuinely pinch.
- **Managed ML endpoints** from cloud ML platforms bundle model hosting, versioning, autoscaling, and monitoring behind one interface, trading flexibility and cost transparency for speed of setup.

For a first deployment, the serverless-container middle ground is hard to beat: real production infrastructure, minimal operations, easy rollback.

## Step 5: Monitor, then plan the next release

Deployment is not the finish line; it is the point where feedback starts. Monitoring for a model service has two layers. The **service layer** is conventional: request rate, latency percentiles, error rate, resource usage, alerting when thresholds break. The **model layer** is where ML differs: log inputs and predictions (respecting privacy constraints), track the distribution of both over time, and watch for drift — the slow divergence between the data the model sees today and the data it was trained on. A model can be perfectly healthy as software while becoming quietly wrong as a predictor.

Plan for replacement from day one. Version your endpoints or your model artefacts so two versions can run side by side. Roll new models out to a slice of traffic first and compare against the incumbent before full cutover. Keep the previous artefact packaged and ready so rollback is one command, not an archaeology project. Teams that treat model updates as routine, rehearsed events ship improvements weekly; teams that treat them as ceremonies ship quarterly and fear every release.

## Frequently asked questions

**What is the simplest way to deploy my first model?**

Wrap it in a FastAPI service, containerise it with Docker, and push it to a serverless container platform on any major cloud. That path touches every essential concept — artefact export, API design, containerisation, managed infrastructure — without requiring you to administer servers or learn an orchestrator, and it costs little to nothing at hobby traffic levels.

**Do I need Kubernetes to deploy machine learning models?**

No. Kubernetes solves problems of scale and multiplicity — many services, many models, many teams. A single model serving moderate traffic runs happily on a VM or a serverless container platform. Learn the fundamentals on the simple path; the concepts (containers, health checks, rolling updates) transfer directly if you later need an orchestrator.

**How do I update a deployed model without downtime?**

Run old and new versions simultaneously and shift traffic gradually. On managed platforms this is built in: deploy a new revision and split traffic by percentage. The prerequisites are on your side of the fence: versioned artefacts, a health check that confirms the new model loaded, and comparison metrics so you can detect regression before the new version takes all traffic — and roll back instantly if it does.

## Where to go from here

The distance between reading about deployment and doing it is exactly one project. The [Machine Learning course](/courses/machine-learning) includes graded projects that carry a model from training to a working service, with Nova reviewing your code at every submission. If your gap is more on the API-and-infrastructure side, the [Full Stack Development course](/courses/fullstack-development) builds those foundations with the same project-first approach.
