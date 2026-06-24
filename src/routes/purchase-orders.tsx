import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({
    meta: [
      { title: "PO Log | Dunrite Construction Group" },
      {
        name: "description",
        content: "Purchase order register — vendor, amount, issue and delivery dates and status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <POLog />
    </RequireAuth>
  ),
});

function POLog() {
  return (
    <Layout>
      <PageHeader
        number={4}
        title="Purchase Order Log"
        description="Issued purchase orders by vendor, with amounts and delivery tracking."
        actions={<SectionActions label="Purchase Order Log" />}
      />
      <LogManager config={LOG_CONFIGS.po_logs} />
    </Layout>
  );
}
