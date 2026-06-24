import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement Buyout Log | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Long-lead procurement — committed and purchased status, vendors, POs and expected delivery.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Procurement />
    </RequireAuth>
  ),
});

function Procurement() {
  return (
    <Layout>
      <PageHeader
        number={8}
        title="Procurement Buyout Log"
        description="Long-lead items, commitment status and expected delivery."
        actions={<SectionActions label="Procurement Buyout Log" />}
      />
      <LogManager config={LOG_CONFIGS.procurement_items} />
    </Layout>
  );
}
