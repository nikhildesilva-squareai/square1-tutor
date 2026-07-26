Deepfake fraud has moved from novelty to operational threat: synthetic voices authorise payments, cloned faces join video calls, and fabricated documents support the story. The defining shift is that seeing and hearing are no longer proof of identity — and most business processes were built on the assumption that they were. This guide explains how deepfake fraud actually works, which controls survive it, and how to prepare your organisation before the first convincing fake arrives.

## How deepfake fraud actually works

A deepfake attack is rarely just a synthetic video; it is a social engineering operation with synthetic media as one component. The typical structure has three parts.

First, harvesting: attackers gather source material — voice samples from earnings calls, conference talks, podcasts and voicemail greetings; images and video from social profiles and company pages. Public-facing executives are the easiest targets precisely because their voices and faces are abundantly documented.

Second, synthesis: modern tools can clone a voice from small audio samples and generate live conversational speech, animate a face for a video call, or produce supporting artefacts like fake documents. Quality varies, but the bar for "convincing over a compressed phone line or a low-quality video call" is far lower than for cinema — and business communication happens over exactly those degraded channels.

Third, the pretext: the fake is deployed inside a story engineered to suppress verification — urgency (a deal closing today), authority (the chief executive personally calling), and secrecy (this acquisition is confidential, tell no one). The media sells the identity; the pretext sells the action.

Finance teams are the classic target, because payment authorisation is the shortest path from deception to money. But HR (payroll changes), IT helpdesks (password and MFA resets), and executives themselves (fake calls from "board members" or "bankers") are all in scope.

## Why detection is the wrong foundation

It is natural to want a detector — software or human — that spots fakes. Both exist, and both make unreliable foundations for defence.

Human detection fails because the tells people are told to look for (unnatural blinking, lip-sync glitches, robotic cadence) are artefacts of older generation tools and continue to shrink. Worse, believing you can spot fakes creates misplaced confidence in whatever passes your inspection.

Automated detection is a genuine research field and a useful signal, but it is an arms race: detectors train on current generation techniques, generators improve, and the gap reopens. Detection also arrives too late in the workflow — a finance officer on a live call with a convincing voice does not have a forensic pipeline to hand.

The strategic conclusion is that identity verification must not depend on recognising media as authentic. Any control that begins with "if the video looks real..." is built on the assumption the attacker has already defeated.

## Controls that survive convincing fakes

The controls that work share one property: they do not care how good the fake is.

- **Out-of-band verification.** Any unusual or high-value request received by call, video or message gets verified through a separate channel the requester does not control — calling back on the number in the directory, not the number that just called. This single habit defeats most current deepfake fraud.
- **Fixed procedures for payments and credentials.** Payee changes, urgent transfers, payroll amendments and MFA resets follow a defined process with mandatory steps that no caller — however senior they sound — can waive. The scam depends on process being negotiable under pressure; make it non-negotiable.
- **Dual authorisation.** High-value actions require two people. This forces the attacker to deceive twice through independent paths, which changes the economics sharply.
- **Pre-agreed challenge information.** For genuinely sensitive relationships (executive-to-finance, family members, key suppliers), agree verification phrases or questions in advance through a trusted channel. Crude, but effective precisely because the answer is not in any harvested audio.
- **Limit the harvestable surface where practical.** You cannot remove an executive's public footprint, but you can avoid publishing more than necessary and brief high-exposure individuals that their voice and face should be assumed clonable.

Note what is absent: nothing above requires anyone to judge whether media is fake. That is the design principle.

## Preparing your organisation before it happens

Deepfake resilience is mostly preparation, and the preparation is inexpensive.

Start by mapping the processes where a convincing voice or face could move money or grant access: payments, payee management, payroll, credential resets, data releases. For each, ask whether a persuasive phone or video request could shortcut the procedure. Wherever the honest answer is yes, add out-of-band verification or dual control at that point.

Then train with realism. Tell staff plainly that voices and faces can be cloned, that the fakes are good, and that verification procedures exist because detection cannot be trusted — including their own. Tabletop a scenario: the finance manager receives a video call from the chief executive demanding a confidential urgent payment. Walking through it once, calmly, before it happens is worth more than any poster campaign.

Finally, plan the response. If a deepfake incident occurs, speed matters: freezing payments, alerting banks, preserving the media and call metadata for investigation, and briefing staff that the attacker may retry through other channels. Fold this into your existing incident response playbooks rather than treating it as exotic.

## The defender's skill set for synthetic media threats

For security professionals, deepfake defence is becoming a standard competency: interviewers and employers increasingly expect candidates to reason about synthetic media threats and design verification controls that do not depend on detection. The underlying skills are classic security thinking — threat modelling, process design, layered control — applied to a new attack surface. Building those fundamentals through hands-on, graded work is the durable preparation; on Square 1, projects in the security curriculum are graded by the AI tutor Nova, which gives concrete feedback on whether your defensive designs hold together.

## Frequently asked questions

**How much audio does an attacker need to clone a voice?**

Modern tools can produce a usable clone from remarkably small samples — the sort of material available from a conference talk, a podcast appearance or even a voicemail greeting. Quality improves with more source audio, but the practical assumption for any public-facing person should be that sufficient material already exists. Defence should proceed from that assumption rather than from hopes about sample scarcity.

**Can deepfake detection software protect my business?**

It can help as one signal — for screening submitted media, supporting investigations, or flagging suspicious calls — but it should not be the foundation. Detection is an arms race with no permanent winner, and it is rarely available at the moment of decision anyway. Process controls (out-of-band verification, dual authorisation, fixed procedures) protect you regardless of whether the fake is detectable.

**Are small businesses really targets, or just large enterprises?**

Small businesses are attractive targets because they combine payment authority concentrated in few hands with informal processes and no security team. A cloned voice of the owner calling the bookkeeper is a complete attack path in many small firms. The defences scale down well: callback verification and a fixed rule for payment changes cost nothing and close most of the risk.

## Where to go from here

Deepfake fraud is social engineering with better props, and defending against it draws on core security skills you can build systematically. Check where you currently stand with the [free 3-minute skill check](/diagnostic), then go deeper with the graded, hands-on projects in the [Cybersecurity course](/courses/cybersecurity).
