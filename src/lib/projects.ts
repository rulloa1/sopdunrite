export type ProjectStatus =
  | "bid_pre_contract"
  | "bid_under_contract"
  | "active"
  | "complete";

export interface Project {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  value: number;
  status: ProjectStatus;
  assigned_to: string | null;
  bid_due_date: string | null;
  start_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Display order for the dashboard groupings.
export const STATUS_ORDER: ProjectStatus[] = [
  "bid_pre_contract",
  "bid_under_contract",
  "active",
  "complete",
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  bid_pre_contract: "Bid – Pre-Contract",
  bid_under_contract: "Bid / Under Contract",
  active: "Active / In Progress",
  complete: "Complete",
};

// Tailwind tone classes per status (semantic tokens only).
export const STATUS_TONE: Record<ProjectStatus, string> = {
  bid_pre_contract: "bg-warning/20 text-warning-foreground",
  bid_under_contract: "bg-primary/15 text-primary",
  active: "bg-secondary text-secondary-foreground",
  complete: "bg-success/15 text-success",
};

export const projectCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
