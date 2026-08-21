"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Records that a human has taken this student on.
 *
 * It does not change the student's standing, does not message them and does not
 * appear anywhere they can see it. Its only job is to stop the second instructor
 * making the same call — which at 50 students and two staff is a real failure
 * mode, and an embarrassing one from the student's side.
 *
 * The write goes through the desk's own route handler so the actor comes from
 * the session, never from this form.
 */
export function DeskFlagButton({
  enrollmentId,
  studentName,
  alreadyFlaggedBy,
}: {
  enrollmentId: string;
  studentName: string;
  alreadyFlaggedBy: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function flag() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/desk/bootcamp/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, note: note.trim() || undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Could not record the flag.");
        return;
      }
      setOpen(false);
      setNote("");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-[8px] border border-border font-semibold text-xs px-3 py-1.5 hover:border-brand hover:text-brand transition"
      >
        {alreadyFlaggedBy ? "Flag again" : "Flag for a call"}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-[10px] border border-border bg-surface-alt p-3">
      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
        Flag {studentName}
      </p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 2000))}
        placeholder="What you are going to do about it (optional)"
        className="mt-2 w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs"
      />
      {error && <p className="mt-2 text-xs text-error font-medium">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={flag}
          className="rounded-[8px] bg-brand text-white font-semibold text-xs px-3 py-1.5 hover:opacity-90 disabled:opacity-50 transition"
        >
          {busy ? "Recording…" : "Record the flag"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => { setOpen(false); setError(null); }}
          className="rounded-[8px] border border-border font-semibold text-xs px-3 py-1.5 hover:border-brand transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
