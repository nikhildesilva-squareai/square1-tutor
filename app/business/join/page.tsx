"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";

const SUBJECTS = [
  { slug: "generative-ai", title: "Generative AI", icon: "🤖", color: "#6366f1" },
  { slug: "machine-learning", title: "Machine Learning", icon: "🧠", color: "#8b5cf6" },
  { slug: "fullstack-development", title: "Full Stack Dev", icon: "🚀", color: "#06b6d4" },
  { slug: "cybersecurity", title: "Cybersecurity", icon: "🔐", color: "#ef4444" },
  { slug: "data-science", title: "Data Science", icon: "📊", color: "#14b8a6" },
  { slug: "devops-engineering", title: "DevOps", icon: "⚙️", color: "#F97316" },
  { slug: "artificial-intelligence", title: "Artificial Intelligence", icon: "⚡", color: "#0ea5e9" },
  { slug: "computer-vision", title: "Computer Vision", icon: "👁️", color: "#10b981" },
  { slug: "llm-agent-architect", title: "LLM Agent Architect", icon: "🛠️", color: "#7C3AED" },
  { slug: "game-development", title: "Game Development", icon: "🎮", color: "#f59e0b" },
  { slug: "drone-technology", title: "Drone Technology", icon: "🚁", color: "#EC4899" },
  { slug: "ai-product-management", title: "AI Product Management", icon: "📋", color: "#0EA5E9" },
];

type Stage = "loading" | "signin" | "pick" | "joining" | "error";

export default function JoinTeamPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [code, setCode] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  async function signIn() {
    const supabase = createClient();
    const next = encodeURIComponent(`/business/join?code=${code}`);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${next}` },
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 45%)" }}>
      <header className="flex items-center px-5 sm:px-10 py-5">
        <Link href="/"><Logo variant="dark" size="md" /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {stage === "loading" && <p className="text-sm text-slate-400">Loading…</p>}

        {stage === "error" && (
          <div className="text-center max-w-sm">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Invite link problem</h1>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        )}

        {stage === "signin" && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-2">You&apos;re invited to learn 🎓</h1>
            <p className="text-sm text-slate-600 mb-6">Your team has a Square 1 seat for you. Sign in to claim it.</p>
            <button onClick={signIn}
              className="w-full h-12 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" opacity=".95"/></svg>
              Continue with Google
            </button>
          </div>
        )}

        {(stage === "pick" || stage === "joining") && (
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-1">Pick your track</h1>
            <p className="text-sm text-slate-600 mb-7">Choose what you want to learn — you can switch later.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
              {SUBJECTS.map((s) => {
                const on = selected === s.slug;
                return (
                  <button key={s.slug} onClick={() => setSelected(s.slug)} disabled={stage === "joining"}
                    className="rounded-2xl p-4 border-2 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ borderColor: on ? s.color : "rgba(15,28,49,0.10)", background: on ? `${s.color}0D` : "#fff" }}>
                    <span className="text-2xl">{s.icon}</span>
                    <p className="mt-2 text-sm font-bold text-slate-900 leading-tight">{s.title}</p>
                  </button>
                );
              })}
            </div>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <button onClick={() => selected && join(code, selected)} disabled={!selected || stage === "joining"}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 hover:-translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
              {stage === "joining" ? "Setting up…" : "Start learning →"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
