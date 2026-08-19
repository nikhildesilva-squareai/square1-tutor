import Link from "next/link";
import { CalendarRange, Sparkles, ArrowRight, BookOpen, Layers } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// The two learning elements — the two ways Square 1 serves a learner, side by
// side on the dashboard:
//
//   PACED TRACK — the committed, self-paced program that already exists in the
//   plan machinery: a 3/6/9-month track with a weekly schedule and a target
//   completion date. Everything shown is real enrolment data; the pace line is
//   plain arithmetic (lessons remaining ÷ weeks remaining), never a judgement.
//
//   Named "Paced Track" and NOT "Bootcamp": Bootcamp is now a separate paid
//   product (live cohorts, weekly 1-1, gated projects — docs/bootcamp-prd.md).
//   Two things called Bootcamp in one app is a support nightmare, and this one
//   is the cheaper, solo, no-instructor option.
//
//   AI TUTOR — the always-on, self-paced side: Nova (who remembers your graded
//   work), the current lesson, and the spaced-repetition review deck.
//
// Server component: no state, all data passed in from the dashboard's queries.
// ═══════════════════════════════════════════════════════════════════════════════

export interface LearningModesProps {
  courseSlug: string;
  courseTitle: string;
  planMonths: number | null;
  targetDate: string | null; // ISO date
  lessonsDone: number;
  totalLessons: number;
  currentLessonId: string | null;
  reviewsDue: number;
}

export function LearningModes({
  courseSlug, courseTitle, planMonths, targetDate,
  lessonsDone, totalLessons, currentLessonId, reviewsDue,
}: LearningModesProps) {
  const hasPlan = Boolean(planMonths && targetDate);

  // Honest pace arithmetic — only rendered when a real plan exists.
  let paceLine: string | null = null;
  let dateLine: string | null = null;
  if (hasPlan && targetDate) {
    const target = new Date(`${targetDate}T00:00:00`);
    const daysLeft = Math.ceil((target.getTime() - Date.now()) / 86400000);
    dateLine = target.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    const remaining = Math.max(0, totalLessons - lessonsDone);
    if (daysLeft > 0 && remaining > 0) {
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      paceLine = `≈ ${Math.ceil(remaining / weeksLeft)} lessons a week hits your date`;
    } else if (remaining === 0) {
      paceLine = "Track complete — your target is met";
    } else if (daysLeft <= 0) {
      paceLine = "Target date has passed — adjust your plan to set a new one";
    }
  }

  return (
    <div className="mb-6">
      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest mb-3">
        Two ways to learn
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Paced Track — the committed, self-paced program ──────────────── */}
        <div className="relative rounded-2xl border border-border bg-surface p-5 sm:p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              Paced Track
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
              style={hasPlan
                ? { color: "#059669", borderColor: "rgba(5,150,105,0.3)", background: "rgba(5,150,105,0.07)" }
                : { color: "#B45309", borderColor: "rgba(180,83,9,0.3)", background: "rgba(180,83,9,0.06)" }}>
              {hasPlan ? "Active" : "Not set up"}
            </span>
          </div>

          {hasPlan ? (
            <>
              <p className="text-base font-black text-ink leading-snug">
                {planMonths}-month track · {courseTitle}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">
                Target: <span className="font-bold text-ink">{dateLine}</span>
                {" · "}{Math.max(0, totalLessons - lessonsDone)} of {totalLessons} lessons to go
              </p>
              {paceLine && <p className="mt-1 text-xs font-semibold text-brand">{paceLine}</p>}
              <div className="mt-4 flex flex-wrap gap-2.5 pt-1">
                <Link href={`/courses/${courseSlug}/schedule`}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all">
                  This week&apos;s schedule
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <Link href={`/courses/${courseSlug}/plan`}
                  className="inline-flex items-center h-10 px-4 rounded-xl border border-border text-ink-secondary text-xs font-bold hover:bg-surface-alt transition-all">
                  Adjust plan
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-black text-ink leading-snug">
                Turn {courseTitle} into a paced track
              </p>
              <p className="mt-1 text-sm text-ink-secondary leading-relaxed">
                Commit to a pace — 3, 6 or 9 months — and get a weekly schedule with a
                target completion date. Structure for people who want a program, not a library.
              </p>
              <div className="mt-4 pt-1">
                <Link href={`/courses/${courseSlug}/plan`}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all">
                  Set my pace
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ── AI Tutor — always-on, self-paced with Nova ──────────────────── */}
        <div className="relative rounded-2xl border border-border bg-surface p-5 sm:p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI Tutor
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border"
              style={{ color: "#059669", borderColor: "rgba(5,150,105,0.3)", background: "rgba(5,150,105,0.07)" }}>
              Always on
            </span>
          </div>

          <p className="text-base font-black text-ink leading-snug">
            Learn at your own pace, with Nova
          </p>
          <p className="mt-1 text-sm text-ink-secondary leading-relaxed">
            Nova reads your graded work, remembers your gaps, and coaches you through
            every lesson — no schedule required.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5 pt-1">
            <Link href="/tutor"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all">
              Ask Nova
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {currentLessonId && (
              <Link href={`/learn/${currentLessonId}`}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border text-ink-secondary text-xs font-bold hover:bg-surface-alt transition-all">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                Current lesson
              </Link>
            )}
            <Link href="/notes?filter=flashcard"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border text-ink-secondary text-xs font-bold hover:bg-surface-alt transition-all">
              <Layers className="h-3.5 w-3.5" aria-hidden />
              Review deck{reviewsDue > 0 ? ` · ${reviewsDue} due` : ""}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
