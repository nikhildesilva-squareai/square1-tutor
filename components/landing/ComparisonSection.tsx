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
      className="relative overflow-hidden py-32 sm:py-40 lg:py-48 px-4 sm:px-6 lg:px-8"
      style={{
        /* Multi-stop gradient with smooth fade-in at top + fade-out at bottom */
        background: `
          linear-gradient(180deg,
            #F4F8FF 0%,
            #94A8C8 5%,
            #3E5070 10%,
            #15243C 15%,
            #050B14 22%,
            #0B1626 50%,
            #050B14 78%,
            #15243C 85%,
            #3E5070 90%,
            #94A8C8 95%,
            #F8FAFC 100%
          )
        `,
      }}
    >
      {/* Subtle radial accents within the dark zone */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-40 animate-blob-1"
        style={{ background: "radial-gradient(circle, rgba(0,86,206,0.15) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 w-[600px] h-[500px] rounded-full opacity-30 animate-blob-2"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(90px)" }} />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-slate-500 font-bold">
            Why Square 1
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Square 1 beats{" "}
            <span style={{
              background: "linear-gradient(135deg, #3388FF 0%, #A78BFA 50%, #10B981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              everything else.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
            Stop wasting time on tutorials that don&apos;t lead anywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Way */}
          <div
            className="rounded-2xl p-5 sm:p-8 border"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
              borderColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">😩</span>
              <h3 className="text-lg font-bold text-slate-400">The Old Way</h3>
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
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}>
                    ✗
                  </span>
                  <span className="line-through decoration-slate-700 decoration-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Square 1 */}
          <div
            className="relative rounded-2xl p-5 sm:p-8 border-2"
            style={{
              background: "linear-gradient(135deg, rgba(0,86,206,0.18) 0%, rgba(99,102,241,0.10) 100%)",
              borderColor: "rgba(51,136,255,0.50)",
              boxShadow: "0 8px 40px rgba(0,86,206,0.30), 0 0 60px rgba(99,102,241,0.20), 0 0 0 1px rgba(255,255,255,0.05) inset",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Decorative top-right glow blob */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-50"
              style={{ background: "radial-gradient(circle, rgba(51,136,255,0.35) 0%, transparent 70%)", filter: "blur(16px)" }} />

            <div className="relative flex items-center gap-3 mb-6">
              <span className="text-2xl">🚀</span>
              <h3 className="text-lg font-black text-white">Square 1 AI</h3>
              <span className="ml-auto text-[9px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.20)", color: "#34D399" }}>
                Your path
              </span>
            </div>
            <ul className="relative space-y-3">
              {NEW_WAY.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm sm:text-base text-white font-medium"
                  style={
                    visible
                      ? { animation: `fadeInUp 0.4s ease-out ${i * 0.08 + 0.1}s both` }
                      : { opacity: 0 }
                  }
                >
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold shrink-0"
                    style={{ background: "rgba(16,185,129,0.20)", color: "#34D399" }}>
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
