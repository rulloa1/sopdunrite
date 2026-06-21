import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/rfis")({
  head: () => ({
    meta: [
      { title: "RFI Log | Dunrite Construction Group" },
      {
        name: "description",
        content: "Requests for information — issue and required dates, cost impact and status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <RFILog />
    </RequireAuth>
  ),
});

function RFILog() {
  return (
    <Layout>
      <PageHeader
        number={5}
        title="RFI Log"
        description="Requests for information issued during project execution."
        actions={<SectionActions label="RFI Log" />}
      />
      <LogManager config={LOG_CONFIGS.rfi_logs} />
    </Layout>
  );
}
