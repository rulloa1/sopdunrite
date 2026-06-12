import type { Database } from "@/integrations/supabase/types";

export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export interface StatusMeta {
  value: ProjectStatus;
  label: string;
  short: string;
  // tailwind classes for the column header accent + badge
  badge: string;
  dot: string;
}

export const STATUSES: StatusMeta[] = [
  {
    value: "bid_pre_contract",
    label: "Bid – Pre-Contract",
    short: "Pre-Contract",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "bid_under_contract",
    label: "Bid / Under Contract",
    short: "Under Contract",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  {
    value: "active",
    label: "Active / In Progress",
    short: "Active",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    value: "complete",
    label: "Complete",
    short: "Complete",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
];

export const STATUS_BY_VALUE: Record<ProjectStatus, StatusMeta> = STATUSES.reduce(
  (acc, s) => {
    acc[s.value] = s;
    return acc;
  },
  {} as Record<ProjectStatus, StatusMeta>,
);
