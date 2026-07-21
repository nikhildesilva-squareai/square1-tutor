"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// One-time post-signup routing question, shown atop the dashboard for a brand-new
// user with zero enrolments. The answer is persisted on the auth user's metadata
// (onboarding_goal) — the same mechanism signup_country / signup_subject use — with
// a localStorage mirror so it never reshows even if the metadata write fails.
//
// Landing-fork intent: the homepage's "use AI at my job" door links to
// /diagnostic?goal=work; the diagnostic stashes that under GOAL_KEY. If that stash
// (or a ?goal=work param on the current URL) is present, the question is treated
// as pre-answered "work" and never rendered.
export const GOAL_KEY = "sq1_goal";

type Goal = "career" | "work" | "explore";

export function RoutingQuestion({ workHref }: { workHref: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function persist(goal: Goal) {
    try {
      localStorage.setItem(GOAL_KEY, goal);
    } catch {
      /* storage blocked — metadata write below still records it */
    }
    // Best-effort — never block navigation on this.
    try {
      supabaseRef.current ??= createClient();
      void supabaseRef.current.auth.updateUser({ data: { onboarding_goal: goal } });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    let stored: string | null = null;
    let session: string | null = null;
    try {
      stored = localStorage.getItem(GOAL_KEY);
      session = sessionStorage.getItem(GOAL_KEY);
    } catch {
      /* storage blocked — fall through to showing the question */
    }

    // Already answered on this device (covers the metadata-write-failed case).
    if (stored === "career" || stored === "explore") return;

    // Carried intent from the landing fork → pre-answer as "work", never show.
    const param = new URLSearchParams(window.location.search).get("goal");
    if (stored === "work" || session === "work" || param === "work") {
      persist("work");
      return;
    }

    setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  function answer(goal: Goal, href: string) {
    persist(goal);
    router.push(href);
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl sm:text-2xl font-black text-ink tracking-tight mb-1">What brings you here?</h2>
      <p className="text-sm text-ink-muted mb-4">Pick one and we&apos;ll point you at the right starting place.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => answer("career", "/courses")}
          className="group text-left bg-surface rounded-2xl border border-border shadow-card p-6 hover:shadow-card-hover hover:border-brand/30 hover:-translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-surface-tint flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors mb-1">Build a career in AI</h3>
          <p className="text-sm text-ink-muted leading-relaxed mb-4">
            Technical tracks with lessons, exercises, and hands-on projects.
          </p>
          <span className="text-sm font-semibold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
            Browse career tracks
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>

        <button
          type="button"
          onClick={() => answer("work", workHref)}
          className="group text-left bg-surface rounded-2xl border border-border shadow-card p-6 hover:shadow-card-hover hover:border-brand/30 hover:-translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-surface-tint flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink group-hover:text-brand transition-colors mb-1">Get better at my job with AI — no code</h3>
          <p className="text-sm text-ink-muted leading-relaxed mb-4">
            Practical AI skills for your role. No programming required.
          </p>
          <span className="text-sm font-semibold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
            Start here
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </button>
      </div>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => {
            persist("explore");
            setVisible(false);
          }}
          className="text-xs text-ink-muted hover:text-ink font-semibold hover:underline transition-colors"
        >
          I&apos;ll explore on my own
        </button>
      </div>
    </div>
  );
}
