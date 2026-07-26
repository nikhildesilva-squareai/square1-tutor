Large language models are now embedded in customer support, code review, search and internal tooling, which means their weaknesses are now everyone's problem. LLM security is the discipline of understanding how these systems fail under attack and designing applications so that failures stay small. This article covers the core attack classes every developer and security practitioner should recognise, and the defensive habits that matter most.

## Why LLM security is different from traditional application security

Traditional application security deals with deterministic software: given an input, the code does the same thing every time, and a vulnerability is a reproducible flaw you can patch. LLMs break both assumptions. Their behaviour is probabilistic, learned from data rather than written by developers, and the same input can produce different outputs.

That changes the defender's job in three ways. First, you cannot enumerate the inputs that cause bad behaviour — natural language is too large a space. Second, you cannot "patch" a model the way you patch a function; changing behaviour means retraining, fine-tuning or wrapping the model in external controls. Third, the boundary between data and instructions is blurry, because the model reads both as text.

None of this makes classic security irrelevant. LLM applications still run on servers, use APIs, store secrets and authenticate users, and most real incidents involve boring, well-understood failures around the model rather than exotic attacks on the model itself. LLM security is additive: everything you knew still applies, plus a new layer.

## The core attack classes to know

A handful of attack categories account for most of the practical risk in deployed LLM applications.

- **Prompt injection.** Hostile instructions placed in text the model reads — directly by a user, or indirectly via documents, web pages and emails the model processes. This is the signature LLM vulnerability, and it is covered in depth by community efforts such as the OWASP Top 10 for LLM applications.
- **Jailbreaking.** Persuading a model to bypass its own refusal behaviour through role-play framing, obfuscation or many-step manipulation. The consequence depends on context: for a public chatbot it is mostly reputational; for a model that gates real actions, it is an access-control failure.
- **Sensitive data leakage.** Models can reveal information they should not: secrets pasted into prompts, personal data in training or fine-tuning sets, or content from other users' context in badly isolated systems. Leakage is often a plumbing failure — logging prompts carelessly, or reusing context across sessions — rather than a model failure.
- **Insecure output handling.** Treating model output as trusted is a classic mistake. If generated text is rendered as HTML, executed as code, or passed into a shell or database without validation, the model becomes an injection vector into your own systems.
- **Supply chain risks.** Applications inherit risk from base models, fine-tuned weights of unknown provenance, third-party datasets, plugins and libraries. A model file from an unverified source is executable-adjacent content and deserves the same suspicion as an unsigned binary.
- **Denial of wallet.** LLM calls cost money and compute. Attackers or careless users can drive up costs with long inputs, repeated calls or expensive tool loops. Rate limits and budget caps are security controls here, not just financial hygiene.

## Where real applications actually fail

It is worth separating headline attacks from everyday failures. In practice, the most common problems in shipped LLM features are prosaic: API keys committed to repositories, system prompts containing secrets, no rate limiting, model output piped into privileged actions without checks, and retrieval systems that happily serve one user's documents to another because access control was applied at the application layer but not the retrieval layer.

The lesson is that an LLM application is an application first. Threat-model the whole system: where does untrusted input enter, what can the model touch, what happens downstream of its output, and who can observe the traffic. The model is one component in that diagram, not the whole diagram.

## Defensive habits that scale

A few habits consistently separate robust LLM applications from fragile ones.

- **Assume injection, design for containment.** Give the model the least privilege it needs. Scope tools and API access narrowly, and require human confirmation for irreversible actions.
- **Validate outputs like inputs.** Parse, constrain and sanitise model output before anything downstream consumes it. Structured output formats with strict schemas are easier to validate than free text.
- **Isolate contexts.** Keep users' data separate at every layer, including retrieval indexes and caches. Cross-tenant leakage is one of the most damaging and most preventable failures.
- **Guard the secrets.** Never put credentials in prompts, and treat prompt logs as sensitive data with retention limits and access controls.
- **Test adversarially and continuously.** Red-team new features before launch and re-test after model or prompt changes, because behaviour shifts with every update.
- **Monitor in production.** Log refusals, anomalous outputs, unusual token consumption and tool-call patterns. Many attacks look like traffic anomalies before they look like breaches.

## Building LLM security skills

Demand for people who understand both application security and model behaviour is growing faster than the supply, and the skill is best learned by doing. Reading attack taxonomies is a start, but the durable understanding comes from building an LLM feature, attacking it yourself, and fixing what breaks. Writing prompts that resist manipulation is a practisable craft: on Square 1, the AI tutor Nova grades prompts as well as code, so you get concrete feedback on whether a defensive prompt actually holds up rather than just whether it looks sensible.

## Frequently asked questions

**Is LLM security only relevant if my company builds its own models?**

No. Most organisations consume models through APIs, and nearly all the attack classes above — injection, leakage, insecure output handling, supply chain, cost abuse — apply to applications built on third-party models. If your product sends untrusted text to a model and acts on the response, LLM security is your problem regardless of who trained the weights.

**What should I learn first: machine learning or security fundamentals?**

For LLM application security, security fundamentals transfer better. Access control, input validation, secrets management and threat modelling carry over directly, while deep ML theory is rarely the bottleneck. A working mental model of how LLMs process context and follow instructions is enough to start; you can deepen the ML side as you go.

**Are guardrail products enough to secure an LLM application?**

Guardrails — input filters, output classifiers, policy layers — reduce risk but are probabilistic and can be bypassed. Treat them as one layer in a stack that also includes least privilege, output validation, context isolation and monitoring. Any vendor claiming complete protection against prompt injection is overstating what current techniques can deliver.

## Where to go from here

LLM security rewards practitioners who can move between the security mindset and the ML mindset. To see where your current strengths and gaps are, take the [free 3-minute skill check](/diagnostic). To build the underlying security foundations properly — with graded, hands-on projects rather than passive reading — start with the [Cybersecurity course](/courses/cybersecurity).
