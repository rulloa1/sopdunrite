import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/bids")({
  head: () => ({
    meta: [
      { title: "Bid Log | Dunrite Construction Group" },
      {
        name: "description",
        content: "Track project bids and quotations by contractor, amount and award status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Bids />
    </RequireAuth>
  ),
});

function Bids() {
  return (
    <Layout>
      <PageHeader
        number={3}
        title="Bid Log"
        description="Project bids and quotations by contractor, amount and award status."
        actions={<SectionActions label="Bid Log" />}
      />
      <LogManager config={LOG_CONFIGS.bid_logs} />
    </Layout>
  );
}
