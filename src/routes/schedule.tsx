import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { GanttChart } from "@/components/GanttChart";
import { LOG_CONFIGS } from "@/lib/logs";
import {
  MILESTONES,
  formatDate,
  getMilestoneProgress,
  getCompletedMilestones,
} from "@/data/projectData";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule Delays | Dunrite Construction Group" },
      {
        name: "description",
        content: "Milestone schedule and logged delay events impacting project completion.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ScheduleDelays />
    </RequireAuth>
  ),
});

function ScheduleDelays() {
  const progress = getMilestoneProgress();
  return (
    <Layout>
      <PageHeader
        number={7}
        title="Schedule Delays"
        description="Milestone progress and documented events impacting the construction schedule."
        actions={<SectionActions label="Schedule Delays" />}
      />

      <div className="mb-6">
        <GanttChart />
      </div>

      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm print-section">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">Milestones</h3>
          <span className="text-sm font-medium tabular-nums">
            {getCompletedMilestones()}/{MILESTONES.length} complete · {progress}%
          </span>
        </div>
        <ol className="space-y-1">
          {MILESTONES.map((m, i) => (
            <li
              key={m.name}
              className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40"
            >
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
              <span className="nowrap-date text-xs text-muted-foreground">
                Sched: {formatDate(m.scheduled)}
              </span>
              <span className="nowrap-date w-32 text-xs text-muted-foreground">
                Actual: {formatDate(m.actual)}
              </span>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ol>
      </div>

      <h3 className="mb-3 font-display text-lg font-semibold">Delay Events</h3>
      <LogManager config={LOG_CONFIGS.schedule_delays} />
    </Layout>
  );
}
