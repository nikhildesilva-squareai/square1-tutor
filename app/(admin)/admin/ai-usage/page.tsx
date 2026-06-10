import { createAdminClient } from "@/lib/supabase/admin";
import { AI_ALLOCATION_USD } from "@/lib/ai/budget";

function StatCard({ label, value, sub, color = "#D97706", icon }: {
  label: string; value: string | number; sub?: string; color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12` }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-ink">{value}</p>
        <p className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">{label}</p>
        {sub && <p className="text-[10px] text-ink-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Bar({ pct, color = "#D97706" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-surface-alt overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

export default async function AdminAIUsagePage() {
  const db = createAdminClient();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Get last 6 months of keys
  const monthKeys: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const [usageRes, walletsRes, allUsageRes] = await Promise.all([
    // Current month usage per student
    db.from("api_usage").select("student_id, total_calls, input_tokens, output_tokens, estimated_cost").eq("month_key", monthKey),
    // Current month wallets
    db.from("ai_wallets").select("student_id, allocated_amount, spent_amount, swept_at, swept_amount").eq("month_key", monthKey),
    // All months usage (for trend)
    db.from("api_usage").select("month_key, total_calls, input_tokens, output_tokens, estimated_cost").in("month_key", monthKeys),
  ]);

  const usageData = usageRes.data ?? [];
  const wallets = walletsRes.data ?? [];
  const allUsage = allUsageRes.data ?? [];

  // Current month totals
  const totalCalls = usageData.reduce((sum, r) => sum + (r.total_calls ?? 0), 0);
  const totalInputTokens = usageData.reduce((sum, r) => sum + (r.input_tokens ?? 0), 0);
  const totalOutputTokens = usageData.reduce((sum, r) => sum + (r.output_tokens ?? 0), 0);
  const totalCost = usageData.reduce((sum, r) => sum + Number(r.estimated_cost ?? 0), 0);
  const activeStudents = usageData.length;
  const avgCostPerStudent = activeStudents > 0 ? totalCost / activeStudents : 0;

  // Wallet stats
  const totalAllocated = wallets.reduce((sum, w) => sum + Number(w.allocated_amount ?? 0), 0);
  const totalSpent = wallets.reduce((sum, w) => sum + Number(w.spent_amount ?? 0), 0);
  const utilizationPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Per-student breakdown sorted by spend
  const studentUsage = usageData
    .map(u => ({
      studentId: u.student_id,
      calls: u.total_calls ?? 0,
      cost: Number(u.estimated_cost ?? 0),
      inputTokens: u.input_tokens ?? 0,
      outputTokens: u.output_tokens ?? 0,
      budget: AI_ALLOCATION_USD,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Monthly trend
  const monthlyTrend = monthKeys.map(mk => {
    const monthUsage = allUsage.filter(u => u.month_key === mk);
    return {
      month: mk,
      label: new Date(mk + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      totalCalls: monthUsage.reduce((sum, r) => sum + (r.total_calls ?? 0), 0),
      totalCost: monthUsage.reduce((sum, r) => sum + Number(r.estimated_cost ?? 0), 0),
      students: monthUsage.length,
    };
  }).reverse();

  // Get student names
  const studentIds = studentUsage.map(s => s.studentId);
  let studentNames = new Map<string, { name: string; email: string }>();
  if (studentIds.length > 0) {
    const { data: students } = await db.from("students").select("id, name, email").in("id", studentIds);
    for (const s of students ?? []) {
      studentNames.set(s.id, { name: s.name ?? "—", email: s.email ?? "—" });
    }
  }

  return (
    <div className="min-h-full px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-ink tracking-tight">AI Usage</h1>
        <p className="text-sm text-ink-muted mt-1">
          Claude Sonnet 4.5 &middot; ${AI_ALLOCATION_USD.toFixed(2)}/student/month budget &middot;{" "}
          {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Key Metrics ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Spend"
          value={`$${totalCost.toFixed(2)}`}
          sub={`of $${totalAllocated.toFixed(2)} allocated`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M8 10h8" /><path d="M8 14h8" /></svg>}
        />
        <StatCard
          label="API Calls"
          value={totalCalls.toLocaleString()}
          sub={`${activeStudents} students`}
          color="#7C3AED"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
        />
        <StatCard
          label="Avg/Student"
          value={`$${avgCostPerStudent.toFixed(3)}`}
          sub={`Budget: $${AI_ALLOCATION_USD.toFixed(2)}`}
          color="#059669"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <StatCard
          label="Budget Used"
          value={`${Math.round(utilizationPct)}%`}
          sub={`$${(totalAllocated - totalSpent).toFixed(2)} remaining`}
          color="#0056CE"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0056CE" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>}
        />
      </div>

      {/* ── Token Breakdown ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Token Usage This Month</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-ink font-medium">Input Tokens</span>
                <span className="text-sm font-bold text-ink">{(totalInputTokens / 1000).toFixed(1)}K</span>
              </div>
              <p className="text-[10px] text-ink-muted mb-1">@ $3/M = ${(totalInputTokens * 3 / 1_000_000).toFixed(4)}</p>
              <Bar pct={totalInputTokens > 0 ? 100 : 0} color="#0056CE" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-ink font-medium">Output Tokens</span>
                <span className="text-sm font-bold text-ink">{(totalOutputTokens / 1000).toFixed(1)}K</span>
              </div>
              <p className="text-[10px] text-ink-muted mb-1">@ $15/M = ${(totalOutputTokens * 15 / 1_000_000).toFixed(4)}</p>
              <Bar pct={totalOutputTokens > 0 ? 100 : 0} color="#7C3AED" />
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-5">Monthly Trend</p>
          <div className="space-y-3">
            {monthlyTrend.map((m) => {
              const maxCost = Math.max(0.01, ...monthlyTrend.map(t => t.totalCost));
              return (
                <div key={m.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink font-medium">{m.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-ink-muted">{m.totalCalls} calls</span>
                      <span className="text-sm font-bold text-ink">${m.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                  <Bar pct={(m.totalCost / maxCost) * 100} color={m.month === monthKey ? "#D97706" : "#D9770640"} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Per-Student Breakdown ──────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Per-Student AI Spend — {new Date().toLocaleDateString("en-GB", { month: "long" })}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-soft">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Student</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">API Calls</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Input Tokens</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Output Tokens</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Cost</th>
                <th className="text-center px-5 py-3 text-[10px] font-bold text-ink-muted uppercase tracking-widest">Budget Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentUsage.map((s) => {
                const info = studentNames.get(s.studentId);
                const budgetPct = (s.cost / s.budget) * 100;
                return (
                  <tr key={s.studentId} className="hover:bg-surface-soft transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-surface-tint flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-brand">
                            {(info?.name ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{info?.name ?? "—"}</p>
                          <p className="text-[10px] text-ink-muted">{info?.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-ink">{s.calls}</td>
                    <td className="px-5 py-3 text-center text-ink-muted">{(s.inputTokens / 1000).toFixed(1)}K</td>
                    <td className="px-5 py-3 text-center text-ink-muted">{(s.outputTokens / 1000).toFixed(1)}K</td>
                    <td className="px-5 py-3 text-center font-bold text-ink">${s.cost.toFixed(4)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Bar pct={budgetPct} color={budgetPct > 80 ? "#ef4444" : budgetPct > 50 ? "#D97706" : "#059669"} />
                        </div>
                        <span className="text-[10px] font-bold text-ink-muted w-10 text-right">{budgetPct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {studentUsage.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-muted">
                    No AI usage this month yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
