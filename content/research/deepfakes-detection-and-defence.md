Deepfakes — synthetic images, audio and video generated or altered by AI to depict people saying or doing things they never did — have moved from novelty to genuine risk. They enable fraud, harassment, disinformation and reputational attacks, and the technology to make them keeps getting cheaper and better. This guide explains how deepfakes work, why detection is hard, and what individuals and organisations can realistically do to defend themselves.

## How deepfakes are made

Modern synthetic media rests on generative models that learn the statistical patterns of real images, voices or video and then produce new samples that fit those patterns. Face-swapping and face-reenactment techniques map one person's expressions onto another's likeness. Voice cloning learns the timbre and cadence of a target speaker from a modest amount of audio and can then read arbitrary text in that voice. Fully generative video models synthesise moving footage from a prompt or a reference.

The important shift is accessibility. Producing convincing synthetic media once required technical skill, substantial compute and considerable source material. Today, consumer tools lower every one of those barriers, and voice cloning in particular can work from short samples that are trivial to obtain — a voicemail greeting, a conference talk, a social video. The result is that the pool of people capable of producing a passable fake has expanded enormously, and the material needed to target a specific person has shrunk.

This is why deepfakes are best understood as a scaling problem rather than a brand-new capability. Impersonation and doctored media are old; what has changed is the cost, speed and quality with which they can now be produced at volume and aimed at specific victims.

## Why detection is genuinely hard

It is tempting to hope for a reliable detector that flags synthetic media automatically. The reality is more sobering, for a few structural reasons.

First, detection and generation are locked in an arms race. Any artefact a detector learns to spot — unnatural blinking, inconsistent lighting, audio spectral quirks — becomes a target for the next generation of generators to eliminate. Detectors trained on yesterday's fakes degrade against today's, and a detector's own logic can be used to train fakes that evade it.

Second, detectors generalise poorly. A model trained to catch outputs from one generation technique often fails on another, and performance drops further on compressed, re-encoded or low-quality media of the kind that actually circulates on social platforms. A detector that scores well in the lab can be much weaker in the wild.

Third, the base rates are punishing. Most media is real, so even an accurate detector produces many false positives at scale, and falsely branding genuine footage as fake is its own serious harm. Detection also cannot easily resolve the subtler cases — real footage stripped of context, or authentic media falsely claimed to be fake, a move sometimes called the liar's dividend.

The honest takeaway: automated detection is a useful layer, not a solution. Treating any single detector's verdict as definitive is a mistake.

## Provenance: shifting from detection to authentication

Because proving something is fake is so hard, much of the serious defensive effort has shifted to proving something is real — establishing provenance at the point of capture rather than adjudicating authenticity after the fact.

The core idea is content authentication: attaching tamper-evident metadata to media when it is created or edited, recording where it came from and how it was changed, using cryptographic signatures so the record cannot be quietly altered. Industry efforts to standardise such provenance signals aim to let a viewer, or a platform, check a verifiable history rather than squint at pixels. Watermarking — embedding a detectable signal into AI-generated output — is a complementary approach that helps identify synthetic content at the source.

Neither is a panacea. Provenance metadata can be stripped, and content without it is not thereby proven fake — plenty of legitimate media carries no provenance data. Watermarks can sometimes be removed or degraded, and only cover content whose generators chose to mark it. But provenance shifts the ground from an unwinnable pixel-forensics race toward a more tractable question of verifiable history, and it scales better than per-item forensic analysis.

## Practical defences for organisations

For organisations, the most effective defences are procedural rather than technological, because the highest-impact attacks target processes, not media literacy. Voice-cloning fraud, where an attacker impersonates an executive to authorise a payment or extract information, defeats even sceptical staff precisely because the voice sounds right.

The reliable countermeasure is to remove single-channel trust from consequential actions. Payments and sensitive changes should require verification through an independent channel and a pre-agreed procedure that a convincing voice or video alone cannot satisfy — a call-back to a known number, a code word, dual authorisation. If a process can be triggered by one convincing message, cloning breaks it; if it requires an independent confirmation, cloning is far less useful.

Beyond payments, organisations should treat provenance as part of their communications: signing and authenticating official media so audiences have a way to verify it, and preparing an incident response for the scenario where a fake depicting the organisation or its leaders circulates. The response plan matters because speed is decisive — a rapid, credible rebuttal with verifiable evidence limits damage far better than a slow legalistic one. Staff awareness training helps, but should be framed honestly: the goal is procedural discipline, not an unrealistic expectation that people can eyeball a good fake.

## Practical defences for individuals

Individuals face a different threat mix — harassment, non-consensual imagery, scams targeting them or their families — and have fewer resources, so priorities differ.

Reduce the raw material where you reasonably can: the more high-quality audio and video of you is publicly available, the easier targeting becomes, though for public-facing people this is only partly controllable. Agree a verification habit with family and close contacts for the classic distress scam — a caller with a cloned voice claiming an emergency and demanding money — so an unexpected urgent request can be checked against something an impersonator would not know. Treat urgency and secrecy in any request for money or credentials as a warning sign in itself, since manufactured pressure is the common thread across these scams.

If targeted by malicious synthetic media, document everything, use platform reporting and legal avenues, which are expanding in many jurisdictions, and seek support rather than facing it alone. The harm is real and increasingly recognised as such.

## Frequently asked questions

**Can I reliably tell a deepfake by looking closely?**

Less and less. Visual tells like odd blinking, warped hands or inconsistent lighting still catch weaker fakes, but the best synthetic media has largely eliminated obvious artefacts, and circulating footage is often compressed enough to hide clues. Verification through provenance and independent confirmation is more dependable than visual inspection.

**Are deepfake detectors trustworthy?**

They are a useful layer, not a verdict. Detectors are locked in an arms race with generators, generalise poorly to new techniques and degraded media, and produce false positives at scale. Use them as one input among several, never as sole proof that content is real or fake.

**What single step most reduces deepfake fraud risk?**

For organisations, requiring independent, out-of-band verification for any payment or sensitive action — so no convincing message alone can trigger it. For individuals, a pre-agreed verification habit with family and treating urgent, secretive money requests as suspicious regardless of how authentic the voice sounds.

## Where to go from here

Defending against synthetic-media attacks draws on security thinking — provenance, verification, incident response — which the [Cybersecurity course](/courses/cybersecurity) develops through graded projects, with Nova reviewing your work. To gauge your current footing, start with the [free 3-minute skill check](/diagnostic).
