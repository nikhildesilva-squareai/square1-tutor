"use client";

import { useState } from "react";
import Link from "next/link";
import { ratePerSeat, billedTotal, annualSavings, tierName, MAX_SELF_SERVE_SEATS, type BillingInterval } from "@/lib/org";

const INTERVALS: [BillingInterval, string][] = [
  ["annual", "Annual"],
  ["monthly", "Monthly"],
];

export function SeatSelector() {
  const [seats, setSeats] = useState(10);
  const [interval, setInterval] = useState<BillingInterval>("annual");

  const perSeat = ratePerSeat(seats, interval);
  const total = billedTotal(seats, interval);
  const savings = annualSavings(seats);

  return (
    <div className="max-w-2xl mx-auto rounded-3xl border-2 border-brand/20 bg-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,86,206,0.10)]">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="text-[10px] tracking-widest uppercase font-bold text-slate-400">Build your team</p>
          <p className="text-lg font-black text-slate-900">How many people?</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> FREE during early access
        </span>
      </div>

      {/* Billing interval toggle */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 mb-5 max-w-xs">
        {INTERVALS.map(([opt, label]) => (
          <button
            key={opt}
            onClick={() => setInterval(opt)}
            className={`flex-1 h-9 rounded-lg text-sm font-bold transition-all ${interval === opt ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {label}
            {opt === "annual" && <span className="ml-1.5 text-[10px] font-bold text-emerald-600">save ~3mo</span>}
          </button>
        ))}
      </div>

      {/* Seat stepper + slider */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => setSeats((s) => Math.max(1, s - 1))} aria-label="Fewer seats"
          className="w-10 h-10 rounded-xl border border-slate-300 text-slate-700 text-xl font-bold hover:bg-slate-50">−</button>
        <div className="flex-1 text-center">
          <span className="text-4xl font-black text-slate-900 tabular-nums">{seats}</span>
          <span className="text-sm text-slate-500 ml-1">seat{seats !== 1 ? "s" : ""}</span>
        </div>
        <button onClick={() => setSeats((s) => Math.min(MAX_SELF_SERVE_SEATS, s + 1))} aria-label="More seats"
          className="w-10 h-10 rounded-xl border border-slate-300 text-slate-700 text-xl font-bold hover:bg-slate-50">+</button>
      </div>
      <input type="range" min={1} max={MAX_SELF_SERVE_SEATS} value={seats} onChange={(e) => setSeats(Number(e.target.value))}
        className="w-full accent-[#0056CE] mb-6" aria-label="Number of seats" />

      {/* Price (reference — free for now) */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{tierName(seats)} tier · {interval === "annual" ? "Annual" : "Monthly"}</p>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">${perSeat}</span>/seat/mo when billing launches
          </p>
          {interval === "annual" && savings > 0 && (
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Saves ${savings.toLocaleString()}/yr vs monthly</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-900 tabular-nums">$0 <span className="text-sm font-semibold text-emerald-600">today</span></p>
          <p className="text-[11px] text-slate-400">
            {interval === "annual" ? `~$${total.toLocaleString()}/yr later` : `~$${total.toLocaleString()}/mo later`} · cancel anytime
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-sm text-slate-700">
        {["AI tutor that grades real code", "Personalised path per employee", "Manager progress dashboard", "Projects + verifiable certificates"].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            {f}
          </li>
        ))}
      </ul>

      <Link href={`/business/start?seats=${seats}&interval=${interval}`}
        className="block text-center w-full py-4 rounded-xl text-white font-bold text-base hover:-translate-y-0.5 transition-transform"
        style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
        Start your team — free →
      </Link>
      <p className="text-center text-[11px] text-slate-400 mt-3">
        No card today. Need 50+? <Link href="#request" className="text-brand font-semibold hover:underline">Talk to us</Link>.
      </p>
    </div>
  );
}
