"use client";
import { useEffect, useRef, useState } from "react";

const STORIES = [
  {
    initials: "P",
    avatarBg: "bg-violet-500",
    name: "Priya S., 27",
    before: "Accountant with zero coding experience",
    after: "AI Engineer at a Series B startup",
    quote:
      "6 months ago I couldn't write a Python function. I just deployed my 10th project and got 3 interview calls in one week. The AI grading was the difference — I knew exactly what to fix.",
    tag: "6-month plan · Generative AI",
  },
  {
    initials: "J",
    avatarBg: "bg-blue-500",
    name: "James O., 19",
    before: "CS student, lots of theory, zero shipped code",
    after: "Launched his own AI startup in month 4",
    quote:
      "University taught me theory. Square 1 taught me to build. By month 3 I had 6 real projects. By month 4 I had my first paying customer.",
    tag: "9-month plan · Full Stack + Gen AI",
  },
  {
    initials: "M",
    avatarBg: "bg-emerald-500",
    name: "Marcus T., 34",
    before: "DevOps engineer wanting to move into AI",
    after: "Senior AI Engineer, 40% salary increase",
    quote:
      "I'd tried Udemy, Coursera, YouTube. Nothing stuck because there was no feedback. Square 1 AI grades your actual code. That changes everything.",
    tag: "3-month plan · Machine Learning",
  },
];

export function TransformationStories() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
            Real learners. Real transformations.
          </h2>
          <p className="mt-3 text-ink-muted text-lg">
            They didn&apos;t watch tutorials. They built things.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <div
              key={s.name}
              className="rounded-2xl border border-border bg-surface-soft p-5 sm:p-6 flex flex-col gap-4 shadow-card hover:shadow-card-hover transition-shadow"
              style={
                visible
                  ? { animation: `fadeInUp 0.5s ease-out ${i * 0.12}s both` }
                  : { opacity: 0 }
              }
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${s.avatarBg} flex items-center justify-center text-xl font-bold text-white shrink-0`}
                >
                  {s.initials}
                </div>
                <div>
                  <p className="font-bold text-ink">{s.name}</p>
                  <div className="flex text-yellow-400 text-sm mt-0.5">★★★★★</div>
                </div>
              </div>

              {/* Before / After */}
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 shrink-0 mt-0.5">Before:</span>
                  <span className="text-ink-secondary">{s.before}</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-brand shrink-0 mt-0.5 font-semibold">After:</span>
                  <span className="text-ink font-medium">{s.after}</span>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-ink-secondary leading-relaxed border-l-2 border-brand/30 pl-3 italic flex-1">
                &ldquo;{s.quote}&rdquo;
              </blockquote>

              {/* Tag */}
              <span className="self-start text-[11px] font-semibold text-brand bg-surface-tint px-3 py-1 rounded-full border border-brand/20">
                {s.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
