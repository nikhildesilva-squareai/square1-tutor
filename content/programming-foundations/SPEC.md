# Programming from Zero — build contract (Square 1 AI, TECHNICAL lane)

Course: "Programming from Zero" (slug `programming-from-zero`, 🧱) — 6 week-modules × 3 lessons = 18 lessons.

**Audience: someone who has NEVER written a line of code.** Not a career-changer who "did a bit of Python once" — assume zero. They may not know what a file extension is, what a terminal is, or that code is just text. This is the single most important constraint in this document: **if a lesson uses a word it has not defined, it has failed.**

**Why this course exists.** Every technical track (Computer Vision, Cybersecurity, Machine Learning, Generative AI…) opens with a "Module 0 — Foundations" that silently assumes prior coding. The CV one opens at `import numpy as np` with array slicing; the Cyber one opens inside a shell; all of them close with a Git lesson. This course is the missing on-ramp. **Its exit bar IS Module 0's entry bar** — nothing more, nothing less. Do not teach OOP, data structures, or Big-O; those are out of scope by decision (Big-O is already taught in the AI Module 0).

Voice: warm, plain, unhurried. Short sentences. Never "simply", "just", or "obviously" — those words make a stuck beginner feel stupid. Encourage without being saccharine. British spelling. Assistant-agnostic when AI is mentioned (ChatGPT/Claude/Copilot/Gemini even-handedly).

Course spine (weave through every lesson): **you are not missing a gene for this.** (1) Programming is typing instructions a machine follows literally; (2) errors are normal and readable, not verdicts on you; (3) you learn by running things and seeing what happens — every lesson must give them something to actually run.

## Per-lesson deliverables (exact JSON schema at the bottom)

1. `title` — sentence case, plain, concrete. No colons-with-buzzwords.
2. `theory_md` — **5,000–7,000 chars** of markdown. Structure: hook on a real beginner frustration → concept in plain language → **at least TWO fully worked examples with a fenced code block AND the exact output it produces** → the mistakes beginners actually make here and how to recognise them → "Try this yourself" close with something runnable. Every code block must be complete and runnable — never a fragment that assumes surrounding code.
3. `estimated_minutes` — 25–35.
4. `learning_objectives` — exactly 4 strings, "verb + outcome".
5. `case_study` — markdown starting `**Name — headline (year(s))**`, 2–4 paragraphs. Real, dated, verifiable story from computing history or industry that illuminates THIS lesson. VERIFY via web search (load WebSearch via ToolSearch) before writing. Then DB-check the brand is unused platform-wide: load `mcp__72aec352-39dc-445d-b7b2-4c5cf41d96c5__execute_sql` via ToolSearch and run against project_id `lqjlmaxcarvsqnqhbzdj`:
   `SELECT count(*) FROM lessons WHERE case_study ILIKE '%<Name>%';`
   Must be 0. If not, pick another verified story. Qualitative only — figures only where reported by coverage, attributed in-text.
6. `exercises` — exactly 12, order_index 1–12:
   - **1–5: `mcq`**, marks 2, `language: null`, `options` = 4 strings with the CORRECT option FIRST, `correct_answer` = that exact string. Options similar length/register, distractors are real beginner misconceptions (not silly). **No apostrophes anywhere in option text.** Stems ≥ 60 chars and grounded in the lesson.
   - **6–10: `short_answer`**, marks 3, `language: null`. Scenario/judgement or "explain in your own words". `correct_answer` = a 2–4 sentence model answer.
   - **11–12: `short_answer`**, marks 5. Split by week (see below).

### The two 5-mark slots — CODE-FIRST, this is a coding course

**At least ONE of exercises 11–12 in EVERY lesson must be a real code exercise**, with:
`language: "python"` (or `"bash"` in Week 5), `starter_code` = the scaffold the learner edits, and **`correct_answer` = the complete working solution code.**

> ⚠️ **PLATFORM TRAP — read twice.** The grader reads **`correct_answer`**, NOT `solution_code`. Code placed only in `solution_code` is invisible to grading and the learner gets marked wrong. This previously caused a live grading bug on Computer Vision. Always put the full working solution in `correct_answer`. You may ALSO set `solution_code` to the same string, but `correct_answer` is mandatory.

The OTHER of 11–12 is a **Prompt Lab**: `language: "prompt"`, marks 5, `correct_answer` = a model ~100-scoring prompt. Reframed for beginners: the learner writes the prompt they would send an AI assistant to **explain an error message, explain code they did not write, or help them debug without being handed the answer**. This is a genuine beginner survival skill and keeps the course consistent with the platform.

## Week assignments and pre-assigned case studies

Pre-assigned to stop parallel authors converging on the same stories (a repeated problem). Verify each, and if one fails verification or the DB check, swap for another real dated computing story and say so.

- **Week 1 — Your First Programs** (lessons 1–3): (1) what a program is, how to run one, `print`; (2) variables and types (text vs number, the classic `"5" + 5` confusion); (3) making decisions — `if`/`else`, comparisons, booleans.
  Case studies: **Grace Hopper & the first compiler (1952)** · **Python's creation, Guido van Rossum (1989–91)** · **Scratch at MIT Media Lab (2007)**
- **Week 2 — Working With Data** (4–6): (4) lists; (5) dictionaries; (6) loops over both.
  Case studies: **Microsoft Zune leap-year freeze (2008)** — an infinite loop, perfect here · **Excel autocorrecting gene names (2016–2020)** — data misread · **Knight Capital (2012)** — a loop over the wrong data
- **Week 3 — Functions, Errors & Debugging** (7–9): (7) writing and calling functions; (8) reading errors and stack traces without panic; (9) debugging your own code — print-debugging, narrowing down, rubber-ducking.
  Case studies: **Ariane 5 Flight 501 (1996)** — overflow · **Mars Climate Orbiter (1999)** — unit mismatch · **the first computer "bug", Harvard Mark II moth (1947)**
- **Week 4 — Running Real Code** (10–12): (10) scripts vs notebooks, saving and running a `.py` file; (11) imports and installing packages with pip; (12) virtual environments and "works on my machine".
  Case studies: **Jupyter / IPython (2001, 2014)** · **the left-pad npm incident (2016)** — dependencies · **Docker (2013)** — environment reproducibility
- **Week 5 — The Terminal & Git** (13–15): (13) the terminal — navigating, listing, reading files (use `bash` for code exercises); (14) Git basics — init, add, commit, log; (15) GitHub — remote, push, clone, and why your work being public matters for a portfolio.
  Case studies: **Toy Story 2 near-deletion at Pixar (1998)** — backups · **Git's creation by Linus Torvalds (2005)** · **GitHub's founding (2008)**
- **Week 6 — Arrays With NumPy & What Comes Next** (16–18): (16) what an array is and why lists are not enough — shape, dtype; (17) indexing and slicing, including 2-D (**this is the exact cliff in CV Module 0 lesson 4 — teach `img[10:20, 30:40]`-style slicing explicitly**); (18) vectorised maths, plus a closing map: what the learner can now read, and how to choose their technical track.
  Case studies: **NumPy / Travis Oliphant (2005–06)** · **the Hubble Space Telescope mirror flaw (1990)** — measurement and verification · **ImageNet (2009–12)** — arrays of pixels at scale

Lesson 18 must end by naming the technical tracks (AI/Generative AI, Machine Learning, Computer Vision, Cybersecurity, Data Science, Full Stack) and stating plainly that the learner can now read their Module 0.

## Output

Write ONE file `week{N}.json` (N = your week) in this directory, UTF-8, valid JSON, **no markdown fences around it**:

```json
{
  "week": N,
  "lessons": [
    {
      "order_index": <week1→1,2,3; week2→4,5,6; … week6→16,17,18>,
      "title": "…",
      "theory_md": "…",
      "estimated_minutes": 30,
      "learning_objectives": ["…","…","…","…"],
      "case_study": "…",
      "exercises": [
        { "order_index": 1, "type": "mcq", "language": null, "marks": 2, "title": "…", "prompt_md": "…", "options": ["correct","d1","d2","d3"], "correct_answer": "correct" },
        { "order_index": 11, "type": "short_answer", "language": "python", "marks": 5, "title": "…", "prompt_md": "…", "starter_code": "…", "correct_answer": "<FULL WORKING SOLUTION CODE>" },
        { "order_index": 12, "type": "short_answer", "language": "prompt", "marks": 5, "title": "…", "prompt_md": "…", "correct_answer": "<model prompt>" }
      ]
    }
  ]
}
```

Return as your final text ONLY: week number, the 3 lesson titles, case-study names used, any swaps with reasons, and confirmation that every lesson has ≥1 code exercise whose solution is in `correct_answer`.
