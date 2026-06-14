"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

const SUBJECTS = [
  { slug: "generative-ai", title: "Generative AI", icon: "🤖", role: "AI Engineer", color: "#6366f1" },
  { slug: "machine-learning", title: "Machine Learning", icon: "🧠", role: "ML Engineer", color: "#8b5cf6" },
  { slug: "fullstack-development", title: "Full Stack Dev", icon: "🚀", role: "Full Stack Engineer", color: "#06b6d4" },
  { slug: "cybersecurity", title: "Cybersecurity", icon: "🔐", role: "Security Engineer", color: "#ef4444" },
  { slug: "data-science", title: "Data Science", icon: "📊", role: "Data Scientist", color: "#14b8a6" },
  { slug: "devops-engineering", title: "DevOps", icon: "⚙️", role: "DevOps Engineer", color: "#F97316" },
  { slug: "artificial-intelligence", title: "Artificial Intelligence", icon: "⚡", role: "AI Engineer", color: "#0ea5e9" },
  { slug: "computer-vision", title: "Computer Vision", icon: "👁️", role: "CV Engineer", color: "#10b981" },
  { slug: "llm-agent-architect", title: "LLM Agent Architect", icon: "🛠️", role: "Agent Architect", color: "#7C3AED" },
  { slug: "game-development", title: "Game Development", icon: "🎮", role: "Game Developer", color: "#f59e0b" },
  { slug: "drone-technology", title: "Drone Technology", icon: "🚁", role: "Drone Engineer", color: "#EC4899" },
  { slug: "ai-product-management", title: "AI Product Management", icon: "📋", role: "AI PM", color: "#0EA5E9" },
];

type Stage = "loading" | "pick" | "claiming" | "waitlist" | "waitlisted";

export default function BetaPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [waitEmail, setWaitEmail] = useState("");
  const [waitPos, setWaitPos] = useState<number | null>(null);
  const [waitSaving, setWaitSaving] = useState(false);

  const claim = useCallback(async (slug: string) => {
    setStage("claiming");
    setError("");
    try {
      const res = await fetch("/api/beta/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });
      const data = await res.json();
      if (data.capped) { setFull(true); setStage("waitlist"); return; }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not start your access");
      // Aha-first: drop them straight into the first lesson
      window.location.href = data.firstLessonId ? `/learn/${data.firstLessonId}` : "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("pick");
    }
  }, []);

  // Initial load: status + auth + handle post-OAuth auto-claim
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const courseParam = params.get("course");
      const shouldClaim = params.get("claim") === "1";

      let isFull = false;
      try {
        const s = await fetch("/api/beta/status").then((r) => r.json());
        setSpotsLeft(s.spotsLeft);
        isFull = s.full;
        setFull(s.full);
      } catch { /* fail open */ }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);

      // Returned from OAuth ready to claim
      if (shouldClaim && user && courseParam) {
        setSelected(courseParam);
        claim(courseParam);
        return;
      }
      if (courseParam) setSelected(courseParam);
      setStage(isFull ? "waitlist" : "pick");
    })();
  }, [claim]);

  async function handlePrimary() {
    if (!selected) { setError("Pick a track first."); return; }
    setError("");
    if (loggedIn) {
      claim(selected);
      return;
    }
    // Not logged in → Google OAuth, return to /beta to auto-claim
    const supabase = createClient();
    const next = encodeURIComponent(`/beta?course=${selected}&claim=1`);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${next}` },
    });
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitEmail.trim()) { setError("Enter your email."); return; }
    setWaitSaving(true);
    setError("");
    try {
      const res = await fetch("/api/beta/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitEmail, courseSlug: selected ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not join — try again");
      setWaitPos(data.position);
      setStage("waitlisted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setWaitSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 45%)" }}>
      <header className="flex items-center justify-between px-5 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
        {!loggedIn && <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">

        {stage === "loading" && (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
            <p className="text-sm">Checking founding spots…</p>
          </div>
        )}

        {stage === "claiming" && (
          <div className="flex flex-col items-center gap-3 text-slate-500 text-center">
            <svg className="animate-spin h-7 w-7 text-brand" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
            <p className="text-sm font-semibold text-slate-700">Setting up your free access…</p>
            <p className="text-xs">Dropping you into your first lesson.</p>
          </div>
        )}

        {/* PICK A TRACK + CLAIM */}
        {stage === "pick" && (
          <div className="w-full max-w-3xl text-center animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold mb-5"
              style={{ background: "rgba(0,86,206,0.08)", color: "#0056CE", border: "1px solid rgba(0,86,206,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              FOUNDING BETA{spotsLeft !== null ? ` · ${spotsLeft} of 100 spots left` : ""}
            </span>
            <h1 className="font-black tracking-tight text-slate-900 leading-[1.0] mb-3" style={{ fontSize: "clamp(32px,5vw,56px)" }}>
              2 weeks free. No card.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-9">
              Pick a track and start in 30 seconds. All we ask back is your honest feedback.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {SUBJECTS.map((s) => {
                const on = selected === s.slug;
                return (
                  <button key={s.slug} onClick={() => setSelected(s.slug)}
                    className="rounded-2xl p-4 border-2 text-left transition-all hover:-translate-y-0.5"
                    style={{ borderColor: on ? s.color : "rgba(15,28,49,0.10)", background: on ? `${s.color}0D` : "#fff" }}>
                    <span className="text-2xl">{s.icon}</span>
                    <p className="mt-2 text-sm font-bold text-slate-900 leading-tight">{s.title}</p>
                    <p className="text-[11px] font-semibold mt-0.5" style={{ color: s.color }}>{s.role}</p>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <button onClick={handlePrimary} disabled={!selected}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-white font-bold text-sm sm:text-base disabled:opacity-40 hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
              {loggedIn ? (
                <>Claim my free spot →</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" opacity=".9"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" fill="#fff" opacity=".7"/></svg>
                  Continue with Google — claim my spot
                </>
              )}
            </button>
            {!loggedIn && (
              <p className="text-xs text-slate-400 mt-4">
                Prefer email? <Link href="/signup" className="text-brand font-semibold hover:underline">Sign up here</Link>, then come back to claim.
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-3">Free for 2 weeks · no credit card · cancel anytime</p>
          </div>
        )}

        {/* WAITLIST (cap reached) */}
        {stage === "waitlist" && (
          <div className="w-full max-w-md text-center animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold mb-5 bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ALL 100 SPOTS CLAIMED
            </span>
            <h1 className="font-black tracking-tight text-slate-900 leading-[1.0] mb-3" style={{ fontSize: "clamp(28px,5vw,48px)" }}>
              Join the waitlist
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mb-7">
              The founding beta is full — but we&apos;re letting people in as spots open. Leave your email and you&apos;re next in line.
            </p>
            <form onSubmit={joinWaitlist} className="space-y-3">
              <input type="email" value={waitEmail} onChange={(e) => setWaitEmail(e.target.value)} placeholder="you@example.com"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={waitSaving}
                className="w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-60 hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.3)" }}>
                {waitSaving ? "Joining…" : "Join the waitlist →"}
              </button>
            </form>
          </div>
        )}

        {/* WAITLISTED CONFIRMATION */}
        {stage === "waitlisted" && (
          <div className="w-full max-w-md text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h1 className="font-black text-slate-900 text-3xl mb-2">You&apos;re on the list 🎉</h1>
            <p className="text-sm text-slate-600">
              {waitPos ? <>You&apos;re <span className="font-bold text-slate-900">#{waitPos}</span> in line. </> : null}
              We&apos;ll email you the moment a spot opens.
            </p>
            <Link href="/" className="inline-block mt-6 text-xs text-slate-400 hover:text-slate-700">← Back home</Link>
          </div>
        )}
      </main>
    </div>
  );
}
