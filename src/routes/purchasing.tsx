import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, DataCard } from "@/components/PageHeader";
import { DocActions } from "@/components/DocActions";
import { PURCHASING, currency } from "@/lib/project-data";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Purchasing Log | Dun Rite Construction" },
      { name: "description", content: "Cost-code budget, contracted subcontractors and contract amounts for the Dun Rite Construction project." },
    ],
  }),
  component: Purchasing,
});

function Purchasing() {
  const totalBudget = PURCHASING.reduce((a, r) => a + r.originalBudget, 0);
  const totalContract = PURCHASING.reduce((a, r) => a + r.contractAmount, 0);

  return (
    <Layout>
      <PageHeader
        title="Purchasing Log"
        description="Original budget vs. contracted amounts by cost code."
        actions={<DocActions label="Purchasing Log" />}
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Summary label="Original Budget" value={currency(totalBudget)} />
        <Summary label="Contracted" value={currency(totalContract)} />
        <Summary
          label="Variance"
          value={currency(totalBudget - totalContract)}
          tone={totalBudget - totalContract >= 0 ? "pos" : "neg"}
        />
      </div>

      <DataCard>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th>Cost Code</Th>
              <Th>Description</Th>
              <Th right>Original Budget</Th>
              <Th>Subcontractor</Th>
              <Th right>Contract Amount</Th>
              <Th>PO #</Th>
              <Th right>Variance</Th>
            </tr>
          </thead>
          <tbody>
            {PURCHASING.map((r) => (
              <tr key={r.code} className="border-b last:border-0 hover:bg-muted/40">
                <Td className="font-mono text-xs font-medium">{r.code}</Td>
                <Td>{r.desc}</Td>
                <Td right className="tabular-nums">{currency(r.originalBudget)}</Td>
                <Td className="text-muted-foreground">{r.subcontractor}</Td>
                <Td right className="tabular-nums">{currency(r.contractAmount)}</Td>
                <Td className="font-mono text-xs text-muted-foreground">{r.poNumber}</Td>
                <Td right className={`tabular-nums font-medium ${r.variance >= 0 ? "text-success" : "text-destructive"}`}>
                  {currency(r.variance)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataCard>
    </Layout>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-bold tabular-nums ${
          tone === "pos" ? "text-success" : tone === "neg" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3 font-medium ${right ? "text-right" : ""}`}>{children}</th>;
}
function Td({
  children,
  right,
  className = "",
}: {
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${right ? "text-right" : ""} ${className}`}>{children}</td>;
}
