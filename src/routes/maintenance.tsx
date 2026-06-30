import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canManageLogs, canDeleteLogs } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";
import { formatDate } from "@/data/projectData";
import { todayISO } from "@/lib/expiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & Repairs | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Equipment, vehicle, and trailer maintenance & repair log — tracks reported defects through to completion.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Maintenance />
    </RequireAuth>
  ),
});

type MaintRow = Database["public"]["Tables"]["maintenance_records"]["Row"];

const ASSET_TYPES = [
  { value: "vehicle", label: "Vehicle" },
  { value: "trailer", label: "Trailer" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];
const SERVICE_TYPES = [
  { value: "repair", label: "Repair" },
  { value: "preventive", label: "Preventive maintenance" },
  { value: "inspection-followup", label: "Inspection follow-up" },
  { value: "other", label: "Other" },
];
const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((o) => o.value === v)?.label ?? v;

const STATUS_PILL: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  "in-progress": "bg-amber-500/10 text-amber-600",
  completed: "bg-success/10 text-success",
};
const STATUS_RANK: Record<string, number> = { open: 3, "in-progress": 2, completed: 1 };

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_PILL[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {labelOf(STATUS_OPTIONS, status)}
    </span>
  );
}

function formatCost(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function buildEmptyForm() {
  return {
    id: "",
    asset: "",
    asset_type: "vehicle",
    service_type: "repair",
    description: "",
    reported_date: todayISO(),
    completed_date: "",
    status: "open",
    vendor: "",
    cost: "",
    odometer_hours: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function Maintenance() {
  const { role } = useAuth();
  const [rows, setRows] = useState<MaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = canManageLogs(role);
  const canDelete = canDeleteLogs(role);

  // Sequence guard: only the most recent load() applies its result, so an
  // earlier in-flight fetch can't resolve last and overwrite fresher rows.
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    const { data, error: lErr } = await supabase
      .from("maintenance_records")
      .select("*")
      .order("reported_date", { ascending: false });
    // Superseded by a newer load: bail without touching state — the newest
    // load always runs to completion and owns the loading flag, so this can't
    // leave the spinner stuck, and it avoids clearing it prematurely.
    if (seq !== loadSeq.current) return;
    if (lErr) setError(lErr.message);
    else setRows((data as MaintRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setError(null);
    setEditId(null);
    setForm(buildEmptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: MaintRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      asset: row.asset,
      asset_type: row.asset_type,
      service_type: row.service_type,
      description: row.description,
      reported_date: row.reported_date,
      completed_date: row.completed_date ?? "",
      status: row.status,
      vendor: row.vendor ?? "",
      cost: row.cost === null ? "" : String(row.cost),
      odometer_hours: row.odometer_hours ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.reported_date) {
      setError("A reported date is required.");
      return;
    }
    if (form.completed_date && form.completed_date < form.reported_date) {
      setError("Completed date can't be before the reported date.");
      return;
    }
    if (form.status === "completed" && !form.completed_date) {
      setError("Set a completed date before marking this record completed.");
      return;
    }
    const costTrim = form.cost.trim();
    if (costTrim && (Number.isNaN(Number(costTrim)) || Number(costTrim) < 0)) {
      setError("Cost must be a number that is 0 or more.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      asset: form.asset.trim(),
      asset_type: form.asset_type,
      service_type: form.service_type,
      description: form.description.trim(),
      reported_date: form.reported_date,
      completed_date: form.completed_date || null,
      status: form.status,
      vendor: form.vendor.trim() || null,
      cost: costTrim ? Number(costTrim) : null,
      odometer_hours: form.odometer_hours.trim() || null,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("maintenance_records").update(payload).eq("id", editId)
      : await supabase.from("maintenance_records").insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setDialogOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    const { error: dErr } = await supabase.from("maintenance_records").delete().eq("id", deleteId);
    setDeleting(false);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<MaintRow>[]>(() => {
    const base: Column<MaintRow>[] = [
      {
        key: "asset",
        header: "Asset",
        sortValue: (r) => r.asset,
        cell: (r) => (
          <span>
            <span className="font-medium">{r.asset}</span>
            <span className="text-muted-foreground"> · {labelOf(ASSET_TYPES, r.asset_type)}</span>
          </span>
        ),
      },
      {
        key: "service",
        header: "Service",
        sortValue: (r) => labelOf(SERVICE_TYPES, r.service_type),
        cell: (r) => labelOf(SERVICE_TYPES, r.service_type),
      },
      {
        key: "description",
        header: "Description",
        sortValue: (r) => r.description,
        cell: (r) => <span className="line-clamp-2">{r.description}</span>,
      },
      {
        key: "reported",
        header: "Reported",
        sortValue: (r) => r.reported_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.reported_date)}</span>,
      },
      {
        key: "completed",
        header: "Completed",
        sortValue: (r) => r.completed_date ?? "",
        cell: (r) => (
          <span className="nowrap-date text-muted-foreground">
            {r.completed_date ? formatDate(r.completed_date) : "—"}
          </span>
        ),
      },
      {
        key: "cost",
        header: "Cost",
        align: "right",
        sortValue: (r) => r.cost ?? -1,
        cell: (r) => <span className="text-muted-foreground">{formatCost(r.cost)}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => STATUS_RANK[r.status] ?? 0,
        cell: (r) => <StatusPill status={r.status} />,
      },
    ];
    const actions: Column<MaintRow>[] =
      canManage || canDelete
        ? [
            {
              key: "__actions",
              header: "",
              sortable: false,
              align: "right",
              cell: (r) => (
                <div className="flex justify-end gap-1 no-print">
                  {canManage && (
                    <button
                      onClick={() => openEdit(r)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit record"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteId(r.id);
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]
        : [];
    return [...base, ...actions];
  }, [canManage, canDelete]);

  const outstandingCount = rows.filter((r) => r.status !== "completed").length;

  return (
    <Layout>
      <PageHeader
        title="Maintenance & Repairs"
        description="Vehicle, trailer, and equipment maintenance and repairs — log a defect and track it through to completion."
        actions={<SectionActions label="Maintenance & Repairs" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Maintenance Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} record{rows.length === 1 ? "" : "s"}
            {outstandingCount > 0 && (
              <span className="text-destructive"> · {outstandingCount} open or in progress</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Record
          </Button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id}
          initialSort={{ key: "status", dir: "desc" }}
          minWidthClass="min-w-[960px]"
          emptyTitle="No maintenance records"
          emptyDescription="Log repairs and preventive maintenance — including defects found during pre-use and trailer inspections."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Record" : "Add Maintenance Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-asset">Asset (vehicle / unit ID) *</Label>
                <Input
                  id="m-asset"
                  value={form.asset}
                  onChange={(e) => setForm({ ...form, asset: e.target.value })}
                  placeholder="e.g. Truck 12, Gooseneck A"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-asset-type">Asset type</Label>
                <Select
                  value={form.asset_type}
                  onValueChange={(v) => setForm({ ...form, asset_type: v })}
                >
                  <SelectTrigger id="m-asset-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-service">Service type</Label>
                <Select
                  value={form.service_type}
                  onValueChange={(v) => setForm({ ...form, service_type: v })}
                >
                  <SelectTrigger id="m-service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="m-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-description">Description *</Label>
              <Textarea
                id="m-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was found / what was done"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-reported">Reported date *</Label>
                <Input
                  id="m-reported"
                  type="date"
                  value={form.reported_date}
                  onChange={(e) => setForm({ ...form, reported_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-completed">Completed date</Label>
                <Input
                  id="m-completed"
                  type="date"
                  value={form.completed_date}
                  onChange={(e) => setForm({ ...form, completed_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-vendor">Vendor / shop</Label>
                <Input
                  id="m-vendor"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-cost">Cost (USD)</Label>
                <Input
                  id="m-cost"
                  inputMode="decimal"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="e.g. 450"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-odo">Odometer / hours</Label>
              <Input
                id="m-odo"
                value={form.odometer_hours}
                onChange={(e) => setForm({ ...form, odometer_hours: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-notes">Notes</Label>
              <Textarea
                id="m-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={
                saving || !form.asset.trim() || !form.description.trim() || !form.reported_date
              }
            >
              {saving ? "Saving…" : editId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          // Don't dismiss (and lose the error) while a delete is still running.
          if (!o && !deleting) {
            setDeleteId(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the maintenance record from the log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
