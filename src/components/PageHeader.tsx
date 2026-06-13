import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, AlertTriangle } from "lucide-react";

export function Breadcrumb({ section }: { section: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground no-print"
    >
      <Link to="/" className="transition-colors hover:text-foreground">
        450 Innovation Drive, Austin, TX 78701
      </Link>
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span>Project Management Workbook</span>
      <ChevronRight className="h-3 w-3 shrink-0" />
      <span className="font-medium text-foreground">{section}</span>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  number,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  number?: number;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {number != null && <span className="text-primary">{number}. </span>}
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

const STYLES: Record<string, string> = {
  complete: "bg-success/15 text-success",
  closed: "bg-success/15 text-success",
  "in-progress": "bg-primary/15 text-primary",
  open: "bg-primary/15 text-primary",
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
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
      <AlertTriangle className="h-3 w-3" /> Overdue
    </span>
  );
}

/** Variance number coloured: negative = destructive, positive = success, zero = muted. */
export function Variance({ value, children }: { value: number; children: ReactNode }) {
  const tone = value < 0 ? "text-destructive" : value > 0 ? "text-success" : "text-muted-foreground";
  return <span className={`font-medium tabular-nums ${tone}`}>{children}</span>;
}

export function DataCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
