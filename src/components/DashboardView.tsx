import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  HelpCircle,
  FileCheck2,
  CalendarClock,
  ShoppingCart,
  Gavel,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
import { DocActions } from "@/components/DocActions";
import { DataTable, type Column } from "@/components/DataTable";
import { Variance } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/data/projectData";
import { STATUS_BY_VALUE, type ProjectRow } from "@/lib/projects";

interface ProjectStat {
  id: string;
  name: string;
  status: ProjectRow["status"];
  value: number;
  budget: number;
  contracted: number;
  variance: number;
  poIssued: number;
  openRfis: number;
  totalRfis: number;
  openSubs: number;
  totalSubs: number;
  delayDays: number;
  bidCount: number;
  bidTotal: number;
  milestonesComplete: number;
  milestonesTotal: number;
}

type Row = Record<string, unknown>;

interface DashLogs {
  bid_logs: Row[];
  rfi_logs: Row[];
  submittal_logs: Row[];
  purchasing_logs: Row[];
  po_logs: Row[];
  schedule_delays: Row[];
  project_milestones: Row[];
}
const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);

/** Group log rows by their project_id for O(1) per-project lookups. */
function groupByProject(rows: Row[]): Map<string, Row[]> {
  const map = new Map<string, Row[]>();
  for (const r of rows) {
    const key = String(r.project_id);
    const list = map.get(key);
    if (list) list.push(r);
    else map.set(key, [r]);
  }
  return map;
}

export function DashboardView() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [logs, setLogs] = useState<DashLogs>({
    bid_logs: [],
    rfi_logs: [],
    submittal_logs: [],
    purchasing_logs: [],
    po_logs: [],
    schedule_delays: [],
    project_milestones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [proj, purchasing, bids, pos, rfis, submittals, delays, milestones] = await Promise.all(
        [
          supabase.from("projects").select("*").order("created_at", { ascending: false }),
          supabase.from("purchasing_logs").select("project_id, original_budget, contract_amount"),
          supabase.from("bid_logs").select("project_id, bid_amount"),
          supabase.from("po_logs").select("project_id, amount"),
          supabase.from("rfi_logs").select("project_id, closed"),
          supabase.from("submittal_logs").select("project_id, closed"),
          supabase.from("schedule_delays").select("project_id, days_delayed"),
          supabase.from("project_milestones").select("project_id, status"),
        ],
      );
      const firstErr = [proj, purchasing, bids, pos, rfis, submittals, delays, milestones].find(
        (r) => r.error,
      );
      if (firstErr?.error) setError(firstErr.error.message);
      const list = (proj.data as ProjectRow[]) ?? [];
      setProjects(list);
      setLogs({
        bid_logs: (bids.data as Row[]) ?? [],
        rfi_logs: (rfis.data as Row[]) ?? [],
        submittal_logs: (submittals.data as Row[]) ?? [],
        purchasing_logs: (purchasing.data as Row[]) ?? [],
        po_logs: (pos.data as Row[]) ?? [],
        schedule_delays: (delays.data as Row[]) ?? [],
        project_milestones: (milestones.data as Row[]) ?? [],
      });
      setExportId((curr) => curr || list[0]?.id || "");
      setLoading(false);
    })();
  }, []);

  const stats = useMemo<ProjectStat[]>(() => {
    const byPurchasing = groupByProject(logs.purchasing_logs);
    const byBids = groupByProject(logs.bid_logs);
    const byPos = groupByProject(logs.po_logs);
    const byRfis = groupByProject(logs.rfi_logs);
    const bySubs = groupByProject(logs.submittal_logs);
    const byDelays = groupByProject(logs.schedule_delays);
    const byMilestones = groupByProject(logs.project_milestones);

    return projects.map((p) => {
      const purchasing = byPurchasing.get(p.id) ?? [];
      const bids = byBids.get(p.id) ?? [];
      const pos = byPos.get(p.id) ?? [];
      const rfis = byRfis.get(p.id) ?? [];
      const subs = bySubs.get(p.id) ?? [];
      const delays = byDelays.get(p.id) ?? [];
      const milestones = byMilestones.get(p.id) ?? [];

      const budget = purchasing.reduce((a, r) => a + num(r.original_budget), 0);
      const contracted = purchasing.reduce((a, r) => a + num(r.contract_amount), 0);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        value: num(p.value),
        budget,
        contracted,
        variance: budget - contracted,
        poIssued: pos.reduce((a, r) => a + num(r.amount), 0),
        openRfis: rfis.filter((r) => !r.closed).length,
        totalRfis: rfis.length,
        openSubs: subs.filter((r) => !r.closed).length,
        totalSubs: subs.length,
        delayDays: delays.reduce((a, r) => a + num(r.days_delayed), 0),
        bidCount: bids.length,
        bidTotal: bids.reduce((a, r) => a + num(r.bid_amount), 0),
        milestonesComplete: milestones.filter((r) => r.status === "complete").length,
        milestonesTotal: milestones.length,
      };
    });
  }, [projects, logs]);

  const totals = useMemo(
    () =>
      stats.reduce(
        (a, s) => ({
          value: a.value + s.value,
          budget: a.budget + s.budget,
          contracted: a.contracted + s.contracted,
          poIssued: a.poIssued + s.poIssued,
          openRfis: a.openRfis + s.openRfis,
          totalRfis: a.totalRfis + s.totalRfis,
          openSubs: a.openSubs + s.openSubs,
          totalSubs: a.totalSubs + s.totalSubs,
          delayDays: a.delayDays + s.delayDays,
          bidCount: a.bidCount + s.bidCount,
          bidTotal: a.bidTotal + s.bidTotal,
          milestonesComplete: a.milestonesComplete + s.milestonesComplete,
          milestonesTotal: a.milestonesTotal + s.milestonesTotal,
        }),
        {
          value: 0,
          budget: 0,
          contracted: 0,
          poIssued: 0,
          openRfis: 0,
          totalRfis: 0,
          openSubs: 0,
          totalSubs: 0,
          delayDays: 0,
          bidCount: 0,
          bidTotal: 0,
          milestonesComplete: 0,
          milestonesTotal: 0,
        },
      ),
    [stats],
  );

  const netVariance = totals.budget - totals.contracted;

  const columns: Column<ProjectStat>[] = [
    {
      key: "name",
      header: "Project",
      sortValue: (s) => s.name,
      cell: (s) => (
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${STATUS_BY_VALUE[s.status]?.dot ?? "bg-muted-foreground"}`}
          />
          <span className="font-medium">{s.name}</span>
        </span>
      ),
    },
    {
      key: "value",
      header: "Pipeline",
      align: "right",
      sortValue: (s) => s.value,
      cell: (s) => <span className="tabular-nums">{currency(s.value)}</span>,
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      sortValue: (s) => s.budget,
      cell: (s) => <span className="tabular-nums">{currency(s.budget)}</span>,
    },
    {
      key: "contracted",
      header: "Contracted",
      align: "right",
      sortValue: (s) => s.contracted,
      cell: (s) => <span className="tabular-nums">{currency(s.contracted)}</span>,
    },
    {
      key: "variance",
      header: "Variance",
      align: "right",
      sortValue: (s) => s.variance,
      cell: (s) => <Variance value={s.variance}>{currency(s.variance)}</Variance>,
    },
    {
      key: "po",
      header: "PO Issued",
      align: "right",
      sortValue: (s) => s.poIssued,
      cell: (s) => <span className="tabular-nums">{currency(s.poIssued)}</span>,
    },
    {
      key: "rfis",
      header: "Open RFIs",
      align: "right",
      sortValue: (s) => s.openRfis,
      cell: (s) => (
        <span className="tabular-nums">
          {s.openRfis}/{s.totalRfis}
        </span>
      ),
    },
    {
      key: "subs",
      header: "Open Subs",
      align: "right",
      sortValue: (s) => s.openSubs,
      cell: (s) => (
        <span className="tabular-nums">
          {s.openSubs}/{s.totalSubs}
        </span>
      ),
    },
    {
      key: "milestones",
      header: "Milestones",
      align: "right",
      sortValue: (s) => (s.milestonesTotal ? s.milestonesComplete / s.milestonesTotal : -1),
      cell: (s) => (
        <span className="tabular-nums">
          {s.milestonesComplete}/{s.milestonesTotal}
        </span>
      ),
    },
    {
      key: "delays",
      header: "Delay Days",
      align: "right",
      sortValue: (s) => s.delayDays,
      cell: (s) => <span className="tabular-nums">{s.delayDays}</span>,
    },
  ];

  const exportProject = projects.find((p) => p.id === exportId);

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold sm:text-2xl">
            <span className="text-primary">1. </span>Executive Summary
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading portfolio…"
              : `${projects.length} project${projects.length === 1 ? "" : "s"} · ${currency(totals.value)} total pipeline value`}
          </p>
        </div>
        {projects.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-3 no-print">
            <Select value={exportId} onValueChange={setExportId}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DocActions
              label="Workbook"
              projectId={exportId}
              projectName={exportProject?.name ?? ""}
              disabled={!exportId}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Dashboard is empty"
          description="There's no project data yet. Add a project to start populating the dashboard."
          action={
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            <StatCard
              icon={FolderKanban}
              label="Projects"
              value={String(projects.length)}
              sub={`${currency(totals.value)} pipeline`}
            />
            <StatCard
              icon={ShoppingCart}
              label="Contracted"
              value={currency(totals.contracted)}
              sub={`of ${currency(totals.budget)} budget`}
            />
            <StatCard
              icon={ShoppingCart}
              label="Net Variance"
              value={currency(netVariance)}
              tone={netVariance < 0 ? "neg" : netVariance > 0 ? "pos" : undefined}
            />
            <StatCard
              icon={Gavel}
              label="PO Issued"
              value={currency(totals.poIssued)}
              sub={`${currency(totals.bidTotal)} bids`}
            />
            <StatCard
              icon={HelpCircle}
              label="Open RFIs"
              value={`${totals.openRfis}`}
              sub={`of ${totals.totalRfis} total`}
            />
            <StatCard
              icon={FileCheck2}
              label="Milestones"
              value={`${totals.milestonesComplete}/${totals.milestonesTotal}`}
              sub="complete"
            />
            <StatCard
              icon={CalendarClock}
              label="Delay Days"
              value={`${totals.delayDays}`}
              sub={`${totals.openSubs} open submittals`}
            />
          </div>

          <h3 className="mb-3 mt-8 font-display text-lg font-semibold">Per-Project Breakdown</h3>
          <DataTable
            columns={columns}
            rows={stats}
            getRowKey={(s) => s.id}
            initialSort={{ key: "value", dir: "desc" }}
            minWidthClass="min-w-[920px]"
            emptyTitle="No projects"
          />
        </>
      )}
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p
        className={`mt-1.5 font-display text-xl font-bold tabular-nums ${
          tone === "pos" ? "text-success" : tone === "neg" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
