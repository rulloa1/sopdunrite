import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Table, Th, Td, Tr } from "@/components/Table";
import { PURCHASE_ORDERS, currency } from "@/lib/project-data";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({
    meta: [
      { title: "PO Log | Dun Rite Construction" },
      { name: "description", content: "Purchase order log tracking PO number, vendor, description, issue date and amount." },
    ],
  }),
  component: POLog,
});

function POLog() {
  const total = PURCHASE_ORDERS.reduce((a, r) => a + r.amount, 0);
  return (
    <Layout>
      <PageHeader
        title="Purchase Order Log"
        description="Issued purchase orders by vendor and cost code."
        actions={
          <div className="rounded-xl border bg-card px-4 py-2 shadow-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Total Issued </span>
            <span className="font-display text-lg font-bold tabular-nums">{currency(total)}</span>
          </div>
        }
      />
      <Table
        head={
          <tr>
            <Th>PO #</Th>
            <Th>Cost Code</Th>
            <Th>Subcontractor / Vendor</Th>
            <Th>Description</Th>
            <Th>Issue Date</Th>
            <Th right>Amount</Th>
          </tr>
        }
      >
        {PURCHASE_ORDERS.map((r) => (
          <Tr key={r.po}>
            <Td className="font-mono text-xs font-medium">{r.po}</Td>
            <Td className="font-mono text-xs text-muted-foreground">{r.code}</Td>
            <Td>{r.vendor}</Td>
            <Td className="text-muted-foreground">{r.description}</Td>
            <Td>{r.issueDate}</Td>
            <Td right className="tabular-nums font-medium">{currency(r.amount)}</Td>
          </Tr>
        ))}
      </Table>
    </Layout>
  );
}
