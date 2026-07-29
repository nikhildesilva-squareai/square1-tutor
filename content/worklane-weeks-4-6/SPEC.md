# Work-lane courses — weeks 4–6 extension (Square 1 AI)

Five existing 3-week courses are being extended to 6 weeks. **Weeks 1–3 already exist and must not be touched.** You are writing ONE new week (3 lessons) for ONE course. Your prompt names both.

## House conventions (match exactly — these courses are LIVE)

- **`order_index` is PER MODULE**: your three lessons are order_index **1, 2, 3**. (Not global.)
- `theory_md`: **5,500–7,000 chars** markdown. Structure: hook on a real pain in that role → concept plainly → at least TWO fully worked examples showing an actual example prompt in a fenced block AND the kind of output it produces (abridged) → the mistakes people make here → "In practice" close.
- `estimated_minutes`: 26–30.
- `learning_objectives`: exactly 4, "verb + outcome".
- `case_study`: opens `**Brand — headline (year(s))**`, then 3–4 paragraphs. Real, dated, verifiable.
- `exercises`: exactly 12 — 1–5 `mcq` (marks 2), 6–10 `short_answer` (marks 3, language null), 11–12 `short_answer` with `language: "prompt"` (marks 5, Nova-graded Prompt Labs).
  - MCQ: 4 options, **correct FIRST**, `correct_answer` = its exact text, **no apostrophes anywhere in option text**, similar option lengths, plausible distractors, stems ≥ 60 chars.
  - Short answers: `correct_answer` = 2–4 sentence model answer.
  - Prompt Labs: `prompt_md` = realistic scenario + what a strong prompt must carry; `correct_answer` = model ~100-scoring prompt.

Voice: "brief a colleague, don't query a search box." Assistant-agnostic (ChatGPT/Claude/Copilot/Gemini named even-handedly). British spelling. **No code** — this is the no-code lane. Never "simply", "just", "obviously".

## The shared 3-week arc (same for every course, tailored to the role)

- **Week 4 — the automation layer.** Prompt chains for the role's recurring production work · saved templates and macros with placeholders, stored and versioned · PRACTICAL: build a reusable chain, whose two Prompt Labs are the master template and a verification prompt that checks output against the brief, the role's voice/standards and the honesty rules before it goes anywhere.
- **Week 5 — the role's own AI assistant.** Building a no-code custom assistant loaded with the role's own material · testing it before anyone relies on it (test set, drift, invented facts, grounding rules, re-test after every change) · PRACTICAL: ship a tested assistant, Prompt Labs = the instruction block and the reliability test protocol.
- **Week 6 — capstone: the role's AI operating system.** Auditing the real working month against what was built and where human checkpoints must stay · running it as a documented system (system card per template, versioning, handover) · PRACTICAL/CAPSTONE: deliver the documented pack, Prompt Labs = the master context block and the documented template pack.

Carry each course's existing spine and hard lines (they are stated in weeks 1–3 and your prompt names them). Week 6 is now the course finale — the old week-3 capstone is being reframed as a mid-course milestone.

## Case studies — verified AND unique platform-wide

For each: verify by web search (load WebSearch via ToolSearch), then DB-check with `mcp__72aec352-39dc-445d-b7b2-4c5cf41d96c5__execute_sql` (load via ToolSearch), project_id `lqjlmaxcarvsqnqhbzdj`:
`SELECT count(*) FROM lessons WHERE case_study ILIKE '%<Brand>%';` — must be **0**.

**Also check your siblings.** Other agents are writing the other weeks into the SAME directory right now. Before finalising, grep every `week*.json` already present in your output directory for your chosen brand names and pick something else on any clash. Parallel writers reliably converge on the same famous stories — this check is what prevents it.

Check the outlets you cite too, not only the subject brand: a publication named in your text counts as a brand.

**Known-taken (non-exhaustive) — do not use:** Persado, L'Oréal, Nestlé, Chevrolet, Publicis, Instacart, Cursor, DoNotPay, WPP, Hogarth, Estée Lauder, Chicago Sun-Times, Moderna, Pak'nSave, Telstra, Under Armour, Bayer, Zalando, Klarna, Air Canada, Samsung, Walmart, Amazon, Zara, Ocado, Maersk, DPD, UPS, DHL, FedEx, IKEA, Toyota, Unilever, Flexport, Morgan Stanley, McKinsey, Deloitte, EY, Canva, Grammarly, Netflix, Meta, Spotify, Duolingo, CNET, Heinz, Shopify, Cadbury, Coca-Cola, Washington Post, Sports Illustrated, Google, Microsoft, Slack, Notion, Zoom, Asana, monday.com, Otter.ai, Atlassian, Miro, Airtable, Linear, ClickUp, Glean, Zapier, Smartsheet, PMI, Codecademy, Coursera, Quizlet, Chegg, Pearson, Brainly, Khan Academy, Turnitin, GPTZero, UNESCO, MIT, Stanford, Harvard, Wharton, Georgia Tech, Arizona State, California State, University of Michigan, Guardian, Reuters, TechCrunch, JPMorgan, Mastercard, Thomson Reuters, HubSpot, Salesloft, Gong, Apollo.io, ZoomInfo, Lavender, Fireflies, PandaDoc, 6sense, Clari, Gainsight, Metaphysic, Linkin Park, CBA, Vanderbilt, Kahoot, Quizizz, Wolfram, Stack Overflow.

Prefer less-covered, well-documented stories: regulator rulings on AI claims, named enterprise rollouts with published detail, professional-body guidance, documented AI failures in that profession. Qualitative only — figures only where reported by coverage, attributed in-text.

## Robustness

Long generations have stalled mid-stream on this workload. **Write each lesson to its own file as soon as it is done** (`<course>-w<N>-lesson<n>.json`), then combine into the final file at the end. Do not hold all three lessons until the end.

## Output

Final file: `<course-slug>-week<N>.json` in your output directory, UTF-8, valid JSON, no markdown fences:

```json
{ "week": N, "lessons": [ { "order_index": 1, "title": "…", "theory_md": "…", "estimated_minutes": 28,
  "learning_objectives": ["…","…","…","…"], "case_study": "…",
  "exercises": [ { "order_index": 1, "type": "mcq", "language": null, "marks": 2, "title": "…", "prompt_md": "…", "options": ["correct","d1","d2","d3"], "correct_answer": "correct" } ] } ] }
```

Return as final text ONLY: course, week, the 3 lesson titles, case-study brands with their DB-check counts, and any swaps with reasons.
