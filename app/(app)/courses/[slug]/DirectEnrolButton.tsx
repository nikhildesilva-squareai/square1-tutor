"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Direct, free enrolment for open-access tracks (no placement assessment).
// POSTs to /api/courses/enroll-free, then drops the learner straight into lesson 1.
export function DirectEnrolButton({
  courseSlug,
  label = "Start this track — free",
  className,
}: {
  courseSlug: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function enrol() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/courses/enroll-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? "Could not start the course");
        setLoading(false);
        return;
      }
      router.push(data.firstLessonId ? `/learn/${data.firstLessonId}` : `/courses/${courseSlug}`);
      router.refresh();
    } catch {
      setErr("Something went wrong — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={enrol}
        disabled={loading}
        className={
          className ??
          "shrink-0 h-11 px-6 rounded-xl bg-white text-ink font-bold text-sm hover:bg-white/90 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
        }
      >
        {loading ? "Starting…" : label}
        {!loading && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        )}
      </button>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}
