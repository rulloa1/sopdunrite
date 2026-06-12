import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  FileSignature,
  CircleDollarSign,
  CheckCircle2,
  Clock,
  CalendarClock,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/PageHeader";
import {
  BUDGET,
  MILESTONES,
  PROJECT,
  RFIS,
  SUBMITTALS,
  DELAYS,
  currency,
} from "@/lib/project-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Dun Rite Construction" },
      {
        name: "description",
        content:
          "Executive summary dashboard for Dun Rite Construction — schedule milestones, budget tracking, RFIs, submittals and procurement at a glance.",
      },
      { property: "og:title", content: "Dun Rite Construction — Project Dashboard" },
      {
        property: "og:description",
        content: "Schedule, budget and project controls for the Baker's Bay residence.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const completed = MILESTONES.filter((m) => m.status === "complete").length;
  const progress = Math.round((completed / MILESTONES.length) * 100);
  const openRFIs = RFIS.filter((r) => r.status === "open").length;
  const openSubs = SUBMITTALS.filter((s) => s.status === "open").length;
  const totalDelayDays = DELAYS.reduce((a, d) => a + d.days, 0);
  const variancePct = ((BUDGET.contingencyVariance / BUDGET.currentBudget) * 100).toFixed(1);

  const budgetCards = [
    { label: "Original Control Estimate", value: BUDGET.originalControlEstimate, icon: Wallet, tone: "muted" },
    { label: "Approved NOCIs", value: BUDGET.approvedNOCIs, icon: FileSignature, tone: "muted" },
    { label: "Current Budget", value: BUDGET.currentBudget, icon: CircleDollarSign, tone: "primary" },
    { label: "Committed to Date", value: BUDGET.committed, icon: TrendingUp, tone: "muted" },
  ] as const;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Executive Summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {PROJECT.scheduleMonths}-month schedule · Started {PROJECT.startDate} · Target completion{" "}
          {PROJECT.currentCompletion}
        </p>
      </div>

      {/* Budget cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {budgetCards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border bg-card p-5 shadow-sm ${
              c.tone === "primary" ? "ring-1 ring-primary/30" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <c.icon className={`h-5 w-5 ${c.tone === "primary" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums">{currency(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Variance + quick stats */}
      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contingency Variance
            </p>
            {BUDGET.contingencyVariance < 0 ? (
              <TrendingDown className="h-5 w-5 text-destructive" />
            ) : (
              <TrendingUp className="h-5 w-5 text-success" />
            )}
          </div>
          <p
            className={`mt-3 font-display text-2xl font-bold tabular-nums ${
              BUDGET.contingencyVariance < 0 ? "text-destructive" : "text-success"
            }`}
          >
            {currency(BUDGET.contingencyVariance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{variancePct}% of current budget</p>
        </div>

        <StatCard icon={Clock} label="Open RFIs" value={openRFIs} sub={`${RFIS.length} total`} />
        <StatCard icon={CheckCircle2} label="Open Submittals" value={openSubs} sub={`${SUBMITTALS.length} total`} />
        <StatCard
          icon={CalendarClock}
          label="Schedule Delay Days"
          value={totalDelayDays}
          sub={`${DELAYS.length} logged events`}
        />
      </div>

      {/* Schedule milestones */}
      <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm lg:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">Schedule Milestones</h3>
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full brand-gradient" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-medium tabular-nums">{progress}%</span>
          </div>
        </div>

        <ol className="relative space-y-1">
          {MILESTONES.map((m, i) => (
            <li
              key={m.name}
              className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
            >
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
              <span className="flex-1 min-w-40 text-sm font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">Sched: {m.scheduled}</span>
              <span className="w-28 text-xs text-muted-foreground">Actual: {m.actual}</span>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ol>
      </div>
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  sub: string;
}) {
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
