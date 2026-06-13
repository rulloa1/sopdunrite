import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge, OverdueBadge, Variance } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { RFIS, type Rfi, currency, formatDate, daysOpen, isOverdue, type LogStatus } from "@/data/projectData";

export const Route = createFileRoute("/rfis")({
  head: () => ({
    meta: [
      { title: "RFI Log | Dun Rite Construction" },
      { name: "description", content: "Requests for information log — issue dates, required dates, cost impact, days open and status." },
    ],
  }),
  component: RFILog,
});

const columns: Column<Rfi>[] = [
  { key: "num", header: "RFI #", sortValue: (r) => r.num, cell: (r) => <span className="font-mono text-xs font-medium">{r.num}</span> },
  { key: "desc", header: "Description", sortValue: (r) => r.description, cell: (r) => r.description },
  { key: "issue", header: "Issue Date", sortValue: (r) => r.issueDate, cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDate(r.issueDate)}</span> },
  { key: "required", header: "Date Required", sortValue: (r) => r.required, cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDate(r.required)}</span> },
  { key: "received", header: "Date Received", sortValue: (r) => r.received ?? "", cell: (r) => <span className="nowrap-date text-muted-foreground">{formatDate(r.received)}</span> },
  { key: "days", header: "Days Open", align: "right", sortValue: (r) => daysOpen(r), cell: (r) => <span className="tabular-nums">{daysOpen(r)}</span> },
  { key: "cost", header: "Cost Impact", align: "right", sortValue: (r) => r.costImpact, cell: (r) => (r.costImpact ? <Variance value={-r.costImpact}>{currency(r.costImpact)}</Variance> : <span className="text-muted-foreground">—</span>) },
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

function RFILog() {
  const [filter, setFilter] = useState<"all" | LogStatus>("all");
  const rows = filter === "all" ? RFIS : RFIS.filter((r) => r.status === filter);
  const open = RFIS.filter((r) => r.status === "open").length;

  return (
    <Layout>
      <PageHeader
        number={5}
        title="RFI Log"
        description={`Requests for information · ${open} open of ${RFIS.length}.`}
        actions={<SectionActions label="RFI Log" />}
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.num}
        initialSort={{ key: "num", dir: "asc" }}
        minWidthClass="min-w-[900px]"
        emptyTitle="No RFIs match this filter"
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
