"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Note {
  id: string; type: string; title: string | null; content: string; color: string;
  lesson_id: string | null; lesson_title: string | null; module_title: string | null;
  course_title: string | null; section_title: string | null;
  flashcard_answer: string | null; next_review_at: string | null;
  review_count: number; is_pinned: boolean; tags: string[];
  created_at: string; updated_at: string;
}

interface Props {
  initialNotes: Note[];
  stats: { total: number; highlights: number; codeSnippets: number; flashcards: number; dueFlashcards: number; userNotes: number; novaSaves: number; summaries: number };
}

type Filter = "all" | "highlight" | "note" | "code_snippet" | "flashcard" | "nova_save" | "auto_summary";

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  highlight:    { label: "Highlight",    icon: "M12 2L2 7l10 5 10-5-10-5z",                    color: "text-amber-600", bg: "bg-amber-50" },
  note:         { label: "Note",         icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6", color: "text-brand", bg: "bg-brand/5" },
  code_snippet: { label: "Code",         icon: "M16 18l6-6-6-6M8 6l-6 6 6 6",                 color: "text-violet-600", bg: "bg-violet-50" },
  flashcard:    { label: "Flashcard",    icon: "M2 4h20v16H2zM12 4v16",                         color: "text-emerald-600", bg: "bg-emerald-50" },
  nova_save:    { label: "Nova",         icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", color: "text-indigo-600", bg: "bg-indigo-50" },
  auto_summary: { label: "Summary",     icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11", color: "text-teal-600", bg: "bg-teal-50" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function StudyHubClient({ initialNotes, stats }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const filtered = notes.filter(n => {
    if (filter !== "all" && n.type !== filter) return false;
    if (search && !n.content.toLowerCase().includes(search.toLowerCase()) && !(n.title ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const flashcardsDue = notes.filter(n => n.type === "flashcard" && n.next_review_at && new Date(n.next_review_at) <= new Date());
  const currentFlashcard = flashcardsDue[flashcardIdx] ?? null;

  async function createNote() {
    if (!newNoteContent.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", content: newNoteContent, title: newNoteTitle || "Quick note" }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => [{ id: data.noteId, type: "note", title: newNoteTitle || "Quick note", content: newNoteContent, color: "blue", lesson_id: null, lesson_title: null, module_title: null, course_title: null, section_title: null, flashcard_answer: null, next_review_at: null, review_count: 0, is_pinned: false, tags: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev]);
        setNewNoteContent("");
        setNewNoteTitle("");
        setShowNewNote(false);
      }
    } catch { /* ignore */ }
  }

  async function deleteNote(noteId: string) {
    try {
      await fetch(`/api/notes?id=${noteId}`, { method: "DELETE" });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch { /* ignore */ }
  }

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "note", label: "Notes", count: stats.userNotes },
    { id: "highlight", label: "Highlights", count: stats.highlights },
    { id: "code_snippet", label: "Code", count: stats.codeSnippets },
    { id: "flashcard", label: "Flashcards", count: stats.flashcards },
    { id: "nova_save", label: "Nova", count: stats.novaSaves },
    { id: "auto_summary", label: "Summaries", count: stats.summaries },
  ];

  return (
    <div className="min-h-full px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-violet-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">Study Hub</h1>
            <p className="text-sm text-ink-muted">{stats.total} saved items{stats.dueFlashcards > 0 ? ` · ${stats.dueFlashcards} flashcards due` : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stats.dueFlashcards > 0 && (
            <button onClick={() => { setFlashcardMode(true); setFlashcardIdx(0); setShowAnswer(false); }}
              className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 4v16" /></svg>
              Review ({stats.dueFlashcards})
            </button>
          )}
          <button onClick={() => setShowNewNote(!showNewNote)}
            className="h-9 px-4 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Note
          </button>
        </div>
      </div>

      {/* New note form */}
      {showNewNote && (
        <div className="bg-surface rounded-xl border border-border p-5 mb-6 shadow-card">
          <input value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} placeholder="Note title (optional)"
            className="w-full text-sm font-semibold text-ink placeholder:text-ink-muted bg-transparent focus:outline-none mb-3" />
          <textarea value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} placeholder="Write your note..."
            rows={4} className="w-full text-sm text-ink placeholder:text-ink-muted bg-surface-soft rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-brand resize-none mb-3" />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setShowNewNote(false)} className="h-8 px-4 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-alt transition-all">Cancel</button>
            <button onClick={createNote} disabled={!newNoteContent.trim()} className="h-8 px-4 rounded-lg bg-brand text-white text-xs font-bold disabled:opacity-40 hover:bg-brand/90 transition-all">Save Note</button>
          </div>
        </div>
      )}

      {/* Flashcard review mode */}
      {flashcardMode && currentFlashcard && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-lg max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">Flashcard {flashcardIdx + 1}/{flashcardsDue.length}</span>
              <button onClick={() => setFlashcardMode(false)} className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center text-ink-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Question */}
            <div className="bg-surface-soft rounded-xl p-5 mb-4 min-h-[100px]">
              <p className="text-sm font-medium text-ink whitespace-pre-wrap">{currentFlashcard.title ?? currentFlashcard.content}</p>
              {currentFlashcard.course_title && <p className="text-[10px] text-ink-muted mt-2">{currentFlashcard.course_title} · {currentFlashcard.lesson_title}</p>}
            </div>

            {/* Answer */}
            {showAnswer ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
                <p className="text-sm text-ink whitespace-pre-wrap">{currentFlashcard.flashcard_answer ?? currentFlashcard.content}</p>
              </div>
            ) : (
              <button onClick={() => setShowAnswer(true)} className="w-full h-12 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-ink-muted hover:border-brand/30 hover:text-brand transition-all mb-6">
                Show Answer
              </button>
            )}

            {/* Actions */}
            {showAnswer && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setFlashcardIdx(i => Math.min(i + 1, flashcardsDue.length - 1)); setShowAnswer(false); }}
                  className="flex-1 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-all">
                  Hard — Review soon
                </button>
                <button onClick={() => { setFlashcardIdx(i => Math.min(i + 1, flashcardsDue.length - 1)); setShowAnswer(false); }}
                  className="flex-1 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-all">
                  Good — 3 days
                </button>
                <button onClick={() => { setFlashcardIdx(i => Math.min(i + 1, flashcardsDue.length - 1)); setShowAnswer(false); }}
                  className="flex-1 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all">
                  Easy — 7 days
                </button>
              </div>
            )}

            {flashcardIdx >= flashcardsDue.length - 1 && showAnswer && (
              <div className="text-center mt-4">
                <p className="text-sm text-ink-muted">All flashcards reviewed!</p>
                <button onClick={() => setFlashcardMode(false)} className="mt-2 text-sm text-brand font-semibold hover:underline">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn("shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === f.id ? "bg-brand text-white" : "text-ink-muted hover:bg-surface-alt"
              )}>
              {f.label}
              {f.count > 0 && <span className={cn("ml-1 px-1 py-0.5 rounded text-[9px]", filter === f.id ? "bg-white/20" : "bg-surface-alt")}>{f.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-sm text-ink-muted w-full sm:w-auto sm:min-w-[200px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="flex-1 bg-transparent text-sm focus:outline-none text-ink" />
        </div>
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-alt flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-ink mb-1">
            {filter === "all" ? "Your Study Hub is empty" : `No ${FILTERS.find(f => f.id === filter)?.label.toLowerCase()} yet`}
          </h3>
          <p className="text-sm text-ink-muted max-w-sm mx-auto">
            Save highlights, code snippets, and notes while studying. They'll appear here for easy review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(note => {
            const config = TYPE_CONFIG[note.type] ?? TYPE_CONFIG.note;
            return (
              <div key={note.id} className="bg-surface rounded-xl border border-border p-4 hover:shadow-card transition-all group relative">
                {/* Delete button */}
                <button onClick={() => deleteNote(note.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-md bg-surface-alt flex items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                {/* Type badge */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", config.bg)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={config.color}><path d={config.icon} /></svg>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>{config.label}</span>
                  {note.is_pinned && <svg width="10" height="10" viewBox="0 0 24 24" fill="#0056CE" stroke="none"><circle cx="12" cy="12" r="4" /></svg>}
                </div>

                {/* Title */}
                {note.title && <p className="text-sm font-semibold text-ink mb-1 line-clamp-1">{note.title}</p>}

                {/* Content */}
                <p className="text-xs text-ink-secondary leading-relaxed line-clamp-4 mb-3 whitespace-pre-wrap">
                  {note.type === "code_snippet" ? note.content.slice(0, 200) : note.content.slice(0, 150)}
                </p>

                {/* Context */}
                <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                  {note.course_title && <span className="truncate">{note.course_title}</span>}
                  {note.lesson_title && <><span>·</span><span className="truncate">{note.lesson_title}</span></>}
                  <span className="ml-auto shrink-0">{timeAgo(note.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
