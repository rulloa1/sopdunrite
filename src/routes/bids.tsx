import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Variance } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { BIDS, type Bid, currency } from "@/data/projectData";

export const Route = createFileRoute("/bids")({
  head: () => ({
    meta: [
      { title: "Bid Log | 12412 Curley St, San Antonio, FL 33576" },
      { name: "description", content: "Competitive bid tracking by cost code — bids received, low qualified bid, award and budget variance." },
    ],
  }),
  component: Bids,
});

const fmtOthers = (b: Bid) =>
  b.bids
    .filter((x) => x.status !== "awarded")
    .map((x) => currency(x.amount))
    .join(" · ") || "—";

const columns: Column<Bid>[] = [
  { key: "code", header: "Cost Code", sortValue: (r) => r.code, cell: (r) => <span className="font-mono text-xs font-medium">{r.code}</span> },
  {
    key: "desc",
    header: "Description",
    sortValue: (r) => r.description,
    cell: (r) => (
      <span>
        {r.description}
        {r.footnote && <sup className="ml-0.5 font-bold text-destructive">*</sup>}
      </span>
    ),
  },
  { key: "count", header: "Bids", align: "right", sortValue: (r) => r.bids.length, cell: (r) => r.bids.length },
  { key: "low", header: "Low Qualified Bid", align: "right", sortValue: (r) => r.awardedAmount, cell: (r) => <span className="tabular-nums font-medium">{currency(r.awardedAmount)}</span> },
  { key: "others", header: "Other Bids", align: "right", sortable: false, cell: (r) => <span className="tabular-nums text-xs text-muted-foreground">{fmtOthers(r)}</span> },
  { key: "awarded", header: "Awarded To", sortValue: (r) => r.awardedVendor, cell: (r) => r.awardedVendor },
  { key: "budget", header: "Budget", align: "right", sortValue: (r) => r.budget, cell: (r) => <span className="tabular-nums">{currency(r.budget)}</span> },
  {
    key: "variance",
    header: "Variance",
    align: "right",
    sortValue: (r) => r.budget - r.awardedAmount,
    cell: (r) => {
      const v = r.budget - r.awardedAmount;
      return <Variance value={v}>{currency(v)}</Variance>;
    },
  },
];

function Bids() {
  const notes = BIDS.filter((b) => b.footnote);
  return (
    <Layout>
      <PageHeader
        number={3}
        title="Bid Log"
        description="Competitive bids by cost code with awarded subcontractor and budget variance."
        actions={<SectionActions label="Bid Log" />}
      />
      <DataTable
        columns={columns}
        rows={BIDS}
        getRowKey={(r) => r.code}
        initialSort={{ key: "code", dir: "asc" }}
        minWidthClass="min-w-[920px]"
        emptyTitle="No bids recorded"
      />
      {notes.length > 0 && (
        <div className="mt-4 rounded-xl border bg-card p-4 text-xs text-muted-foreground print-section">
          <p className="mb-1 font-semibold text-foreground">Footnotes</p>
          <ul className="space-y-1">
            {notes.map((n) => (
              <li key={n.code}>
                <span className="font-bold text-destructive">*</span> {n.code} — {n.footnote}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  );
}
