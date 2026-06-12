import {
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
  currency,
} from "@/lib/project-data";
import logo from "@/assets/dunrite-logo.png.asset.json";

// Brand palette matching the printed Project Management Workbook
const BRAND: [number, number, number] = [41, 171, 226]; // sky blue
const DARK: [number, number, number] = [51, 51, 51];
const GREY: [number, number, number] = [120, 120, 120];
const RULE: [number, number, number] = [190, 190, 190];
const ZEBRA: [number, number, number] = [240, 243, 246];

const statusLabel: Record<string, string> = {
  complete: "Complete",
  closed: "Closed",
  "in-progress": "In Progress",
  open: "Open",
  upcoming: "Upcoming",
  "not-started": "Not Started",
};

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(logo.url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadWorkbookPdf() {
  const doc = await buildWorkbookDoc();
  doc.save(`Dun-Rite-Workbook-${PROJECT.name.replace(/[^a-z0-9]+/gi, "-")}.pdf`);
}

export async function buildWorkbookDoc() {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;
  const logoData = await loadLogo();

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // ---- Cover page ----
  if (logoData) {
    // white logo sits inside a brand-blue rounded badge
    doc.setFillColor(...BRAND);
    doc.roundedRect(margin, 70, 86, 86, 10, 10, "F");
    doc.addImage(logoData, "PNG", margin + 13, 83, 60, 60, undefined, "FAST");
  }
  doc.setTextColor(...BRAND);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(COMPANY.name.toUpperCase(), margin, 200);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.text("Project Management Workbook", margin, 226);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(1);
  doc.line(margin, 250, pageW - margin, 250);

  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  const meta: [string, string][] = [
    ["Project", PROJECT.name],
    ["Lot", PROJECT.lot],
    ["Location", PROJECT.location],
    ["Start Date", PROJECT.startDate],
    ["Target Completion", PROJECT.currentCompletion],
    ["Prepared", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
  ];
  let cy = 280;
  meta.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREY);
    doc.text(`${k}:`, margin, cy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(v, margin + 130, cy);
    cy += 24;
  });

  // table of contents
  cy += 16;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND);
  doc.setFontSize(13);
  doc.text("Contents", margin, cy);
  cy += 22;
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  SECTIONS.forEach((s, i) => {
    doc.text(`${i + 1}.  ${s}`, margin + 8, cy);
    cy += 18;
  });

  // ---- Section pages ----
  const section = (n: number, title: string, subtitle?: string) => {
    doc.addPage();
    // brand banner with logo
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, pageW, 56, "F");
    if (logoData) doc.addImage(logoData, "PNG", margin, 12, 32, 32, undefined, "FAST");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DUN RITE CONSTRUCTION", margin + 44, 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Project Management Workbook", margin + 44, 42);
    // grey rule under banner
    doc.setFillColor(...RULE);
    doc.rect(0, 56, pageW, 4, "F");
    // numbered title
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`${n}. ${title}`, margin, 92);
    let startY = 108;
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...GREY);
      doc.text(subtitle, margin, 110);
      startY = 126;
    }
    return startY;
  };

  const table = (startY: number, head: string[], body: (string | number)[][], colStyles?: Record<number, object>) => {
    autoTable(doc, {
      head: [head],
      body: body.map((r) => r.map((c) => String(c))),
      startY,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: RULE, lineWidth: 0.5, textColor: DARK },
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: colStyles,
    });
  };

  // 1. Executive Summary
  let y = section(1, "Executive Summary");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["Project Schedule — Milestone", "Scheduled", "Actual", "Status"]],
    body: MILESTONES.map((m) => [m.name, m.scheduled, m.actual, statusLabel[m.status] ?? m.status]),
    styles: { fontSize: 8.5, cellPadding: 4, lineColor: RULE, lineWidth: 0.5, textColor: DARK },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: ZEBRA },
  });
  // budget summary
  // @ts-expect-error lastAutoTable is attached by the plugin
  const afterMilestones = doc.lastAutoTable.finalY + 20;
  table(
    afterMilestones,
    ["Budget Summary", "Amount"],
    [
      ["Original Control Estimate", currency(BUDGET.originalControlEstimate)],
      ["Approved NOCIs", currency(BUDGET.approvedNOCIs)],
      ["Current Budget", currency(BUDGET.currentBudget)],
      ["Committed to Date", currency(BUDGET.committed)],
      ["Contingency Variance", currency(BUDGET.contingencyVariance)],
    ],
    { 1: { halign: "right" } },
  );

  // 2. Purchasing Log
  y = section(2, "Purchasing Log", "Original budget vs. contracted amounts by cost code.");
  table(
    y,
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
    { 2: { halign: "right" }, 4: { halign: "right" }, 6: { halign: "right" } },
  );

  // 3. Bid Log
  y = section(3, "Bid Log", "Competitive bids by cost code with awarded subcontractor.");
  table(
    y,
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
    { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
  );

  // 4. PO Log
  y = section(4, "Purchase Order Log", "Issued purchase orders by vendor and cost code.");
  table(
    y,
    ["PO #", "Cost Code", "Subcontractor / Vendor", "Description", "Issue Date", "Amount"],
    PURCHASE_ORDERS.map((r) => [r.po, r.code, r.vendor, r.description, r.issueDate, currency(r.amount)]),
    { 5: { halign: "right" } },
  );

  // 5. RFI Log
  y = section(5, "RFI Log", "Requests for information with cost impact and status.");
  table(
    y,
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
    { 5: { halign: "right" } },
  );

  // 6. Submittal Log
  y = section(6, "Submittal Log", "Shop drawings, samples & product data.");
  table(
    y,
    ["Sub #", "Description", "Spec Section", "Issue Date", "Date Required", "Date Received", "Status"],
    SUBMITTALS.map((s) => [s.num, s.description, "—", s.issueDate, s.required, s.received, statusLabel[s.status] ?? s.status]),
  );

  // 7. Schedule Delays
  y = section(7, "Schedule Delays", "Documented events impacting the construction schedule.");
  table(
    y,
    ["#", "Description of Delay", "Impacted Dates", "Days"],
    DELAYS.map((d) => [d.num, d.description, d.impactedDates, d.days]),
    { 3: { halign: "right" } },
  );

  // 8. Procurement Log
  y = section(8, "Procurement Buyout Log", "Long-lead items, commitment status and expected delivery.");
  table(
    y,
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
  );

  // 9. Project Procurement — long-lead matrix
  y = section(9, "Project Procurement", "Long-Lead Items & Material Status Matrix");
  table(
    y,
    ["Item", "Committed", "Vendor", "Expected Delivery", "Shop Drawing Status", "Notes"],
    PROCUREMENT.map((p) => [
      p.item,
      p.committed ? "Yes" : "No",
      p.vendor,
      p.expectedDelivery,
      statusLabel[p.status] ?? p.status,
      "—",
    ]),
  );

  // ---- Footers (page numbers) ----
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`${COMPANY.name} — Project Management Workbook`, margin, pageH - 20);
    doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 20, { align: "right" });
  }

  doc.save(`Dun-Rite-Workbook-${PROJECT.name.replace(/[^a-z0-9]+/gi, "-")}.pdf`);
}

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
