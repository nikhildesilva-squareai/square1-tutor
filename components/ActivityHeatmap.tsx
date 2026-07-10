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

  const monthByCol = new Map(months.map((m) => [m.col, m.label]));

  return (
    <div className="w-full">
      {/* Month labels — mirror the column grid so each label sits over its column */}
      <div className="mb-1.5 flex gap-1">
        <div className="w-7 shrink-0" />
        <div className="flex flex-1 gap-[4px] min-w-0">
          {cols.map((_, ci) => (
            <div key={ci} className="flex-1 whitespace-nowrap text-[10px] text-ink-muted">
              {monthByCol.get(ci) ?? ""}
            </div>
          ))}
        </div>
      </div>

      {/* Grid — columns span the full width; cells are capped + centred so they
          stay a tidy size while the spare room becomes even spacing. */}
      <div className="flex items-stretch gap-1">
        <div className="flex w-7 shrink-0 flex-col gap-[6px]">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <span key={i} className="flex flex-1 items-center text-[10px] leading-none text-ink-muted">{d}</span>
          ))}
        </div>
        <div className="flex flex-1 gap-[6px] min-w-0">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col items-center gap-[6px]">
              {col.map((cell) => (
                <div
                  key={cell.date}
                  className={[
                    "w-full max-w-[30px] aspect-square rounded-[5px] transition-colors",
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

      {/* Legend */}
      <div className="mt-2.5 flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-ink-muted">Less</span>
        <div className="w-[11px] h-[11px] rounded-[3px] bg-surface-alt" />
        <div className="w-[11px] h-[11px] rounded-[3px] bg-brand/40" />
        <div className="w-[11px] h-[11px] rounded-[3px] bg-brand" />
        <span className="text-[10px] text-ink-muted">More</span>
      </div>
    </div>
  );
}
