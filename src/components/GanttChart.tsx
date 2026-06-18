import { useState } from "react";
import { currency } from "@/data/projectData";
import {
  GANTT_GROUPS,
  GANTT_META,
  MONTH_SPANS,
  WEEKS,
  type GanttTask,
} from "@/data/ganttData";

function durationLabel(task: GanttTask): string {
  return task.durationDays != null ? `${task.durationDays} days` : "—";
}

export function GanttChart() {
  const [active, setActive] = useState<string | null>(null);
  const colCount = WEEKS.length;

  return (
    <div className="rounded-xl border bg-card shadow-sm print-section">
      {/* Header band */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Project Gantt Chart</h3>
          <p className="text-xs text-muted-foreground">
            {GANTT_META.startDate} → Substantial Completion {GANTT_META.substantialCompletion} · {GANTT_META.contact}
          </p>
        </div>
        <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning">
          {GANTT_META.status}
        </span>
      </div>

      {/* Scrollable timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          {/* Month header */}
          <div className="flex border-b bg-muted/40">
            <div className="sticky left-0 z-20 w-64 shrink-0 border-r bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trade
            </div>
            <div
              className="grid flex-1"
              style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
            >
              {MONTH_SPANS.map((m, i) => (
                <div
                  key={`${m.month}-${i}`}
                  className="border-l px-2 py-2 text-center text-xs font-semibold text-secondary-foreground"
                  style={{ gridColumn: `span ${m.span}` }}
                >
                  {m.month}
                </div>
              ))}
            </div>
          </div>

          {/* Week header */}
          <div className="flex border-b bg-muted/20">
            <div className="sticky left-0 z-20 w-64 shrink-0 border-r bg-muted/20 px-4 py-1.5 text-[11px] font-medium text-muted-foreground">
              Duration
            </div>
            <div
              className="grid flex-1"
              style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
            >
              {WEEKS.map((w) => (
                <div
                  key={w.index}
                  className="border-l px-1 py-1.5 text-center text-[10px] tabular-nums text-muted-foreground"
                >
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {GANTT_GROUPS.map((group) => (
            <div key={group.division}>
              {/* Division header row */}
              <div className="flex items-stretch border-b bg-accent/40">
                <div className="sticky left-0 z-10 w-64 shrink-0 border-r bg-accent/60 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                  {group.division}
                </div>
                <div className="flex-1" />
              </div>

              {group.tasks.map((task, idx) => {
                const key = `${task.code}-${task.name}-${idx}`;
                const isActive = active === key;
                const span = task.endWeek - task.startWeek + 1;
                return (
                  <div
                    key={key}
                    className="flex items-stretch border-b last:border-b-0 hover:bg-muted/30"
                    onMouseEnter={() => setActive(key)}
                    onMouseLeave={() => setActive((a) => (a === key ? null : a))}
                  >
                    <div className="sticky left-0 z-10 flex w-64 shrink-0 items-center gap-2 border-r bg-card px-4 py-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{task.code}</span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium" title={task.name}>
                        {task.name}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {durationLabel(task)}
                      </span>
                    </div>

                    <div
                      className="relative grid min-h-9 flex-1"
                      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
                    >
                      {WEEKS.map((w) => (
                        <div key={w.index} className="border-l" />
                      ))}
                      <div
                        className={`pointer-events-none absolute top-1/2 h-5 -translate-y-1/2 rounded-md shadow-sm transition-all ${
                          isActive ? "ring-2 ring-primary/60" : ""
                        }`}
                        style={{
                          left: `${(task.startWeek / colCount) * 100}%`,
                          width: `${(span / colCount) * 100}%`,
                          background: "var(--gradient-brand)",
                        }}
                        title={`${task.name} · ${durationLabel(task)}`}
                      />
                    </div>

                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-6 rounded"
            style={{ background: "var(--gradient-brand)" }}
          />
          <span>Scheduled trade activity</span>
        </div>
        <span className="tabular-nums">
          Total contract value: <span className="font-semibold text-foreground">{currency(GANTT_META.total)}</span>
        </span>
      </div>
    </div>
  );
}
