# Audience Pain-Point Research — August 2026

Three parallel research passes over recent (2025–26) forum discussions, social media discourse, and job-market data. Every claim carries a source URL. "Recurring" = found in 3+ independent places; anecdotes are labeled. No invented statistics. Reddit data was accessed via the PullPush archive (Reddit blocks direct crawling); coverage skews H1-2025 where noted.

Compiled for Square 1 AI messaging, ad copy, and product decisions.

---

## Audience 1: AI / GenAI / Agentic AI learners (career track)

### Top pain points (ranked by recurrence)

1. **Roadmap chaos / resource overload** — the single most repeated post type in r/learnmachinelearning is "where do I even start": a 100-pt thread from a student who knows Python but is "overwhelmed by where to go next" (https://www.reddit.com/r/learnmachinelearning/comments/1kj0dti/), a 131-pt "Ultimate ML Roadmap" thread (https://www.reddit.com/r/learnmachinelearning/comments/1kk1j6w/), plus a flood of low-karma "need a roadmap" posts and roadmap content mills (https://dev.to/dr_hernani_costa/ai-learning-roadmap-2025-9-university-courses-to-master-ai-3oah).

2. **Tutorial hell — learning doesn't convert to building** — "After a year of courses... I wasn't actually learning" (https://www.reddit.com/r/learnmachinelearning/comments/1knuy0x/); "built projects, and still feel lost" (https://www.reddit.com/r/learnmachinelearning/comments/1kf9h9p/); widely-shared arguments that Kaggle-clone portfolios don't land interviews (https://medium.com/data-science-collective/stop-follow-along-tutorials-build-real-ai-ml-projects-instead-99f2e6933c4b, https://dev.to/surajupadhyay/machine-learning-the-tutorial-hell-6f9).

3. **Content staleness + framework churn (worst in agentic AI; growing)** — learners flag even DeepLearning.AI series as "outdated now" (https://www.reddit.com/r/learnmachinelearning/comments/1k1dc5s/, also 1ka3p85, 1it630j). Objective churn: 15+ NEW agent frameworks hit the HN front page between Feb 2025 and Jul 2026 (Mastra, 12-factor-agents, Jido, Hephaestus, Microsoft Agent Framework, Gambit…) per HN Algolia (https://hn.algolia.com/api/v1/search?query=agent%20frameworks). Model-release pace overwhelm: https://aashaysachdeva.substack.com/p/rlocalllama-is-the-real-benchmark, https://fortune.com/2024/09/26/ai-model-releases-accelerates-progress-confusion.

4. **Entry-level catch-22 (growing)** — MS-holder with 1.5 yrs ML experience: "everyone 'wants' an ai engineer but reject every single one that applies" (https://www.reddit.com/r/cscareerquestions/comments/1kmhx5w/); self-study doubt threads (https://www.reddit.com/r/learnmachinelearning/comments/1kf1xn9/).

5. **Cost of hands-on practice** — "Can't we learn agents for free?" — 70 pts, 52 comments on API costs blocking practice (https://www.reddit.com/r/AI_Agents/comments/1kq6bx5/); fine-tuning tooling overwhelm (https://www.reddit.com/r/learnmachinelearning/comments/1k1f3yp/).

6. **Guru/credential distrust** — "Too many fake gurus trying to sell courses" (https://www.reddit.com/r/AI_Agents/comments/1kl41b8/); certificates critiqued as LinkedIn decoration (https://www.goodreads.com/author_blog_posts/26062670-ai-mastery-certification-the-best-one-for-2025); NOTE conflicting vendor evidence: Pearson claims cert-holders see promotions (https://www.stocktitan.net/news/PSO/certifications-fuel-success-in-the-age-of-ai-pearson-releases-the-4suu6j3h6xqr.html) — treat as conflicted.

7. **Emotional layer: imposter syndrome, saturation dread, AI-noise fatigue** — imposter posts (https://www.reddit.com/r/learnmachinelearning/comments/1if4t2n/); "noise around Agents... becoming unbearable" (https://www.reddit.com/r/AI_Agents/comments/1kkhvk0/); saturation worry at 62 pts (https://www.reddit.com/r/learnmachinelearning/comments/1kk25sl/); 147-pt HN thread "Is anyone else just done with the industry?" (https://news.ycombinator.com/item?id=44393304).

### Are they finding jobs?

Two-sided market:
- **Demand (senior-skewed) is real:** LinkedIn Jobs on the Rise 2026 ranks AI Engineer the **#1 fastest-growing US role, +143% YoY postings**, ~75K AI-engineer postings 2023–25; top skills LangChain, RAG, PyTorch (https://www.linkedin.com/pulse/linkedin-jobs-rise-2026-25-fastest-growing-roles-us-linkedin-news-dlb1c, https://www.forbes.com/sites/juliakorn/2026/01/14/future-proof-your-career-with-linkedins-2026-fastest-growing-jobs-list/).
- **But juniors mostly aren't the ones hired:** only **2.5% of 903 Glassdoor AI-engineer postings target 0–2 yrs experience** (https://365datascience.com/career-advice/career-guides/ai-engineer-job-outlook-2025/); big-tech new-grad hiring **down >50% vs 2019**, new grads = 7% of hires (https://www.signalfire.com/blog/signalfire-state-of-talent-report-2025); US tech postings down 36% vs Feb-2020, CS-grad unemployment ~6.1% (https://www.softwareseni.com/what-the-data-actually-shows-about-ai-and-junior-developer-employment-decline/, https://intuitionlabs.ai/articles/ai-impact-graduate-jobs-2025).
- Perspective: only ~3.8% of ALL Indeed postings ask for any AI skill (https://www.hiringlab.org/2025/10/28/how-employers-are-talking-about-ai-in-job-postings/).
- **Net:** career-switchers with prior SWE experience are converting; true beginners face a narrow door. The market rewards current, production-grade, end-to-end proof of skill — exactly what self-learners struggle to produce.

### What they wish existed
1. A free/cheap sandbox to practice agents without burning API money (https://www.reddit.com/r/AI_Agents/comments/1kq6bx5/)
2. A trustworthy, current, structured roadmap that isn't a guru funnel (https://www.reddit.com/r/AI_Agents/comments/1kl41b8/)
3. A bridge from tutorials to real, employer-respected projects (https://www.reddit.com/r/learnmachinelearning/comments/1knuy0x/)
4. Courses that don't rot (staleness complaints above = implicit demand for continuously-updated curricula)

---

## Audience 2: Cybersecurity learners (career track)

Method note: Reddit fully blocked for this pass; sentiment from HN, Blind, practitioner Substacks, and coverage documenting the same recurring themes.

### Top pain points (ranked by recurrence)

1. **The entry-level paradox (strongest signal)** — "entry" postings demand 3–5 years experience; ISC2's own hiring-manager survey: **34% require CISSP and 38% CISA for entry-level** — certs that themselves require 5+ years (https://www.isc2.org/Insights/2025/06/cybersecurity-hiring-trends-study, https://www.forbes.com/sites/emilsayegh/2025/02/05/the-cybersecurity-crisis-companies-cant-fill-roles-workers-shut-out/, https://theentrylevelcurmudgeon.substack.com/p/part-three-the-chasm-between-entry).

2. **ATS black hole / ghosting** — single postings draw hundreds-to-thousands of applicants; canned rejections >90% of the time, described as "dehumanizing" (https://cloudsecurityguy.substack.com/p/why-is-it-so-hard-to-find-a-cybersecurity, https://theentrylevelcurmudgeon.substack.com/p/part-three-the-chasm-between-entry, https://acsmi.org/blogs/cybersecurity-workforce-shortage-a-comprehensive-2025-study).

3. **Certs alone don't convert** — Security+/CEH "not golden tickets" (Forbes above); Blind posters with Security+ + years of adjacent IT report no traction (https://www.teamblind.com/post/looking-for-guidance-or-referrals-in-cybersecurity-feeling-stuck-zcd7fsuq); OSCP costs $1,699–$2,749 + 20–40% hidden costs (https://certempire.com/oscp-certification-cost/). Yet hiring managers rank certs their #1 attribute (47%, ISC2 above) — the treadmill is real on both sides.

4. **The junior pipeline is being cut** — **31% of security teams have ZERO entry-level staff**; SOC/security-analyst roles lead reductions at 32% — the traditional on-ramp (Forbes above, https://www.sans.org/press/announcements/sans-research-cybersecurity-talent-shortage-narrative-wrong-real-crisis-what-your-team-doesnt-know-starting-ai).

5. **AI eating tier-1 tasks (newer)** — 74% of orgs say AI already affects team structure (SANS above); HN counterpoint: "AI is a great excuse" to gatekeep (https://news.ycombinator.com/item?id=44694553, https://www.isaca.org/resources/isaca-journal/issues/2025/volume-5/artificial-intelligence-and-entry-level-cybersecurity-jobs).

6. **SOC burnout on the other side of the door** — **71% of SOC analysts report burnout** from alert fatigue; sub-18-month turnover in some SOCs (https://www.wiz.io/academy/cloud-careers/soc-analyst-burnout, https://netenrich.com/blog/soc-analyst-burnout, https://ilovesec.substack.com/p/six-tickets-the-ramblings-of-a-beaten).

7. **Self-study plateau / tooling overwhelm** — beginners jumping to HackTheBox too early "feel stuck and lose motivation" (https://cyberlad.io/hackthebox-vs-tryhackme/, https://acefortis.com/2026/01/20/tryhackme-vs-hackthebox-comparison-guide/, https://mycybersecuritypath.com/labs/tryhackme-vs-hackthebox/).

8. **Low-paid first rungs (anecdotal)** — MSSP tier-1 offers as low as $15/hr on third shift (https://www.teamblind.com/post/soc-analyst-opportunity-wanv4gxs).

### Are they finding jobs? The shortage contradiction, both sides cited

- **Shortage claims:** ~4.8M unfilled roles globally (ISC2 2024, via Forbes); 514,359 US cyber postings in 12 months, supply/demand ratio 74% (CyberSeek — https://www.nist.gov/news-events/news/2025/06/new-cyberseek-updates-reveal-57000-increase-cybersecurity-job-openings); 65% of orgs report unfilled positions (ISACA 2025 — https://www.isaca.org/about-us/newsroom/press-releases/2025/state-of-cybersecurity-2025-global-press-release).
- **Counter-evidence:** SANS: the shortage narrative is wrong — 60% cite skills gaps vs 40% headcount; entry-level recruitment poses "minimal recruitment challenges at just 4%" (employers fill junior seats easily; scarcity is SENIORS). A CISA advisor calls the shortage "largely a myth" (https://www.afcea.org/signal-media/cyber-edge/cyber-workforce-shortage-myth). ISC2 2025: shortage reports declining, 34% say staffing adequate (https://www.isc2.org/Insights/2025/12/2025-ISC2-Cybersecurity-Workforce-Study).
- **Net:** real junior openings exist but are outnumbered by applicant floods. Where orgs DO hire juniors: 61% of entry roles fill within 3 months; 90% of managers accept IT-experience-only candidates; 81% of hires reach independence within a year (ISC2 hiring study). The bottleneck is FEW JUNIOR SEATS, not unhireable juniors.

### What they wish existed
- Mentorship — 50% of orgs offer none (ISC2); paid marketplaces exist to fill the gap (https://mentorcruise.com/filter/cybersecurity/, https://www.projectcyber.org/post/first-year-of-the-cyber-pathways-mentorship-program)
- Experience bridges — internships/apprenticeships rank among top hiring sources (55%/46%, ISC2)
- A structured beginner→job path (guided-path platforms praised precisely because unguided self-study causes quitting)
- Hiring feedback + honest job descriptions (the Curmudgeon series' core demand; ISC2's "unrealistic requirements" finding)
- Networking access over cold applications (https://cloudsecurityguy.substack.com/p/why-is-it-so-hard-to-find-a-cybersecurity, https://zendannyy.substack.com/p/positioning-yourself-in-cybersecurity)

Flagged: the "85% of roles filled via connections" figure circulating in bootcamp blogs is uncited — treat as marketing.

---

## Audience 3: Working professionals learning AI (the no-code lane)

### Top pain points (ranked by recurrence)

1. **Told to use AI, given no training (strongest signal, 6+ sources)** — Dayforce: **71% of workers got no AI training in the past year** (https://stocktitan.net/news/DAY/16th-annual-dayforce-pulse-of-talent-71-of-workers-untrained-in-ai-wgasv2mdhodo.html); Conference Board: 55% use AI regularly but only 1 in 3 had employer training in 6 months (https://www.hrdive.com/news/employers-may-not-be-training-workers-well-enough-for-widespread-ai-disrupt/826672/); 50% of K-12 teachers had no AI training in fall 2025 (https://www.edweek.org/technology/teacher-ai-training-is-rising-fast-but-still-has-a-long-way-to-go/2025/11, https://www.reddit.com/r/Teachers/comments/1i6vttc/).

2. **Fear of falling behind / adoption-as-career-survival** — "a real career risking move for me to not embrace it" (https://www.reddit.com/r/womenintech/comments/1jyv214/); r/marketing obsolescence worry (https://www.reddit.com/r/marketing/comments/1ki9hwc/); PMs question PMP vs managing AI agents (https://www.reddit.com/r/projectmanagement/comments/1kor6kx/); accounting juniors fear the 5-year horizon (https://www.reddit.com/r/Accounting/comments/1kpi8tx/).

3. **Generic "workslop" undermining trust** — BetterUp/Stanford: **40% of 1,150 workers received AI "workslop"; ~1h56m cleanup each** (https://hbr.org/2025/09/ai-generated-workslop-is-destroying-productivity, https://www.cnbc.com/2025/09/23/ai-generated-workslop-is-destroying-productivity-and-teams-researchers-say.html); 10k-upvote mockery of AI corporate content (https://www.reddit.com/r/LinkedInLunatics/comments/1ko2xbu/); prompt-sharing threads exist to escape "generic fluff" (https://www.reddit.com/r/ChatGPTPromptGenius/comments/1kn8rw6/).

4. **Tool overload / pace overwhelm** — WalkMe: **71% say AI tools appear faster than they can learn them**; 54% bypassed company AI tools in the last 30 days (https://www.metaintro.com/blog/bosses-pushed-workers-use-ai-backfired, https://www.itpro.com/technology/artificial-intelligence/ai-fatigue-is-the-backlash-against-ai-already-here); BCG: beyond 4 tools, self-reported productivity FALLS (+19% information overload).

5. **Self-teaching maze — no structured non-technical path** — "hundreds of hours of videos but I still have no idea what I'm doing" (https://www.reddit.com/r/AiAutomations/comments/1j8v8w9/); a designer wants AI "without getting too technical" (https://www.reddit.com/r/UXDesign/comments/1jc1t5v/); recurrent "where do I start" (https://www.reddit.com/r/ArtificialInteligence/comments/1jrsrc5/).

6. **Shame/stigma — hiding AI use** — KPMG/Univ. Melbourne (n=48,000, 47 countries): **57% hide AI use from managers/colleagues; only 47% ever trained** (https://kpmg.com/xx/en/media/press-releases/2025/04/trust-of-ai-remains-a-critical-challenge.html); Slack/Salesforce: ~half of US workers uneasy admitting AI use, fear being seen as lazy/cheating (https://www.salesforce.com/news/stories/ai-at-work-guilt/).

7. **Course/guru distrust** — "AI training course scams explode" (https://aiforreal.substack.com/p/ai-training-course-scams-explode); documented guru scam (https://www.toolify.ai/ai-news/exposed-the-deceitful-scam-by-ai-guru-siraj-raval-1835426); "everyone became an AI strategist overnight" fatigue (https://thelinkedblog.com/2026/thought-leadership-on-linkedin-in-2026-4057/, https://www.teamblind.com/post/linkedin-connections-became-ai-enthusiasts-overnight-0aefyndx).

8. **AI used against them, not for them (anecdotes)** — junior copywriter's work rewritten by ChatGPT without permission (https://www.reddit.com/r/marketing/comments/1kg8bsy/); non-technical users can't judge output quality (https://mlnotes.substack.com/p/how-to-leverage-ai-as-a-non-technical).

### The pressure/anxiety numbers

- Pew (n=5,273, Feb 2025): **52% of US workers worried** about workplace AI; 33% overwhelmed; 32% expect fewer opportunities (https://www.pewresearch.org/social-trends/2025/02/25/u-s-workers-are-more-worried-than-hopeful-about-future-ai-use-in-the-workplace/)
- Opinium: 47% felt they SHOULD be excited about AI but felt worry (https://www.itpro.com/technology/artificial-intelligence/ai-fatigue-is-the-backlash-against-ai-already-here)
- Microsoft WTI 2025 (n≈31,000): leaders' AI-agent familiarity 73% vs employees 45% (https://www.microsoft.com/en-us/worklab/work-trend-index)
- Dayforce: 82% of execs say employers should reskill; only 17% of employees see it happening
- LinkedIn: 177% growth in members adding AI skills since 2023 (https://business.linkedin.com/learn/resources/workplace-learning-report)
- Gallup: workplace AI use 40%→45% in ONE quarter of 2025 (https://www.gallup.com/workplace/699689/ai-use-at-work-rises.aspx)

### What they wish existed / what they distrust

Wished-for:
1. **Role-specific, applied training** — Section benchmark: agent-trained workers score 44/100 vs 25 untrained; only 17% got such training (https://www.sectionai.com/ai/the-ai-proficiency-report)
2. **Sanctioned time + guidance** — Slack: guided workers adopted 13% faster; **61% have spent <5 hours total learning AI** (https://slack.com/blog/news/the-fall-2024-workforce-index-shows-executives-and-employees-investing-in-ai-but-uncertainty-holding-back-adoption); 61% say employer-led training would speed adoption (Microsoft Ireland WTI)
3. **Credible proof** — 42% of businesses seek AI-qualified applicants and struggle to find them (https://www.careers360.com/courses-certifications/articles/ibm-vs-google-which-ai-certification-actually-gets-you-hired-in-2025)

Distrusted: influencer/guru courses; AI-written "thought leadership" itself (~40% odds LinkedIn career advice is AI-generated — https://cybernews.com/ai-news/linkedin-thought-leadership-posts-ai-generated/); hype indistinguishable from reality (https://siddhantkhare.com/writing/ai-fatigue-is-real).

---

## Synthesis: the one shared meta-pain and what Square 1 does about it

**Across all three audiences, the deepest pain is not learning — it's PROVING.** The junior on-ramp collapsed in both technical fields (2.5% of AI postings accept juniors; 31% of security teams have no entry-level staff), and professionals face proof-pressure of a different kind (57% hide their AI use; "workslop" made unverified AI skills a liability). Meanwhile every audience independently distrusts guru courses and stale content.

### Pain → what Square 1 already has → messaging move

| Pain (cited above) | Square 1 already has | Say it like this |
|---|---|---|
| Roadmap chaos | One structured path per track, placement-tested | "Stop collecting tutorials. One path, placed to your level." |
| Tutorial hell / proof gap | 152 public graded project repos, objective answer-key marking, portfolio + verify pages | "Employers don't read certificates. They read repos. Leave with 10." |
| Content rot (agentic worst) | Curriculum-currency passes; MCP/agent-protocols module | "Courses rot in 6 months. Ours get updated — check the changelog." |
| API costs block practice | Wallet-capped AI included in every seat | "Practice on real AI without burning your own API bill." |
| Guru distrust | No fake testimonials, cited stats, real repos, honest pricing | Keep doing it — and say it: "No gurus. No fake reviews. Look at the actual work." |
| Cert treadmill (cyber) | Skill report + graded projects as evidence artifacts | "A cert says you memorized. A graded project says you can." |
| No employer training (71%) | Role courses (Marketers/Sales/Teachers/PM/Ops/Finance/Founders/Students) in 6-week shapes | "Your company won't train you. Train yourself in 20 min/day." |
| Workslop fear | Prompt Labs graded by Nova — output QUALITY is the graded thing | "Stop shipping AI slop. Learn to make AI work that passes review." |
| Hiding AI use / no proof | Certificates + verify page + skill report | "Stop hiding your AI use — get it validated." |
| Fear of falling behind | 3-min skill check as the honest entry | Meet the anxiety, don't amplify it: "Find out where you actually stand — 3 minutes, free." |

### Genuine gaps (things the research says matter that Square 1 does NOT yet have)
1. **Mentorship / human touch** — 50% of cyber orgs offer none; learners explicitly want humans. Nova is a tutor, not a mentor. (Community exists but is disabled for launch.)
2. **Networking/referral access** — repeatedly cited as the real hiring channel; no current product answer.
3. **Job-hunt layer** — interview prep exists (Nova interview mode) but resume/ATS guidance and "how to get seen" content is absent while ATS ghosting is a top-3 pain.
4. **Honest job-market framing per track** — the data says juniors face a narrow door; landing copy sells role outcomes + salaries. Consider adding the honest path narrative ("the door is narrow; here's what actually gets people through it: proof") — it matches the honesty brand and pre-empts skepticism.

### Ad-copy angles straight from the research (per audience)
- Career AI: "A year of tutorials and still lost? Five questions tell you where you actually stand."
- Agentic: "The framework you're learning will be dead in 6 months. The fundamentals won't. Learn those."
- Cyber: "Entry-level jobs that want 5 years' experience. Beat the paradox with proof, not certs."
- Professionals: "Your boss said 'use AI.' Nobody showed you how. 20 minutes a day, for your actual job."
