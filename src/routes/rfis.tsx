import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { DocActions } from "@/components/DocActions";
import { Table, Th, Td, Tr } from "@/components/Table";
import { RFIS, currency } from "@/lib/project-data";

export const Route = createFileRoute("/rfis")({
  head: () => ({
    meta: [
      { title: "RFI Log | Dun Rite Construction" },
      { name: "description", content: "Requests for information log — issue dates, required dates, cost impact and open/closed status." },
    ],
  }),
  component: RFILog,
});

function RFILog() {
  const open = RFIS.filter((r) => r.status === "open").length;
  return (
    <Layout>
      <PageHeader
        title="RFI Log"
        description={`Requests for information · ${open} open of ${RFIS.length}.`}
        actions={<DocActions label="RFI Log" />}
      />
      <Table
        head={
          <tr>
            <Th>RFI #</Th>
            <Th>Description</Th>
            <Th>Issue Date</Th>
            <Th>Date Required</Th>
            <Th>Date Received</Th>
            <Th right>Cost Impact</Th>
            <Th>Status</Th>
          </tr>
        }
      >
        {RFIS.map((r) => (
          <Tr key={r.num}>
            <Td className="font-mono text-xs font-medium">{r.num}</Td>
            <Td>{r.description}</Td>
            <Td className="text-muted-foreground">{r.issueDate}</Td>
            <Td className="text-muted-foreground">{r.required}</Td>
            <Td className="text-muted-foreground">{r.received}</Td>
            <Td right className="tabular-nums">{r.costImpact ? currency(r.costImpact) : "—"}</Td>
            <Td><StatusBadge status={r.status} /></Td>
          </Tr>
        ))}
      </Table>
    </Layout>
  );
}
