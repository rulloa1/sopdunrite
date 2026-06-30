import logo from "@/assets/dunrite-logo.jpg.asset.json";
import { PROJECT, COMPANY } from "@/data/projectData";

/**
 * Branded header bar that mirrors the printed Project Management Workbook —
 * white DC logo on the brand-blue band with the company / workbook title.
 */
export function WorkbookBanner() {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border-l-4 border-primary bg-card px-5 py-3 shadow-sm lg:px-6">
      <img src={logo.url} alt="Dunrite Construction Group LLC logo" className="h-9 w-auto shrink-0 rounded" />
      <p className="text-xs font-medium tracking-wide text-foreground/80 sm:text-sm">
        <span className="font-semibold uppercase">{PROJECT.name}</span>
        <span className="mx-1.5 text-muted-foreground">/</span>
        <span className="text-muted-foreground">{COMPANY.tagline}</span>
      </p>
    </div>
  );
}
