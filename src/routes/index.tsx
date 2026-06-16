import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Printer, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
import { SectionActions } from "@/components/SectionActions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Longleaf Amenity Center" },
      {
        name: "description",
        content:
          "Executive summary dashboard for Longleaf Amenity Center — schedule, budget, RFIs, submittals and procurement at a glance.",
      },
      { property: "og:title", content: "Longleaf Amenity Center — Dunrite Construction Group" },
      { property: "og:description", content: "Schedule, budget and project controls dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold sm:text-2xl">
            <span className="text-primary">1. </span>Executive Summary
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No project data to display.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 no-print">
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Download Workbook
          </Button>
          <SectionActions label="Executive Summary" />
        </div>
      </div>

      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard is empty"
        description="There's no project data yet. Add a project to start populating the dashboard."
        action={
          <Button asChild>
            <Link to="/projects">Go to Projects</Link>
          </Button>
        }
      />
    </Layout>
  );
}
