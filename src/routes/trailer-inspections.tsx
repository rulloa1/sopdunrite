import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Container, CheckCircle2, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { formatDate } from "@/data/projectData";
import { todayISO } from "@/lib/expiry";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/trailer-inspections")({
  head: () => ({
    meta: [
      { title: "Trailer Inspections | Dunrite Construction Group" },
      { name: "description", content: "Gooseneck and flatbed trailer inspection checklist." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TrailerInspections />
    </RequireAuth>
  ),
});

type TrailerRow = Database["public"]["Tables"]["trailer_inspections"]["Row"];

// Inspection points (the "boxes" from the SOP sketch). true = OK / serviceable.
const CHECKLIST = [
  { key: "coupler_ok", label: "Coupler / Hitch / King Pin" },
  { key: "safety_chains_ok", label: "Safety Chains / Breakaway" },
  { key: "lights_ok", label: "Lights & Reflectors" },
  { key: "brakes_ok", label: "Brakes" },
  { key: "tires_wheels_ok", label: "Tires & Wheels / Lug Nuts" },
  { key: "suspension_ok", label: "Suspension / Axles" },
  { key: "frame_welds_ok", label: "Frame & Welds" },
  { key: "deck_floor_ok", label: "Deck / Floor" },
  { key: "ramps_gates_ok", label: "Ramps / Gates" },
  { key: "tie_downs_ok", label: "Tie-downs / Chains / Straps" },
  { key: "landing_gear_ok", label: "Landing Gear / Jack" },
  { key: "plate_registration_ok", label: "License Plate / Registration" },
] as const;

type CheckKey = (typeof CHECKLIST)[number]["key"];

const TRAILER_TYPES = [
  { value: "gooseneck", label: "Gooseneck Trailer" },
  { value: "flatbed", label: "Flatbed Trailer" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "needs-attention", label: "Needs Attention" },
  { value: "fail", label: "Fail / Out of Service" },
];

const labelOf = (opts: { value: string; label: string }[], v: string) =>
  opts.find((o) => o.value === v)?.label ?? v;

function buildEmptyForm() {
  const checks = Object.fromEntries(CHECKLIST.map((c) => [c.key, true])) as Record<
    CheckKey,
    boolean
  >;
  return {
    id: "",
    trailer_type: "gooseneck",
    trailer: "",
    inspection_date: todayISO(),
    inspector_name: "",
    status: "pass",
    defects: "",
    ...checks,
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function flaggedItems(row: TrailerRow): string[] {
  return CHECKLIST.filter((c) => row[c.key] === false).map((c) => c.label);
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "pass"
      ? "bg-success/15 text-success"
      : status === "fail"
        ? "bg-destructive/15 text-destructive"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {labelOf(STATUS_OPTIONS, status)}
    </span>
  );
}

function TrailerInspections() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<TrailerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: lErr } = await supabase
      .from("trailer_inspections")
      .select("*")
      .order("inspection_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (lErr) setError(lErr.message);
    else setRows((data as TrailerRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canModify = (row: TrailerRow) => isAdmin(role) || row.inspected_by === user?.id;

  const openCreate = () => {
    setError(null);
    setEditId(null);
    setForm(buildEmptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: TrailerRow) => {
    setError(null);
    setEditId(row.id);
    const checks = Object.fromEntries(
      CHECKLIST.map((c) => [c.key, row[c.key] !== false]),
    ) as Record<CheckKey, boolean>;
    setForm({
      id: row.id,
      trailer_type: row.trailer_type,
      trailer: row.trailer,
      inspection_date: row.inspection_date,
      inspector_name: row.inspector_name ?? "",
      status: row.status,
      defects: row.defects ?? "",
      ...checks,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const checks = Object.fromEntries(CHECKLIST.map((c) => [c.key, form[c.key]]));
    const payload = {
      trailer_type: form.trailer_type,
      trailer: form.trailer.trim(),
      inspection_date: form.inspection_date || todayISO(),
      inspector_name: form.inspector_name.trim() || null,
      status: form.status,
      defects: form.defects.trim() || null,
      ...checks,
    };
    // On insert, omit inspected_by and let the DB DEFAULT auth.uid() supply it —
    // this always satisfies the WITH CHECK (inspected_by = auth.uid()) policy,
    // even if the client auth context is momentarily unresolved.
    const res = editId
      ? await supabase.from("trailer_inspections").update(payload).eq("id", editId)
      : await supabase.from("trailer_inspections").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setDialogOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error: dErr } = await supabase.from("trailer_inspections").delete().eq("id", deleteId);
    if (dErr) {
      // Keep the confirmation dialog open so the failure stays in context.
      setError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<TrailerRow>[]>(() => {
    const base: Column<TrailerRow>[] = [
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.inspection_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.inspection_date)}</span>,
      },
      {
        key: "type",
        header: "Trailer Type",
        sortValue: (r) => r.trailer_type,
        cell: (r) => <span>{labelOf(TRAILER_TYPES, r.trailer_type)}</span>,
      },
      {
        key: "trailer",
        header: "Trailer ID",
        sortValue: (r) => r.trailer,
        cell: (r) => <span className="font-medium">{r.trailer}</span>,
      },
      {
        key: "inspector",
        header: "Inspector",
        sortValue: (r) => r.inspector_name ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.inspector_name || "—"}</span>,
      },
      {
        key: "items",
        header: "Flagged Items",
        sortValue: (r) => flaggedItems(r).length,
        cell: (r) => {
          const flagged = flaggedItems(r);
          return flagged.length === 0 ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> All clear
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-destructive"
              title={flagged.join(", ")}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> {flagged.length}: {flagged.join(", ")}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => r.status,
        cell: (r) => <StatusPill status={r.status} />,
      },
    ];
    const actions: Column<TrailerRow>[] = [
      {
        key: "__actions",
        header: "",
        sortable: false,
        align: "right",
        cell: (r) =>
          canModify(r) ? (
            <div className="flex justify-end gap-1 no-print">
              <button
                onClick={() => openEdit(r)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Edit inspection"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeleteId(r.id)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete inspection"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ];
    return [...base, ...actions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.id]);

  const flaggedCount = rows.filter((r) => flaggedItems(r).length > 0 || r.status !== "pass").length;

  return (
    <Layout>
      <PageHeader
        title="Trailer Inspections"
        description="Inspection checklist for gooseneck and flatbed trailers. Complete before towing or per the inspection schedule."
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={openCreate} className="no-print">
              <Plus className="mr-1.5 h-4 w-4" /> New Inspection
            </Button>
            <SectionActions label="Trailer Inspections" />
          </div>
        }
      />

      {rows.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {rows.length} inspection{rows.length === 1 ? "" : "s"} ·{" "}
          {flaggedCount === 0 ? "none with flagged items" : `${flaggedCount} needing attention`}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id}
          initialSort={{ key: "date", dir: "desc" }}
          minWidthClass="min-w-[1000px]"
          emptyTitle="No trailer inspections yet"
          emptyDescription="Log the first gooseneck or flatbed trailer inspection to start the record."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Trailer Inspection" : "New Trailer Inspection"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Trailer type</Label>
                <Select
                  value={form.trailer_type}
                  onValueChange={(v) => setForm({ ...form, trailer_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAILER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-trailer">Trailer ID *</Label>
                <Input
                  id="t-trailer"
                  value={form.trailer}
                  onChange={(e) => setForm({ ...form, trailer: e.target.value })}
                  placeholder="e.g. GN-02, Flatbed 7"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-date">Date *</Label>
                <Input
                  id="t-date"
                  type="date"
                  value={form.inspection_date}
                  onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-inspector">Inspector / Operator</Label>
                <Input
                  id="t-inspector"
                  value={form.inspector_name}
                  onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Inspection points</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CHECKLIST.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{c.label}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={`text-xs ${form[c.key] ? "text-success" : "text-destructive"}`}
                      >
                        {form[c.key] ? "OK" : "Defect"}
                      </span>
                      <Switch
                        checked={form[c.key]}
                        onCheckedChange={(v) => setForm({ ...form, [c.key]: v })}
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Overall status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-defects">Defects / notes</Label>
              <Textarea
                id="t-defects"
                rows={3}
                value={form.defects}
                onChange={(e) => setForm({ ...form, defects: e.target.value })}
                placeholder="Describe any defects found and action taken."
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.trailer.trim() || !form.inspection_date}
            >
              {saving ? "Saving…" : editId ? "Update Inspection" : "Save Inspection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this inspection?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the trailer inspection record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
