import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule | Dunrite Construction Group" },
      {
        name: "description",
        content: "Milestone schedule and logged delay events impacting project completion.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Schedule />
    </RequireAuth>
  ),
});

function Schedule() {
  return (
    <Layout>
      <PageHeader
        number={7}
        title="Schedule"
        description="Project milestones and documented events impacting the construction schedule."
        actions={<SectionActions label="Schedule" />}
      />

      <h3 className="mb-3 font-display text-lg font-semibold">Milestones</h3>
      <LogManager config={LOG_CONFIGS.project_milestones} />

      <h3 className="mb-3 mt-8 font-display text-lg font-semibold">Delay Events</h3>
      <LogManager config={LOG_CONFIGS.schedule_delays} />
    </Layout>
  );
}
