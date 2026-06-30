import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
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

export const Route = createFileRoute("/inspections")({
  head: () => ({
    meta: [
      { title: "Pre-Use Inspections | Dunrite Construction Group" },
      { name: "description", content: "Daily pre-use vehicle and equipment inspection log." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Inspections />
    </RequireAuth>
  ),
});

type InspectionRow = Database["public"]["Tables"]["vehicle_inspections"]["Row"];

// Checklist items (DOT / CDL pre-use). Column name → label. true = OK.
const CHECKLIST = [
  { key: "fluids_ok", label: "Fluids" },
  { key: "guards_ok", label: "Guards" },
  { key: "controls_ok", label: "Controls" },
  { key: "tires_ok", label: "Tires" },
  { key: "headlights_ok", label: "Headlights" },
  { key: "running_lights_ok", label: "Running Lights" },
  { key: "brake_lights_ok", label: "Brake Lights" },
  { key: "blinkers_ok", label: "Blinkers (F&B)" },
  { key: "clearance_lights_ok", label: "Clearance Lights" },
] as const;

type CheckKey = (typeof CHECKLIST)[number]["key"];

const STATUS_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "needs-attention", label: "Needs Attention" },
  { value: "fail", label: "Fail / Out of Service" },
];

// Operator's LOCAL calendar date (toISOString() would give the UTC day, which
// rolls over early evening for time zones west of UTC and misorders the log).
function buildEmptyForm() {
  const checks = Object.fromEntries(CHECKLIST.map((c) => [c.key, true])) as Record<
    CheckKey,
    boolean
  >;
  return {
    id: "",
    vehicle: "",
    inspection_date: todayISO(),
    inspector_name: "",
    odometer: "",
    status: "pass",
    defects: "",
    ...checks,
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function flaggedItems(row: InspectionRow): string[] {
  return CHECKLIST.filter((c) => row[c.key] === false).map((c) => c.label);
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "pass"
      ? "bg-success/15 text-success"
      : status === "fail"
        ? "bg-destructive/15 text-destructive"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function Inspections() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<InspectionRow[]>([]);
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
      .from("vehicle_inspections")
      .select("*")
      .order("inspection_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (lErr) setError(lErr.message);
    setRows((data as InspectionRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canModify = (row: InspectionRow) => isAdmin(role) || row.inspected_by === user?.id;

  const openCreate = () => {
    setError(null);
    setEditId(null);
    setForm({ ...buildEmptyForm(), inspector_name: "" });
    setDialogOpen(true);
  };

  const openEdit = (row: InspectionRow) => {
    setError(null);
    setEditId(row.id);
    const checks = Object.fromEntries(
      CHECKLIST.map((c) => [c.key, row[c.key] !== false]),
    ) as Record<CheckKey, boolean>;
    setForm({
      id: row.id,
      vehicle: row.vehicle,
      inspection_date: row.inspection_date,
      inspector_name: row.inspector_name ?? "",
      odometer: row.odometer != null ? String(row.odometer) : "",
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
      vehicle: form.vehicle.trim(),
      inspection_date: form.inspection_date || todayISO(),
      inspector_name: form.inspector_name.trim() || null,
      odometer: form.odometer ? Number(form.odometer) : null,
      status: form.status,
      defects: form.defects.trim() || null,
      ...checks,
    };
    const res = editId
      ? await supabase.from("vehicle_inspections").update(payload).eq("id", editId)
      : await supabase
          .from("vehicle_inspections")
          .insert({ ...payload, inspected_by: user?.id ?? null });
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
    const { error: dErr } = await supabase.from("vehicle_inspections").delete().eq("id", deleteId);
    setDeleteId(null);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    load();
  };

  const columns = useMemo<Column<InspectionRow>[]>(() => {
    const base: Column<InspectionRow>[] = [
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.inspection_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.inspection_date)}</span>,
      },
      {
        key: "vehicle",
        header: "Vehicle / Equipment",
        sortValue: (r) => r.vehicle,
        cell: (r) => <span className="font-medium">{r.vehicle}</span>,
      },
      {
        key: "inspector",
        header: "Inspector",
        sortValue: (r) => r.inspector_name ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.inspector_name || "—"}</span>,
      },
      {
        key: "odometer",
        header: "Odometer / Hrs",
        align: "right",
        sortValue: (r) => Number(r.odometer) || 0,
        cell: (r) =>
          r.odometer != null ? (
            <span className="tabular-nums">{Number(r.odometer).toLocaleString()}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
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
    const actions: Column<InspectionRow>[] = [
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
        title="Pre-Use Inspections"
        description="Daily pre-use vehicle & equipment inspection log. Complete one at the start of each day, or whenever a new operator takes a vehicle or piece of equipment."
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={openCreate} className="no-print">
              <Plus className="mr-1.5 h-4 w-4" /> New Inspection
            </Button>
            <SectionActions label="Pre-Use Inspections" />
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
          minWidthClass="min-w-[1040px]"
          emptyTitle="No inspections yet"
          emptyDescription="Log the first pre-use inspection to start the record."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Inspection" : "New Pre-Use Inspection"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="i-vehicle">Vehicle / Equipment *</Label>
                <Input
                  id="i-vehicle"
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  placeholder="e.g. Truck 12, Trailer 3"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-date">Date *</Label>
                <Input
                  id="i-date"
                  type="date"
                  value={form.inspection_date}
                  onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-inspector">Inspector / Operator</Label>
                <Input
                  id="i-inspector"
                  value={form.inspector_name}
                  onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-odo">Odometer / Hours</Label>
                <Input
                  id="i-odo"
                  type="number"
                  value={form.odometer}
                  onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Checklist</p>
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
              <Label htmlFor="i-defects">Defects / notes</Label>
              <Textarea
                id="i-defects"
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
              disabled={saving || !form.vehicle.trim() || !form.inspection_date}
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
              This permanently removes the inspection record. This action cannot be undone.
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
