import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardView } from "@/components/DashboardView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Executive summary dashboard — portfolio budget, bids, RFIs, submittals, purchase orders and schedule across all projects.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardView />
    </RequireAuth>
  ),
});
