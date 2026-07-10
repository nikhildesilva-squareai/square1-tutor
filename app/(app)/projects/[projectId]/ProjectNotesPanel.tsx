"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { NoteContent } from "@/components/ui/note-content";

interface Snippet {
  id: string; title: string | null; content: string;
  type: string; lesson_title: string | null; tags: string[];
}

// A floating "My notes" tab on the project page. Opens a slide-over of the
// student's code snippets + bug-fix logs for THIS project's course — the moment
// they most need their own reference is while building the project.
export function ProjectNotesPanel({ snippets, courseTitle }: { snippets: Snippet[]; courseTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger — fixed to the right edge */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 pl-3 pr-2 py-3 rounded-l-xl bg-[#0D1117] text-white shadow-lg hover:pr-3 transition-all"
        style={{ writingMode: "vertical-rl" }}
        aria-label="Open my notes for this course"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: "rotate(90deg)" }}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
        <span className="text-[11px] font-bold tracking-wide">My notes{snippets.length ? ` (${snippets.length})` : ""}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="text-sm font-black text-ink">My notes</h3>
                <p className="text-[11px] text-ink-muted">{courseTitle} — snippets & bug fixes</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center text-ink-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {snippets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-ink mb-1">Nothing saved yet</p>
                  <p className="text-xs text-ink-muted max-w-[240px] mx-auto">
                    Save code from this course&apos;s lessons with <span className="font-semibold">Save ➜ Hub</span>, or log a bug fix in your Study Hub. It shows up here while you build.
                  </p>
                </div>
              ) : (
                snippets.map(s => {
                  const isError = s.tags?.includes("error-log");
                  return (
                    <div key={s.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          isError ? "bg-red-50 text-red-500" : "bg-violet-50 text-violet-600")}>
                          {isError ? "Bug fix" : "Snippet"}
                        </span>
                        {s.lesson_title && <span className="text-[10px] text-ink-muted truncate">{s.lesson_title}</span>}
                      </div>
                      {s.title && !s.title.startsWith("🐛") && <p className="text-xs font-semibold text-ink mb-1">{s.title}</p>}
                      <NoteContent content={s.content} noteType={s.type} compact />
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-border shrink-0">
              <a href="/notes/cheatsheet" className="text-xs font-semibold text-brand hover:underline">Open full cheatsheet →</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
