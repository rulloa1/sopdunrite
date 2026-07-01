export const COMPANY = {
  name: "Dunrite Construction Group LLC",
  tagline: "Project Management & Standard Operating Procedures",
};

export interface Executive {
  name: string;
  title: string;
  email: string;
}

// Placeholder executives — update names and emails with the real recipients.
export const EXECUTIVES: Executive[] = [
  { name: "Executive One", title: "President", email: "exec1@dunriteconstruction.com" },
  { name: "Executive Two", title: "Vice President", email: "exec2@dunriteconstruction.com" },
  {
    name: "Executive Three",
    title: "Chief Financial Officer",
    email: "exec3@dunriteconstruction.com",
  },
  {
    name: "Executive Four",
    title: "Director of Operations",
    email: "exec4@dunriteconstruction.com",
  },
  { name: "Executive Five", title: "Project Executive", email: "exec5@dunriteconstruction.com" },
];

export const PROJECT = {
  name: "DunRite Construction Group",
  lot: "12412 Curley St, San Antonio, FL 33576",
  location: "12412 Curley St, San Antonio, FL 33576",
  scheduleMonths: 18,
  startDate: "Mar 3, 2025",
  contractCompletion: "Sep 15, 2026",
  currentCompletion: "Oct 2, 2026",
};

export const BUDGET = {
  originalControlEstimate: 8_450_000,
  approvedNOCIs: 312_500,
  currentBudget: 8_762_500,
  committed: 6_980_400,
  contingencyVariance: -84_200,
};

export type MilestoneStatus = "complete" | "in-progress" | "upcoming";
export interface Milestone {
  name: string;
  scheduled: string;
  actual: string;
  status: MilestoneStatus;
}

export const MILESTONES: Milestone[] = [
  { name: "Pour Slab", scheduled: "Apr 18, 2025", actual: "Apr 21, 2025", status: "complete" },
  {
    name: "Flashing & Dry In",
    scheduled: "Jul 30, 2025",
    actual: "Aug 4, 2025",
    status: "complete",
  },
  { name: "MEPS Complete", scheduled: "Oct 12, 2025", actual: "Oct 15, 2025", status: "complete" },
  {
    name: "Drywall Complete",
    scheduled: "Jan 9, 2026",
    actual: "In Progress",
    status: "in-progress",
  },
  { name: "Install Cabinets", scheduled: "Mar 6, 2026", actual: "—", status: "upcoming" },
  { name: "Complete Countertops", scheduled: "Apr 10, 2026", actual: "—", status: "upcoming" },
  { name: "MEP Trim Complete", scheduled: "May 22, 2026", actual: "—", status: "upcoming" },
  {
    name: "Exterior Finishes (Scaffold Down)",
    scheduled: "Jul 17, 2026",
    actual: "—",
    status: "upcoming",
  },
  {
    name: "House Complete & Ready for Furniture",
    scheduled: "Oct 2, 2026",
    actual: "—",
    status: "upcoming",
  },
];

export interface CostCode {
  code: string;
  desc: string;
}

export const COST_CODES: CostCode[] = [
  { code: "02-200", desc: "Site Preparation & Plant Salvage" },
  { code: "02-220", desc: "Excavate & Backfill" },
  { code: "02-225", desc: "Cistern" },
  { code: "02-362", desc: "Termite Control" },
  { code: "02-350", desc: "Piles and Caissons" },
  { code: "02-900", desc: "Landscaping / Hardscape" },
  { code: "03-110", desc: "SHELL (Structural Concrete)" },
  { code: "04-220", desc: "SHELL (Concrete Unit Masonry)" },
  { code: "05-120", desc: "SHELL (Structural Steel)" },
  { code: "05-200", desc: "Metal Stud Framing, backing, blocking" },
  { code: "06-110", desc: "SHELL (Rough Framing)" },
  { code: "06-270", desc: "Closet Shelving" },
  { code: "06-400", desc: "Exterior Architectural Woodwork - Decks & Railing" },
  { code: "06-420", desc: "Exterior Stairs / Railings / Columns" },
  { code: "06-410", desc: "Custom Casework - Cabinets & Mirrors" },
  { code: "06-430", desc: "Interior Stairs and Handrail" },
  { code: "06-450", desc: "Standing and Running Trim" },
  { code: "07-200", desc: "Icynene Insulation" },
  { code: "07-310", desc: "Shingles and Copper Flashing" },
  { code: "07-460", desc: "Exterior Siding / Stone Veneer" },
  { code: "07-770", desc: "Gutters and Downspouts" },
  { code: "08-200", desc: "Interior Doors" },
  { code: "08-610", desc: "Exterior Doors, Windows, & Shutters" },
  { code: "08-710", desc: "Door Hardware (interior)" },
  { code: "09-220", desc: "Stucco" },
  { code: "09-250", desc: "Drywall & Batt Insulation" },
  { code: "09-310", desc: "Floor and Wall Tile" },
  { code: "09-370", desc: "Countertops" },
  { code: "09-450", desc: "Exterior Stone - Patios" },
  { code: "09-640", desc: "Wood Flooring" },
  { code: "09-900", desc: "Painting - Int/Ext" },
  { code: "10-810", desc: "Toilet & Bath Accessories" },
  { code: "10-820", desc: "Shower Enclosures" },
  { code: "11-450", desc: "Kitchen Appliances" },
  { code: "13-154", desc: "BBQ / Outdoor Kitchen" },
  { code: "13-155", desc: "Swimming Pool, Spa & Water Features" },
  { code: "13-300", desc: "Fireplace & Flue" },
  { code: "13-900", desc: "Cart Garage" },
  { code: "15-100", desc: "Plumbing (includes propane)" },
  { code: "15-400", desc: "Plumbing Fixtures" },
  { code: "15-500", desc: "HVAC" },
  { code: "16-100", desc: "Electrical" },
  { code: "16-105", desc: "Temporary Power" },
  { code: "16-110", desc: "Generator and Surge Protection" },
  { code: "16-500", desc: "Lighting Fixtures" },
  { code: "16-800", desc: "Audio / Video - Pre Wire" },
];

const SUBS = [
  "Abaco Sitework Ltd.",
  "Bahama Concrete Co.",
  "Island Steel Fabricators",
  "Coastal Framing LLC",
  "Tropic Roofing Systems",
  "Reef Mechanical",
  "BlueWave Electric",
  "Marsh Harbour Millwork",
  "Cay Tile & Stone",
  "Northshore Plumbing",
  "Guana Painting Co.",
  "Atlantic Pools & Spa",
];
const fmt = (n: number) => n;

export interface PurchaseRow {
  code: string;
  desc: string;
  originalBudget: number;
  subcontractor: string;
  contractAmount: number;
  vendor: string;
  poNumber: string;
  variance: number;
}

export const PURCHASING: PurchaseRow[] = COST_CODES.slice(0, 24).map((c, i) => {
  const base = 40_000 + ((i * 37_123) % 480_000);
  const contract = base + (((i * 13) % 9) - 4) * 2_500;
  return {
    code: c.code,
    desc: c.desc,
    originalBudget: fmt(base),
    subcontractor: SUBS[i % SUBS.length],
    contractAmount: fmt(contract),
    vendor: SUBS[(i + 3) % SUBS.length],
    poNumber: `PO-${String(i + 1).padStart(3, "0")}`,
    variance: fmt(base - contract),
  };
});

export interface BidRow {
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

export const BIDS: BidRow[] = COST_CODES.slice(0, 20).map((c, i) => {
  const budget = 55_000 + ((i * 51_777) % 520_000);
  const low = budget - ((i * 3_300) % 28_000);
  return {
    code: c.code,
    desc: c.desc,
    contacted: 2 + (i % 4),
    lowBid: fmt(low),
    bid2: fmt(low + 9_500 + (i % 5) * 1_200),
    bid3: fmt(low + 21_000 + (i % 3) * 3_400),
    awardedTo: SUBS[i % SUBS.length],
    budget: fmt(budget),
    variance: fmt(budget - low),
  };
});

export interface PORow {
  po: string;
  code: string;
  vendor: string;
  description: string;
  issueDate: string;
  amount: number;
}

export const PURCHASE_ORDERS: PORow[] = Array.from({ length: 14 }).map((_, i) => {
  const c = COST_CODES[i + 2];
  return {
    po: String(i + 1).padStart(3, "0"),
    code: c.code,
    vendor: SUBS[i % SUBS.length],
    description: c.desc,
    issueDate: `2025-${String((i % 9) + 3).padStart(2, "0")}-1${i % 9}`,
    amount: fmt(18_000 + ((i * 27_311) % 240_000)),
  };
});

export type LogStatus = "open" | "closed";

export interface RFIRow {
  num: string;
  description: string;
  issueDate: string;
  required: string;
  received: string;
  costImpact: number;
  status: LogStatus;
}

const RFI_DESCS = [
  "Confirm rebar spacing at grade beam GB-3",
  "Clarify window head height at master suite",
  "Verify finish floor elevation at lanai",
  "Confirm electrical panel location, garage",
  "Stone veneer coursing pattern at entry",
  "Pool equipment pad dimensions",
  "HVAC chase routing through truss bay 4",
  "Cabinet toe-kick height in butler's pantry",
  "Roof slope transition at dormer",
  "Generator clearance requirements",
];

export const RFIS: RFIRow[] = RFI_DESCS.map((d, i) => ({
  num: String(i + 1).padStart(3, "0"),
  description: d,
  issueDate: `2025-${String((i % 8) + 4).padStart(2, "0")}-0${(i % 8) + 1}`,
  required: `2025-${String((i % 8) + 4).padStart(2, "0")}-1${(i % 8) + 1}`,
  received: i < 7 ? `2025-${String((i % 8) + 4).padStart(2, "0")}-1${(i % 8) + 3}` : "—",
  costImpact: i % 3 === 0 ? (i + 1) * 1_450 : 0,
  status: i < 7 ? "closed" : "open",
}));

export interface SubmittalRow {
  num: string;
  description: string;
  issueDate: string;
  required: string;
  received: string;
  status: LogStatus;
}

const SUB_DESCS = [
  "Structural steel shop drawings",
  "Window & door schedule",
  "Cabinetry shop drawings",
  "Tile & stone samples",
  "Plumbing fixture cut sheets",
  "Lighting fixture submittals",
  "Roofing material data",
  "HVAC equipment submittals",
  "Pool & spa equipment",
  "Appliance specifications",
];

export const SUBMITTALS: SubmittalRow[] = SUB_DESCS.map((d, i) => ({
  num: String(i + 1).padStart(3, "0"),
  description: d,
  issueDate: `2025-${String((i % 7) + 4).padStart(2, "0")}-0${(i % 7) + 2}`,
  required: `2025-${String((i % 7) + 5).padStart(2, "0")}-0${(i % 7) + 2}`,
  received: i < 6 ? `2025-${String((i % 7) + 4).padStart(2, "0")}-2${i % 7}` : "—",
  status: i < 6 ? "closed" : "open",
}));

export interface DelayRow {
  num: string;
  description: string;
  impactedDates: string;
  days: number;
}

export const DELAYS: DelayRow[] = [
  {
    num: "1",
    description: "Hurricane preparation & shutdown",
    impactedDates: "Aug 28 – Sep 2, 2025",
    days: 5,
  },
  {
    num: "2",
    description: "Late structural steel delivery (port delay)",
    impactedDates: "Jun 9 – Jun 16, 2025",
    days: 7,
  },
  {
    num: "3",
    description: "Owner-requested kitchen layout revision",
    impactedDates: "Nov 3 – Nov 6, 2025",
    days: 3,
  },
  {
    num: "4",
    description: "Concrete cure delay, extended rain",
    impactedDates: "May 19 – May 21, 2025",
    days: 2,
  },
  {
    num: "5",
    description: "Customs hold on imported stone veneer",
    impactedDates: "Dec 1 – Dec 9, 2025",
    days: 8,
  },
];

export type ProcStatus = "complete" | "in-progress" | "not-started";
export interface ProcRow {
  item: string;
  committed: boolean;
  purchased: boolean;
  vendor: string;
  poNumber: string;
  expectedDelivery: string;
  status: ProcStatus;
}

export const PROCUREMENT: ProcRow[] = [
  {
    item: "Finish Matrix",
    committed: true,
    purchased: true,
    vendor: "Marsh Harbour Millwork",
    poNumber: "PO-004",
    expectedDelivery: "Delivered",
    status: "complete",
  },
  {
    item: "Re-Bar",
    committed: true,
    purchased: true,
    vendor: "Bahama Concrete Co.",
    poNumber: "PO-002",
    expectedDelivery: "Delivered",
    status: "complete",
  },
  {
    item: "MEP Contracts",
    committed: true,
    purchased: true,
    vendor: "Reef Mechanical",
    poNumber: "PO-006",
    expectedDelivery: "Delivered",
    status: "complete",
  },
  {
    item: "Heavy Timber & Look Outs",
    committed: true,
    purchased: true,
    vendor: "Coastal Framing LLC",
    poNumber: "PO-005",
    expectedDelivery: "Apr 2026",
    status: "in-progress",
  },
  {
    item: "Windows & Exterior Doors",
    committed: true,
    purchased: false,
    vendor: "Island Glazing",
    poNumber: "—",
    expectedDelivery: "May 2026",
    status: "in-progress",
  },
  {
    item: "Cabinetry",
    committed: true,
    purchased: false,
    vendor: "Marsh Harbour Millwork",
    poNumber: "—",
    expectedDelivery: "Mar 2026",
    status: "in-progress",
  },
  {
    item: "Countertops",
    committed: false,
    purchased: false,
    vendor: "Cay Tile & Stone",
    poNumber: "—",
    expectedDelivery: "Apr 2026",
    status: "not-started",
  },
  {
    item: "Appliances",
    committed: false,
    purchased: false,
    vendor: "—",
    poNumber: "—",
    expectedDelivery: "Jun 2026",
    status: "not-started",
  },
  {
    item: "Pool & Spa Equipment",
    committed: false,
    purchased: false,
    vendor: "Atlantic Pools & Spa",
    poNumber: "—",
    expectedDelivery: "Jul 2026",
    status: "not-started",
  },
];

export const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
