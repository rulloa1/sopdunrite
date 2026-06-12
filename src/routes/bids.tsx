import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { DocActions } from "@/components/DocActions";
import { Table, Th, Td, Tr } from "@/components/Table";
import { BIDS, currency } from "@/lib/project-data";

export const Route = createFileRoute("/bids")({
  head: () => ({
    meta: [
      { title: "Bid Log | Dun Rite Construction" },
      { name: "description", content: "Competitive bid tracking by cost code — bids received, low qualified bid, award and budget variance." },
    ],
  }),
  component: Bids,
});

function Bids() {
  return (
    <Layout>
      <PageHeader number={3} title="Bid Log" description="Competitive bids by cost code with awarded subcontractor and budget variance." actions={<DocActions label="Bid Log" />} />
      <Table
        head={
          <tr>
            <Th>Cost Code</Th>
            <Th>Description</Th>
            <Th right>Bids</Th>
            <Th right>Low Qualified Bid</Th>
            <Th right>Bid 2</Th>
            <Th right>Bid 3</Th>
            <Th>Awarded To</Th>
            <Th right>Budget</Th>
            <Th right>Variance</Th>
          </tr>
        }
      >
        {BIDS.map((r) => (
          <Tr key={r.code}>
            <Td className="font-mono text-xs font-medium">{r.code}</Td>
            <Td>{r.desc}</Td>
            <Td right>{r.contacted}</Td>
            <Td right className="tabular-nums font-medium">{currency(r.lowBid)}</Td>
            <Td right className="tabular-nums text-muted-foreground">{currency(r.bid2)}</Td>
            <Td right className="tabular-nums text-muted-foreground">{currency(r.bid3)}</Td>
            <Td>{r.awardedTo}</Td>
            <Td right className="tabular-nums">{currency(r.budget)}</Td>
            <Td right className={`tabular-nums font-medium ${r.variance >= 0 ? "text-success" : "text-destructive"}`}>
              {currency(r.variance)}
            </Td>
          </Tr>
        ))}
      </Table>
    </Layout>
  );
}
