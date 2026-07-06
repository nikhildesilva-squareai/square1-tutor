"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/client";
import { tierName, ratePerSeat, MAX_SELF_SERVE_SEATS, type BillingInterval } from "@/lib/org";
import { TeamSignIn } from "@/components/business/TeamSignIn";

export default function StartTeamPage() {
  const [seats, setSeats] = useState(5);
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Clamp instead of silently discarding — a 100-seat buyer must land on a
    // 100-seat form, never on the 5-seat default. Range mirrors the pricing
    // table (1 to MAX_SELF_SERVE_SEATS).
    const s = parseInt(params.get("seats") ?? "5", 10);
    if (!isNaN(s)) setSeats(Math.min(MAX_SELF_SERVE_SEATS, Math.max(1, s)));
    if (params.get("interval") === "monthly") setInterval("monthly");
    createClient().auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Give your team a name."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/org/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), seats, interval }),
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
            <p className="text-sm text-slate-600">
              {seats} seats · {tierName(seats)} tier · ${ratePerSeat(seats, interval)}/seat/mo {interval === "annual" ? "billed annually" : "month-to-month"} when billing launches (free today)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <Link href="/business#start" className="text-brand font-semibold hover:underline">Change seats or billing</Link>
            </p>
          </div>

          {loggedIn === null ? (
            <div className="text-center text-slate-500 text-sm py-8">Loading…</div>
          ) : !loggedIn ? (
            <div>
              <p className="text-sm text-slate-600 mb-4 text-center">First, sign in — you&apos;ll be the team&apos;s manager.</p>
              <TeamSignIn next={`/business/start?seats=${seats}&interval=${interval}`} onAuthed={() => setLoggedIn(true)} />
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
                style={{ background: "linear-gradient(135deg, #3388FF 0%, #0056CE 55%, #01224F 100%)" }}>
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
