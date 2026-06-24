import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { LogManager } from "@/components/LogManager";
import { LOG_CONFIGS } from "@/lib/logs";

export const Route = createFileRoute("/submittals")({
  head: () => ({
    meta: [
      { title: "Submittal Log | Dunrite Construction Group" },
      {
        name: "description",
        content: "Shop drawings, product data and samples with approval status tracking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SubmittalLog />
    </RequireAuth>
  ),
});

function SubmittalLog() {
  return (
    <Layout>
      <PageHeader
        number={6}
        title="Submittal Log"
        description="Shop drawings, samples and product data with approval status."
        actions={<SectionActions label="Submittal Log" />}
      />
      <LogManager config={LOG_CONFIGS.submittal_logs} />
    </Layout>
  );
}
