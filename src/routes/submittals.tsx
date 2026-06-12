import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, StatusBadge } from "@/components/PageHeader";
import { DocActions } from "@/components/DocActions";
import { Table, Th, Td, Tr } from "@/components/Table";
import { SUBMITTALS } from "@/lib/project-data";

export const Route = createFileRoute("/submittals")({
  head: () => ({
    meta: [
      { title: "Submittal Log | Dun Rite Construction" },
      { name: "description", content: "Submittal log tracking shop drawings, samples and data with required and received dates." },
    ],
  }),
  component: SubmittalLog,
});

function SubmittalLog() {
  const open = SUBMITTALS.filter((s) => s.status === "open").length;
  return (
    <Layout>
      <PageHeader
        title="Submittal Log"
        description={`Shop drawings, samples & product data · ${open} open of ${SUBMITTALS.length}.`}
        actions={<DocActions label="Submittal Log" />}
      />
      <Table
        head={
          <tr>
            <Th>Sub #</Th>
            <Th>Description</Th>
            <Th>Issue Date</Th>
            <Th>Date Required</Th>
            <Th>Date Received</Th>
            <Th>Status</Th>
          </tr>
        }
      >
        {SUBMITTALS.map((s) => (
          <Tr key={s.num}>
            <Td className="font-mono text-xs font-medium">{s.num}</Td>
            <Td>{s.description}</Td>
            <Td className="text-muted-foreground">{s.issueDate}</Td>
            <Td className="text-muted-foreground">{s.required}</Td>
            <Td className="text-muted-foreground">{s.received}</Td>
            <Td><StatusBadge status={s.status} /></Td>
          </Tr>
        ))}
      </Table>
    </Layout>
  );
}
