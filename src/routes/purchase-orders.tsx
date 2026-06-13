import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { PURCHASE_ORDERS, type PurchaseOrder, currency, formatDate, getTotalPOIssued } from "@/data/projectData";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({
    meta: [
      { title: "PO Log | 12412 Curley St, San Antonio, FL 33576" },
      { name: "description", content: "Purchase order log tracking PO number, vendor, description, issue date and amount." },
    ],
  }),
  component: POLog,
});

const columns: Column<PurchaseOrder>[] = [
  { key: "po", header: "PO #", sortValue: (r) => r.po, cell: (r) => <span className="font-mono text-xs font-medium">{r.po}</span> },
  { key: "code", header: "Cost Code", sortValue: (r) => r.code, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.code}</span> },
  { key: "vendor", header: "Subcontractor / Vendor", sortValue: (r) => r.vendor, cell: (r) => r.vendor },
  { key: "desc", header: "Description", sortValue: (r) => r.description, cell: (r) => <span className="text-muted-foreground">{r.description}</span> },
  { key: "date", header: "Issue Date", sortValue: (r) => r.issueDate, cell: (r) => <span className="nowrap-date">{formatDate(r.issueDate)}</span> },
  { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, cell: (r) => <span className="tabular-nums font-medium">{currency(r.amount)}</span> },
];

function POLog() {
  return (
    <Layout>
      <PageHeader
        number={4}
        title="Purchase Order Log"
        description="Issued purchase orders by vendor and cost code, in issue-date order."
        actions={
          <div className="flex items-center gap-3">
            <div className="rounded-xl border bg-card px-4 py-2 shadow-sm no-print">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Total Issued </span>
              <span className="font-display text-lg font-bold tabular-nums">{currency(getTotalPOIssued())}</span>
            </div>
            <SectionActions label="Purchase Order Log" />
          </div>
        }
      />
      <DataTable
        columns={columns}
        rows={PURCHASE_ORDERS}
        getRowKey={(r) => r.po}
        initialSort={{ key: "po", dir: "asc" }}
        minWidthClass="min-w-[820px]"
        emptyTitle="No purchase orders"
      />
    </Layout>
  );
}
