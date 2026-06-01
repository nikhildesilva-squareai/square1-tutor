"use client";

const MONTHS = [
  {
    n: "Month 1",
    title: "Foundations",
    projects: ["🤖 AI Chatbot", "📄 Document Q&A"],
    weeks: ["Week 1-2: Theory", "Week 3-4: Build"],
    count: "2 projects",
    done: false,
  },
  {
    n: "Month 2",
    title: "Prompting",
    projects: ["🧪 Prompt Lab", "💻 Code Reviewer"],
    weeks: ["Week 1-2: Theory", "Week 3-4: Build"],
    count: "2 projects",
    done: false,
  },
  {
    n: "Month 3",
    title: "Building",
    projects: ["🔍 Research Agent", "🗄️ Knowledge Base"],
    weeks: ["Week 1-2: Theory", "Week 3-4: Build"],
    count: "2 projects",
    done: false,
  },
  {
    n: "Month 4",
    title: "Production",
    projects: ["🎙️ Voice AI", "📝 Content Platform"],
    weeks: ["Week 1-2: Theory", "Week 3-4: Build"],
    count: "2 projects",
    done: false,
  },
  {
    n: "Month 5",
    title: "Advanced",
    projects: ["🏭 Production SaaS", "🤖 Multi-Agent"],
    weeks: ["Week 1-2: Theory", "Week 3-4: Build"],
    count: "2 projects",
    done: false,
  },
  {
    n: "Month 6",
    title: "Portfolio Complete",
    projects: ["🎯 Interview Ready", "🚀 Job Offers"],
    weeks: ["Week 1-2: Polish", "Week 3-4: Interview prep"],
    count: "Portfolio done ✓",
    done: true,
  },
];

export function TimelineSection() {
  return (
    <section className="py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8" style={{ background: "#050B14" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Your 6-month transformation
          </h2>
          <p className="mt-3 text-slate-400 text-base sm:text-lg">
            Every week, a new lesson. Every month, a new project shipped.
          </p>
        </div>

        {/* Horizontal scroll */}
        <div
          className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#0056CE transparent" }}
        >
          {MONTHS.map((month, i) => (
            <div
              key={month.n}
              className="snap-start shrink-0 w-[260px] sm:w-[280px] rounded-2xl border border-white/10 p-6 flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                borderLeft: "3px solid #0056CE",
              }}
            >
              {/* Month + dot indicator */}
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: month.done ? "#19A65F" : "#0056CE",
                    boxShadow: `0 0 8px ${month.done ? "#19A65F" : "#0056CE"}80`,
                  }}
                />
                <span className="text-xs font-semibold text-brand-light uppercase tracking-widest">
                  {month.n}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{month.title}</h3>
              </div>

              {/* Projects */}
              <div className="space-y-1.5">
                {month.projects.map((p) => (
                  <div
                    key={p}
                    className="text-sm text-slate-300 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5"
                  >
                    {p}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="space-y-0.5">
                {month.weeks.map((w) => (
                  <p key={w} className="text-xs text-slate-500">
                    {w}
                  </p>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-white/10">
                <span
                  className={`text-xs font-semibold ${
                    month.done ? "text-emerald-400" : "text-brand-light"
                  }`}
                >
                  {month.count}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          ← Scroll to see all 6 months →
        </p>
      </div>
    </section>
  );
}
