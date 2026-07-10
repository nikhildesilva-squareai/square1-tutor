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
    // Cap the width so cells stay a tidy ~26px on wide screens instead of
    // stretching into huge squares; still fills narrower cards.
    <div className="w-full max-w-[480px]">
      {/* Month labels — mirror the column grid so each label sits over its column */}
      <div className="mb-1.5 flex gap-1">
        <div className="w-6 shrink-0" />
        <div className="flex flex-1 gap-[4px] min-w-0">
          {cols.map((_, ci) => (
            <div key={ci} className="flex-1 whitespace-nowrap text-[10px] text-ink-muted">
              {monthByCol.get(ci) ?? ""}
            </div>
          ))}
        </div>
      </div>

      {/* Grid — dense square cells that fill the (capped) width symmetrically */}
      <div className="flex items-stretch gap-1">
        <div className="flex w-6 shrink-0 flex-col gap-[4px]">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <span key={i} className="flex flex-1 items-center text-[9px] leading-none text-ink-muted">{d}</span>
          ))}
        </div>
        <div className="flex flex-1 gap-[4px] min-w-0">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-[4px]">
              {col.map((cell) => (
                <div
                  key={cell.date}
                  className={[
                    "w-full aspect-square rounded-[3px] transition-colors",
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
        <div className="w-[10px] h-[10px] rounded-[2px] bg-surface-alt" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand/40" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-brand" />
        <span className="text-[10px] text-ink-muted">More</span>
      </div>
    </div>
  );
}
