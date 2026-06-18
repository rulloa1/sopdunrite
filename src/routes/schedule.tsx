import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { GanttChart } from "@/components/GanttChart";
import {
  DELAYS,
  type DelayEvent,
  DELAY_NOTE,
  MILESTONES,
  formatDate,
  formatDateRange,
  getTotalDelayDays,
  getMilestoneProgress,
  getCompletedMilestones,
} from "@/data/projectData";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule Delays | Longleaf Amenity Center" },
      { name: "description", content: "Milestone schedule and logged delay events impacting the Longleaf Amenity Center completion." },
    ],
  }),
  component: ScheduleDelays,
});

const columns: Column<DelayEvent>[] = [
  { key: "num", header: "#", sortValue: (r) => Number(r.num), cell: (r) => <span className="font-mono text-xs font-medium">{r.num}</span> },
  { key: "desc", header: "Description of Delay", sortValue: (r) => r.description, cell: (r) => r.description },
  { key: "dates", header: "Impacted Dates", sortValue: (r) => r.start, cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDateRange(r.start, r.end)}</span> },
  { key: "days", header: "Days", align: "right", sortValue: (r) => r.days, cell: (r) => <span className="tabular-nums font-medium text-destructive">{r.days}</span> },
];

function ScheduleDelays() {
  const progress = getMilestoneProgress();
  return (
    <Layout>
      <PageHeader
        number={7}
        title="Schedule Delays"
        description="Milestone progress and documented events impacting the construction schedule."
        actions={
          <div className="flex items-center gap-3">
            <div className="rounded-xl border bg-card px-4 py-2 shadow-sm no-print">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Total Delay </span>
              <span className="font-display text-lg font-bold tabular-nums">{getTotalDelayDays()} days</span>
            </div>
            <SectionActions label="Schedule Delays" />
          </div>
        }
      />

      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm print-section">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">Milestones</h3>
          <span className="text-sm font-medium tabular-nums">
            {getCompletedMilestones()}/{MILESTONES.length} complete · {progress}%
          </span>
        </div>
        <ol className="space-y-1">
          {MILESTONES.map((m, i) => (
            <li key={m.name} className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.status === "complete"
                    ? "bg-success text-success-foreground"
                    : m.status === "in-progress"
                      ? "brand-gradient text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-40 flex-1 text-sm font-medium">{m.name}</span>
              <span className="nowrap-date text-xs text-muted-foreground">Sched: {formatDate(m.scheduled)}</span>
              <span className="nowrap-date w-32 text-xs text-muted-foreground">Actual: {formatDate(m.actual)}</span>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ol>
      </div>

      <DataTable
        columns={columns}
        rows={DELAYS}
        getRowKey={(r) => r.num}
        initialSort={{ key: "dates", dir: "asc" }}
        minWidthClass="min-w-[640px]"
        emptyTitle="No delay events"
      />
      <p className="mt-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground print-section">{DELAY_NOTE}</p>
    </Layout>
  );
}
