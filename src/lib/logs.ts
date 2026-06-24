import type { ReactNode } from "react";
import { currency } from "@/data/projectData";

// The six per-project operational log tables from the DunRite SOP integration.
export type LogTable =
  | "bid_logs"
  | "rfi_logs"
  | "submittal_logs"
  | "purchasing_logs"
  | "po_logs"
  | "schedule_delays";

// Loosely-typed log row. Each table has its own columns; the generic
// LogManager reads/writes them by name, so a permissive shape keeps it simple.
export type LogRow = { id: string; project_id: string } & Record<string, unknown>;

export type FieldType = "text" | "textarea" | "number" | "currency" | "date" | "boolean" | "select";

export interface LogField {
  /** Database column name. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Options for `select` fields. */
  options?: { value: string; label: string }[];
  /** Render as a table column. Defaults to true. */
  column?: boolean;
  /** Column header (defaults to `label`). */
  header?: string;
  align?: "left" | "right" | "center";
  /** Render the value in a monospace font (codes, numbers). */
  mono?: boolean;
  /** Span the full width of the form grid (long text). */
  full?: boolean;
}

export interface ComputedColumn {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortValue: (row: LogRow) => number | string;
  render: (row: LogRow) => ReactNode;
}

export interface LogConfig {
  table: LogTable;
  /** Singular noun used in buttons / dialogs, e.g. "RFI". */
  singular: string;
  fields: LogField[];
  /** Extra derived columns (e.g. variance) shown after the field columns. */
  computed?: ComputedColumn[];
  defaultSort: { key: string; dir: "asc" | "desc" };
  minWidthClass?: string;
  /** Name of a boolean field that drives an all / open / closed filter. */
  filterableBoolean?: string;
  /** One-line summary computed from the loaded rows. */
  summary?: (rows: LogRow[]) => string;
}

const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);
const openOf = (rows: LogRow[], total: number) =>
  `${rows.filter((r) => !r.closed).length} open of ${total}`;

const BID_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "awarded", label: "Awarded" },
];

const PO_STATUS = [
  { value: "issued", label: "Issued" },
  { value: "partial", label: "Partial" },
  { value: "received", label: "Received" },
  { value: "closed", label: "Closed" },
];

export const LOG_CONFIGS: Record<LogTable, LogConfig> = {
  bid_logs: {
    table: "bid_logs",
    singular: "Bid",
    defaultSort: { key: "bid_number", dir: "asc" },
    minWidthClass: "min-w-[920px]",
    summary: (rows) =>
      `${rows.length} bids · ${currency(rows.reduce((a, r) => a + num(r.bid_amount), 0))} total`,
    fields: [
      { name: "bid_number", label: "Bid #", type: "text", required: true, mono: true },
      { name: "status", label: "Status", type: "select", options: BID_STATUS },
      { name: "contractor", label: "Contractor", type: "text" },
      { name: "bid_amount", label: "Amount", type: "currency", align: "right" },
      { name: "bid_date", label: "Bid Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "notes", label: "Notes", type: "textarea", full: true, column: false },
    ],
  },

  rfi_logs: {
    table: "rfi_logs",
    singular: "RFI",
    defaultSort: { key: "rfi_number", dir: "asc" },
    minWidthClass: "min-w-[960px]",
    filterableBoolean: "closed",
    summary: (rows) => openOf(rows, rows.length),
    fields: [
      { name: "rfi_number", label: "RFI #", type: "text", required: true, mono: true },
      { name: "description", label: "Description", type: "textarea", required: true, full: true },
      { name: "issue_date", label: "Issue Date", type: "date" },
      { name: "date_required", label: "Date Required", type: "date" },
      { name: "date_received", label: "Date Received", type: "date" },
      { name: "cost_impact", label: "Cost Impact", type: "currency", align: "right" },
      { name: "closed", label: "Status", type: "boolean" },
      { name: "notes", label: "Notes", type: "textarea", full: true, column: false },
    ],
  },

  submittal_logs: {
    table: "submittal_logs",
    singular: "Submittal",
    defaultSort: { key: "submittal_number", dir: "asc" },
    minWidthClass: "min-w-[920px]",
    filterableBoolean: "closed",
    summary: (rows) => openOf(rows, rows.length),
    fields: [
      { name: "submittal_number", label: "Sub #", type: "text", required: true, mono: true },
      { name: "description", label: "Description", type: "textarea", required: true, full: true },
      { name: "issue_date", label: "Issue Date", type: "date" },
      { name: "date_required", label: "Date Required", type: "date" },
      { name: "date_received", label: "Date Received", type: "date" },
      { name: "closed", label: "Status", type: "boolean" },
      { name: "notes", label: "Notes", type: "textarea", full: true, column: false },
    ],
  },

  purchasing_logs: {
    table: "purchasing_logs",
    singular: "Cost Code",
    defaultSort: { key: "cost_code", dir: "asc" },
    minWidthClass: "min-w-[1180px]",
    summary: (rows) => {
      const budget = rows.reduce((a, r) => a + num(r.original_budget), 0);
      const contracted = rows.reduce((a, r) => a + num(r.contract_amount), 0);
      return `Original budget ${currency(budget)} · Contracted ${currency(contracted)} · Net variance ${currency(budget - contracted)}`;
    },
    fields: [
      { name: "cost_code", label: "Cost Code", type: "text", required: true, mono: true },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "original_budget", label: "Original Budget", type: "currency", align: "right" },
      { name: "contractor", label: "Contractor", type: "text" },
      { name: "contract_amount", label: "Contract Amount", type: "currency", align: "right" },
      { name: "vendor", label: "Vendor", type: "text" },
      { name: "material_amount", label: "Material Amount", type: "currency", align: "right" },
      { name: "po_number", label: "PO #", type: "text", mono: true },
      { name: "noci", label: "NOCI", type: "currency", align: "right" },
      { name: "contract_issued", label: "Contract Issued", type: "date" },
      { name: "notes", label: "Notes", type: "textarea", full: true, column: false },
    ],
    computed: [
      {
        key: "variance",
        header: "Variance",
        align: "right",
        sortValue: (r) => num(r.original_budget) - num(r.contract_amount),
        render: (r) => num(r.original_budget) - num(r.contract_amount),
      },
    ],
  },

  po_logs: {
    table: "po_logs",
    singular: "Purchase Order",
    defaultSort: { key: "po_number", dir: "asc" },
    minWidthClass: "min-w-[940px]",
    summary: (rows) =>
      `${rows.length} POs · ${currency(rows.reduce((a, r) => a + num(r.amount), 0))} issued`,
    fields: [
      { name: "po_number", label: "PO #", type: "text", required: true, mono: true },
      { name: "status", label: "Status", type: "select", options: PO_STATUS },
      { name: "vendor", label: "Vendor", type: "text" },
      { name: "amount", label: "Amount", type: "currency", align: "right" },
      { name: "po_date", label: "Issue Date", type: "date" },
      { name: "delivery_date", label: "Delivery Date", type: "date" },
      { name: "description", label: "Description", type: "textarea", full: true },
      { name: "notes", label: "Notes", type: "textarea", full: true, column: false },
    ],
  },

  schedule_delays: {
    table: "schedule_delays",
    singular: "Delay",
    defaultSort: { key: "original_date", dir: "asc" },
    minWidthClass: "min-w-[860px]",
    summary: (rows) =>
      `${rows.length} events · ${rows.reduce((a, r) => a + num(r.days_delayed), 0)} days total`,
    fields: [
      {
        name: "delay_description",
        label: "Description of Delay",
        type: "textarea",
        required: true,
        full: true,
      },
      { name: "original_date", label: "Original Date", type: "date" },
      { name: "revised_date", label: "Revised Date", type: "date" },
      { name: "days_delayed", label: "Days", type: "number", align: "right" },
      { name: "reason", label: "Reason", type: "text" },
      { name: "impact", label: "Impact", type: "text" },
      { name: "notes", label: "Notes", type: "textarea", full: true, column: false },
    ],
  },
};
