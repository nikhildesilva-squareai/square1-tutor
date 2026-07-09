"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NoteContent } from "@/components/ui/note-content";

interface Snippet {
  id: string; title: string | null; content: string;
  course_title: string | null; module_title: string | null; lesson_title: string | null;
  tags: string[]; created_at: string;
}

interface Props { snippets: Snippet[]; studentName: string }

export function CheatsheetClient({ snippets, studentName }: Props) {
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const courses = useMemo(
    () => Array.from(new Set(snippets.map(s => s.course_title ?? "Unsorted"))).sort(),
    [snippets]
  );

  // course → module → snippets
  const grouped = useMemo(() => {
    const filtered = courseFilter === "all"
      ? snippets
      : snippets.filter(s => (s.course_title ?? "Unsorted") === courseFilter);
    const byCourse = new Map<string, Map<string, Snippet[]>>();
    for (const s of filtered) {
      const course = s.course_title ?? "Unsorted";
      const mod = s.module_title ?? "General";
      if (!byCourse.has(course)) byCourse.set(course, new Map());
      const mods = byCourse.get(course)!;
      if (!mods.has(mod)) mods.set(mod, []);
      mods.get(mod)!.push(s);
    }
    return byCourse;
  }, [snippets, courseFilter]);

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      {/* Print styles: hide chrome, tighten spacing */}
      <style>{`@media print {
        .no-print { display: none !important; }
        .cheat-group { break-inside: avoid; }
        body { background: white !important; }
      }`}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/notes" className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-ink-muted hover:text-brand hover:border-brand/30 transition-all" aria-label="Back to Study Hub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-ink">My Cheatsheet</h1>
            <p className="text-sm text-ink-muted">{snippets.length} snippet{snippets.length === 1 ? "" : "s"} — your personal reference, built from what you saved while learning</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="h-9 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
          Print / PDF
        </button>
      </div>

      {/* Course filter */}
      {courses.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none mb-6 no-print">
          {["all", ...courses].map(c => (
            <button key={c} onClick={() => setCourseFilter(c)}
              className={cn("shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                courseFilter === c ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-alt")}>
              {c === "all" ? "All courses" : c}
            </button>
          ))}
        </div>
      )}

      {/* Print title */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-black">{studentName}&apos;s Cheatsheet — Square 1 AI</h1>
      </div>

      {snippets.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <h3 className="text-base font-bold text-ink mb-1">No snippets yet</h3>
          <p className="text-sm text-ink-muted max-w-md mx-auto">
            While reading a lesson, press <span className="font-semibold text-ink">Save ➜ Hub</span> on any code block.
            It lands here, grouped by course — your personal reference manual.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([course, mods]) => (
            <section key={course}>
              <h2 className="text-lg font-black text-ink mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-brand" />{course}
              </h2>
              <div className="space-y-5">
                {Array.from(mods.entries()).map(([mod, items]) => (
                  <div key={mod} className="cheat-group">
                    <h3 className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-2">{mod}</h3>
                    <div className="space-y-3">
                      {items.map(s => (
                        <div key={s.id} className="bg-surface rounded-xl border border-border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold text-ink">{s.title ?? "Snippet"}</p>
                            {s.lesson_title && s.lesson_title !== s.title && (
                              <span className="text-[10px] text-ink-muted truncate">· {s.lesson_title}</span>
                            )}
                          </div>
                          <NoteContent content={s.content} noteType="code_snippet" compact />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
