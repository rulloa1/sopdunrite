import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Variance } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import {
  CONTRACTS,
  type Contract,
  currency,
  poForCode,
  getTotalBudget,
  getTotalContracted,
  getNetVariance,
} from "@/data/projectData";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Purchasing Log | Dun Rite Construction" },
      { name: "description", content: "Cost-code budget vs. contracted amounts for Baker's Bay Golf & Ocean Club." },
    ],
  }),
  component: Purchasing,
});

const columns: Column<Contract>[] = [
  { key: "code", header: "Cost Code", sortValue: (r) => r.code, cell: (r) => <span className="font-mono text-xs font-medium">{r.code}</span> },
  { key: "desc", header: "Description", sortValue: (r) => r.description, cell: (r) => r.description },
  { key: "budget", header: "Original Budget", align: "right", sortValue: (r) => r.originalBudget, cell: (r) => <span className="tabular-nums">{currency(r.originalBudget)}</span> },
  { key: "sub", header: "Subcontractor", sortValue: (r) => r.subcontractor, cell: (r) => <span className="text-muted-foreground">{r.subcontractor}</span> },
  { key: "contract", header: "Contract Amount", align: "right", sortValue: (r) => r.contractAmount, cell: (r) => <span className="tabular-nums">{currency(r.contractAmount)}</span> },
  { key: "po", header: "PO #", sortValue: (r) => poForCode(r.code), cell: (r) => <span className="font-mono text-xs text-muted-foreground">{poForCode(r.code)}</span> },
  {
    key: "variance",
    header: "Variance",
    align: "right",
    sortValue: (r) => r.originalBudget - r.contractAmount,
    cell: (r) => {
      const v = r.originalBudget - r.contractAmount;
      return <Variance value={v}>{currency(v)}</Variance>;
    },
  },
];

function Purchasing() {
  const budget = getTotalBudget();
  const contracted = getTotalContracted();
  const net = getNetVariance();

  return (
    <Layout>
      <PageHeader
        number={2}
        title="Purchasing Log"
        description="Original budget vs. contracted amounts by cost code."
        actions={<SectionActions label="Purchasing Log" />}
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Summary label="Original Budget" value={currency(budget)} />
        <Summary label="Contracted" value={currency(contracted)} />
        <Summary label="Net Variance" value={currency(net)} tone={net < 0 ? "neg" : net > 0 ? "pos" : undefined} />
      </div>

      <DataTable
        columns={columns}
        rows={CONTRACTS}
        getRowKey={(r) => r.code}
        initialSort={{ key: "code", dir: "asc" }}
        minWidthClass="min-w-[860px]"
        emptyTitle="No cost codes"
      />
    </Layout>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold tabular-nums ${tone === "pos" ? "text-success" : tone === "neg" ? "text-destructive" : ""}`}>
        {value}
      </p>
    </div>
  );
}
