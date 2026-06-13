import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { PROCUREMENT, poForCode, type ProcurementItem, type ProcStatus } from "@/data/projectData";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement Buyout Log | Dun Rite Construction" },
      { name: "description", content: "Procurement buyout tracking — committed and purchased status, vendors, POs and expected delivery." },
    ],
  }),
  component: Procurement,
});

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-success">
      <Check className="h-4 w-4" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <X className="h-4 w-4" /> No
    </span>
  );
}

const columns: Column<ProcurementItem>[] = [
  { key: "item", header: "Item", sortValue: (r) => r.item, cell: (r) => <span className="font-medium">{r.item}</span> },
  { key: "committed", header: "Committed", align: "center", sortValue: (r) => (r.committed ? 1 : 0), cell: (r) => <YesNo value={r.committed} /> },
  { key: "purchased", header: "Purchased", align: "center", sortValue: (r) => (r.purchased ? 1 : 0), cell: (r) => <YesNo value={r.purchased} /> },
  { key: "vendor", header: "Vendor", sortValue: (r) => r.vendor, cell: (r) => <span className="text-muted-foreground">{r.vendor}</span> },
  {
    key: "po",
    header: "PO #(s)",
    sortValue: (r) => r.costCodes.map(poForCode).join(", "),
    cell: (r) => (
      <span className="font-mono text-xs text-muted-foreground">
        {r.costCodes.length ? r.costCodes.map(poForCode).join(", ") : "—"}
      </span>
    ),
  },
  { key: "delivery", header: "Expected Delivery", sortValue: (r) => r.expectedDelivery, cell: (r) => <span className="nowrap-date text-muted-foreground">{r.expectedDelivery}</span> },
  { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
];

function Procurement() {
  const [filter, setFilter] = useState<"all" | ProcStatus>("all");
  const rows = filter === "all" ? PROCUREMENT : PROCUREMENT.filter((p) => p.status === filter);
  const purchased = PROCUREMENT.filter((p) => p.purchased).length;

  return (
    <Layout>
      <PageHeader
        number={8}
        title="Procurement Buyout Log"
        description={`Long-lead items, commitment status & expected delivery · ${purchased} of ${PROCUREMENT.length} purchased.`}
        actions={<SectionActions label="Procurement Buyout Log" />}
      />
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.item}
        initialSort={{ key: "item", dir: "asc" }}
        minWidthClass="min-w-[900px]"
        emptyTitle="No procurement items match this filter"
        toolbar={
          <>
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {(["all", "complete", "in-progress", "not-started"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
                {f === "all" ? "All" : f.replace("-", " ")}
              </Button>
            ))}
          </>
        }
      />
    </Layout>
  );
}
