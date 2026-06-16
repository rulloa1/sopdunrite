import logo from "@/assets/dunrite-logo.jpg.asset.json";
import { PROJECT, COMPANY } from "@/data/projectData";

/**
 * Branded header bar that mirrors the printed Project Management Workbook —
 * white DC logo on the brand-blue band with the company / workbook title.
 */
export function WorkbookBanner() {
  return (
    <div className="mb-6 overflow-hidden rounded-xl shadow-sm">
      <div className="flex items-center gap-4 bg-primary px-5 py-3 lg:px-6">
        <img src={logo.url} alt="Dunrite Construction Group LLC logo" className="h-9 w-auto shrink-0 rounded" />
        <p className="text-sm font-semibold tracking-wide text-primary-foreground sm:text-base">
          <span className="font-bold uppercase">{PROJECT.name}</span>
          <span className="mx-1.5 text-primary-foreground/60">/</span>
          <span className="font-medium text-primary-foreground/90">{COMPANY.tagline}</span>
        </p>
      </div>
      <div className="h-1.5 bg-muted-foreground/30" />
    </div>
  );
}
