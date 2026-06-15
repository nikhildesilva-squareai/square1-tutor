"use client";

import { useState } from "react";

const TEAM_SIZES = ["1–5", "6–15", "16–30", "31–50", "50+"];

export function BusinessLeadForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !company.trim() || !email.trim()) {
      setError("Please fill in your name, company and work email.");
      return;
    }
    setState("saving");
    setError("");
    try {
      const res = await fetch("/api/business-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, teamSize, message }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Could not submit — please try again");
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit — please try again");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <p className="text-lg font-black text-slate-900 mb-1">Thanks, {name.split(" ")[0]} — we&apos;ll be in touch.</p>
        <p className="text-sm text-slate-600">We&apos;ll email {email} with team pricing and a quick way to pilot Square 1 with your staff.</p>
      </div>
    );
  }

  const inputClass = "w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(15,28,49,0.08)] space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Your name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Company *</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Work email *</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>How many people would you train?</label>
        <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
          className={inputClass + " cursor-pointer"}>
          <option value="">Select team size</option>
          {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Anything we should know? (optional)</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="What skills do you want your team to build?"
          className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none" />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <button type="submit" disabled={state === "saving"}
        className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
        {state === "saving" ? "Sending…" : "Request team pricing →"}
      </button>
      <p className="text-[11px] text-slate-400 text-center">We&apos;ll reply with pricing + a pilot offer. No spam.</p>
    </form>
  );
}
