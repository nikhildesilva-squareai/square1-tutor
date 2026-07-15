"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, TrendingUp, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { DIAG_SUBJECTS as SUBJECTS } from "@/lib/diagnostic";
import { CourseIcon } from "@/components/ui/course-icon";

export default function DiagnosticPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("subject");
    if (!slug) return;
    const match = SUBJECTS.find((s) => s.slug === slug);
    if (match) router.replace(`/diagnostic/${match.slug}`);
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUBJECTS;
    return SUBJECTS.filter((s) => s.title.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
          Sign in
        </Link>
      </header>

      <main className="flex-1 px-4 pb-16 sm:px-6">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-[#D4F0FC] bg-[#ECF8FE] px-6 py-8 text-center sm:px-10 sm:py-9">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/40 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CCE1FF] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0056CE]">
                <TrendingUp className="h-3.5 w-3.5" />
                Free · 3 minutes · No signup
              </span>
              <h1 className="mt-4 text-[26px] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-[32px]">
                Where do you stand?
              </h1>
              <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                Pick the track you&apos;re aiming for. Five quick questions, an instant skill snapshot — no account needed.
              </p>

              <div className="relative mx-auto mt-6 max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <label htmlFor="track-search" className="sr-only">Search tracks</label>
                <input
                  id="track-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tracks — e.g. machine learning, security"
                  className="h-11 w-full rounded-xl border border-[#D4F0FC] bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-[#0056CE] focus:ring-4 focus:ring-[#0056CE]/15"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <section className="mx-auto mt-6 max-w-5xl">
          <p className="mb-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{filtered.length}</span> {filtered.length === 1 ? "skill check" : "skill checks"}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <Link
                  key={s.slug}
                  href={`/diagnostic/${s.slug}`}
                  className="group flex flex-col rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_1px_2px_rgba(21,47,84,0.04)] transition-all hover:-translate-y-1 hover:border-[#D8E2ED] hover:shadow-[0_14px_26px_-12px_rgba(21,47,84,0.20)]"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${s.color}14`, border: `1px solid ${s.color}2b` }}
                  >
                    <CourseIcon slug={s.slug} size={22} color={s.color} />
                  </span>
                  <h3 className="mt-3 text-[15px] font-bold leading-snug text-slate-900">{s.title}</h3>
                  <p className="mt-0.5 text-[13px] font-semibold" style={{ color: s.color }}>{s.role}</p>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-xs font-medium text-slate-400">5 questions · 3 min</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: s.color }}>
                      Start
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D8E2ED] bg-[#F8FAFC] px-6 py-16 text-center">
              <Search className="h-9 w-9 text-slate-400" />
              <p className="text-base font-bold text-slate-900">No tracks match “{query}”</p>
              <button onClick={() => setQuery("")} className="text-sm font-semibold text-[#0056CE] hover:underline">
                Clear search
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
