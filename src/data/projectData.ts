// =============================================================================
// SINGLE SOURCE OF TRUTH
// Longleaf Amenity Center — Dunrite Construction Group Project Management Workbook
//
// Every total, subtotal, count and KPI shown anywhere in the app is COMPUTED
// from the row data below via the selector functions at the bottom of this file.
// Never hardcode a total in a page component — call a selector.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type MilestoneStatus = "complete" | "in-progress" | "upcoming";
export type LogStatus = "open" | "closed";
export type ProcStatus = "complete" | "in-progress" | "not-started";

export interface Vendor {
  name: string;
  trades: string[];
}

export interface CostCode {
  code: string;
  description: string;
}

export interface Contract {
  code: string;
  description: string;
  originalBudget: number;
  subcontractor: string; // must match a Vendor name
  contractAmount: number;
  // variance is computed: originalBudget - contractAmount
}

export interface BidEntry {
  bidder: string;
  amount: number;
  status: "awarded" | "qualified" | "rejected";
  note?: string;
}

export interface Bid {
  code: string;
  description: string;
  budget: number;
  awardedVendor: string;
  awardedAmount: number; // === Contract.contractAmount for this code
  bids: BidEntry[];
  footnote?: string;
  // variance is computed: budget - awardedAmount
}

export interface PurchaseOrder {
  po: string; // PO-001 … PO-030
  code: string;
  vendor: string;
  description: string;
  issueDate: string; // ISO yyyy-mm-dd
  amount: number; // === Contract.contractAmount
}

export interface Rfi {
  num: string;
  description: string;
  issueDate: string; // ISO
  required: string; // ISO
  received: string | null; // ISO or null when open
  costImpact: number;
  status: LogStatus;
}

export interface Submittal {
  num: string;
  description: string;
  vendor: string | null;
  issueDate: string;
  required: string;
  received: string | null;
  status: LogStatus;
}

export interface DelayEvent {
  num: string;
  description: string;
  start: string; // ISO
  end: string; // ISO
  days: number;
}

export interface ProcurementItem {
  item: string;
  committed: boolean;
  purchased: boolean;
  vendor: string;
  costCodes: string[]; // resolves to PO numbers via poForCode()
  expectedDelivery: string;
  status: ProcStatus;
}

export interface Milestone {
  name: string;
  scheduled: string; // ISO
  actual: string | null; // ISO or null
  status: MilestoneStatus;
}

// ---------------------------------------------------------------------------
// "Today" — the workbook is presented as of mid-June 2026 (finishes phase).
// Aging / overdue indicators compute against this date.
// ---------------------------------------------------------------------------
export const TODAY = new Date(2026, 5, 13); // Jun 13, 2026

// ---------------------------------------------------------------------------
// Project & contractor
// ---------------------------------------------------------------------------
export const PROJECT = {
  name: "Longleaf Amenity Center",
  lot: "Austin, TX 78701",
  location: "Austin, TX 78701",
  scheduleMonths: 18,
  startDate: "2025-03-03",
  targetCompletion: "2026-10-02",
};

export const CONTRACTOR = {
  name: "Dunrite Construction Group",
  address: "Austin, TX",
};

export const COMPANY = {
  name: "Dunrite Construction Group LLC",
  tagline: "Project Management Workbook",
};

// ---------------------------------------------------------------------------
// Budget inputs (only raw inputs are stored — derived values are selectors)
// ---------------------------------------------------------------------------
export const BUDGET_INPUTS = {
  originalControlEstimate: 8_450_000,
  approvedNOCIs: 312_500,
  contingencyAllowance: 250_000,
  contingencyDrawn: 334_200,
};

// ---------------------------------------------------------------------------
// 2.2 Vendors (trade-matched roster — never assign a vendor outside its trade)
// ---------------------------------------------------------------------------
export const VENDORS: Vendor[] = [
  { name: "Abaco Sitework Ltd.", trades: ["Sitework", "Excavation", "Landscaping/Hardscape"] },
  { name: "Bahama Concrete Co.", trades: ["Concrete", "Piles/Caissons", "Masonry", "Cistern"] },
  { name: "Island Steel Fabricators", trades: ["Structural Steel", "Metal Stud Framing"] },
  { name: "Coastal Framing LLC", trades: ["Rough Framing", "Heavy Timber", "Decks", "Exterior/Interior Stairs"] },
  { name: "Tropic Roofing Systems", trades: ["Roofing", "Copper Flashing", "Gutters"] },
  { name: "Sandpiper Insulation Co.", trades: ["Icynene Insulation"] },
  { name: "Reef Mechanical", trades: ["HVAC"] },
  { name: "Northshore Plumbing", trades: ["Plumbing"] },
  { name: "BlueWave Electric", trades: ["Electrical"] },
  {
    name: "Marsh Harbour Millwork",
    trades: ["Cabinetry", "Casework", "Interior Doors", "Trim", "Shelving", "Door Hardware"],
  },
  { name: "Cay Tile & Stone", trades: ["Tile", "Stone Veneer", "Countertops"] },
  { name: "Guana Painting Co.", trades: ["Painting & Coatings"] },
  { name: "Island Glazing Ltd.", trades: ["Windows", "Exterior Doors", "Shutters"] },
  { name: "Atlantic Pools & Spa", trades: ["Pool & Spa"] },
  { name: "Abaco Pest Solutions", trades: ["Termite Control"] },
];

// ---------------------------------------------------------------------------
// 2.3 Purchasing Log — 30 cost codes (exact values)
// Internal trade tag is used only to match bids to the right losing bidders.
// ---------------------------------------------------------------------------
interface ContractSeed extends Contract {
  trade: string;
  issueDate: string; // PO issue date (used to derive PO Log)
}

const CONTRACT_SEEDS: ContractSeed[] = [
  {
    code: "02-200",
    description: "Site Preparation & Plant Salvage",
    originalBudget: 85_000,
    subcontractor: "Abaco Sitework Ltd.",
    contractAmount: 78_500,
    trade: "sitework",
    issueDate: "2025-03-06",
  },
  {
    code: "02-220",
    description: "Excavate & Backfill",
    originalBudget: 142_000,
    subcontractor: "Abaco Sitework Ltd.",
    contractAmount: 149_800,
    trade: "sitework",
    issueDate: "2025-03-13",
  },
  {
    code: "02-225",
    description: "Cistern",
    originalBudget: 118_500,
    subcontractor: "Bahama Concrete Co.",
    contractAmount: 121_300,
    trade: "concrete",
    issueDate: "2025-04-09",
  },
  {
    code: "02-350",
    description: "Piles and Caissons",
    originalBudget: 395_000,
    subcontractor: "Bahama Concrete Co.",
    contractAmount: 412_600,
    trade: "concrete",
    issueDate: "2025-04-02",
  },
  {
    code: "02-362",
    description: "Termite Control",
    originalBudget: 18_500,
    subcontractor: "Abaco Pest Solutions",
    contractAmount: 17_200,
    trade: "pest",
    issueDate: "2025-03-21",
  },
  {
    code: "02-900",
    description: "Landscaping / Hardscape",
    originalBudget: 265_000,
    subcontractor: "Abaco Sitework Ltd.",
    contractAmount: 265_000,
    trade: "sitework",
    issueDate: "2026-01-27",
  },
  {
    code: "03-110",
    description: "SHELL (Structural Concrete)",
    originalBudget: 720_000,
    subcontractor: "Bahama Concrete Co.",
    contractAmount: 698_400,
    trade: "concrete",
    issueDate: "2025-04-24",
  },
  {
    code: "04-220",
    description: "SHELL (Concrete Unit Masonry)",
    originalBudget: 340_000,
    subcontractor: "Bahama Concrete Co.",
    contractAmount: 351_250,
    trade: "concrete",
    issueDate: "2025-05-08",
  },
  {
    code: "05-120",
    description: "SHELL (Structural Steel)",
    originalBudget: 285_000,
    subcontractor: "Island Steel Fabricators",
    contractAmount: 279_900,
    trade: "steel",
    issueDate: "2025-06-03",
  },
  {
    code: "05-200",
    description: "Metal Stud Framing, backing, blocking",
    originalBudget: 96_500,
    subcontractor: "Island Steel Fabricators",
    contractAmount: 94_200,
    trade: "steel",
    issueDate: "2025-07-01",
  },
  {
    code: "06-110",
    description: "SHELL (Rough Framing)",
    originalBudget: 610_000,
    subcontractor: "Coastal Framing LLC",
    contractAmount: 624_750,
    trade: "carpentry",
    issueDate: "2025-06-18",
  },
  {
    code: "06-270",
    description: "Closet Shelving",
    originalBudget: 42_500,
    subcontractor: "Marsh Harbour Millwork",
    contractAmount: 39_800,
    trade: "millwork",
    issueDate: "2025-12-11",
  },
  {
    code: "06-400",
    description: "Exterior Architectural Woodwork — Decks & Railing",
    originalBudget: 318_000,
    subcontractor: "Coastal Framing LLC",
    contractAmount: 326_400,
    trade: "carpentry",
    issueDate: "2025-10-07",
  },
  {
    code: "06-410",
    description: "Custom Casework — Cabinets & Mirrors",
    originalBudget: 365_000,
    subcontractor: "Marsh Harbour Millwork",
    contractAmount: 380_200,
    trade: "millwork",
    issueDate: "2025-10-30",
  },
  {
    code: "06-420",
    description: "Exterior Stairs / Railings / Columns",
    originalBudget: 104_000,
    subcontractor: "Coastal Framing LLC",
    contractAmount: 99_600,
    trade: "carpentry",
    issueDate: "2025-10-20",
  },
  {
    code: "06-430",
    description: "Interior Stairs and Handrail",
    originalBudget: 88_000,
    subcontractor: "Coastal Framing LLC",
    contractAmount: 86_500,
    trade: "carpentry",
    issueDate: "2025-12-03",
  },
  {
    code: "06-450",
    description: "Standing and Running Trim",
    originalBudget: 162_000,
    subcontractor: "Marsh Harbour Millwork",
    contractAmount: 158_300,
    trade: "millwork",
    issueDate: "2025-11-24",
  },
  {
    code: "07-200",
    description: "Icynene Insulation",
    originalBudget: 76_000,
    subcontractor: "Sandpiper Insulation Co.",
    contractAmount: 79_400,
    trade: "insulation",
    issueDate: "2025-07-29",
  },
  {
    code: "07-310",
    description: "Shingles and Copper Flashing",
    originalBudget: 412_000,
    subcontractor: "Tropic Roofing Systems",
    contractAmount: 405_800,
    trade: "roofing",
    issueDate: "2025-07-16",
  },
  {
    code: "07-460",
    description: "Exterior Siding / Stone Veneer",
    originalBudget: 298_000,
    subcontractor: "Cay Tile & Stone",
    contractAmount: 309_700,
    trade: "stone",
    issueDate: "2025-09-09",
  },
  {
    code: "07-770",
    description: "Gutters and Downspouts",
    originalBudget: 54_500,
    subcontractor: "Tropic Roofing Systems",
    contractAmount: 52_900,
    trade: "roofing",
    issueDate: "2025-09-24",
  },
  {
    code: "08-200",
    description: "Interior Doors",
    originalBudget: 128_000,
    subcontractor: "Marsh Harbour Millwork",
    contractAmount: 124_600,
    trade: "millwork",
    issueDate: "2025-11-12",
  },
  {
    code: "08-610",
    description: "Exterior Doors, Windows, & Shutters",
    originalBudget: 685_000,
    subcontractor: "Island Glazing Ltd.",
    contractAmount: 712_400,
    trade: "glazing",
    issueDate: "2025-05-15",
  },
  {
    code: "08-710",
    description: "Door Hardware (interior)",
    originalBudget: 46_500,
    subcontractor: "Marsh Harbour Millwork",
    contractAmount: 44_100,
    trade: "millwork",
    issueDate: "2025-12-18",
  },
  {
    code: "09-300",
    description: "Tile & Stone Finishes",
    originalBudget: 245_000,
    subcontractor: "Cay Tile & Stone",
    contractAmount: 251_800,
    trade: "stone",
    issueDate: "2026-01-08",
  },
  {
    code: "09-900",
    description: "Painting & Coatings",
    originalBudget: 165_000,
    subcontractor: "Guana Painting Co.",
    contractAmount: 159_500,
    trade: "painting",
    issueDate: "2026-01-15",
  },
  {
    code: "13-150",
    description: "Pool & Spa",
    originalBudget: 385_000,
    subcontractor: "Atlantic Pools & Spa",
    contractAmount: 392_000,
    trade: "pool",
    issueDate: "2025-05-27",
  },
  {
    code: "15-400",
    description: "Plumbing",
    originalBudget: 312_000,
    subcontractor: "Northshore Plumbing",
    contractAmount: 304_800,
    trade: "plumbing",
    issueDate: "2025-08-05",
  },
  {
    code: "15-700",
    description: "HVAC",
    originalBudget: 298_000,
    subcontractor: "Reef Mechanical",
    contractAmount: 307_400,
    trade: "hvac",
    issueDate: "2025-08-12",
  },
  {
    code: "16-100",
    description: "Electrical",
    originalBudget: 402_000,
    subcontractor: "BlueWave Electric",
    contractAmount: 396_200,
    trade: "electrical",
    issueDate: "2025-08-21",
  },
];

export const CONTRACTS: Contract[] = CONTRACT_SEEDS.map(
  ({ code, description, originalBudget, subcontractor, contractAmount }) => ({
    code,
    description,
    originalBudget,
    subcontractor,
    contractAmount,
  }),
);

export const COST_CODES: CostCode[] = CONTRACT_SEEDS.map((c) => ({
  code: c.code,
  description: c.description,
}));

// ---------------------------------------------------------------------------
// 2.4 Purchase Order Log (derived) — one PO per contract, numbered strictly
// in issue-date order.
// ---------------------------------------------------------------------------
export const PURCHASE_ORDERS: PurchaseOrder[] = [...CONTRACT_SEEDS]
  .sort((a, b) => a.issueDate.localeCompare(b.issueDate) || a.code.localeCompare(b.code))
  .map((c, i) => ({
    po: `PO-${String(i + 1).padStart(3, "0")}`,
    code: c.code,
    vendor: c.subcontractor,
    description: c.description,
    issueDate: c.issueDate,
    amount: c.contractAmount,
  }));

const PO_BY_CODE: Record<string, PurchaseOrder> = Object.fromEntries(PURCHASE_ORDERS.map((p) => [p.code, p]));

export function poForCode(code: string): string {
  return PO_BY_CODE[code]?.po ?? "—";
}

// ---------------------------------------------------------------------------
// 2.5 Bid Log (derived) — awarded amount === contract amount.
// ---------------------------------------------------------------------------
const LOSING_BIDDERS: Record<string, string[]> = {
  sitework: ["Eleuthera Siteworks", "Treasure Cay Earthmoving"],
  concrete: ["Treasure Cay Concrete", "Great Abaco Concrete", "Hope Town Masonry"],
  steel: ["Freeport Steel Works", "Nassau Fabricators"],
  carpentry: ["Hope Town Carpentry", "Man-O-War Builders", "Eleuthera Builders Group"],
  roofing: ["Cay Roofing & Sheet Metal", "Sunshine State Roofing"],
  insulation: ["Gulf Coast Insulation"],
  hvac: ["Tradewinds Mechanical", "Bay Area HVAC"],
  plumbing: ["Conch Plumbing Co.", "Lucayan Plumbing"],
  electrical: ["Lucayan Electrical", "Bahama Power Systems"],
  millwork: ["Hope Town Cabinetry", "Tampa Bay Millwork"],
  stone: ["Marble & Granite Bahamas", "Sun Coast Stone"],
  painting: ["Coastal Coatings LLC", "Bayside Painters"],
  glazing: ["Hurricane Glass & Glazing", "Storm-Tite Windows"],
  pool: ["Crystal Waters Pools", "Blue Lagoon Spa"],
  pest: ["Tropic Pest Control"],
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export const BIDS: Bid[] = CONTRACT_SEEDS.map((c, i) => {
  const pool = LOSING_BIDDERS[c.trade] ?? ["Regional Bidder"];
  const awarded = c.contractAmount;

  // Two realism exceptions where the low bid was rejected.
  if (c.code === "04-220") {
    return {
      code: c.code,
      description: c.description,
      budget: c.originalBudget,
      awardedVendor: c.subcontractor,
      awardedAmount: awarded,
      footnote: "Low bid $338,900 (Treasure Cay Concrete) rejected — incomplete insurance certificates.",
      bids: [
        { bidder: "Treasure Cay Concrete", amount: 338_900, status: "rejected", note: "incomplete insurance certs" },
        { bidder: c.subcontractor, amount: awarded, status: "awarded" },
        { bidder: "Great Abaco Concrete", amount: 372_400, status: "qualified" },
        { bidder: "Hope Town Masonry", amount: 389_750, status: "qualified" },
      ],
    };
  }
  if (c.code === "08-610") {
    return {
      code: c.code,
      description: c.description,
      budget: c.originalBudget,
      awardedVendor: c.subcontractor,
      awardedAmount: awarded,
      footnote: "Low bid $689,500 (Hurricane Glass & Glazing) rejected — non-compliant hurricane rating.",
      bids: [
        {
          bidder: "Hurricane Glass & Glazing",
          amount: 689_500,
          status: "rejected",
          note: "non-compliant hurricane rating",
        },
        { bidder: c.subcontractor, amount: awarded, status: "awarded" },
        { bidder: "Storm-Tite Windows", amount: 754_900, status: "qualified" },
      ],
    };
  }

  // Standard rows: awarded vendor is the low qualified bid; 1–3 higher losers.
  const count = 2 + ((i * 7 + 3) % 3); // 2..4 total bids
  const losers = count - 1;
  const pct1 = 0.04 + ((i * 13) % 6) / 100; // 4–9%
  const pct2 = 0.08 + ((i * 17) % 9) / 100; // 8–16%
  const pct3 = 0.14 + ((i * 11) % 7) / 100; // 14–20%
  const pcts = [pct1, pct2, pct3];

  const bids: BidEntry[] = [{ bidder: c.subcontractor, amount: awarded, status: "awarded" }];
  for (let l = 0; l < losers; l++) {
    const amt = roundTo(awarded * (1 + pcts[l]), 100) + ((i * 37 + l * 53) % 5) * 10;
    bids.push({ bidder: pool[l % pool.length], amount: amt, status: "qualified" });
  }

  return {
    code: c.code,
    description: c.description,
    budget: c.originalBudget,
    awardedVendor: c.subcontractor,
    awardedAmount: awarded,
    bids,
  };
});

// ---------------------------------------------------------------------------
// 2.6 RFI Log (10 rows; 3 open)
// ---------------------------------------------------------------------------
export const RFIS: Rfi[] = [
  {
    num: "001",
    description: "Confirm rebar spacing at grade beam GB-3",
    issueDate: "2025-04-08",
    required: "2025-04-18",
    received: "2025-04-15",
    costImpact: 1_450,
    status: "closed",
  },
  {
    num: "002",
    description: "Clarify window head height at master suite",
    issueDate: "2025-05-05",
    required: "2025-05-15",
    received: "2025-05-12",
    costImpact: 0,
    status: "closed",
  },
  {
    num: "003",
    description: "Verify finish floor elevation at lanai",
    issueDate: "2025-06-11",
    required: "2025-06-20",
    received: "2025-06-18",
    costImpact: 0,
    status: "closed",
  },
  {
    num: "004",
    description: "Confirm electrical panel location, garage",
    issueDate: "2025-07-09",
    required: "2025-07-18",
    received: "2025-07-22",
    costImpact: 5_800,
    status: "closed",
  },
  {
    num: "005",
    description: "Stone veneer coursing pattern at entry",
    issueDate: "2025-08-14",
    required: "2025-08-25",
    received: "2025-08-21",
    costImpact: 0,
    status: "closed",
  },
  {
    num: "006",
    description: "Pool equipment pad dimensions",
    issueDate: "2025-09-03",
    required: "2025-09-12",
    received: "2025-09-10",
    costImpact: 0,
    status: "closed",
  },
  {
    num: "007",
    description: "HVAC chase routing through truss bay 4",
    issueDate: "2025-10-07",
    required: "2025-10-16",
    received: "2025-10-20",
    costImpact: 10_150,
    status: "closed",
  },
  {
    num: "008",
    description: "Confirm cabinet toe-kick height, butler's pantry",
    issueDate: "2026-05-18",
    required: "2026-05-28",
    received: null,
    costImpact: 0,
    status: "open",
  },
  {
    num: "009",
    description: "Countertop edge profile at kitchen island",
    issueDate: "2026-05-29",
    required: "2026-06-08",
    received: null,
    costImpact: 0,
    status: "open",
  },
  {
    num: "010",
    description: "Generator clearance to property line",
    issueDate: "2026-06-05",
    required: "2026-06-15",
    received: null,
    costImpact: 14_500,
    status: "open",
  },
];

// ---------------------------------------------------------------------------
// 2.7 Submittal Log (10 rows; 4 open)
// ---------------------------------------------------------------------------
export const SUBMITTALS: Submittal[] = [
  {
    num: "001",
    description: "Structural steel shop drawings",
    vendor: "Island Steel Fabricators",
    issueDate: "2025-04-15",
    required: "2025-04-30",
    received: "2025-04-28",
    status: "closed",
  },
  {
    num: "002",
    description: "Window & door schedule",
    vendor: "Island Glazing Ltd.",
    issueDate: "2025-05-02",
    required: "2025-05-20",
    received: "2025-05-16",
    status: "closed",
  },
  {
    num: "003",
    description: "Plumbing fixture cut sheets",
    vendor: "Northshore Plumbing",
    issueDate: "2025-07-14",
    required: "2025-07-28",
    received: "2025-07-25",
    status: "closed",
  },
  {
    num: "004",
    description: "Lighting fixture submittals",
    vendor: "BlueWave Electric",
    issueDate: "2025-08-11",
    required: "2025-08-26",
    received: "2025-08-22",
    status: "closed",
  },
  {
    num: "005",
    description: "Cabinetry shop drawings",
    vendor: "Marsh Harbour Millwork",
    issueDate: "2025-09-08",
    required: "2025-09-25",
    received: "2025-09-22",
    status: "closed",
  },
  {
    num: "006",
    description: "Tile & stone samples",
    vendor: "Cay Tile & Stone",
    issueDate: "2025-10-06",
    required: "2025-10-21",
    received: "2025-10-18",
    status: "closed",
  },
  {
    num: "007",
    description: "Countertop slab samples",
    vendor: "Cay Tile & Stone",
    issueDate: "2026-05-06",
    required: "2026-06-05",
    received: null,
    status: "open",
  },
  {
    num: "008",
    description: "Appliance specifications",
    vendor: null,
    issueDate: "2026-05-20",
    required: "2026-06-19",
    received: null,
    status: "open",
  },
  {
    num: "009",
    description: "Pool & spa equipment data",
    vendor: "Atlantic Pools & Spa",
    issueDate: "2026-05-27",
    required: "2026-06-26",
    received: null,
    status: "open",
  },
  {
    num: "010",
    description: "MEP trim fixture schedule",
    vendor: null,
    issueDate: "2026-06-02",
    required: "2026-07-02",
    received: null,
    status: "open",
  },
];

// ---------------------------------------------------------------------------
// 2.8 Schedule — milestones + delays
// ---------------------------------------------------------------------------
export const MILESTONES: Milestone[] = [
  { name: "Pour Slab", scheduled: "2025-04-18", actual: "2025-04-21", status: "complete" },
  { name: "Flashing & Dry In", scheduled: "2025-07-30", actual: "2025-08-04", status: "complete" },
  { name: "MEPS Complete", scheduled: "2025-10-12", actual: "2025-10-15", status: "complete" },
  { name: "Drywall Complete", scheduled: "2026-01-09", actual: "2026-01-28", status: "complete" },
  { name: "Install Cabinets", scheduled: "2026-03-06", actual: "2026-03-19", status: "complete" },
  { name: "Complete Countertops", scheduled: "2026-04-10", actual: null, status: "in-progress" },
  { name: "MEP Trim Complete", scheduled: "2026-05-22", actual: null, status: "in-progress" },
  { name: "Exterior Finishes (Scaffold Down)", scheduled: "2026-07-17", actual: null, status: "upcoming" },
  { name: "House Complete & Ready for Furniture", scheduled: "2026-10-02", actual: null, status: "upcoming" },
];

export const DELAYS: DelayEvent[] = [
  { num: "1", description: "Concrete cure delay, extended rain", start: "2025-05-19", end: "2025-05-21", days: 2 },
  {
    num: "2",
    description: "Late structural steel delivery (port delay)",
    start: "2025-06-09",
    end: "2025-06-16",
    days: 7,
  },
  { num: "3", description: "Hurricane preparation & shutdown", start: "2025-08-28", end: "2025-09-02", days: 5 },
  { num: "4", description: "Owner-requested kitchen layout revision", start: "2025-11-03", end: "2025-11-06", days: 3 },
  { num: "5", description: "Customs hold on imported stone veneer", start: "2025-12-01", end: "2025-12-09", days: 8 },
].sort((a, b) => a.start.localeCompare(b.start));

export const DELAY_NOTE =
  "Delays partially absorbed through re-sequencing; current finish-phase milestones tracking ~2–3 weeks behind baseline. Target completion date unchanged.";

// ---------------------------------------------------------------------------
// 2.9 Procurement Buyout Log — PO refs resolve to the PO Log via poForCode()
// ---------------------------------------------------------------------------
export const PROCUREMENT: ProcurementItem[] = [
  {
    item: "Re-Bar package",
    committed: true,
    purchased: true,
    vendor: "Bahama Concrete Co.",
    costCodes: ["03-110"],
    expectedDelivery: "Delivered",
    status: "complete",
  },
  {
    item: "Heavy Timber & Look-Outs",
    committed: true,
    purchased: true,
    vendor: "Coastal Framing LLC",
    costCodes: ["06-110"],
    expectedDelivery: "Delivered",
    status: "complete",
  },
  {
    item: "Windows & Exterior Doors",
    committed: true,
    purchased: true,
    vendor: "Island Glazing Ltd.",
    costCodes: ["08-610"],
    expectedDelivery: "Delivered Apr 2026",
    status: "complete",
  },
  {
    item: "Cabinetry",
    committed: true,
    purchased: true,
    vendor: "Marsh Harbour Millwork",
    costCodes: ["06-410"],
    expectedDelivery: "Delivered Mar 2026",
    status: "complete",
  },
  {
    item: "Countertop slabs",
    committed: true,
    purchased: false,
    vendor: "Cay Tile & Stone",
    costCodes: ["09-300"],
    expectedDelivery: "Jul 2026",
    status: "in-progress",
  },
  {
    item: "MEP trim fixtures",
    committed: true,
    purchased: false,
    vendor: "Reef Mechanical / Northshore Plumbing / BlueWave Electric",
    costCodes: ["15-700", "15-400", "16-100"],
    expectedDelivery: "Jun–Jul 2026",
    status: "in-progress",
  },
  {
    item: "Appliances",
    committed: false,
    purchased: false,
    vendor: "TBD (owner selection pending)",
    costCodes: [],
    expectedDelivery: "Aug 2026",
    status: "not-started",
  },
  {
    item: "Pool & Spa equipment package",
    committed: true,
    purchased: false,
    vendor: "Atlantic Pools & Spa",
    costCodes: ["13-150"],
    expectedDelivery: "Jul 2026",
    status: "in-progress",
  },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
export const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2025-04-21" → "Apr 21, 2025" */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Apr 21, 2025" range with smart month/year elision. */
export function formatDateRange(startISO: string, endISO: string): string {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${formatDate(startISO)} – ${formatDate(endISO)}`;
}

/** Whole days between two dates. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Days a log item has been open (issue → received, or issue → today). */
export function daysOpen(item: { issueDate: string; received: string | null }): number {
  const end = item.received ? parseISO(item.received) : TODAY;
  return Math.max(0, daysBetween(parseISO(item.issueDate), end));
}

/** Open AND past its required date. */
export function isOverdue(item: { required: string; status: LogStatus }): boolean {
  return item.status === "open" && TODAY > parseISO(item.required);
}

// ---------------------------------------------------------------------------
// Selectors — every total / KPI is COMPUTED here, never hardcoded in a page.
// ---------------------------------------------------------------------------
export const getOriginalControlEstimate = () => BUDGET_INPUTS.originalControlEstimate;
export const getApprovedNOCIs = () => BUDGET_INPUTS.approvedNOCIs;
export const getCurrentBudget = () => BUDGET_INPUTS.originalControlEstimate + BUDGET_INPUTS.approvedNOCIs;

export const getTotalBudget = () => CONTRACTS.reduce((a, c) => a + c.originalBudget, 0);
export const getTotalContracted = () => CONTRACTS.reduce((a, c) => a + c.contractAmount, 0);
export const getNetVariance = () => getTotalBudget() - getTotalContracted();

export const getCommittedToDate = () => getTotalContracted();
export const getCommittedPct = () => Math.round((getCommittedToDate() / getCurrentBudget()) * 100);

export const getContingencyVariance = () => BUDGET_INPUTS.contingencyAllowance - BUDGET_INPUTS.contingencyDrawn;
export const getContingencyVariancePct = () => (getContingencyVariance() / getCurrentBudget()) * 100;

export const getTotalPOIssued = () => PURCHASE_ORDERS.reduce((a, p) => a + p.amount, 0);

export const getOpenRfiCount = () => RFIS.filter((r) => r.status === "open").length;
export const getOpenSubmittalCount = () => SUBMITTALS.filter((s) => s.status === "open").length;
export const getTotalDelayDays = () => DELAYS.reduce((a, d) => a + d.days, 0);

export const getCompletedMilestones = () => MILESTONES.filter((m) => m.status === "complete").length;
export const getMilestoneProgress = () => Math.round((getCompletedMilestones() / MILESTONES.length) * 100);

export const contractForCode = (code: string) => CONTRACTS.find((c) => c.code === code);
