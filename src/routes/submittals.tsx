import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge, OverdueBadge } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { SUBMITTALS, type Submittal, formatDate, daysOpen, isOverdue, type LogStatus } from "@/data/projectData";

export const Route = createFileRoute("/submittals")({
  head: () => ({
    meta: [
      { title: "Submittal Log | Longleaf Amenity Center" },
      { name: "description", content: "Submittal log tracking shop drawings, samples and product data with required, received dates and aging." },
    ],
  }),
  component: SubmittalLog,
});

const columns: Column<Submittal>[] = [
  { key: "num", header: "Sub #", sortValue: (r) => r.num, cell: (r) => <span className="font-mono text-xs font-medium">{r.num}</span> },
  { key: "desc", header: "Description", sortValue: (r) => r.description, cell: (r) => r.description },
  { key: "vendor", header: "Vendor", sortValue: (r) => r.vendor ?? "", cell: (r) => <span className="text-muted-foreground">{r.vendor ?? "—"}</span> },
  { key: "issue", header: "Issue Date", sortValue: (r) => r.issueDate, cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDate(r.issueDate)}</span> },
  { key: "required", header: "Date Required", sortValue: (r) => r.required, cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDate(r.required)}</span> },
  { key: "received", header: "Date Received", sortValue: (r) => r.received ?? "", cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDate(r.received)}</span> },
  { key: "days", header: "Days Open", align: "right", sortValue: (r) => daysOpen(r), cell: (r) => <span className="tabular-nums">{daysOpen(r)}</span> },
  {
    key: "status",
    header: "Status",
    sortValue: (r) => r.status,
    cell: (r) => (
      <span className="inline-flex items-center gap-1.5">
        <StatusBadge status={r.status} />
        {isOverdue(r) && <OverdueBadge />}
      </span>
    ),
  },
];

function SubmittalLog() {
  const [filter, setFilter] = useState<"all" | LogStatus>("all");
  const rows = filter === "all" ? SUBMITTALS : SUBMITTALS.filter((s) => s.status === filter);
  const open = SUBMITTALS.filter((s) => s.status === "open").length;

  return (
    <Layout>
      <PageHeader
        number={6}
        title="Submittal Log"
        description={`Shop drawings, samples & product data · ${open} open of ${SUBMITTALS.length}.`}
        actions={<SectionActions label="Submittal Log" />}
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.num}
        initialSort={{ key: "num", dir: "asc" }}
        minWidthClass="min-w-[920px]"
        emptyTitle="No submittals match this filter"
        toolbar={
          <>
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {(["all", "open", "closed"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </>
        }
      />
    </Layout>
  );
}
