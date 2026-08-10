import Link from "next/link";
import type { StudentMemory } from "@/lib/nova-memory";

// ═══════════════════════════════════════════════════════════════════════════════
// "Nova remembers" — the retention greeting (audit R6a, 2026-08-10).
//
// The single cheapest reason to come back tomorrow is a tutor that visibly
// remembers you. This card surfaces the SAME memory Nova already injects into
// chat (students.memory — mined from graded work, never self-report):
//   - the one-line continuity hook ("last time you…")
//   - the freshest gaps, framed as today's shortest useful rep
//   - the strengths, framed as earned ground ("locked in")
//
// Rules, inherited from lib/nova-memory:
//   - Renders NOTHING when memory is empty — no boilerplate, no fake warmth.
//   - Grounded phrasing only: every item shown comes from scored exercises.
//   - One primary action (a rep with Nova), one quiet secondary (resume).
// ═══════════════════════════════════════════════════════════════════════════════

const BLUE_GRADIENT = "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)";

/** Strip the "(Lesson title)" suffix nova-memory appends — the chip is short,
 *  the full context lives in the title attribute. */
function topicLabel(t: string): string {
  const m = t.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  return (m ? m[1] : t).replace(/^(Explain|Code|Build|Debug|Design|Write)\s*:\s*/i, "").trim();
}

export function NovaMemoryCard({
  memory,
  resumeHref,
  resumeLabel,
}: {
  memory: StudentMemory;
  resumeHref: string | null;
  resumeLabel: string | null;
}) {
  const gaps = memory.gaps.slice(-3).reverse(); // freshest first
  const strengths = memory.strengths.slice(-3).reverse();
  const hasAnything = Boolean(memory.last_session) || gaps.length > 0 || strengths.length > 0;
  if (!hasAnything) return null;

  const focus = gaps[0] ?? null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Nova badge — same mark as the chat panel, so the memory reads as
              HERS, not as a generic stats widget. */}
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white"
            style={{ background: BLUE_GRADIENT }}
            aria-hidden
          >
            N
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              Nova remembers
            </p>

            {/* The continuity hook — the sentence that makes a return visit feel
                like a resumed conversation instead of a cold open. */}
            <p className="mt-1 text-sm font-bold text-ink leading-snug">
              {memory.last_session
                ? memory.last_session
                : focus
                  ? `You've been wrestling with ${topicLabel(focus.t)}.`
                  : "You're on a roll — every recent rep landed."}
            </p>

            {focus && (
              <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
                Shortest useful rep today: close{" "}
                <span className="font-semibold text-ink">{topicLabel(focus.t)}</span>
                {(focus.n ?? 1) > 1 ? ` — it's come up ${focus.n} times` : ""}. Ten focused
                minutes with Nova usually does it.
              </p>
            )}

            {/* Gap + strength chips — state encoded in form AND color, from
                graded work only. Titles carry the full topic context. */}
            {(gaps.length > 0 || strengths.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {gaps.map((g) => (
                  <span
                    key={`g${g.t}`}
                    title={g.t}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    <span className="truncate">{topicLabel(g.t)}</span>
                    {(g.n ?? 1) > 1 && <span className="shrink-0 text-amber-600/80">×{g.n}</span>}
                  </span>
                ))}
                {strengths.map((s) => (
                  <span
                    key={`s${s.t}`}
                    title={s.t}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="shrink-0" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="truncate">{topicLabel(s.t)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions — a rep with Nova is the primary; resume stays quiet. */}
          <div className="hidden sm:flex shrink-0 flex-col items-stretch gap-2">
            <Link
              href="/tutor"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              style={{ background: BLUE_GRADIENT }}
            >
              {focus ? "Close it with Nova" : "Chat with Nova"}
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            {resumeHref && (
              <Link
                href={resumeHref}
                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:text-ink"
              >
                {resumeLabel ?? "Resume lesson"}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile actions — full-width, thumb-reachable. */}
        <div className="mt-4 flex gap-2 sm:hidden">
          <Link
            href="/tutor"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white"
            style={{ background: BLUE_GRADIENT }}
          >
            {focus ? "Close it with Nova" : "Chat with Nova"}
          </Link>
          {resumeHref && (
            <Link
              href={resumeHref}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-[13px] font-semibold text-ink-secondary"
            >
              {resumeLabel ?? "Resume"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
