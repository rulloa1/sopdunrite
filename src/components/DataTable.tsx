import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  /** Value used for sorting; defaults to the rendered cell when omitted. */
  sortValue?: (row: T) => string | number;
  cell: (row: T) => ReactNode;
  /** Extra classes applied to each body cell in this column. */
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Minimum table width so it scrolls horizontally on small screens. */
  minWidthClass?: string;
}

/**
 * Sortable, horizontally-scrollable log table. Click any sortable header to
 * sort; an optional toolbar slot hosts status filters.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  initialSort,
  toolbar,
  emptyTitle = "Nothing to show",
  emptyDescription = "There are no records in this log yet.",
  minWidthClass = "min-w-[720px]",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSort?.dir ?? "asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const out = [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    });
    return sortDir === "asc" ? out : out.reverse();
  }, [rows, columns, sortKey, sortDir]);

  const toggle = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-3">
      {toolbar && <div className="flex flex-wrap items-center gap-2 no-print">{toolbar}</div>}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm print-section">
        {sorted.length === 0 ? (
          <div className="p-4">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse text-sm ${minWidthClass} [&_tbody_tr:nth-child(even)]:bg-muted/30`}>
              <thead className="bg-primary text-left text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                <tr>
                  {columns.map((c) => {
                    const sortable = c.sortable !== false && !!c.sortValue;
                    const active = sortKey === c.key;
                    return (
                      <th
                        key={c.key}
                        className={`border-r border-primary-foreground/15 px-4 py-3 font-semibold last:border-r-0 ${
                          c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""
                        } ${sortable ? "cursor-pointer select-none" : ""}`}
                        onClick={sortable ? () => toggle(c.key) : undefined}
                      >
                        <span
                          className={`inline-flex items-center gap-1 ${
                            c.align === "right" ? "flex-row-reverse" : ""
                          }`}
                        >
                          {c.header}
                          {sortable &&
                            (active ? (
                              sortDir === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-50" />
                            ))}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`border-r border-border/50 px-4 py-3 last:border-r-0 ${
                          c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""
                        } ${c.cellClassName ?? ""}`}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
