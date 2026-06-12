import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { Table, Th, Td, Tr } from "@/components/Table";
import { PROCUREMENT } from "@/lib/project-data";

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

function Procurement() {
  return (
    <Layout>
      <PageHeader
        title="Procurement Buyout Log"
        description="Long-lead items, commitment status and expected delivery."
      />
      <Table
        head={
          <tr>
            <Th>Item</Th>
            <Th>Committed</Th>
            <Th>Purchased</Th>
            <Th>Vendor</Th>
            <Th>PO #</Th>
            <Th>Expected Delivery</Th>
            <Th>Status</Th>
          </tr>
        }
      >
        {PROCUREMENT.map((p) => (
          <Tr key={p.item}>
            <Td className="font-medium">{p.item}</Td>
            <Td><YesNo value={p.committed} /></Td>
            <Td><YesNo value={p.purchased} /></Td>
            <Td className="text-muted-foreground">{p.vendor}</Td>
            <Td className="font-mono text-xs text-muted-foreground">{p.poNumber}</Td>
            <Td className="text-muted-foreground">{p.expectedDelivery}</Td>
            <Td><StatusBadge status={p.status} /></Td>
          </Tr>
        ))}
      </Table>
    </Layout>
  );
}
