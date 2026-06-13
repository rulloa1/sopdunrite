import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  FileSignature,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  CalendarClock,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import {
  PROJECT,
  MILESTONES,
  currency,
  formatDate,
  getOriginalControlEstimate,
  getApprovedNOCIs,
  getCurrentBudget,
  getCommittedToDate,
  getCommittedPct,
  getContingencyVariance,
  getContingencyVariancePct,
  getOpenRfiCount,
  getOpenSubmittalCount,
  getTotalDelayDays,
  getMilestoneProgress,
  getCompletedMilestones,
  RFIS,
  SUBMITTALS,
  DELAYS,
} from "@/data/projectData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Dun Rite Construction" },
      {
        name: "description",
        content:
          "Executive summary for Baker's Bay Golf & Ocean Club — schedule milestones, budget, RFIs, submittals and procurement at a glance.",
      },
      { property: "og:title", content: "Dun Rite Construction — Project Dashboard" },
      { property: "og:description", content: "Schedule, budget and project controls for Baker's Bay Golf & Ocean Club." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const progress = getMilestoneProgress();
  const contVar = getContingencyVariance();
  const committed = getCommittedToDate();

  const budgetCards = [
    { label: "Original Control Estimate", value: getOriginalControlEstimate(), icon: Wallet, primary: false, sub: undefined as string | undefined },
    { label: "Approved NOCIs", value: getApprovedNOCIs(), icon: FileSignature, primary: false, sub: undefined },
    { label: "Current Budget", value: getCurrentBudget(), icon: CircleDollarSign, primary: true, sub: "Estimate + NOCIs" },
    { label: "Committed to Date", value: committed, icon: TrendingUp, primary: false, sub: `${getCommittedPct()}% of current budget` },
  ];

  return (
    <Layout>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold">
            <span className="text-primary">1. </span>Executive Summary
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {PROJECT.scheduleMonths}-month schedule · Started {formatDate(PROJECT.startDate)} · Target completion{" "}
            {formatDate(PROJECT.targetCompletion)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 no-print">
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Download Workbook
          </Button>
          <SectionActions label="Executive Summary" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {budgetCards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border bg-card p-5 shadow-sm ${c.primary ? "ring-1 ring-primary/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.primary ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums">{currency(c.value)}</p>
            {c.sub && <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contingency Variance</p>
            {contVar < 0 ? (
              <TrendingDown className="h-5 w-5 text-destructive" />
            ) : (
              <TrendingUp className="h-5 w-5 text-success" />
            )}
          </div>
          <p
            className={`mt-3 font-display text-2xl font-bold tabular-nums ${
              contVar < 0 ? "text-destructive" : "text-success"
            }`}
          >
            {currency(contVar)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {getContingencyVariancePct().toFixed(1)}% of current budget
          </p>
        </div>

        <StatCard icon={Clock} label="Open RFIs" value={getOpenRfiCount()} sub={`${RFIS.length} total`} />
        <StatCard icon={CheckCircle2} label="Open Submittals" value={getOpenSubmittalCount()} sub={`${SUBMITTALS.length} total`} />
        <StatCard icon={CalendarClock} label="Schedule Delay Days" value={getTotalDelayDays()} sub={`${DELAYS.length} logged events`} />
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm lg:p-6 print-section">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">Schedule Milestones</h3>
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full brand-gradient" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-medium tabular-nums">
              {getCompletedMilestones()}/{MILESTONES.length} · {progress}%
            </span>
          </div>
        </div>

        <ol className="space-y-1">
          {MILESTONES.map((m, i) => (
            <li key={m.name} className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.status === "complete"
                    ? "bg-success text-success-foreground"
                    : m.status === "in-progress"
                      ? "brand-gradient text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-40 flex-1 text-sm font-medium">{m.name}</span>
              <span className="nowrap-date text-xs text-muted-foreground">Sched: {formatDate(m.scheduled)}</span>
              <span className="nowrap-date w-32 text-xs text-muted-foreground">Actual: {formatDate(m.actual)}</span>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 no-print">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          View all projects →
        </Link>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
