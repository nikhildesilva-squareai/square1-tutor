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
    <section className="py-24 bg-white px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink">
            Why Square 1 beats everything else
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Way */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">😩</span>
              <h3 className="text-lg font-bold text-slate-600">The Old Way</h3>
            </div>
            <ul className="space-y-3">
              {OLD_WAY.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-slate-500"
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
            className="rounded-2xl border-2 border-brand p-8 shadow-[0_4px_40px_rgb(0_86_206_/_0.15)]"
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
                  className="flex items-center gap-3 text-sm text-ink font-medium"
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
