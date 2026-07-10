// Presentational mock of the manager portal — the hero product visual on
// /business. Sample data (clearly illustrative), styled to match the real
// /business/dashboard so buyers see exactly what they get.

const ROLLUPS = [
  { label: "Active this week", value: "9" },
  { label: "Lessons done", value: "142" },
  { label: "Avg score", value: "86" },
];

const ROSTER = [
  { initials: "AR", name: "Alex Rivera", track: "Cybersecurity", pct: 78, accent: "#0056CE" },
  { initials: "JL", name: "Jordan Lee", track: "Data Science", pct: 91, accent: "#10B981" },
  { initials: "SK", name: "Sam Khan", track: "Generative AI", pct: 64, accent: "#0EA5E9" },
  { initials: "MP", name: "Morgan Patel", track: "Full Stack", pct: 45, accent: "#F59E0B" },
];

export function TeamDashboardPreview() {
  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-60"
        style={{ background: "radial-gradient(60% 60% at 70% 30%, rgba(0,86,206,0.22), transparent 70%), radial-gradient(50% 50% at 20% 80%, rgba(14,165,233,0.18), transparent 70%)", filter: "blur(24px)" }}
      />

      {/* The card */}
      <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden"
        style={{ boxShadow: "0 30px 70px -20px rgba(15,28,49,0.35), 0 0 0 1px rgba(15,28,49,0.04)" }}>
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Manager portal</span>
        </div>

        <div className="p-4 sm:p-5">
          {/* Org header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-black text-slate-900 leading-tight">
                Acme Inc
                <span className="ml-1.5 align-middle rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Example</span>
              </p>
              <p className="text-[11px] text-slate-400">8 of 12 seats active</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On track
            </span>
          </div>

          {/* Rollups */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ROLLUPS.map((r) => (
              <div key={r.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                <p className="text-lg font-black text-slate-900 tabular-nums leading-none">{r.value}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide mt-1 leading-tight">{r.label}</p>
              </div>
            ))}
          </div>

          {/* Seat meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Seat usage</span>
              <span className="text-[10px] text-slate-400">8 active · 4 invited</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full" style={{ width: "67%", background: "#0056CE" }} />
              <div className="h-full" style={{ width: "33%", background: "rgba(0,86,206,0.3)" }} />
            </div>
          </div>

          {/* Roster */}
          <div className="space-y-2">
            {ROSTER.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                  style={{ background: m.accent }}>{m.initials}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                    <span className="text-[10px] tabular-nums font-semibold text-slate-500">{m.pct}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 truncate w-24">{m.track}</span>
                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.accent }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating "verifiable certificate" chip */}
      <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2"
        style={{ boxShadow: "0 16px 40px -12px rgba(15,28,49,0.3)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
        <span className="text-[11px] font-bold text-slate-800">Certificates verified</span>
      </div>
    </div>
  );
}
