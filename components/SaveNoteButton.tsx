"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SaveNoteButtonProps {
  content: string;
  type: "highlight" | "code_snippet" | "note" | "nova_save";
  lessonId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
  courseId?: string;
  courseTitle?: string;
  sectionTitle?: string;
  conversationId?: string;
  className?: string;
  variant?: "icon" | "text" | "inline";
}

export function SaveNoteButton({
  content, type, lessonId, lessonTitle, moduleTitle, courseId, courseTitle,
  sectionTitle, conversationId, className, variant = "icon",
}: SaveNoteButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  async function save(saveType: "highlight" | "code_snippet" | "note" | "nova_save" | "flashcard") {
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: saveType,
          content,
          title: sectionTitle ?? lessonTitle ?? "Saved note",
          lessonId, lessonTitle, moduleTitle, courseId, courseTitle, sectionTitle, conversationId,
          flashcardAnswer: saveType === "flashcard" ? content : undefined,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setShowMenu(false);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  if (variant === "inline") {
    return (
      <div className={cn("relative inline-flex", className)}>
        <button onClick={() => setShowMenu(!showMenu)} disabled={saving || saved}
          className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
            saved ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-surface-alt text-ink-muted hover:text-brand hover:bg-surface-tint border border-border"
          )}>
          {saved ? (
            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>Saved</>
          ) : (
            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /></svg>Save</>
          )}
        </button>

        {showMenu && (
          <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 min-w-[140px]">
            <button onClick={() => save(type)} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-surface-soft transition-colors flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Save to notes
            </button>
            <button onClick={() => save("flashcard")} className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-surface-soft transition-colors flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 4v16" /></svg>
              Add as flashcard
            </button>
          </div>
        )}
      </div>
    );
  }

  // Icon variant (default)
  return (
    <button onClick={() => save(type)} disabled={saving || saved}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
        saved ? "bg-emerald-50 text-emerald-600" : "bg-surface-alt text-ink-muted hover:text-brand hover:bg-surface-tint",
        className
      )}
      title={saved ? "Saved!" : "Save to Study Hub"}>
      {saved ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
      ) : saving ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" />
        </svg>
      )}
    </button>
  );
}
