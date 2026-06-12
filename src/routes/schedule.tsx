import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { DocActions } from "@/components/DocActions";
import { Table, Th, Td, Tr } from "@/components/Table";
import { DELAYS } from "@/lib/project-data";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule Delays | Dun Rite Construction" },
      { name: "description", content: "Logged schedule delay events with impacted dates and day counts affecting the project completion." },
    ],
  }),
  component: ScheduleDelays,
});

function ScheduleDelays() {
  const total = DELAYS.reduce((a, d) => a + d.days, 0);
  return (
    <Layout>
      <PageHeader
        number={7}
        title="Schedule Delays"
        description="Documented events impacting the construction schedule."
        actions={
          <div className="flex items-center gap-3">
            <div className="rounded-xl border bg-card px-4 py-2 shadow-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Total Delay </span>
              <span className="font-display text-lg font-bold tabular-nums">{total} days</span>
            </div>
            <DocActions label="Schedule Delays" />
          </div>
        }
      />
      <Table
        head={
          <tr>
            <Th>#</Th>
            <Th>Description of Delay</Th>
            <Th>Impacted Dates</Th>
            <Th right>Days</Th>
          </tr>
        }
      >
        {DELAYS.map((d) => (
          <Tr key={d.num}>
            <Td className="font-mono text-xs font-medium">{d.num}</Td>
            <Td>{d.description}</Td>
            <Td className="text-muted-foreground">{d.impactedDates}</Td>
            <Td right className="tabular-nums font-medium text-destructive">{d.days}</Td>
          </Tr>
        ))}
      </Table>
    </Layout>
  );
}
