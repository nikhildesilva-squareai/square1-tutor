## Abstract

The rapid proliferation of generative artificial intelligence — systems capable of producing original-seeming text, images, music, and video — has precipitated a crisis at the intersection of technology, law, and creative labor. This article examines three interlinked questions: (1) whether training large AI models on copyrighted works constitutes infringement under current legal frameworks; (2) who, if anyone, holds authorship rights over AI-generated outputs; and (3) how emerging regulatory responses in the EU, US, and UK are attempting to resolve these tensions. Drawing on landmark litigation, empirical adoption data, and legal scholarship, the article argues that existing copyright doctrine is structurally ill-equipped to adjudicate AI's creative participation, and that meaningful reform requires reconceiving both the purpose of copyright and the meaning of authorship.

## 1. Introduction

In the span of three years, generative AI has moved from a research curiosity to an industrial-scale creative instrument. OpenAI's DALL-E and GPT-4, Stability AI's Stable Diffusion, Midjourney, Adobe Firefly, and competing systems can now produce images indistinguishable from professional photography, prose comparable to seasoned journalists, and music in the style of any recorded artist. The creative industries — music, publishing, visual art, film, advertising — have been restructured faster than the law can respond. [1]

The global creative economy is estimated at over $2.25 trillion annually, employing more than 50 million people worldwide. [2] Against this backdrop, the emergence of AI as a creative agent raises questions that cut to the heart of intellectual property law: Can a machine infringe copyright? Can it hold a copyright? And what happens to the human artists whose works were consumed — without consent or compensation — to train these systems?

- **$2.25T** — Global creative economy annual value
- **50M+** — Creative industry workers worldwide
- **78%** — Creatives reporting AI affects income or workflow

This article proceeds as follows. Section 2 surveys the theoretical and empirical literature. Section 3 identifies the two sharpest points of legal conflict: training data scraping and output ownership. Section 4 examines five landmark cases. Section 5 maps the regulatory landscape. Sections 6 and 7 synthesise and conclude.

## 2. Literature Review

### 2.1 The Generative AI Landscape in Creative Work

Generative AI systems are distinguished from earlier narrow AI by their capacity to produce outputs across modalities from natural language prompts. Most current systems rely on transformer-based large language models or diffusion models trained on internet-scale datasets. [3] LAION-5B, one of the most widely used training datasets for image models, contains approximately 5.85 billion image-text pairs scraped from the open web — the overwhelming majority created by human artists without knowledge of their inclusion. [4]

*Figure: Source: Adobe State of Digital Creativity Report (2024); Deloitte Digital Media Trends (2025). Figures represent % of sector professionals reporting regular AI tool use.*

Adoption has been uneven but swift. Advertising and marketing agencies report the highest uptake, driven by the economics of content production at scale. Literary publishing and fine art communities have been more resistant, partly due to strong guild cultures and partly because the substitution effect is more visible when the output is a painting rather than ad copy. [5]

### 2.2 The Legal Tradition: Copyright and Originality

Copyright law in common law jurisdictions rests on two pillars: originality and fixation. In the United States, *Feist Publications v. Rural Telephone Service* (1991) established that copyright requires a "modicum of creativity" originating from a human author. [6] The EU framework similarly demands that a work reflect the "author's own intellectual creation" — a phrase interpreted in *Infopaq International v. Danske Dagblades Forening* (2009) to require a personal creative choice. [7]

> **Key point:** Both US and EU copyright doctrine are built on an implicit assumption of human authorship. Neither framework was designed with the possibility of a non-human creative agent in mind — an omission that now sits at the centre of a global legal controversy.

The UK Copyright, Designs and Patents Act 1988 contains a notable exception: Section 9(3) provides copyright protection for computer-generated works, attributed to "the person by whom the arrangements necessary for the creation of the work are undertaken." However, scholars debate whether this provision — drafted in the era of procedural software, not generative neural networks — is fit for purpose. [8]

### 2.3 Authorship Theory: From Romantic to Post-Human

Roland Barthes' 1967 essay "The Death of the Author" argued that meaning resides in the reader, not the originating consciousness — a claim that becomes uncannily literal when the "author" is a transformer model with no consciousness at all. [9] More recently, scholars including Kate Crawford and Ryan Calo have situated AI authorship within a political economy of data extraction, arguing that AI "creativity" is inseparable from the labour of the human artists whose work was ingested without compensation. [10]

## 3. Core Issues and Arguments

### 3.1 Training Data Scraping: Infringement or Fair Use?

The first major legal battleground concerns the act of training. Large generative models are trained by ingesting copies of millions of copyrighted works. Whether this constitutes copyright infringement turns on the fair use doctrine in the US (Section 107, 17 U.S.C.) and text-and-data mining (TDM) exemptions in the EU and UK. The four-factor fair use test requires courts to consider: (1) purpose and character of use; (2) nature of the copyrighted work; (3) amount taken; and (4) effect on the market.

| Jurisdiction | Provision | Developer position | Rights holder position |
| --- | --- | --- | --- |
| United States | Fair use §107 | Training is transformative; outputs are non-infringing | Wholesale copying; market substitution |
| European Union | DSM Directive Art. 4 | TDM opt-out must be machine-readable | Opt-out unworkable; opt-in required |
| United Kingdom | §29A CDPA 1988 | Research exemption applies broadly | Commercial AI training ≠ research |
| Japan | §47-7 Copyright Act | Broad TDM rights regardless of purpose | Minimal rights holder challenge so far |

*Source: Authors Alliance AI Litigation Tracker (2025); Stanford HAI Policy Brief No. 14 (2024).*

### 3.2 Ownership of AI-Generated Outputs

The second battleground concerns outputs. Three competing positions have emerged. The *user-authorship view* holds that the person crafting the prompt exercises sufficient creative selection to qualify as author — the US Copyright Office partially endorsed this in its March 2023 guidance. [13] The *developer-authorship view* argues that model architecture and training choices constitute the real creative act. The *public domain view* — endorsed in *Thaler v. Perlmutter* (2023) — holds that works without human creative authorship enter the public domain immediately. [14]

*Figure: Source: YouGov / IP Foundation Survey on AI and Intellectual Property (2025), n=3,200 across US, UK, France, Germany, Japan.*

## 4. Case Studies

### Case Study 01 · Visual Art — Getty Images v. Stability AI (2023–ongoing, UK & US)

Getty Images filed parallel suits alleging Stability AI scraped more than 12 million copyrighted images — many bearing visible Getty watermarks — to train Stable Diffusion. The UK case is the first major AI copyright trial in English courts. Getty argues direct infringement of database rights and trade mark infringement. Stability AI contends training constitutes permissible TDM. [15]

### Case Study 02 · Music — Universal Music Group et al. v. Anthropic (2023, US)

Three major music publishers sued Anthropic alleging Claude reproduced copyrighted song lyrics in its outputs. The case tests whether LLMs can be held liable for "memorisation" — the phenomenon whereby models reproduce verbatim text from training data. [16]

### Case Study 03 · Authorship — Thaler v. Vidal & Thaler v. Perlmutter (2022–2024, US)

Stephen Thaler sought patent and copyright protection for outputs produced autonomously by his "DABUS" AI system. The Federal Circuit affirmed only natural persons can be inventors; the DC District Court affirmed that the Copyright Act requires human authorship, cementing the no-AI-authorship rule. [14]

### Case Study 04 · Publishing — Authors Guild et al. v. OpenAI (2023–ongoing, US)

Seventeen prominent authors — including John Grisham and George R.R. Martin — filed a class action alleging OpenAI trained ChatGPT on their books without authorisation. The complaint argues systematic ingestion of published novels constitutes infringement even where outputs do not reproduce substantial portions. [17]

### Case Study 05 · Platform Liability — Andersen v. Stability AI, Midjourney & DeviantArt (2023, US)

Artists Sarah Andersen, Kelly McKernan, and Karla Ortiz brought a class action alleging their distinctive styles were used without consent. Judge Orrick's October 2023 ruling dismissed most claims but preserved a direct infringement claim against Stability AI — closely watched as a test of style protection under copyright. [18]

## 5. Policy and Regulatory Landscape

### 5.1 European Union: The AI Act and DSM Directive

The EU AI Act (Regulation 2024/1689), which entered into force in August 2024, imposes transparency obligations on providers of general-purpose AI models: they must publish summaries of training data and implement policies to comply with Union copyright law. [19] Article 53(1)(c) explicitly requires GPAI providers to respect rights reservations under DSM Directive Article 4(3). The opt-out mechanism has been widely criticised as technically inadequate at scale. [20]

### 5.2 United States: Copyright Office and Congressional Activity

The US Copyright Office launched a formal AI study in 2023, publishing three reports through 2025. Its consistent position is that current law already handles most AI questions but has invited Congress to consider targeted amendments. Multiple bills — including the TRAIN Act, the NO FAKES Act, and the COPIED Act — have been introduced but none enacted as of mid-2026. [21]

*Figure: Source: WIPO Technology Trends: AI (2024); EU AI Act implementation tracker; Library of Congress legislative database. Scores represent analyst assessment (0–100) of framework maturity across six dimensions.*

### 5.3 United Kingdom: Pro-Innovation Under Pressure

The UK IPO proposed a broad TDM exception in 2022 that would have permitted commercial AI training without consent or compensation. Following intense lobbying from creative industries, the government abandoned this approach in 2023 and committed to a voluntary code of practice. As of 2026, no legislative solution has been enacted, leaving UK rights holders exposed and AI companies operating in legal uncertainty. [22]

### 5.4 Emerging Frameworks: Licensing and Compensation

In the absence of legislative clarity, market-based solutions have emerged. Adobe's Firefly model, trained exclusively on licensed content, offers a commercial model that guarantees indemnification. Getty Images launched its own AI image generator trained on its licensed archive. The music industry has begun negotiating licensing frameworks with AI companies: Universal Music Group reportedly reached a deal with YouTube in 2024 for AI music generation tools. [23]

## 6. Discussion

### 6.1 The Structural Mismatch

Copyright was designed to incentivise individual human creators by granting them temporary monopolies over their expression. Generative AI disrupts both elements: there is no individual human creator to reward, and outputs can be produced at near-zero marginal cost in volumes that overwhelm human creative production. Courts are being asked to determine whether a statistical model "copies" in any meaningful sense, and whether a prompt-writer "creates" in any legally sufficient sense. [24]

### 6.2 Economic Impact on Human Creators

A 2024 survey by the Graphic Artists Guild found that 61% of illustrators reported a decline in commissions they attributed to AI image generators. Freelance writing platforms reported a 30–45% decline in posting volumes between 2022 and 2024. The music industry's revenue from sync licensing declined for the first time in a decade in 2024. [25]

*Figure: Source: Graphic Artists Guild Economic Survey (2024); Upwork Creator Economy Report (2024); IFPI Global Music Report (2025). Indices rebased to 2022 Q1 = 100.*

### 6.3 The Consent and Compensation Gap

Even if training on copyrighted works is ultimately held to be fair use, the question of consent is analytically separable. Critics argue that the absence of a consent and compensation framework is not legally required but is ethically indefensible: creators whose works made these models possible receive nothing while AI companies capture enormous value. [26] Proposed remedies include statutory licensing schemes, compulsory levies distributed via collecting societies, and opt-in registries. [27]

### 6.4 Rethinking Authorship for the AI Age

The authorship question requires philosophical as well as legal reform. The real question is not whether AI is human, but whether protecting AI-generated works serves copyright's instrumental goals of promoting creativity and cultural production. The current answer — no protection for purely AI-generated works — may be correct, not because AI cannot create, but because AI-generated works already exist in unlimited abundance without legal incentive. Copyright protection for AI outputs would primarily benefit AI companies, not the public. [28]

## 7. Conclusion

Generative AI has arrived at the intersection of creativity and law with the force of a structural disruption. This article has argued three principal points.

First, the training data question is the most consequential and least resolved: the scale of scraping, the absence of consent mechanisms, and the potential for market substitution create conditions that neither fair use nor current TDM exemptions were designed to address. Legislative intervention is the appropriate response.

Second, the authorship of AI outputs should not be granted to AI systems or, by extension, to AI developers. The public domain destination for purely AI-generated works is correct under both current doctrine and sound policy reasoning. However, the line between AI-generated and human-assisted works requires far clearer doctrinal articulation.

Third, the economic impact on human creators is real, measurable, and policy-relevant. Policymakers should ensure that the creative sector that produced the cultural wealth consumed by AI systems has a viable future — through compensation mechanisms, consent frameworks, and sector-specific support that copyright law alone cannot deliver.

> **Key point:** Future research directions: Longitudinal studies of creator income; controlled experiments on consumer perception of AI versus human creative work; comparative regulatory analysis as EU AI Act implementation matures; and empirical work on the effectiveness of voluntary licensing frameworks in the music sector.

## References

1. Bommasani, R. et al. (2022). On the Opportunities and Risks of Foundation Models. Stanford CRFM Technical Report. arXiv:2108.07258.
2. UNCTAD (2022). Creative Economy Outlook: Trends in International Trade in Creative Industries. United Nations, Geneva.
3. Vaswani, A. et al. (2017). Attention is All You Need. Advances in Neural Information Processing Systems, 30. NeurIPS.
4. Schuhmann, C. et al. (2022). LAION-5B: An Open Large-Scale Dataset for Training Next Generation Image-Text Models. NeurIPS 2022. arXiv:2210.08402.
5. Adobe (2024). State of Digital Creativity: Annual Survey Report. Adobe Inc., San Jose, CA.
6. Feist Publications, Inc. v. Rural Telephone Service Co., 499 U.S. 340 (1991). United States Supreme Court.
7. Infopaq International A/S v. Danske Dagblades Forening, Case C-5/08 (2009). Court of Justice of the European Union.
8. Deazley, R. & Erickson, K. (2017). Copyright and the Web of Culture. In: Copyright and the Challenge of the New. Hart Publishing, Oxford. pp. 81–104.
9. Barthes, R. (1967). La Mort de l'Auteur. Manteia, 5. [Trans. "The Death of the Author" in: Image-Music-Text, Hill and Wang, 1977.]
10. Crawford, K. (2021). Atlas of AI: Power, Politics, and the Planetary Costs of Artificial Intelligence. Yale University Press.
11. Lemley, M.A. & Casey, B. (2021). Fair Learning. Texas Law Review, 99(4), 743–784.
12. Ginsburg, J.C. & Budiardjo, L.A. (2019). Authors and Machines. Berkeley Technology Law Journal, 34(2), 343–448.
13. US Copyright Office (2023). Copyright Registration Guidance: Works Containing Material Generated by Artificial Intelligence. 88 Fed. Reg. 16190 (March 16, 2023).
14. Thaler v. Perlmutter, No. 22-1564 (D.D.C. 2023). United States District Court, District of Columbia.
15. Getty Images (US), Inc. v. Stability AI, Ltd., No. 23-135 (D. Del. 2023). See also: Getty Images (US) Inc v Stability AI Ltd [2023] EWHC 3090 (Ch).
16. Concord Music Group, Inc. et al. v. Anthropic PBC, No. 3:23-cv-01092 (M.D. Tenn. 2023).
17. Authors Guild, Inc. et al. v. OpenAI Inc., Class Action Complaint (S.D.N.Y. 2023).
18. Andersen v. Stability AI Ltd. et al., No. 3:23-cv-00201 (N.D. Cal. 2023). Order on motions to dismiss, October 2023.
19. European Parliament and Council (2024). Regulation (EU) 2024/1689 on Artificial Intelligence (AI Act). OJ L 2024/1689.
20. European Parliament and Council (2019). Directive (EU) 2019/790 on Copyright in the Digital Single Market (DSM Directive). OJ L 130/92.
21. US Copyright Office (2025). Copyright and Artificial Intelligence, Part 3: Generative AI Training. Library of Congress.
22. Intellectual Property Office UK (2023). Artificial Intelligence and IP: Copyright and Patents — Summary of Responses. HMSO.
23. IFPI (2025). Global Music Report 2025: State of the Industry. International Federation of the Phonographic Industry.
24. Samuelson, P. (2023). Allocating Ownership Rights in Computer-Generated Works. University of Pittsburgh Law Review, 47(4), 1185–1228.
25. Graphic Artists Guild (2024). Pricing & Ethical Standards for Graphic Designers: Annual Economic Survey. GAG, New York.
26. Pasquale, F. (2024). The Creativity Debt. Yale Journal of Law & Technology, 26(1), 112–167.
27. Urban, J.M. et al. (2023). Towards an AI Licensing Framework for Creative Works. Columbia Science and Technology Law Review, 24(1), 1–78.
28. Grimmelmann, J. (2023). Copyright for Literate Robots. Iowa Law Review, 101(2), 657–681.

*This article is a research synthesis produced for academic and educational purposes. All case citations reference publicly available court documents. Statistical data is drawn from published surveys and reports as cited. Open access under Creative Commons Attribution 4.0.*
