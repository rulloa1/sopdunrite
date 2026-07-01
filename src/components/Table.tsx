import type { ReactNode } from "react";

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm [&_tbody_tr:nth-child(even)]:bg-muted/40">
          <thead className="bg-primary text-left text-xs font-semibold uppercase tracking-wide text-primary-foreground">
            {head}
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th
      className={`border-r border-primary-foreground/15 px-4 py-3 font-semibold last:border-r-0 ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  right,
  className = "",
}: {
  children: ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`border-r border-border/60 px-4 py-3 last:border-r-0 ${right ? "text-right" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border/60 last:border-0 hover:bg-accent/40">{children}</tr>;
}
