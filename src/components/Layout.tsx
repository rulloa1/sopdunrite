import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Gavel,
  FileText,
  HelpCircle,
  FileCheck2,
  CalendarClock,
  PackageSearch,
  FolderKanban,
  Users,
  LogOut,
  LogIn,
  Menu,
} from "lucide-react";
import logo from "@/assets/dunrite-logo.jpg.asset.json";
import { WorkbookBanner } from "@/components/WorkbookBanner";
import { Breadcrumb } from "@/components/PageHeader";
import { PROJECT, CONTRACTOR } from "@/data/projectData";
import { useAuth, isAdmin, ROLE_LABELS } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/purchasing", label: "Purchasing Log", icon: ShoppingCart },
  { to: "/bids", label: "Bid Log", icon: Gavel },
  { to: "/purchase-orders", label: "PO Log", icon: FileText },
  { to: "/rfis", label: "RFI Log", icon: HelpCircle },
  { to: "/submittals", label: "Submittal Log", icon: FileCheck2 },
  { to: "/schedule", label: "Schedule Delays", icon: CalendarClock },
  { to: "/procurement", label: "Procurement", icon: PackageSearch },
] as const;

function isActivePath(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

function sectionLabel(pathname: string) {
  if (pathname.startsWith("/team")) return "Team & Roles";
  const item = NAV.find((n) => isActivePath(pathname, n.to));
  return item?.label ?? "Dashboard";
}

function LogoChip({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center overflow-hidden rounded-lg shadow-sm ${className}`}>
      <img src={logo.url} alt="Dunrite Construction Group LLC logo" className="h-12 w-auto" />
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { role } = useAuth();
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = isActivePath(pathname, to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
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
      {isAdmin(role) && (
        <Link
          to="/team"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname.startsWith("/team")
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <Users className="h-4.5 w-4.5 shrink-0" />
          Team &amp; Roles
        </Link>
      )}
    </nav>
  );
}

function UserBlock() {
  const { user, role, signOut } = useAuth();
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      {user ? (
        <div className="space-y-2">
          <div className="px-2">
            <p className="truncate text-xs font-medium text-sidebar-accent-foreground">{user.email}</p>
            {role && <p className="text-[11px] text-sidebar-foreground/60">{ROLE_LABELS[role]}</p>}
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : (
        <Link
          to="/auth"
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center px-6 py-6">
          <LogoChip />
        </div>
        <NavLinks pathname={pathname} />
        <UserBlock />
      </aside>

      <div className="flex w-full min-w-0 flex-col lg:pl-64">
        {/* Header — project context on the left */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card/80 px-4 py-3 backdrop-blur lg:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-foreground lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-full flex-col">
                <div className="flex items-center px-6 py-6">
                  <LogoChip />
                </div>
                <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                <UserBlock />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold text-foreground">{PROJECT.name}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {PROJECT.lot} · {PROJECT.location}
            </p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Breadcrumb section={sectionLabel(pathname)} />
          <WorkbookBanner />
          {children}
        </main>

        {/* Footer — contractor identity demoted here + full section nav */}
        <footer className="border-t bg-card px-4 py-6 lg:px-8 no-print">
          <div className="flex flex-col gap-4">
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              {NAV.map(({ to, label }) => {
                const active = isActivePath(pathname, to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`transition-colors ${
                      active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{CONTRACTOR.name}</span>
              <span className="mx-1.5">·</span>
              {CONTRACTOR.address}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
