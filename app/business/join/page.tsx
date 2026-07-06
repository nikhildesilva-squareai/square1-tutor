"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { TeamSignIn } from "@/components/business/TeamSignIn";
import { getVisibleCourses, type CatalogCourse } from "@/lib/catalog";
import { CourseIcon } from "@/components/ui/course-icon";

type Stage = "loading" | "signin" | "pick" | "joining" | "error";

export default function JoinTeamPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [assigned, setAssigned] = useState<{ slug: string; title: string } | null>(null);
  const [checkedAssign, setCheckedAssign] = useState(false);
  const [subjects, setSubjects] = useState<CatalogCourse[]>([]);

  // Live course catalog — same visibility rules as the landing page, so team
  // members can never pick a retired track or miss a new one.
  useEffect(() => {
    getVisibleCourses(createClient()).then(setSubjects).catch(() => setSubjects([]));
  }, []);

  const join = useCallback(async (joinCode: string, slug: string) => {
    setStage("joining"); setError("");
    try {
      const res = await fetch("/api/org/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode, courseSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not join");
      window.location.href = data.firstLessonId ? `/learn/${data.firstLessonId}` : "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("pick");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code") ?? "";
    setCode(c);
    if (!c) { setError("This invite link is missing its code."); setStage("error"); return; }
    createClient().auth.getUser().then(({ data }) => {
      setStage(data.user ? "pick" : "signin");
    });
  }, []);

  // Once authed and on the pick step, check whether the manager pre-assigned a track.
  useEffect(() => {
    if (stage !== "pick" || !code || checkedAssign) return;
    (async () => {
      try {
        const res = await fetch(`/api/org/assignment?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.assigned && data.courseSlug) {
          setAssigned({ slug: data.courseSlug, title: data.courseTitle ?? "your track" });
          setSelected(data.courseSlug);
        }
      } catch {
        /* ignore — fall back to the picker */
      } finally {
        setCheckedAssign(true);
      }
    })();
  }, [stage, code, checkedAssign]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 45%)" }}>
      <header className="flex items-center px-5 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {stage === "loading" && <p className="text-sm text-slate-500">Loading…</p>}

        {stage === "error" && (
          <div className="text-center max-w-sm">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Invite link problem</h1>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        )}

        {stage === "signin" && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-2">You&apos;re invited to learn</h1>
            <p className="text-sm text-slate-600 mb-6">Your team has a Square 1 Ai seat for you. Sign in to claim it.</p>
            <TeamSignIn next={`/business/join?code=${code}`} onAuthed={() => setStage("pick")} />
          </div>
        )}

        {/* Checking for a manager assignment */}
        {(stage === "pick" || stage === "joining") && !checkedAssign && (
          <p className="text-sm text-slate-500">Setting up your seat…</p>
        )}

        {/* Manager pre-assigned a track → skip the picker */}
        {(stage === "pick" || stage === "joining") && checkedAssign && assigned && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-1">You&apos;re all set</h1>
            <p className="text-sm text-slate-600 mb-6">Your manager set you up with a track. Start whenever you&apos;re ready.</p>
            <div className="rounded-2xl border-2 border-brand/30 bg-brand/[0.04] p-6 mb-6">
              <p className="text-[10px] tracking-widest uppercase font-bold text-slate-500 mb-1">Your assigned track</p>
              <p className="text-xl font-black text-slate-900">{assigned.title}</p>
            </div>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button onClick={() => join(code, assigned.slug)} disabled={stage === "joining"}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
              {stage === "joining" ? "Setting up…" : "Start learning →"}
            </button>
          </div>
        )}

        {/* No assignment → choose your own track */}
        {(stage === "pick" || stage === "joining") && checkedAssign && !assigned && (
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-1">Pick your track</h1>
            <p className="text-sm text-slate-600 mb-7">Choose what you want to learn — you can switch later.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
              {subjects.length === 0 && <p className="col-span-full text-sm text-slate-500 py-6">Loading tracks…</p>}
              {subjects.map((s) => {
                const on = selected === s.slug;
                const color = s.color ?? "#0056CE";
                return (
                  <button key={s.slug} onClick={() => setSelected(s.slug)} disabled={stage === "joining"}
                    className="rounded-2xl p-4 border-2 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ borderColor: on ? color : "rgba(15,28,49,0.10)", background: on ? `${color}0D` : "#fff" }}>
                    <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <CourseIcon slug={s.slug} size={20} color={color} />
                    </span>
                    <p className="mt-2 text-sm font-bold text-slate-900 leading-tight">{s.title}</p>
                  </button>
                );
              })}
            </div>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button onClick={() => selected && join(code, selected)} disabled={!selected || stage === "joining"}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg,#0056CE,#01224F)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
              {stage === "joining" ? "Setting up…" : "Start learning →"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
