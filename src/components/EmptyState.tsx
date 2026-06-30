import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * Designed empty-state used app-wide so a table or page never renders blank.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: typeof Inbox;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/40 px-8 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
