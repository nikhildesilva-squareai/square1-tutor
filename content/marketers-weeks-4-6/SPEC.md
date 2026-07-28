# AI for Marketers — weeks 4–6 extension (Square 1 AI work lane)

Extending the existing 3-week course to 6 weeks. **Weeks 1–3 already exist and must not be touched.** You are writing ONE new week of 3 lessons.

## What already exists (do not repeat this material)

- **Week 1 — The Marketer's AI Toolkit:** the marketer's brief · brand voice: teach it to sound like you · campaign ideation: go wide then sharp · audiences and personas · creative briefs for images and video
- **Week 2 — The Assets:** emails and sequences · reporting: turn numbers into the story · ads: variants, hooks, testing discipline · guardrails: claims, disclosure, brand risk · content and SEO briefs
- **Week 3 — The Operator:** analyse campaign results · social content at scale · your campaign prompt library · landing pages · the full campaign pack (a graded milestone)

Weeks 4–6 must build ON these, not restate them. Assume the learner can already write a good marketer's brief, has a brand-voice file, and has produced a campaign pack.

## House conventions (match exactly — this course is live)

- **`order_index` is PER MODULE**: your three lessons are order_index **1, 2, 3** within your new module. (Not global. This course numbers 1–5 inside each existing week.)
- `theory_md`: **5,500–7,000 chars** of markdown (existing course averages ~6,400).
- `estimated_minutes`: 26–30.
- `learning_objectives`: exactly 4 strings, "verb + outcome".
- `case_study`: markdown opening `**Brand — headline (year(s))**`, 2–4 paragraphs, real + dated + verifiable.
- `exercises`: exactly 12 — order_index 1–5 `mcq` (marks 2), 6–10 `short_answer` (marks 3, language null), 11–12 `short_answer` with `language: "prompt"` (marks 5, the Nova-graded Prompt Labs).
  - MCQ: 4 options, **correct option FIRST**, `correct_answer` = its exact text, no apostrophes anywhere in option text, options of similar length, distractors are plausible marketer misconceptions. Stems ≥ 60 chars.
  - Short answers: `correct_answer` = 2–4 sentence model answer.
  - Prompt Labs: `prompt_md` = a realistic marketing scenario + what a strong prompt must carry; `correct_answer` = a model ~100-scoring prompt.

Voice: "brief a colleague, don't query a search box." Assistant-agnostic (ChatGPT/Claude/Copilot/Gemini even-handed). British spelling. No code — this is the no-code lane. Never "simply", "just", "obviously".

Course spine, carried from weeks 1–3: **the marketer's brief** (audience + the decision the output must drive + the brand-voice constraint), plus the honesty rule — no invented statistics, no fabricated customer quotes, disclosure where required.

## Case studies — MUST be verified AND unused platform-wide

Verify each via web search (load WebSearch via ToolSearch), then DB-check the brand is unused: load `mcp__72aec352-39dc-445d-b7b2-4c5cf41d96c5__execute_sql` via ToolSearch and run against project_id `lqjlmaxcarvsqnqhbzdj`:
`SELECT count(*) FROM lessons WHERE case_study ILIKE '%<Brand>%';`
Must return **0**. This platform has ~800 lessons with case studies and the marketing ones are heavily used — expect to swap. Already used somewhere and therefore BANNED: Lexus, Duolingo, Mattel, Spotify, CNET, JPMorgan, Persado, Heinz, Nutella, Shopify, Cadbury, Coca-Cola, Washington Post, Klarna, Air Canada, Samsung, Walmart, Amazon, Zara, Ocado, Maersk, DPD, UPS, DHL, FedEx, IKEA, Toyota, Unilever, Flexport, Morgan Stanley, McKinsey, Deloitte, EY, Canva, Grammarly, Netflix, Meta, Sports Illustrated, Google, Microsoft, Slack, Notion, Zoom, Asana, monday.com, Otter.ai, Atlassian, Miro, Airtable, Linear, ClickUp, Glean, Zapier, Smartsheet, PMI, Codecademy, Coursera, Quizlet, Chegg, Pearson, Brainly, Khan Academy, Turnitin, GPTZero, UNESCO, MIT, Stanford, Harvard, Wharton, Georgia Tech, Arizona State, California State, University of Michigan, Guardian, Pac-Man, NumPy, Hubble, Git, GitHub, Homebrew, Docker, Jupyter, Python, Scratch, Ariane, Apollo, Mars Climate Orbiter, Knight Capital, Excel, Zune, Hawaii, Pixar, Toy Story, Linus Torvalds, Grace Hopper, Requests, virtualenv, Knuth, ImageNet, Siemens, Globality, Bristol Myers Squibb, Scoutbee, C.H. Robinson, Everstream, Sam's Club, Apollo.io, ZoomInfo, Gong, Lavender, Fireflies, PandaDoc, 6sense, Clari, Gainsight, Salesloft, HubSpot, Thomson Reuters, Mastercard, Metaphysic, Linkin Park, CBA, Vanderbilt, Kahoot, Quizizz, Wolfram, Stack Overflow, Sports Illustrated.

Good hunting grounds that are likely clean: smaller/lesser-covered brands, agency campaigns, martech vendors, publisher or retailer AI-content incidents, regulator actions on AI advertising claims (e.g. an ASA or FTC ruling), a named brand's AI-generated ad that drew criticism. Qualitative only — figures only where reported by coverage, attributed in-text.

## Output

Write ONE file `week{N}.json` in this directory, UTF-8, valid JSON, **no markdown fences**:

```json
{
  "week": N,
  "lessons": [
    {
      "order_index": 1,
      "title": "…",
      "theory_md": "…",
      "estimated_minutes": 28,
      "learning_objectives": ["…","…","…","…"],
      "case_study": "…",
      "exercises": [
        { "order_index": 1, "type": "mcq", "language": null, "marks": 2, "title": "…", "prompt_md": "…", "options": ["correct","d1","d2","d3"], "correct_answer": "correct" },
        { "order_index": 11, "type": "short_answer", "language": "prompt", "marks": 5, "title": "…", "prompt_md": "…", "correct_answer": "…" }
      ]
    }
  ]
}
```

Return as final text ONLY: week number, the 3 lesson titles, case-study brands used with their DB-check counts, and any swaps with reasons.
