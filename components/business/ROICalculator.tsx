"use client";

import { useState } from "react";
import Link from "next/link";
import { seatRate, MAX_SELF_SERVE_SEATS } from "@/lib/org";

// Interactive value calculator — team size → tangible output + cost vs bootcamps.
// All arithmetic off our own published pricing + the $10k/head bootcamp anchor.
const BOOTCAMP_PER_HEAD = 10000;

export function ROICalculator() {
  const [seats, setSeats] = useState(15);

  const perSeatMo = seatRate(seats);
  const annualTotal = perSeatMo * 12 * seats;
  const bootcampTotal = seats * BOOTCAMP_PER_HEAD;
  const savings = Math.max(0, bootcampTotal - annualTotal);
  const projects = seats * 12;

  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-6 py-14">
      <div className="text-center mb-8">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">What it&apos;s worth</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">The math your CFO will like.</h2>
      </div>

      <div className="rounded-3xl border-2 border-brand/15 bg-white p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,86,206,0.10)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">Team size</span>
          <span className="text-sm font-black text-slate-900 tabular-nums">{seats} people</span>
        </div>
        <input type="range" min={1} max={MAX_SELF_SERVE_SEATS} value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full accent-[#0056CE] mb-6" aria-label="Team size" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">{projects.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-1.5">deployable projects shipped<span className="text-slate-400"> (up to)</span></p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">{seats}</p>
            <p className="text-[11px] text-slate-500 mt-1.5">verifiable certificates</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-3xl font-black text-emerald-700 tabular-nums leading-none">${savings.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700 mt-1.5">saved vs bootcamps / yr</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-500">Square 1 Ai</p>
            <p className="text-lg font-black text-slate-900 tabular-nums">${annualTotal.toLocaleString()}<span className="text-xs font-semibold text-slate-500">/yr</span></p>
            <p className="text-[11px] text-slate-400">${perSeatMo}/seat/mo · free during early access</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Bootcamps</p>
            <p className="text-lg font-black text-slate-400 line-through tabular-nums">${bootcampTotal.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400">≈ $10k / head</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 max-w-xs text-center sm:text-left">Output = up to 12 deployable builds per learner. Bootcamp benchmark ≈ $10k/head.</p>
          <Link href="#start" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm hover:-translate-y-0.5 transition-transform whitespace-nowrap"
            style={{ background: "linear-gradient(135deg,#0056CE,#4F46E5)", boxShadow: "0 12px 32px rgba(0,86,206,0.30)" }}>
            Start your team →
          </Link>
        </div>
      </div>
    </section>
  );
}
