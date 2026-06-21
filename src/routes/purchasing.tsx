import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Purchasing Log | Dunrite Construction Group" },
      {
        name: "description",
        content: "Cost-code budget vs. contracted amounts, vendors, PO references and variance.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Purchasing />
    </RequireAuth>
  ),
});

function Purchasing() {
  return (
    <Layout>
      <PageHeader
        number={2}
        title="Purchasing Log"
        description="Budget and procurement tracking by cost code, with contract variance."
        actions={<SectionActions label="Purchasing Log" />}
      />
      <LogManager config={LOG_CONFIGS.purchasing_logs} />
    </Layout>
  );
}
