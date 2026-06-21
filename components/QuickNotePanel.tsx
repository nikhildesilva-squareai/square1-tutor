"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * QuickNotePanel — floating action button (right edge) + slide-out note panel.
 * Available app-wide. Supports text notes, paste, and image upload/paste.
 */
export function QuickNotePanel() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hide on login/signup/landing pages, and on surfaces that already have their
  // own composer pinned bottom-right (Nova chat, Messages) — the floating pencil
  // collides with their send button there.
  const hiddenPaths = ["/login", "/signup", "/", "/verify", "/tutor", "/messages"];
  if (hiddenPaths.includes(pathname)) return null;

  // Handle image selection (file input or paste)
  const handleImageFile = useCallback((file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only PNG, JPEG, GIF, WebP images");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Handle paste (text or image from clipboard)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
      // Text paste handled natively by textarea
    },
    [handleImageFile]
  );

  // Handle drag-and-drop
  const [dragOver, setDragOver] = useState(false);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleImageFile(file);
      }
    },
    [handleImageFile]
  );

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save note
  async function handleSave() {
    if (!content.trim() && !imageFile) return;
    setSaving(true);
    setError(null);

    try {
      let imageUrl: string | undefined;

      // Upload image first if present
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/notes/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          throw new Error(d.error ?? "Image upload failed");
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Create note
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          title: title.trim() || "Quick note",
          content: content.trim() || "(image attached)",
          imageUrl,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to save");
      }

      // Success
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
        setTitle("");
        setContent("");
        removeImage();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus textarea on open
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 200);
  }, [open]);

  return (
    <>
      {/* ── Floating Action Button ────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-4 bottom-24 lg:bottom-6 z-40 w-12 h-12 rounded-2xl",
          "bg-brand text-white shadow-lg shadow-brand/30",
          "hover:scale-110 hover:shadow-xl hover:shadow-brand/40",
          "active:scale-95 transition-all duration-200",
          "flex items-center justify-center",
          open && "opacity-0 pointer-events-none"
        )}
        title="Quick Note"
        aria-label="Open notepad"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>

      {/* ── Backdrop ──────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-out Panel ───────────────────────────────────── */}
      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[400px]",
          "bg-surface border-l border-border shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0056CE"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Quick Note</h2>
              <p className="text-[10px] text-ink-muted">
                Write, paste, or drop a screenshot
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-surface-alt flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                textareaRef.current?.focus();
              }
              e.stopPropagation();
            }}
            placeholder="Note title (optional)"
            className="w-full text-sm font-semibold text-ink placeholder:text-ink-muted bg-transparent focus:outline-none"
          />

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="Write your notes here...&#10;&#10;Tip: Paste text or screenshots directly (Ctrl+V)"
            rows={8}
            className={cn(
              "w-full text-sm text-ink placeholder:text-ink-muted",
              "bg-surface-soft rounded-xl border px-4 py-3",
              "focus:outline-none focus:border-brand resize-none",
              "leading-relaxed",
              dragOver ? "border-brand border-2 bg-brand/5" : "border-border"
            )}
          />

          {/* Drag overlay hint */}
          {dragOver && (
            <div className="flex items-center justify-center gap-2 py-3 text-brand text-xs font-semibold animate-pulse">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Drop image here
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl border border-border overflow-hidden bg-surface-soft">
              <img
                src={imagePreview}
                alt="Attached screenshot"
                className="w-full max-h-[200px] object-contain"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="px-3 py-1.5 bg-surface-alt/80 text-[10px] text-ink-muted font-medium">
                {imageFile?.name} ·{" "}
                {imageFile
                  ? `${(imageFile.size / 1024).toFixed(0)} KB`
                  : ""}
              </div>
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            {/* Upload image button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                "border border-border text-ink-muted hover:text-brand hover:border-brand/30 hover:bg-surface-tint"
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Add Image
            </button>

            {/* Paste hint */}
            <span className="text-[10px] text-ink-muted">
              or Ctrl+V to paste
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex items-center gap-2">
          <button
            onClick={() => setOpen(false)}
            className="h-10 px-5 rounded-xl border border-border text-sm font-semibold text-ink-muted hover:bg-surface-alt transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved || (!content.trim() && !imageFile)}
            className={cn(
              "flex-1 h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              saved
                ? "bg-emerald-500 text-white"
                : "bg-brand text-white hover:bg-brand/90 disabled:opacity-40"
            )}
          >
            {saved ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved!
              </>
            ) : saving ? (
              <>
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
