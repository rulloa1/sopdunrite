import { supabase } from "@/integrations/supabase/client";

// =============================================================================
// Workbook data contract
//
// The PDF / DOCX workbook generators were originally hardwired to a static demo
// module (`@/lib/project-data`). They now accept a `WorkbookData` object, which
// `buildWorkbookData()` assembles from live Supabase data for a single project.
//
// The operational log, milestone and procurement tables map onto the workbook's
// sections; budget figures are derived from the purchasing log and schedule
// dates from the project row. Company identity stays constant.
// =============================================================================

export interface WorkbookCompany {
  name: string;
  tagline: string;
}

export interface WorkbookProject {
  name: string;
  lot: string;
  location: string;
  scheduleMonths: number;
  startDate: string;
  contractCompletion: string;
  currentCompletion: string;
}

export interface WorkbookBudget {
  originalControlEstimate: number;
  approvedNOCIs: number;
  currentBudget: number;
  committed: number;
  contingencyVariance: number;
}

export interface WorkbookMilestone {
  name: string;
  scheduled: string;
  actual: string;
  status: "complete" | "in-progress" | "upcoming";
}

export interface WorkbookPurchaseRow {
  code: string;
  desc: string;
  originalBudget: number;
  subcontractor: string;
  contractAmount: number;
  vendor: string;
  poNumber: string;
  variance: number;
}

export interface WorkbookBidRow {
  code: string;
  desc: string;
  contacted: number;
  lowBid: number;
  bid2: number;
  bid3: number;
  awardedTo: string;
  budget: number;
  variance: number;
}

export interface WorkbookPORow {
  po: string;
  code: string;
  vendor: string;
  description: string;
  issueDate: string;
  amount: number;
}

export interface WorkbookRFIRow {
  num: string;
  description: string;
  issueDate: string;
  required: string;
  received: string;
  costImpact: number;
  status: "open" | "closed";
}

export interface WorkbookSubmittalRow {
  num: string;
  description: string;
  issueDate: string;
  required: string;
  received: string;
  status: "open" | "closed";
}

export interface WorkbookDelayRow {
  num: string;
  description: string;
  impactedDates: string;
  days: number;
}

export interface WorkbookProcRow {
  item: string;
  committed: boolean;
  purchased: boolean;
  vendor: string;
  poNumber: string;
  expectedDelivery: string;
  status: "complete" | "in-progress" | "not-started";
}

export interface WorkbookData {
  COMPANY: WorkbookCompany;
  PROJECT: WorkbookProject;
  BUDGET: WorkbookBudget;
  MILESTONES: WorkbookMilestone[];
  PURCHASING: WorkbookPurchaseRow[];
  BIDS: WorkbookBidRow[];
  PURCHASE_ORDERS: WorkbookPORow[];
  RFIS: WorkbookRFIRow[];
  SUBMITTALS: WorkbookSubmittalRow[];
  DELAYS: WorkbookDelayRow[];
  PROCUREMENT: WorkbookProcRow[];
}

const COMPANY: WorkbookCompany = {
  name: "Dunrite Construction Group LLC",
  tagline: "Project Management & Standard Operating Procedures",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-04-21" → "Apr 21, 2025"; null/empty → "—". */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function fmtRange(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  if (start && end) return `${fmtDate(start)} – ${fmtDate(end)}`;
  return fmtDate(start ?? end);
}

/** Whole months between two ISO dates (>= 0). */
function monthsBetween(startIso: string, endIso: string): number {
  const [sy, sm] = startIso.split("-").map(Number);
  const [ey, em] = endIso.split("-").map(Number);
  if (!sy || !sm || !ey || !em) return 0;
  return Math.max(0, (ey - sy) * 12 + (em - sm));
}

const n = (v: unknown) => (v == null ? 0 : Number(v) || 0);

type Row = Record<string, unknown>;

/**
 * Assemble a {@link WorkbookData} object for one project from live Supabase
 * data. Loads the project row, the six operational logs, milestones and
 * procurement items in parallel.
 */
export async function buildWorkbookData(projectId: string): Promise<WorkbookData> {
  const [project, purchasing, bids, pos, rfis, submittals, delays, milestones, procurement] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("purchasing_logs").select("*").eq("project_id", projectId).order("cost_code"),
      supabase.from("bid_logs").select("*").eq("project_id", projectId).order("bid_number"),
      supabase.from("po_logs").select("*").eq("project_id", projectId).order("po_number"),
      supabase.from("rfi_logs").select("*").eq("project_id", projectId).order("rfi_number"),
      supabase
        .from("submittal_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("submittal_number"),
      supabase
        .from("schedule_delays")
        .select("*")
        .eq("project_id", projectId)
        .order("original_date"),
      supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order")
        .order("scheduled"),
      supabase
        .from("procurement_items")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order")
        .order("item"),
    ]);

  const p = (project.data as Row) ?? {};
  const purchasingRows = (purchasing.data as Row[]) ?? [];
  const bidRows = (bids.data as Row[]) ?? [];
  const poRows = (pos.data as Row[]) ?? [];
  const rfiRows = (rfis.data as Row[]) ?? [];
  const submittalRows = (submittals.data as Row[]) ?? [];
  const delayRows = (delays.data as Row[]) ?? [];
  const milestoneRows = (milestones.data as Row[]) ?? [];
  const procurementRows = (procurement.data as Row[]) ?? [];

  const PURCHASING: WorkbookPurchaseRow[] = purchasingRows.map((r) => ({
    code: (r.cost_code as string) ?? "",
    desc: (r.description as string) ?? "",
    originalBudget: n(r.original_budget),
    subcontractor: (r.contractor as string) ?? "",
    contractAmount: n(r.contract_amount),
    vendor: (r.vendor as string) ?? "",
    poNumber: (r.po_number as string) ?? "",
    variance: n(r.original_budget) - n(r.contract_amount),
  }));

  const totalBudget = PURCHASING.reduce((a, r) => a + r.originalBudget, 0);
  const totalContracted = PURCHASING.reduce((a, r) => a + r.contractAmount, 0);
  const totalNoci = purchasingRows.reduce((a, r) => a + n(r.noci), 0);

  const BUDGET: WorkbookBudget = {
    originalControlEstimate: totalBudget,
    approvedNOCIs: totalNoci,
    currentBudget: totalBudget + totalNoci,
    committed: totalContracted,
    contingencyVariance: totalBudget - totalContracted,
  };

  const BIDS: WorkbookBidRow[] = bidRows.map((r) => {
    const awarded = r.status === "awarded" || r.status === "accepted";
    return {
      code: (r.bid_number as string) ?? "",
      desc: (r.description as string) ?? "",
      contacted: 1,
      lowBid: n(r.bid_amount),
      bid2: 0,
      bid3: 0,
      awardedTo: awarded ? ((r.contractor as string) ?? "") : "",
      budget: n(r.bid_amount),
      variance: 0,
    };
  });

  const PURCHASE_ORDERS: WorkbookPORow[] = poRows.map((r) => ({
    po: (r.po_number as string) ?? "",
    code: "",
    vendor: (r.vendor as string) ?? "",
    description: (r.description as string) ?? "",
    issueDate: fmtDate(r.po_date as string | null),
    amount: n(r.amount),
  }));

  const RFIS: WorkbookRFIRow[] = rfiRows.map((r) => ({
    num: (r.rfi_number as string) ?? "",
    description: (r.description as string) ?? "",
    issueDate: fmtDate(r.issue_date as string | null),
    required: fmtDate(r.date_required as string | null),
    received: fmtDate(r.date_received as string | null),
    costImpact: n(r.cost_impact),
    status: r.closed ? "closed" : "open",
  }));

  const SUBMITTALS: WorkbookSubmittalRow[] = submittalRows.map((r) => ({
    num: (r.submittal_number as string) ?? "",
    description: (r.description as string) ?? "",
    issueDate: fmtDate(r.issue_date as string | null),
    required: fmtDate(r.date_required as string | null),
    received: fmtDate(r.date_received as string | null),
    status: r.closed ? "closed" : "open",
  }));

  const DELAYS: WorkbookDelayRow[] = delayRows.map((r, i) => ({
    num: String(i + 1),
    description: (r.delay_description as string) ?? "",
    impactedDates: fmtRange(r.original_date as string | null, r.revised_date as string | null),
    days: n(r.days_delayed),
  }));

  const MILESTONES: WorkbookMilestone[] = milestoneRows.map((r) => {
    const status = ((r.status as string) ?? "upcoming") as WorkbookMilestone["status"];
    const actualDate = r.actual as string | null;
    return {
      name: (r.name as string) ?? "",
      scheduled: fmtDate(r.scheduled as string | null),
      actual: actualDate ? fmtDate(actualDate) : status === "in-progress" ? "In Progress" : "—",
      status,
    };
  });

  const PROCUREMENT: WorkbookProcRow[] = procurementRows.map((r) => ({
    item: (r.item as string) ?? "",
    committed: Boolean(r.committed),
    purchased: Boolean(r.purchased),
    vendor: (r.vendor as string) ?? "—",
    poNumber: (r.po_number as string) ?? "—",
    expectedDelivery: (r.expected_delivery as string) ?? "—",
    status: ((r.status as string) ?? "not-started") as WorkbookProcRow["status"],
  }));

  const start = p.start_date as string | null;
  const completion =
    (p.current_completion as string | null) ?? (p.contract_completion as string | null);
  const scheduleMonths = start && completion ? monthsBetween(start, completion) : 0;

  const PROJECT: WorkbookProject = {
    name: (p.name as string) ?? "Untitled Project",
    lot: (p.location as string) ?? "—",
    location: (p.location as string) ?? "—",
    scheduleMonths,
    startDate: fmtDate(start),
    contractCompletion: fmtDate(p.contract_completion as string | null),
    currentCompletion: fmtDate(p.current_completion as string | null),
  };

  return {
    COMPANY,
    PROJECT,
    BUDGET,
    MILESTONES,
    PURCHASING,
    BIDS,
    PURCHASE_ORDERS,
    RFIS,
    SUBMITTALS,
    DELAYS,
    PROCUREMENT,
  };
}
