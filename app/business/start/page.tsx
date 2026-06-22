"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { tierName, seatRate } from "@/lib/org";
import { TeamSignIn } from "@/components/business/TeamSignIn";

export default function StartTeamPage() {
  const [seats, setSeats] = useState(5);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = parseInt(params.get("seats") ?? "5", 10);
    if (!isNaN(s) && s >= 1 && s <= 50) setSeats(s);
    createClient().auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Give your team a name."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/org/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), seats }),
      });
      const data = await res.json();
      if (!res.ok || !data.orgId) throw new Error(data.error ?? "Could not create your team");
      window.location.href = "/business/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#F8FAFC 0%,#FFFFFF 45%)" }}>
      <header className="flex items-center justify-between px-5 sm:px-10 py-5">
        <Link href="/business"><Logo variant="dark" size="md" /></Link>
        <Link href="/business" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> FREE during early access
            </span>
            <h1 className="text-3xl font-black text-slate-900 mb-1">Set up your team</h1>
            <p className="text-sm text-slate-600">{seats} seats · {tierName(seats)} tier · ${seatRate(seats)}/seat/mo when billing launches (free today)</p>
          </div>

          {loggedIn === null ? (
            <div className="text-center text-slate-500 text-sm py-8">Loading…</div>
          ) : !loggedIn ? (
            <div>
              <p className="text-sm text-slate-600 mb-4 text-center">First, sign in — you&apos;ll be the team&apos;s manager.</p>
              <TeamSignIn next={`/business/start?seats=${seats}`} onAuthed={() => setLoggedIn(true)} />
            </div>
          ) : (
            <form onSubmit={createTeam} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Team / company name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc."
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus:border-brand" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={saving}
                className="w-full h-12 rounded-xl text-white font-bold text-sm disabled:opacity-60 hover:-translate-y-0.5 transition-transform"
                style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)" }}>
                {saving ? "Creating…" : "Create team & open manager portal →"}
              </button>
              <p className="text-[11px] text-slate-500 text-center">You&apos;ll get a link to invite your {seats} team members.</p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
