For years, the standard advice for spotting phishing was to look for bad grammar, odd phrasing and generic greetings. Generative AI has made that advice obsolete: attackers can now produce fluent, personalised, contextually plausible messages at scale, in any language, in seconds. This guide explains how AI has changed phishing, why the old detection heuristics fail, and what defences — technical and human — actually hold up.

## How AI changed the phishing economics

Phishing has always been an economics game. Attackers balance effort per message against success rate: mass campaigns were cheap but crude, while convincing spear-phishing required research and writing time that limited it to high-value targets.

Generative AI collapses that trade-off. A language model can draft a message in the tone of a colleague, reference details harvested from public profiles and company pages, and produce hundreds of individually tailored variants for the cost of a few API calls. The research step is accelerating too: scraping a target's public footprint and summarising it into "pretext material" is exactly the kind of task AI does well.

The practical consequence is that spear-phishing quality is now available at mass-phishing prices. Defenders should assume that any employee can receive a message that is fluent, personalised and free of the traditional tells — because producing one no longer costs the attacker anything meaningful.

## Why the old detection advice fails

Most security awareness training taught pattern-matching on surface features: spelling errors, awkward grammar, strange formatting, implausible senders. Those patterns were artifacts of attackers working fast in unfamiliar languages — and AI removes them entirely.

What AI does not remove is the structure of the attack itself. A phishing message still has to do certain things: create urgency or authority, move you to an attacker-controlled channel or page, and ask for something — credentials, a payment, an approval, a file. Those functional elements cannot be polished away, because they are the attack.

Modern anti-phishing advice therefore shifts from "does this message look off?" to "what is this message asking me to do?" Any message that combines urgency with a request to authenticate, pay, approve or install deserves verification through an independent channel, regardless of how legitimate it looks. Legitimacy of appearance is no longer evidence of anything.

## Beyond email: voice clones and multi-channel pretexts

AI phishing is not confined to text. Voice cloning has made phone-based pretexting — vishing — dramatically more convincing: a plausible rendition of a executive's voice asking finance to expedite a payment, or a "family member" in apparent distress, can be generated from small samples of publicly available audio.

Attackers also increasingly chain channels. An email establishes context, a text message adds urgency, and a phone call closes — each channel reinforcing the others' credibility. AI lowers the cost of orchestrating these multi-step pretexts and keeps the story consistent across them.

The defence that survives this is procedural, not perceptual: verification through a channel the requester does not control. Call back on a known number. Confirm payment changes through the established process, never through details supplied in the request itself. Agree code words or callback rules for sensitive requests in advance. These controls work precisely because they do not depend on anyone detecting the fake.

## Technical defences that still work

Human vigilance is a thin last line; the bulk of protection is architectural, and AI-fluent attackers have not invalidated it.

- **Phishing-resistant authentication.** Hardware security keys and passkeys bind authentication to the legitimate site, so credentials phished on a look-alike page do not work. This single control neutralises the most common goal of phishing regardless of how convincing the lure was.
- **Email authentication and filtering.** Standards that verify sending domains make direct impersonation harder, and modern filters — themselves increasingly ML-based — still remove the vast majority of bulk hostile mail. AI-written text can evade text-based tells, but infrastructure signals (sending patterns, domain age, link reputation) remain useful.
- **Least privilege and payment controls.** Dual approval for payments and payee changes, limits on individual authority, and separation of duties mean a single deceived person cannot complete a catastrophic action alone. Assume someone will eventually be fooled; design so it does not matter much.
- **Fast, blameless reporting.** The organisations that contain phishing well make reporting effortless and never punish the person who clicked. Speed of report determines blast radius far more than the click itself.

Defenders are also using AI on their own side — for analysing message intent rather than surface features, clustering campaign variants, and triaging user reports — which is a genuine help, though like all classifiers it is probabilistic and needs human oversight.

## Training people for the AI phishing era

Awareness training needs rewriting, not discarding. The message that "you can spot the fake" is now false and actively harmful, because it teaches people to trust messages that look professional. Effective training in 2026 teaches three things instead: that appearance is not evidence; that specific request types (credentials, payments, approvals, urgency-plus-secrecy) always trigger out-of-band verification; and that reporting fast is more valuable than being right.

Simulation programs should evolve the same way — testing whether verification procedures get followed, not whether employees can win a spot-the-typo game that attackers stopped playing.

For security professionals, this is also a career-relevant skill area: employers increasingly expect candidates to explain AI-era social engineering and design layered controls against it. Working through defensive design hands-on — and getting graded feedback on it, as with Square 1's project-based courses — builds the fluency that interview scenarios probe.

## Frequently asked questions

**Can AI-written phishing emails be detected by AI filters?**

Partially. Classifiers can flag suspicious intent, unusual sending infrastructure and campaign patterns, and they remove a large share of hostile mail. But detection is probabilistic, attackers iterate against filters, and well-crafted low-volume messages are genuinely hard to catch. Filters reduce exposure; they do not eliminate it, which is why authentication and process controls matter more than ever.

**Is it still worth running phishing simulations?**

Yes, if they are redesigned. Simulations that measure clicks on typo-ridden lures test a skill that no longer matters. Useful simulations test the behaviours that do: whether people verify unusual requests out-of-band, whether they report quickly, and whether payment and approval procedures hold under pressure. Measure reporting rate and time-to-report, not just click rate.

**What is the single best protection against AI phishing?**

Phishing-resistant authentication — security keys or passkeys — because it makes stolen credentials useless against the sites that matter, independent of anyone's judgement in the moment. Pair it with out-of-band verification procedures for payments and sensitive requests, and the two cover the majority of realistic attack outcomes.

## Where to go from here

Understanding social engineering deeply — and designing controls that survive convincing fakes — is core defensive skill, and it is testable. See where your security knowledge stands with the [free 3-minute skill check](/diagnostic), or build the full defensive toolkit through the graded projects in the [Cybersecurity course](/courses/cybersecurity).
