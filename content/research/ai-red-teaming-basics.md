AI red teaming is the practice of deliberately trying to make a model misbehave before real users or attackers do it for you. Borrowed from security, the idea is simple: adopt an adversarial mindset, probe the system for weaknesses, and report what breaks so it can be fixed. This guide covers what red teaming is, how to run a basic exercise, and the techniques worth knowing when you start.

## What AI red teaming is and why it exists

Traditional software testing checks that a system does what it should. Red teaming checks that a system does not do what it should not — a harder question, because the space of undesirable behaviours is open-ended and adversaries are creative. You are not verifying a spec; you are hunting for the inputs nobody thought to forbid.

For AI systems, and language models in particular, this matters because behaviour is learned rather than programmed. A model may have absorbed capabilities and tendencies its developers never intended, and standard evaluation suites only cover behaviours someone thought to test. Red teaming exists to find the rest: the jailbreak that slips past the safety training, the prompt that extracts private data, the phrasing that coaxes out harmful instructions, the edge case where the model confidently fabricates.

It is worth separating red teaming from two neighbours. Benchmarking measures average performance on a fixed test set. Automated evaluation runs scripted checks at scale. Red teaming is the creative, adversarial, often manual search for failures those approaches miss — though the best failures found by red teamers then get turned into automated evaluations so they never regress.

## Categories of failure worth probing

A useful red team covers several distinct risk classes rather than fixating on one. The main families for a modern language model or AI application include the following.

Harmful content generation: attempts to get the model to produce dangerous instructions, harassment, extremist material or other content it is meant to refuse. The interesting cases are rarely blunt requests; they are the framings that disguise intent.

Jailbreaks and instruction override: prompts engineered to make the model ignore its guidelines — role-play framings, hypothetical scenarios, encoded requests, or claims of special authority. These test the robustness of the safety layer rather than the base behaviour.

Prompt injection: content in a document, web page or tool output that the model reads as instructions and obeys, even though it came from data rather than the user. For any system that browses, reads files or calls tools, this is often the highest-impact vulnerability, because the attacker is not the user at all.

Privacy and data leakage: attempts to extract training data, system prompts, other users' information, or secrets the model should not reveal.

Reliability and honesty failures: prompts that elicit confident fabrication, sycophantic agreement with false premises, or inconsistent answers to the same question phrased differently.

Bias and fairness: inputs that reveal systematically different treatment across groups, which overlaps with formal bias auditing.

## How to run a basic red-teaming exercise

Start by defining scope and rules of engagement, exactly as a security team would. Which system and version are in scope? What counts as a finding? What must testers not do — for instance, never use real personal data, never attack production systems belonging to others? Written scope keeps the exercise focused and lawful.

Next, build a threat model. Who might attack this system, with what motivation, and through what surface? A public chatbot faces bored users probing for shock value and determined actors seeking harmful content. A tool-using agent faces prompt injection through whatever it reads. An internal assistant faces data-leakage risk. Prioritise the probes that match your actual exposure rather than testing everything shallowly.

Then probe systematically. Work category by category, and for each attempted attack keep a record: the exact input, the model's output, why it counts as a failure, and how severe it is. Vary your phrasing — small wording changes often flip a refusal into compliance, and that fragility is itself the finding. When something works, push on it: find the minimal version, then variations, to understand the underlying weakness rather than a single lucky prompt.

Finally, triage and report. Rank findings by severity and likelihood, describe each so an engineer can reproduce it, and — crucially — convert the durable ones into automated tests. A red team finding that is not turned into a regression check will quietly return after the next model update.

## Techniques and tools to know

A handful of recurring techniques account for a large share of successful jailbreaks, and knowing them makes you a faster red teamer. Role-play and persona framing ask the model to pretend to be an entity without restrictions. Hypothetical and fictional framings wrap a harmful request in a story or thought experiment. Instruction-in-data attacks hide commands inside content the model processes. Obfuscation encodes the request — different languages, character substitution, splitting a word across turns — to slip past pattern-based filters. Multi-turn attacks build context gradually so that no single message looks alarming. Payload splitting assembles a harmful whole from innocuous parts.

On tooling, red teaming spans a spectrum. Manual probing by a curious human still finds the most novel failures, because creativity is the whole point. Automated red teaming uses one model to generate adversarial prompts against another and scales coverage enormously, at the cost of missing genuinely new attack ideas. In practice teams combine them: humans discover new classes of attack, automation hammers the known classes at volume. Structured prompt libraries and evaluation harnesses help you stay organised and reproducible.

## Building the mindset

The technical techniques matter less than the disposition. Good red teamers assume every guardrail has a gap, treat a refusal as a challenge rather than a conclusion, and think about who benefits from breaking the system. They are comfortable being told the model is safe and setting out to prove otherwise. This adversarial curiosity transfers directly from security work, which is why many red teamers come from penetration testing and vulnerability research backgrounds — the target changed, the instinct did not.

It also demands responsibility. Red teaming surfaces genuinely dangerous outputs and real vulnerabilities, so findings are handled like security disclosures: shared with the people who can fix them, not published casually or used to cause harm.

## Frequently asked questions

**Do I need to be a security expert to start red teaming AI?**

It helps but is not required. A security background gives you the adversarial instinct and disclosure discipline, but many effective language-model red teamers come from writing, linguistics, domain expertise or plain persistent curiosity. The core skill is imagining how a system could be misused, then methodically trying it.

**Is red teaming the same as penetration testing?**

They share a mindset but differ in target. Penetration testing probes software and network vulnerabilities; AI red teaming probes model behaviour — what it will say and do under adversarial input. For AI systems that call tools or browse, the two converge, because a prompt injection can become a genuine security exploit.

**How is red teaming different from a bias audit?**

A bias audit is a structured, metric-driven measurement of disparities across groups. Red teaming is open-ended adversarial exploration for failures of any kind, including but not limited to bias. Bias found during red teaming usually gets handed to a formal audit to quantify.

## Where to go from here

Prompt injection and jailbreaks sit right where AI meets security, so a grounding in both pays off — the [Cybersecurity course](/courses/cybersecurity) covers the adversarial fundamentals through graded projects, with Nova reviewing your work. To see which foundations you already have, start with the [free 3-minute skill check](/diagnostic).
