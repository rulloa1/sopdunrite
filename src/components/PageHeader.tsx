import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  number,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  number?: number;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          {number != null && <span className="text-primary">{number}. </span>}
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

const STYLES: Record<string, string> = {
  complete: "bg-success/15 text-success",
  closed: "bg-success/15 text-success",
  "in-progress": "bg-primary/15 text-primary",
  open: "bg-warning/20 text-warning-foreground",
  upcoming: "bg-muted text-muted-foreground",
  "not-started": "bg-muted text-muted-foreground",
};

const LABELS: Record<string, string> = {
  complete: "Complete",
  closed: "Closed",
  "in-progress": "In Progress",
  open: "Open",
  upcoming: "Upcoming",
  "not-started": "Not Started",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

export function DataCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
