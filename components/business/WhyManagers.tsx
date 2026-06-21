"use client";

import { useEffect, useRef, useState } from "react";

// Value props as a bento grid: one large feature tile with a product visual
// (skill-gap snapshot) + supporting tiles. Cursor spotlight + scroll reveal.

const FEATURED = {
  title: "Measurable, not 'they watched a video'",
  desc: "Every employee is assessed, graded on real code, and tracked — you see who's progressing and who's stalled, with proof you can take to leadership.",
  accent: "#0056CE",
  icon: "M18 20V10M12 20V4M6 20v-6",
};

const TILES = [
  { title: "Personalised to each level", desc: "A diagnostic places everyone, then builds a path from where they actually are — junior to senior, no one bored or lost.", accent: "#0EA5E9", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4l3 2", wide: true },
  { title: "Verifiable proof of skill", desc: "Deployed projects + AI-verified certificates — real evidence, not a completion checkbox.", accent: "#10B981", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4 12 14.01l-3-3", wide: false },
  { title: "A fraction of bootcamp cost", desc: "AI tutoring + project review at scale, per seat — it makes a bootcamp look absurd.", accent: "#F59E0B", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", wide: false },
];

const GAP_BARS = [
  { t: "Search algorithms", v: 58 },
  { t: "RAG systems", v: 44 },
  { t: "Bayesian networks", v: 71 },
];

function IconChip({ accent, icon, big = false }: { accent: string; icon: string; big?: boolean }) {
  const s = big ? "w-12 h-12" : "w-11 h-11";
  return (
    <div className={`${s} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 8px 20px ${accent}33` }}>
      <svg width={big ? 24 : 22} height={big ? 24 : 22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
    </div>
  );
}

function SpotCard({ accent, className = "", visible, delay, children }: { accent: string; className?: string; visible: boolean; delay: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div className={`transition-all duration-700 ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transitionDelay: `${delay}ms` }}>
      <div
        ref={ref}
        onMouseMove={onMove}
        className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{ boxShadow: "0 2px 12px rgba(15,28,49,0.04)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(280px circle at var(--mx, 50%) var(--my, 0px), ${accent}20, transparent 60%)` }} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: `0 18px 44px ${accent}22, 0 0 0 1px ${accent}45 inset` }} />
        <div className="relative h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}

export function WhyManagers() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="max-w-5xl mx-auto px-5 sm:px-6 py-14">
      <div className="text-center mb-10">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">Why managers choose us</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">Training you can actually prove.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4">
        {/* Featured — large, with a product visual */}
        <SpotCard accent={FEATURED.accent} className="md:col-span-2 md:row-span-2" visible={visible} delay={0}>
          <IconChip accent={FEATURED.accent} icon={FEATURED.icon} big />
          <h3 className="mt-4 text-xl font-black text-slate-900 leading-snug">{FEATURED.title}</h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{FEATURED.desc}</p>

          {/* Product visual — skill-gap snapshot */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Team readiness</span>
              <span className="text-sm font-black text-slate-900 tabular-nums">86%</span>
            </div>
            {GAP_BARS.map((s) => (
              <div key={s.t} className="flex items-center gap-3 mb-2">
                <span className="text-[11px] text-slate-500 w-32 truncate">{s.t}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${s.v}%`, background: s.v < 50 ? "#F87171" : s.v < 70 ? "#FBBF24" : "#34D399" }} />
                </div>
                <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{s.v}%</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 mt-2">Skill gaps, mapped automatically.</p>
          </div>
        </SpotCard>

        {/* Wide supporting tile */}
        <SpotCard accent={TILES[0].accent} className="md:col-span-2" visible={visible} delay={100}>
          <div className="flex items-start gap-4">
            <IconChip accent={TILES[0].accent} icon={TILES[0].icon} />
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1 leading-snug">{TILES[0].title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{TILES[0].desc}</p>
            </div>
          </div>
        </SpotCard>

        {/* Two square tiles */}
        {TILES.slice(1).map((t, i) => (
          <SpotCard key={t.title} accent={t.accent} className="md:col-span-1" visible={visible} delay={160 + i * 60}>
            <IconChip accent={t.accent} icon={t.icon} />
            <h3 className="mt-3 text-base font-black text-slate-900 mb-1 leading-snug">{t.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{t.desc}</p>
          </SpotCard>
        ))}
      </div>
    </section>
  );
}
