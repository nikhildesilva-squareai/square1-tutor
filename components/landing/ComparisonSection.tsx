"use client";
import { useEffect, useRef, useState } from "react";

const OLD_WAY = [
  "Watch 40-hour YouTube courses",
  "Build a to-do app for the 5th time",
  "Zero feedback on your code",
  "Certificate nobody believes",
  "Guess what to learn next",
  "Study alone, no direction",
];

const NEW_WAY = [
  "45-min focused daily sessions",
  "12 deployable, real-world projects",
  "AI grades every line you write",
  "GitHub portfolio employers verify",
  "Personalised plan from day 1",
  "AI tutor available 24/7",
];

export function ComparisonSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8"
      style={{
        background: `
          radial-gradient(ellipse 900px 500px at 15% 25%, rgba(0,86,206,0.10), transparent 60%),
          radial-gradient(ellipse 700px 500px at 85% 75%, rgba(167,139,250,0.10), transparent 60%),
          radial-gradient(ellipse 800px 600px at 50% 50%, rgba(16,185,129,0.06), transparent 60%),
          linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 50%, #F4F8FF 100%)
        `,
      }}
    >
      {/* Decorative drifting blobs for depth */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.18) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full opacity-30 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Why Square 1
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Square 1 beats{" "}
            <span style={{
              background: "linear-gradient(135deg, #0056CE 0%, #4F46E5 50%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              everything else.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Way */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">😩</span>
              <h3 className="text-lg font-bold text-slate-600">The Old Way</h3>
            </div>
            <ul className="space-y-3">
              {OLD_WAY.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm sm:text-base text-slate-500"
                  style={
                    visible
                      ? { animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }
                      : { opacity: 0 }
                  }
                >
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 text-xs flex items-center justify-center font-bold shrink-0">
                    ✗
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Square 1 */}
          <div
            className="rounded-2xl border-2 border-brand p-5 sm:p-8 shadow-[0_4px_40px_rgb(0_86_206_/_0.15)]"
            style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0F4FF 100%)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🚀</span>
              <h3 className="text-lg font-bold text-brand">Square 1 AI</h3>
            </div>
            <ul className="space-y-3">
              {NEW_WAY.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm sm:text-base text-ink font-medium"
                  style={
                    visible
                      ? { animation: `fadeInUp 0.4s ease-out ${i * 0.08 + 0.1}s both` }
                      : { opacity: 0 }
                  }
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold shrink-0">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
