import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Gavel,
  FileText,
  HelpCircle,
  FileCheck2,
  CalendarClock,
  PackageSearch,
} from "lucide-react";
import logo from "@/assets/dunrite-logo.png.asset.json";
import { COMPANY, PROJECT } from "@/lib/project-data";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/purchasing", label: "Purchasing Log", icon: ShoppingCart },
  { to: "/bids", label: "Bid Log", icon: Gavel },
  { to: "/purchase-orders", label: "PO Log", icon: FileText },
  { to: "/rfis", label: "RFI Log", icon: HelpCircle },
  { to: "/submittals", label: "Submittal Log", icon: FileCheck2 },
  { to: "/schedule", label: "Schedule Delays", icon: CalendarClock },
  { to: "/procurement", label: "Procurement", icon: PackageSearch },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <img src={logo.url} alt="Dun Rite Construction logo" className="h-10 w-auto" />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">Dun Rite</p>
            <p className="text-xs text-sidebar-foreground/70">Construction</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-6 py-4">
          <p className="text-xs font-medium text-sidebar-accent-foreground">{PROJECT.name}</p>
          <p className="text-xs text-sidebar-foreground/60">{PROJECT.lot}</p>
        </div>
      </aside>

      <div className="flex w-full flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card/80 px-5 py-3 backdrop-blur lg:px-8">
          <img src={logo.url} alt="" className="h-8 w-auto lg:hidden" style={{ filter: "invert(1)" }} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold text-foreground">
              {PROJECT.name}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {PROJECT.lot} · {PROJECT.location}
            </p>
          </div>
          <span className="ml-auto hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline">
            {COMPANY.name}
          </span>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-sidebar px-1 py-2 lg:hidden">
        {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] ${
                active ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
