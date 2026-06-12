"use client";

interface ActivityHeatmapProps {
  activeDates: string[];
  weeks?: number;
}

export function ActivityHeatmap({ activeDates, weeks = 13 }: ActivityHeatmapProps) {
  const dateSet = new Set(activeDates.map((d) => new Date(d).toISOString().slice(0, 10)));
  const today = new Date();
  const totalDays = weeks * 7;

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  const cells: { date: string; level: number; isToday: boolean; isFuture: boolean }[] = [];
  const todayStr = today.toISOString().slice(0, 10);

  for (let i = 0; i < (weeks + 1) * 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const isFuture = d > today;
    cells.push({
      date: ds,
      level: dateSet.has(ds) ? 1 : 0,
      isToday: ds === todayStr,
      isFuture,
    });
  }

  const cols: { date: string; level: number; isToday: boolean; isFuture: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    cols.push(cells.slice(i, i + 7));
  }

  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;
  cols.forEach((col, ci) => {
    const m = new Date(col[0].date).getMonth();
    if (m !== lastMonth) {
      months.push({ label: new Date(col[0].date).toLocaleDateString("en", { month: "short" }), col: ci });
      lastMonth = m;
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-0">
        <div className="flex gap-[3px] pl-7">
          {months.map((m, i) => {
            const nextCol = months[i + 1]?.col ?? cols.length;
            const span = nextCol - m.col;
            return (
              <span key={m.label + m.col} className="text-[9px] text-ink-muted" style={{ width: span * 13 - 3 }}>
                {m.label}
              </span>
            );
          })}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-[3px] pr-1.5 pt-[1px]">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <span key={i} className="text-[9px] text-ink-muted h-[10px] leading-[10px]">{d}</span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    className={[
                      "w-[10px] h-[10px] rounded-[2px] transition-colors",
                      cell.isFuture ? "bg-transparent" :
                      cell.isToday && cell.level === 0 ? "bg-brand/20 ring-1 ring-brand/40" :
                      cell.level > 0 ? "bg-brand" : "bg-surface-alt",
                    ].join(" ")}
                    title={`${cell.date}${cell.level > 0 ? " — active" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 justify-end mt-1 pr-1">
          <span className="text-[9px] text-ink-muted">Less</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-surface-alt" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-brand/40" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-brand" />
          <span className="text-[9px] text-ink-muted">More</span>
        </div>
      </div>
    </div>
  );
}
