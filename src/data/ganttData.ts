// Project Gantt schedule reconstructed from the DunRite Construction Group
// Gantt chart (Dunrite Construction Group). Week indices are 0-based and map
// onto WEEKS below; durationDays is the planned duration from the schedule.

export const GANTT_META = {
  project: "DunRite Construction Group",
  company: "Dunrite Construction Group",
  contact: "Michael E. Chandler · 352-588-4050",
  startDate: "Aug 15, 2026",
  substantialCompletion: "Dec 15, 2026",
  status: "Pending",
  total: 1_350_000,
};

// 20 weekly columns beginning Mon Aug 17, 2026 through the week of Dec 28, 2026.
const FIRST_WEEK = new Date(2026, 7, 17); // Aug 17, 2026 (month is 0-based)

export interface GanttWeek {
  index: number;
  label: string; // e.g. "8/17"
  month: string; // e.g. "Aug '26"
  monthIndex: number;
}

export const WEEKS: GanttWeek[] = Array.from({ length: 20 }, (_, i) => {
  const d = new Date(FIRST_WEEK);
  d.setDate(d.getDate() + i * 7);
  return {
    index: i,
    label: `${d.getMonth() + 1}/${d.getDate()}`,
    month: `${d.toLocaleString("en-US", { month: "short" })} '${String(d.getFullYear()).slice(2)}`,
    monthIndex: d.getFullYear() * 12 + d.getMonth(),
  };
});

export interface GanttTask {
  code: string;
  name: string;
  division: string;
  startWeek: number; // inclusive
  endWeek: number; // inclusive
  durationDays: number | null;
  budget: number;
}

export const GANTT_TASKS: GanttTask[] = [
  // Site Work
  {
    code: "02-220",
    name: "Excavate & Backfill",
    division: "Site Work",
    startWeek: 0,
    endWeek: 1,
    durationDays: 10,
    budget: 12_500,
  },
  {
    code: "02-350",
    name: "Piles / Caissons / Foundation",
    division: "Site Work",
    startWeek: 2,
    endWeek: 4,
    durationDays: 15,
    budget: 43_000,
  },
  {
    code: "02-900",
    name: "Pavers",
    division: "Site Work",
    startWeek: 13,
    endWeek: 14,
    durationDays: 10,
    budget: 30_000,
  },
  {
    code: "02-900",
    name: "Landscaping",
    division: "Site Work",
    startWeek: 12,
    endWeek: 16,
    durationDays: 25,
    budget: 63_000,
  },
  {
    code: "02-900",
    name: "Fencing",
    division: "Site Work",
    startWeek: 12,
    endWeek: 13,
    durationDays: 10,
    budget: 36_500,
  },

  // Concrete
  {
    code: "03-110",
    name: "Structural Concrete",
    division: "Concrete",
    startWeek: 1,
    endWeek: 4,
    durationDays: 20,
    budget: 30_000,
  },

  // Masonry
  {
    code: "04-220",
    name: "Concrete Unit Masonry",
    division: "Masonry",
    startWeek: 5,
    endWeek: 8,
    durationDays: 20,
    budget: 30_500,
  },

  // Metals
  {
    code: "05-120",
    name: "Structural Steel",
    division: "Metals",
    startWeek: 2,
    endWeek: 7,
    durationDays: 20,
    budget: 20_000,
  },

  // Wood & Plastics
  {
    code: "06-110",
    name: "Rough Framing",
    division: "Wood & Plastics",
    startWeek: 8,
    endWeek: 13,
    durationDays: 30,
    budget: 19_500,
  },
  {
    code: "06-400",
    name: "Exterior Architectural Woodwork",
    division: "Wood & Plastics",
    startWeek: 10,
    endWeek: 13,
    durationDays: 15,
    budget: 18_000,
  },
  {
    code: "06-410",
    name: "Custom Millwork, Cabinets & Mirrors",
    division: "Wood & Plastics",
    startWeek: 13,
    endWeek: 15,
    durationDays: 15,
    budget: 7_500,
  },
  {
    code: "06-410",
    name: "Toilet Stalls",
    division: "Wood & Plastics",
    startWeek: 14,
    endWeek: 16,
    durationDays: 15,
    budget: 13_437.5,
  },

  // Thermal & Moisture Protection
  {
    code: "07-200",
    name: "Spray-In Expandable Insulation",
    division: "Thermal & Moisture",
    startWeek: 14,
    endWeek: 14,
    durationDays: 4,
    budget: 8_436,
  },
  {
    code: "07-310",
    name: "Shingles & Copper Flashing",
    division: "Thermal & Moisture",
    startWeek: 13,
    endWeek: 15,
    durationDays: 15,
    budget: 24_000,
  },

  // Doors & Windows
  {
    code: "08-610",
    name: "Exterior Doors & Windows",
    division: "Doors & Windows",
    startWeek: 13,
    endWeek: 14,
    durationDays: 15,
    budget: 21_500,
  },

  // Finishes
  {
    code: "09-220",
    name: "Stucco",
    division: "Finishes",
    startWeek: 15,
    endWeek: 17,
    durationDays: 15,
    budget: 15_690,
  },
  {
    code: "09-250",
    name: "Drywall & Batt Insulation",
    division: "Finishes",
    startWeek: 15,
    endWeek: 16,
    durationDays: 10,
    budget: 6_500,
  },
  {
    code: "09-310",
    name: "Floor & Wall Tile",
    division: "Finishes",
    startWeek: 9,
    endWeek: 14,
    durationDays: 30,
    budget: 21_250,
  },
  {
    code: "09-370",
    name: "Countertops",
    division: "Finishes",
    startWeek: 11,
    endWeek: 13,
    durationDays: 15,
    budget: 8_500,
  },
  {
    code: "09-900",
    name: "Painting Int / Ext",
    division: "Finishes",
    startWeek: 14,
    endWeek: 16,
    durationDays: 15,
    budget: 12_500,
  },

  // Specialties
  {
    code: "10-810",
    name: "Toilet & Bath Accessories",
    division: "Specialties",
    startWeek: 16,
    endWeek: 16,
    durationDays: 5,
    budget: 8_750,
  },

  // Special Construction
  {
    code: "13-155",
    name: "Swimming Pool",
    division: "Special Construction",
    startWeek: 2,
    endWeek: 15,
    durationDays: 90,
    budget: 477_938.75,
  },
  {
    code: "13-200",
    name: "Mail Boxes",
    division: "Special Construction",
    startWeek: 15,
    endWeek: 18,
    durationDays: 20,
    budget: 15_000,
  },

  // Mechanical
  {
    code: "15-100",
    name: "Plumbing",
    division: "Mechanical",
    startWeek: 4,
    endWeek: 12,
    durationDays: 45,
    budget: 17_500,
  },
  {
    code: "15-500",
    name: "HVAC",
    division: "Mechanical",
    startWeek: 7,
    endWeek: 16,
    durationDays: 45,
    budget: 22_500,
  },

  // Electrical
  {
    code: "16-100",
    name: "Electrical Sub",
    division: "Electrical",
    startWeek: 0,
    endWeek: 19,
    durationDays: 100,
    budget: 52_992.69,
  },
  {
    code: "16-105",
    name: "Temporary Power",
    division: "Electrical",
    startWeek: 0,
    endWeek: 19,
    durationDays: 100,
    budget: 10_500,
  },

  // General Conditions
  {
    code: "20-592",
    name: "Dumpsters",
    division: "General Conditions",
    startWeek: 0,
    endWeek: 19,
    durationDays: 100,
    budget: 15_000,
  },
  {
    code: "90-890",
    name: "Warranty",
    division: "General Conditions",
    startWeek: 18,
    endWeek: 19,
    durationDays: null,
    budget: 50_000,
  },
];

export const DIVISION_ORDER = [
  "General Conditions",
  "Site Work",
  "Concrete",
  "Masonry",
  "Metals",
  "Wood & Plastics",
  "Thermal & Moisture",
  "Doors & Windows",
  "Finishes",
  "Specialties",
  "Special Construction",
  "Mechanical",
  "Electrical",
];

export interface GanttGroup {
  division: string;
  tasks: GanttTask[];
}

export const GANTT_GROUPS: GanttGroup[] = DIVISION_ORDER.map((division) => ({
  division,
  tasks: GANTT_TASKS.filter((t) => t.division === division),
})).filter((g) => g.tasks.length > 0);

// Month spans for the header (label + number of week columns it covers).
export const MONTH_SPANS: { month: string; span: number }[] = (() => {
  const spans: { month: string; span: number }[] = [];
  for (const w of WEEKS) {
    const last = spans[spans.length - 1];
    if (last && last.month === w.month) last.span += 1;
    else spans.push({ month: w.month, span: 1 });
  }
  return spans;
})();
