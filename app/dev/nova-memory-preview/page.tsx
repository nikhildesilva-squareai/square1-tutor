// Dev-only fixture preview of the "Nova remembers" dashboard card — lets us
// iterate on the retention greeting without needing a signed-in student with
// graded history. Returns 404 in production (same pattern as report-preview).

import { notFound } from "next/navigation";
import { NovaMemoryCard } from "@/components/NovaMemoryCard";
import type { StudentMemory } from "@/lib/nova-memory";

const FULL: StudentMemory = {
  v: 1,
  gaps: [
    { t: "Explain: chunking strategy trade-offs (Retrieval-Augmented Generation)", n: 2, at: "2026-08-08" },
    { t: "Code: cosine similarity from scratch (Fine-tuning & Embeddings)", n: 1, at: "2026-08-09" },
  ],
  strengths: [
    { t: "Explain: temperature vs top-p (LLM Deep Dive)", at: "2026-08-07" },
    { t: "Code: prompt-injection guard (AI Safety)", at: "2026-08-09" },
  ],
  goals: [],
  prefs: [],
  last_session: "Completed 'Building with LLM APIs — Lesson 3' in Generative AI",
  updated_at: "2026-08-09T10:00:00Z",
};

const GAPS_ONLY: StudentMemory = {
  ...FULL,
  strengths: [],
  last_session: null,
};

const EMPTY: StudentMemory = {
  v: 1, gaps: [], strengths: [], goals: [], prefs: [], last_session: null,
  updated_at: "2026-08-09T10:00:00Z",
};

export default function NovaMemoryPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
        Dev fixture · NovaMemoryCard states
      </p>
      <p className="mb-2 text-sm font-semibold text-slate-500">Full memory</p>
      <NovaMemoryCard memory={FULL} resumeHref="/learn/x" resumeLabel="Resume lesson" />
      <p className="mb-2 text-sm font-semibold text-slate-500">Gaps only, no last session</p>
      <NovaMemoryCard memory={GAPS_ONLY} resumeHref={null} resumeLabel={null} />
      <p className="mb-2 text-sm font-semibold text-slate-500">Empty memory (must render nothing below)</p>
      <NovaMemoryCard memory={EMPTY} resumeHref="/learn/x" resumeLabel="Resume lesson" />
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-400">
        ↑ nothing should appear between this box and the “Empty memory” label
      </div>
    </div>
  );
}
