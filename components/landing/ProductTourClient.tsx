"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, Sparkles, FolderGit2, Trophy,
  Check, ArrowRight, GitBranch, type LucideIcon,
} from "lucide-react";

const BRAND = "#0056CE";

export type TourData = {
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
  totalProjects: number;
  modules: string[];
  lesson: { title: string; minutes: number; objectives: string[]; excerpt: string };
  project: { title: string; difficulty: string; hours: number; stack: string[]; brief: string; hasRepo: boolean };
  nova: { exerciseTitle: string; prompt: string; studentAnswer: string; score: number; maxMarks: number; feedback: string };
  levels: string[];
};

type StepKey = "dashboard" | "lesson" | "nova" | "projects" | "outcome";

const STEPS: { key: StepKey; label: string; icon: LucideIcon; blurb: string }[] = [
  { key: "dashboard", label: "Your dashboard", icon: LayoutDashboard, blurb: "One place that knows where you are." },
  { key: "lesson", label: "The lessons", icon: BookOpen, blurb: "Text and code. No videos to sit through." },
  { key: "nova", label: "Nova grades it", icon: Sparkles, blurb: "Every answer read and marked, with the gap named." },
  { key: "projects", label: "What you build", icon: FolderGit2, blurb: "Real briefs, real repos, deployed." },
  { key: "outcome", label: "What you leave with", icon: Trophy, blurb: "Proof an employer can open." },
];

/* ── Chrome shared by every panel: a small faux app window ─────────────────── */
function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="ml-1 truncate text-xs font-semibold text-slate-500">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function ProductTourClient({ data }: { data: TourData }) {
  const [step, setStep] = useState<StepKey>("dashboard");
  const active = STEPS.find((s) => s.key === step)!;

  return (
    <section className="px-4 py-16 sm:px-6" aria-labelledby="tour-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: BRAND }}>
            See how it works
          </span>
          <h2 id="tour-heading" className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            The whole thing, before you sign up
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Five screens, using real content from the {data.courseTitle} track — the same
            lessons, projects and marking you get on day one.
          </p>
        </div>

        {/* ── Step selector ──────────────────────────────────────────────── */}
        <div role="tablist" aria-label="Product tour" className="mt-9 grid gap-2 sm:grid-cols-5">
          {STEPS.map((s) => {
            const on = s.key === step;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={on}
                aria-controls={`tour-panel-${s.key}`}
                onClick={() => setStep(s.key)}
                className="flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition-all sm:flex-col sm:items-start sm:gap-1.5"
                style={{
                  borderColor: on ? BRAND : "rgba(15,28,49,0.10)",
                  background: on ? "#F2F8FF" : "#fff",
                }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: on ? BRAND : "#94A3B8" }} aria-hidden />
                <span className="text-sm font-bold" style={{ color: on ? BRAND : "#334155" }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm text-slate-600 sm:text-left">{active.blurb}</p>

        {/* ── Panels ─────────────────────────────────────────────────────────
            All five render and the inactive ones are `hidden`, rather than only
            mounting the active panel. Two reasons: switching tabs costs no
            re-render, and — the real one — the lesson text, Nova's marking and
            the project brief are then in the server HTML, where an answer engine
            can actually read them. Conditional mounting would leave the four
            unselected panels invisible to every crawler. */}
        <div className="mt-4">
          {STEPS.map((s) => (
            <div key={s.key} id={`tour-panel-${s.key}`} role="tabpanel" hidden={s.key !== step}>
              {s.key === "dashboard" && <DashboardPanel data={data} />}
              {s.key === "lesson" && <LessonPanel data={data} />}
              {s.key === "nova" && <NovaPanel data={data} />}
              {s.key === "projects" && <ProjectsPanel data={data} />}
              {s.key === "outcome" && <OutcomePanel data={data} />}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/try/${data.courseSlug}`}
            className="group inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: BRAND }}
          >
            Read the first lesson free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={`/courses/${data.courseSlug}`}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            See the full curriculum
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 1. Dashboard ─────────────────────────────────────────────────────────── */
function DashboardPanel({ data }: { data: TourData }) {
  // Illustrative progress: there is no real student to show, and inventing one
  // silently would be a fake screenshot. The caption says so plainly.
  const done = 3;
  const shown = data.modules.slice(0, 5);
  return (
    <Frame title={`square1ai.com/dashboard — ${data.courseTitle}`}>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <h3 className="text-base font-bold text-slate-900">{data.courseTitle}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {data.modules.length} modules · {data.totalLessons} lessons · {data.totalProjects} projects
          </p>
          <ul className="mt-4 space-y-2">
            {shown.map((m, i) => (
              <li key={m} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={
                    i < done
                      ? { background: BRAND, color: "#fff" }
                      : { background: "#F1F5F9", color: "#94A3B8" }
                  }
                >
                  {i < done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`text-sm ${i < done ? "text-slate-500 line-through" : "font-semibold text-slate-800"}`}>
                  {m}
                </span>
                {i === done && (
                  <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: BRAND }}>
                    NEXT
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <Stat label="Modules done" value={`${done} / ${data.modules.length}`} />
          <Stat label="Projects shipped" value={`1 / ${data.totalProjects}`} />
          <Stat label="Current level" value={data.levels[1]} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Module names and totals are live from the curriculum. Progress figures are illustrative.
      </p>
    </Frame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: BRAND }}>{value}</p>
    </div>
  );
}

/* ── 2. Lesson ────────────────────────────────────────────────────────────── */
function LessonPanel({ data }: { data: TourData }) {
  return (
    <Frame title={`Lesson 1 — ${data.courseTitle}`}>
      <h3 className="text-lg font-bold text-slate-900">{data.lesson.title}</h3>
      <p className="mt-0.5 text-sm text-slate-500">About {data.lesson.minutes} minutes</p>

      {data.lesson.objectives.length > 0 && (
        <div className="mt-4 rounded-lg border border-[#CCE1FF] bg-[#F2F8FF] p-4">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>
            By the end you can
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.lesson.objectives.map((o) => (
              <li key={o} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} aria-hidden />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{data.lesson.excerpt}</p>
      <p className="mt-3 text-xs text-slate-400">Real lesson text, straight from the curriculum.</p>
    </Frame>
  );
}

/* ── 3. Nova ──────────────────────────────────────────────────────────────── */
function NovaPanel({ data }: { data: TourData }) {
  const { nova } = data;
  return (
    <Frame title="Nova — exercise marking">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Exercise</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{nova.exerciseTitle}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{nova.prompt}</p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Your answer</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{nova.studentAnswer}</p>
      </div>

      <div className="mt-3 rounded-lg border-2 p-4" style={{ borderColor: "#CCE1FF", background: "#F2F8FF" }}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Nova
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: BRAND }}>
            {nova.score} / {nova.maxMarks}
          </span>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-800">{nova.feedback}</p>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Nova&apos;s words are verbatim from the real marking model — not written for this page.
        Partial credit, and the specific thing that was missing.
      </p>
    </Frame>
  );
}

/* ── 4. Projects ──────────────────────────────────────────────────────────── */
function ProjectsPanel({ data }: { data: TourData }) {
  const { project } = data;
  return (
    <Frame title={`Project 1 of ${data.totalProjects} — ${data.courseTitle}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold text-slate-900">{project.title}</h3>
        {project.difficulty && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
            {project.difficulty}
          </span>
        )}
        {project.hours > 0 && (
          <span className="text-xs text-slate-500">~{project.hours} hours</span>
        )}
      </div>

      {project.stack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.stack.map((t) => (
            <li key={t} className="rounded-md border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {t}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{project.brief}</p>

      {project.hasRepo && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          <GitBranch className="h-4 w-4" aria-hidden /> Starter repo, cloned on day one
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">
        A real brief from the track — a scenario with a client and a deadline, not a toy exercise.
      </p>
    </Frame>
  );
}

/* ── 5. Outcome ───────────────────────────────────────────────────────────── */
function OutcomePanel({ data }: { data: TourData }) {
  return (
    <Frame title="Your skill report">
      <p className="text-sm leading-relaxed text-slate-700">
        Finish the track and the work itself is the proof. Every project is marked against a
        published rubric, and the result is a report an employer can check rather than a
        certificate that only says you attended.
      </p>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Levels you move through</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data.levels.map((l, i) => (
            <span
              key={l}
              className="rounded-lg px-2.5 py-1 text-xs font-bold"
              style={
                i <= 1
                  ? { background: BRAND, color: "#fff" }
                  : { background: "#F1F5F9", color: "#64748B" }
              }
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {[
          { t: `${data.totalProjects} projects`, d: "Deployed, with live URLs and a public repo." },
          { t: "A skill report", d: "Strengths and gaps per topic, from marked work." },
          { t: "A portfolio page", d: "One link an employer can open and run." },
        ].map((x) => (
          <li key={x.t} className="rounded-lg border border-slate-200 p-3.5">
            <p className="text-sm font-bold text-slate-900">{x.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{x.d}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
