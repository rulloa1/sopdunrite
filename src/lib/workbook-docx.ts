import { currency } from "@/lib/project-data";
import type { WorkbookData } from "@/lib/workbook-data";
import logo from "@/assets/dunrite-logo.jpg.asset.json";

// Brand palette matching the printed Project Management Workbook
const BRAND = "20C0E0"; // logo sky blue
const DARK = "333333";
const GREY = "787878";
const RULE = "BEBEBE";
const ZEBRA = "F0F3F6";
const WHITE = "FFFFFF";

// US Letter content width with 1" margins = 12240 - 2880 = 9360 DXA
const CONTENT_WIDTH = 9360;

const statusLabel: Record<string, string> = {
  complete: "Complete",
  closed: "Closed",
  "in-progress": "In Progress",
  open: "Open",
  upcoming: "Upcoming",
  "not-started": "Not Started",
};

const SECTIONS = [
  "Executive Summary",
  "Purchasing Log",
  "Bid Log",
  "Purchase Order Log",
  "RFI Log",
  "Submittal Log",
  "Schedule Delays",
  "Procurement Buyout Log",
  "Project Procurement",
];

async function loadLogoBytes(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(logo.url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** Build and download the branded workbook as a native .docx file. */
export async function downloadWorkbookDocx(data: WorkbookData) {
  const blob = await buildWorkbookDocxBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Dun-Rite-Workbook-${data.PROJECT.name.replace(/[^a-z0-9]+/gi, "-")}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function buildWorkbookDocxBlob(data: WorkbookData): Promise<Blob> {
  const {
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
  } = data;
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    ImageRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    WidthType,
    ShadingType,
    VerticalAlign,
    PageBreak,
  } = await import("docx");

  const logoBytes = await loadLogoBytes();

  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
  const cellBorders = { top: border, bottom: border, left: border, right: border };

  type Align = "left" | "right" | "center";

  const buildTable = (
    head: string[],
    body: (string | number)[][],
    widths: number[],
    aligns: Align[] = [],
  ) => {
    const colWidths = normalizeWidths(widths, CONTENT_WIDTH);
    const headerRow = new TableRow({
      tableHeader: true,
      children: head.map(
        (h, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            borders: cellBorders,
            shading: { fill: BRAND, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: toAlign(AlignmentType, aligns[i]),
                children: [new TextRun({ text: h, bold: true, color: WHITE, size: 17 })],
              }),
            ],
          }),
      ),
    });

    const bodyRows = body.map(
      (row, r) =>
        new TableRow({
          children: row.map(
            (cell, i) =>
              new TableCell({
                width: { size: colWidths[i], type: WidthType.DXA },
                borders: cellBorders,
                shading:
                  r % 2 === 1
                    ? { fill: ZEBRA, type: ShadingType.CLEAR, color: "auto" }
                    : undefined,
                margins: { top: 50, bottom: 50, left: 100, right: 100 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: toAlign(AlignmentType, aligns[i]),
                    children: [new TextRun({ text: String(cell), color: DARK, size: 17 })],
                  }),
                ],
              }),
          ),
        }),
    );

    return new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: colWidths,
      rows: [headerRow, ...bodyRows],
    });
  };

  const sectionHeading = (n: number, title: string, subtitle?: string) => {
    const out: InstanceType<typeof Paragraph>[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { after: subtitle ? 60 : 200 },
        children: [new TextRun({ text: `${n}. ${title}`, bold: true, color: DARK, size: 30 })],
      }),
    ];
    if (subtitle) {
      out.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: subtitle, italics: true, color: GREY, size: 19 })],
        }),
      );
    }
    return out;
  };

  const spacer = () => new Paragraph({ spacing: { after: 200 }, children: [] });

  // ---- Cover page ----
  const cover: (InstanceType<typeof Paragraph>)[] = [];
  if (logoBytes) {
    cover.push(
      new Paragraph({
        spacing: { before: 1200, after: 120 },
        children: [
          new ImageRun({
            type: "png",
            data: logoBytes,
            transformation: { width: 90, height: 90 },
            altText: { title: "Dunrite Construction Group LLC", description: "Company logo", name: "Logo" },
          }),
        ],
      }),
    );
  } else {
    cover.push(new Paragraph({ spacing: { before: 1400 }, children: [] }));
  }
  cover.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: COMPANY.name.toUpperCase(), bold: true, color: BRAND, size: 56 })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 6 } },
      children: [new TextRun({ text: "Project Management Workbook", color: DARK, size: 32 })],
    }),
  );

  const meta: [string, string][] = [
    ["Project", PROJECT.name],
    ["Lot", PROJECT.lot],
    ["Location", PROJECT.location],
    ["Start Date", PROJECT.startDate],
    ["Target Completion", PROJECT.currentCompletion],
    ["Prepared", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
  ];
  meta.forEach(([k, v]) =>
    cover.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${k}:  `, bold: true, color: GREY, size: 21 }),
          new TextRun({ text: v, color: DARK, size: 21 }),
        ],
      }),
    ),
  );

  cover.push(
    new Paragraph({
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: "Contents", bold: true, color: BRAND, size: 24 })],
    }),
  );
  SECTIONS.forEach((s, i) =>
    cover.push(
      new Paragraph({
        spacing: { after: 30 },
        children: [new TextRun({ text: `${i + 1}.  ${s}`, color: DARK, size: 21 })],
      }),
    ),
  );

  // ---- Section content ----
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [...cover];

  // 1. Executive Summary
  children.push(...sectionHeading(1, "Executive Summary"));
  children.push(
    buildTable(
      ["Project Schedule — Milestone", "Scheduled", "Actual", "Status"],
      MILESTONES.map((m) => [m.name, m.scheduled, m.actual, statusLabel[m.status] ?? m.status]),
      [4, 1.6, 1.6, 1.6],
    ),
  );
  children.push(spacer());
  children.push(
    buildTable(
      ["Budget Summary", "Amount"],
      [
        ["Original Control Estimate", currency(BUDGET.originalControlEstimate)],
        ["Approved NOCIs", currency(BUDGET.approvedNOCIs)],
        ["Current Budget", currency(BUDGET.currentBudget)],
        ["Committed to Date", currency(BUDGET.committed)],
        ["Contingency Variance", currency(BUDGET.contingencyVariance)],
      ],
      [6, 3],
      ["left", "right"],
    ),
  );

  // 2. Purchasing Log
  children.push(...sectionHeading(2, "Purchasing Log", "Original budget vs. contracted amounts by cost code."));
  children.push(
    buildTable(
      ["Cost Code", "Description", "Original Budget", "Subcontractor", "Contract", "PO #", "Variance"],
      PURCHASING.map((r) => [
        r.code,
        r.desc,
        currency(r.originalBudget),
        r.subcontractor,
        currency(r.contractAmount),
        r.poNumber,
        currency(r.variance),
      ]),
      [1.3, 2.6, 1.4, 1.9, 1.3, 0.9, 1.2],
      ["left", "left", "right", "left", "right", "left", "right"],
    ),
  );

  // 3. Bid Log
  children.push(...sectionHeading(3, "Bid Log", "Competitive bids by cost code with awarded subcontractor."));
  children.push(
    buildTable(
      ["Code", "Description", "Bids", "Low Qualified", "Bid 2", "Bid 3", "Awarded To", "Budget", "Variance"],
      BIDS.map((r) => [
        r.code,
        r.desc,
        r.contacted,
        currency(r.lowBid),
        currency(r.bid2),
        currency(r.bid3),
        r.awardedTo,
        currency(r.budget),
        currency(r.variance),
      ]),
      [1, 2.1, 0.7, 1.3, 1.1, 1.1, 1.8, 1.2, 1.2],
      ["left", "left", "right", "right", "right", "right", "left", "right", "right"],
    ),
  );

  // 4. PO Log
  children.push(...sectionHeading(4, "Purchase Order Log", "Issued purchase orders by vendor and cost code."));
  children.push(
    buildTable(
      ["PO #", "Cost Code", "Subcontractor / Vendor", "Description", "Issue Date", "Amount"],
      PURCHASE_ORDERS.map((r) => [r.po, r.code, r.vendor, r.description, r.issueDate, currency(r.amount)]),
      [0.9, 1.3, 2.2, 2.6, 1.3, 1.3],
      ["left", "left", "left", "left", "left", "right"],
    ),
  );

  // 5. RFI Log
  children.push(...sectionHeading(5, "RFI Log", "Requests for information with cost impact and status."));
  children.push(
    buildTable(
      ["RFI #", "Description", "Issue Date", "Date Required", "Date Received", "Cost Impact", "Status"],
      RFIS.map((r) => [
        r.num,
        r.description,
        r.issueDate,
        r.required,
        r.received,
        r.costImpact ? currency(r.costImpact) : "—",
        statusLabel[r.status] ?? r.status,
      ]),
      [0.9, 3.2, 1.3, 1.3, 1.3, 1.3, 1.1],
      ["left", "left", "left", "left", "left", "right", "left"],
    ),
  );

  // 6. Submittal Log
  children.push(...sectionHeading(6, "Submittal Log", "Shop drawings, samples & product data."));
  children.push(
    buildTable(
      ["Sub #", "Description", "Spec Section", "Issue Date", "Date Required", "Date Received", "Status"],
      SUBMITTALS.map((s) => [s.num, s.description, "—", s.issueDate, s.required, s.received, statusLabel[s.status] ?? s.status]),
      [0.9, 3.2, 1.3, 1.3, 1.3, 1.3, 1.1],
    ),
  );

  // 7. Schedule Delays
  children.push(...sectionHeading(7, "Schedule Delays", "Documented events impacting the construction schedule."));
  children.push(
    buildTable(
      ["#", "Description of Delay", "Impacted Dates", "Days"],
      DELAYS.map((d) => [d.num, d.description, d.impactedDates, d.days]),
      [0.6, 4.8, 2.6, 0.9],
      ["left", "left", "left", "right"],
    ),
  );

  // 8. Procurement Log
  children.push(...sectionHeading(8, "Procurement Buyout Log", "Long-lead items, commitment status and expected delivery."));
  children.push(
    buildTable(
      ["Item", "Committed", "Purchased", "Vendor", "PO #", "Expected Delivery", "Status"],
      PROCUREMENT.map((p) => [
        p.item,
        p.committed ? "Yes" : "No",
        p.purchased ? "Yes" : "No",
        p.vendor,
        p.poNumber,
        p.expectedDelivery,
        statusLabel[p.status] ?? p.status,
      ]),
      [2.4, 1.1, 1.1, 2.2, 1, 1.6, 1.2],
    ),
  );

  // 9. Project Procurement
  children.push(...sectionHeading(9, "Project Procurement", "Long-Lead Items & Material Status Matrix"));
  children.push(
    buildTable(
      ["Item", "Committed", "Vendor", "Expected Delivery", "Shop Drawing Status", "Notes"],
      PROCUREMENT.map((p) => [
        p.item,
        p.committed ? "Yes" : "No",
        p.vendor,
        p.expectedDelivery,
        statusLabel[p.status] ?? p.status,
        "—",
      ]),
      [2.2, 1.1, 2.2, 1.7, 1.7, 1],
    ),
  );

  const doc = new Document({
    creator: COMPANY.name,
    title: `Dun Rite Project Management Workbook — ${PROJECT.name}`,
    styles: {
      default: { document: { run: { font: "Arial", size: 21 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 30, bold: true, color: DARK, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

function normalizeWidths(rel: number[], total: number): number[] {
  const sum = rel.reduce((a, b) => a + b, 0);
  const out = rel.map((r) => Math.round((r / sum) * total));
  // fix rounding drift on the last column so they sum exactly to total
  const drift = total - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += drift;
  return out;
}

function toAlign(
  AlignmentType: typeof import("docx").AlignmentType,
  a: "left" | "right" | "center" | undefined,
) {
  if (a === "right") return AlignmentType.RIGHT;
  if (a === "center") return AlignmentType.CENTER;
  return AlignmentType.LEFT;
}
