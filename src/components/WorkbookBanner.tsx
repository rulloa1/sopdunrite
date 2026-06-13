import { HardHat } from "lucide-react";

/**
 * Branded header bar that mirrors the printed Project Management Workbook —
 * white icon on the brand-blue band with the company / workbook title.
 */
export function WorkbookBanner() {
  return (
    <div className="mb-6 overflow-hidden rounded-xl shadow-sm">
      <div className="flex items-center gap-4 bg-primary px-5 py-3 lg:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
          <HardHat className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-primary-foreground sm:text-base">
          <span className="font-bold uppercase">12412 Curley St, San Antonio, FL 33576</span>
          <span className="mx-1.5 text-primary-foreground/60">/</span>
          <span className="font-medium text-primary-foreground/90">Project Management Workbook</span>
        </p>
      </div>
      <div className="h-1.5 bg-muted-foreground/30" />
    </div>
  );
}
