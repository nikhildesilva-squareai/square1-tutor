"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  recommendOnRamp,
  isCodingExperience,
  CODING_EXPERIENCE_KEY,
  type CodingExperience,
} from "@/lib/onramp";

// One-time coding-experience question for a brand-new learner heading for a
// technical track. Same mechanism as RoutingQuestion: persisted on auth metadata
// with a localStorage mirror so it never reshows if the metadata write fails.
//
// Answering "never" or "a little" reveals a recommendation to start with the
// on-ramp — ALWAYS alongside a visible link straight into the career tracks.
// This must never become a gate: nothing here blocks enrolment, and the skip is
// as prominent as the recommendation.
const STORE_KEY = "sq1_coding_experience";

const OPTIONS: { value: CodingExperience; label: string; sub: string }[] = [
  { value: "none", label: "Never", sub: "I have not written code before" },
  { value: "some", label: "A little", sub: "I have tried some, not much stuck" },
  { value: "comfortable", label: "Yes, comfortably", sub: "I write code already" },
];

export function CodingExperienceQuestion({ intendedTrackTitle }: { intendedTrackTitle?: string | null }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [answer, setAnswer] = useState<CodingExperience | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORE_KEY);
    } catch {
      /* storage blocked — fall through and show the question */
    }
    if (isCodingExperience(stored)) return; // already answered on this device
    setVisible(true);
  }, []);

  function persist(value: CodingExperience) {
    try {
      localStorage.setItem(STORE_KEY, value);
    } catch {
      /* metadata write below still records it */
    }
    try {
      supabaseRef.current ??= createClient();
      void supabaseRef.current.auth.updateUser({ data: { [CODING_EXPERIENCE_KEY]: value } });
    } catch {
      /* best-effort — never block the learner on this */
    }
  }

  function choose(value: CodingExperience) {
    persist(value);
    const rec = recommendOnRamp(value, intendedTrackTitle);
    if (!rec.recommend) {
      // Experienced — straight through, exactly as before this question existed.
      setVisible(false);
      router.push("/courses");
      return;
    }
    setAnswer(value);
  }

  if (!visible) return null;

  // ── Recommendation state ──────────────────────────────────────────────────
  if (answer) {
    const rec = recommendOnRamp(answer, intendedTrackTitle);
    return (
      <div className="mb-8 rounded-2xl border border-border bg-surface shadow-card p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">
          {rec.strength === "start-here" ? "Recommended starting point" : "Worth a look first"}
        </p>
        <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight mb-2">{rec.headline}</h2>
        <p className="text-sm text-ink-secondary leading-relaxed mb-5 max-w-2xl">{rec.body}</p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            href={`/courses/${rec.courseSlug}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-brand hover:-translate-y-0.5 transition-transform shadow-sm"
          >
            Open Programming from Zero
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* The escape hatch — deliberately plain, prominent, and never apologetic. */}
          <Link
            href="/courses"
            onClick={() => setVisible(false)}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-brand transition-colors"
          >
            {rec.skipLabel}
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // ── Question state ────────────────────────────────────────────────────────
  return (
    <div className="mb-8">
      <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight mb-1">Have you written code before?</h2>
      <p className="text-sm text-ink-muted mb-4">
        There is no wrong answer — it just tells us where to start you.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            className="group text-left bg-surface rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover hover:border-brand/30 hover:-translate-y-0.5 active:scale-[0.99] transition-all"
          >
            <p className="text-base font-bold text-ink group-hover:text-brand transition-colors">{o.label}</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">{o.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
