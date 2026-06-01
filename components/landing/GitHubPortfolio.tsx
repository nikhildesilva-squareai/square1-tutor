"use client";

const REPOS = [
  { name: "ai-chatbot-v2",       lang: "Python",     stars: 47, bars: 7, updated: "2d ago"  },
  { name: "rag-knowledge-base",  lang: "Python",     stars: 31, bars: 5, updated: "1w ago"  },
  { name: "research-agent",      lang: "Python",     stars: 28, bars: 6, updated: "1w ago"  },
  { name: "production-saas",     lang: "TypeScript", stars: 62, bars: 8, updated: "3d ago"  },
  { name: "multi-agent-system",  lang: "Python",     stars: 44, bars: 6, updated: "5d ago"  },
  { name: "voice-ai-assistant",  lang: "TypeScript", stars: 39, bars: 7, updated: "4d ago"  },
];

const LANG_COLORS: Record<string, string> = {
  Python: "#3776AB",
  TypeScript: "#3178C6",
};

// 52 weeks of fake contribution data (0-4 scale)
function generateContributions(): number[][] {
  const weeks: number[][] = [];
  for (let w = 0; w < 52; w++) {
    const days: number[] = [];
    for (let d = 0; d < 7; d++) {
      const rand = Math.random();
      days.push(rand < 0.35 ? 0 : rand < 0.55 ? 1 : rand < 0.75 ? 2 : rand < 0.9 ? 3 : 4);
    }
    weeks.push(days);
  }
  return weeks;
}

const contributions = generateContributions();

const OPACITY = ["opacity-5", "opacity-20", "opacity-50", "opacity-75", "opacity-100"];

export function GitHubPortfolio() {
  return (
    <section className="py-14 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
            Graduate with proof, not just a certificate
          </h2>
          <p className="mt-3 text-ink-muted text-lg">
            Employers see working code. 12 real repos. All deployable.
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full max-w-2xl mx-auto sm:max-w-full"
          style={{ background: "#0D1117" }}
        >
          {/* GitHub-style header */}
          <div
            className="px-6 py-4 border-b border-white/10 flex items-center gap-3"
            style={{ background: "#161B22" }}
          >
            {/* GitHub-style SVG logo */}
            <svg width="24" height="24" viewBox="0 0 98 96" fill="#e6edf3">
              <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-white">priya-learns</p>
              <p className="text-xs text-slate-400">12 repositories</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Contribution graph — hidden on mobile, shown sm+ */}
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400 mb-3">Contribution activity — last 12 months</p>
              <div className="flex gap-0.5 overflow-x-auto">
                {contributions.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        className={`w-2.5 h-2.5 rounded-sm bg-green-500 ${OPACITY[day]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Repo list */}
            <div className="space-y-3">
              {REPOS.map((repo, idx) => (
                <div
                  key={repo.name}
                  className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${idx >= 4 ? "hidden sm:flex" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">📁</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                        {repo.name}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: LANG_COLORS[repo.lang] ?? "#ccc" }}
                          />
                          {repo.lang}
                        </span>
                        <span className="text-xs text-slate-500">Updated {repo.updated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {/* Commit bar */}
                    <div className="hidden sm:flex gap-0.5 items-end">
                      {Array.from({ length: repo.bars }, (_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-green-500"
                          style={{
                            height: `${8 + Math.random() * 12}px`,
                            opacity: 0.5 + (i / repo.bars) * 0.5,
                          }}
                        />
                      ))}
                    </div>
                    {/* Stars */}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {repo.stars}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs text-slate-500 text-center">
              Every repo was built during the course. Every line of code is verifiable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
