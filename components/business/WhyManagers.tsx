"use client";

import { useEffect, useRef, useState } from "react";

// Value-props grid — cursor-following spotlight per card, hover lift + icon
// motion, and a staggered scroll-reveal. Self-contained data.

const VALUE_PROPS = [
  { title: "Measurable, not 'they watched a video'", desc: "Every employee is assessed, graded on real code, and tracked. You see who's progressing and who's stalled — proof you can take to leadership.", accent: "#0056CE", icon: "M18 20V10M12 20V4M6 20v-6" },
  { title: "Personalised to each person's level", desc: "A diagnostic places every employee, then builds them a path from where they actually are — junior to senior, no one bored or lost.", accent: "#7C3AED", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4l3 2" },
  { title: "Verifiable proof of skill", desc: "Staff finish with deployed projects and AI-verified certificates — real evidence of capability, not a completion checkbox.", accent: "#10B981", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4 12 14.01l-3-3" },
  { title: "A fraction of bootcamp cost", desc: "AI tutoring + project review at scale, for every employee, at a per-seat price that makes a bootcamp look absurd.", accent: "#F59E0B", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
];

function Card({ v }: { v: typeof VALUE_PROPS[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 lg:p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 2px 12px rgba(15,28,49,0.04)" }}
    >
      {/* cursor-tracking spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 0px), ${v.accent}20, transparent 60%)` }}
      />
      {/* accent ring + shadow on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: `0 18px 44px ${v.accent}22, 0 0 0 1px ${v.accent}45 inset` }}
      />

      <div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
        style={{ background: `linear-gradient(135deg, ${v.accent}, ${v.accent}cc)`, boxShadow: `0 8px 20px ${v.accent}33` }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={v.icon} /></svg>
      </div>
      <h3 className="relative text-lg font-black text-slate-900 mb-1.5 leading-snug">{v.title}</h3>
      <p className="relative text-sm text-slate-600 leading-relaxed">{v.desc}</p>
    </div>
  );
}

export function WhyManagers() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="max-w-5xl mx-auto px-5 sm:px-6 py-14">
      <div className="text-center mb-10">
        <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">Why managers choose us</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900">Training you can actually prove.</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 items-stretch">
        {VALUE_PROPS.map((v, i) => (
          <div
            key={v.title}
            className="transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transitionDelay: `${i * 100}ms` }}
          >
            <Card v={v} />
          </div>
        ))}
      </div>
    </section>
  );
}
