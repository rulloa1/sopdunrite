import { useCallback, useEffect, useMemo, useState } from "react";
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
import { expiryStatus, statusRank, worstStatus, type ExpiryStatus } from "@/lib/expiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/driver-qualifications")({
  head: () => ({
    meta: [
      { title: "Driver Qualifications | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Driver qualification log: license class and expiry, DOT medical-card expiry, and MVR review tracking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DriverQualifications />
    </RequireAuth>
  ),
});

type DriverRow = Database["public"]["Tables"]["driver_qualifications"]["Row"];

const STATUS_PILL: Record<ExpiryStatus, { label: string; className: string }> = {
  valid: { label: "Current", className: "bg-success/10 text-success" },
  expiring: { label: "Expiring soon", className: "bg-amber-500/10 text-amber-600" },
  expired: { label: "Expired", className: "bg-destructive/10 text-destructive" },
  none: { label: "Not tracked", className: "bg-muted text-muted-foreground" },
};

function StatusPill({ status }: { status: ExpiryStatus }) {
  const s = STATUS_PILL[status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

/** A date cell tinted by its own expiry status, so each date reads at a glance. */
function DateCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const s = expiryStatus(date);
  const tint =
    s === "expired" ? "text-destructive" : s === "expiring" ? "text-amber-600" : "text-foreground";
  return <span className={`nowrap-date ${tint}`}>{formatDate(date)}</span>;
}

function buildEmptyForm() {
  return {
    id: "",
    driver_name: "",
    license_number: "",
    license_class: "",
    endorsements: "",
    license_expires: "",
    medical_card_expires: "",
    last_mvr_review: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

/** Overall qualification status = the most urgent of license + medical card. */
const overallStatus = (r: DriverRow) => worstStatus([r.license_expires, r.medical_card_expires]);

function DriverQualifications() {
  const { role } = useAuth();
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canManage = canManageLogs(role);
  const canDelete = canDeleteLogs(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: lErr } = await supabase
      .from("driver_qualifications")
      .select("*")
      .order("driver_name");
    if (lErr) setError(lErr.message);
    else setRows((data as DriverRow[]) ?? []);
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

  const openEdit = (row: DriverRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      driver_name: row.driver_name,
      license_number: row.license_number ?? "",
      license_class: row.license_class ?? "",
      endorsements: row.endorsements ?? "",
      license_expires: row.license_expires ?? "",
      medical_card_expires: row.medical_card_expires ?? "",
      last_mvr_review: row.last_mvr_review ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      driver_name: form.driver_name.trim(),
      license_number: form.license_number.trim() || null,
      license_class: form.license_class.trim() || null,
      endorsements: form.endorsements.trim() || null,
      license_expires: form.license_expires || null,
      medical_card_expires: form.medical_card_expires || null,
      last_mvr_review: form.last_mvr_review || null,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("driver_qualifications").update(payload).eq("id", editId)
      : await supabase.from("driver_qualifications").insert(payload);
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
    const { error: dErr } = await supabase
      .from("driver_qualifications")
      .delete()
      .eq("id", deleteId);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<DriverRow>[]>(() => {
    const base: Column<DriverRow>[] = [
      {
        key: "driver",
        header: "Driver",
        sortValue: (r) => r.driver_name,
        cell: (r) => <span className="font-medium">{r.driver_name}</span>,
      },
      {
        key: "class",
        header: "License class",
        sortValue: (r) => r.license_class ?? "",
        cell: (r) => (
          <span>
            {r.license_class || "—"}
            {r.endorsements ? (
              <span className="text-muted-foreground"> · {r.endorsements}</span>
            ) : null}
          </span>
        ),
      },
      {
        key: "license_expires",
        header: "License expires",
        sortValue: (r) => r.license_expires ?? "",
        cell: (r) => <DateCell date={r.license_expires} />,
      },
      {
        key: "medical_expires",
        header: "Medical card expires",
        sortValue: (r) => r.medical_card_expires ?? "",
        cell: (r) => <DateCell date={r.medical_card_expires} />,
      },
      {
        key: "mvr",
        header: "Last MVR review",
        sortValue: (r) => r.last_mvr_review ?? "",
        cell: (r) => (
          <span className="nowrap-date text-muted-foreground">
            {r.last_mvr_review ? formatDate(r.last_mvr_review) : "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => statusRank(overallStatus(r)),
        cell: (r) => <StatusPill status={overallStatus(r)} />,
      },
    ];
    const actions: Column<DriverRow>[] =
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
                      aria-label="Edit driver"
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
                      aria-label="Delete driver"
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

  const attention = rows.filter((r) => {
    const s = overallStatus(r);
    return s === "expired" || s === "expiring";
  }).length;

  return (
    <Layout>
      <PageHeader
        title="Driver Qualifications"
        description="Driver licensing and DOT qualification — license class & expiry, medical-card expiry, and MVR review tracking."
        actions={<SectionActions label="Driver Qualifications" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Driver Qualification Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} driver{rows.length === 1 ? "" : "s"}
            {attention > 0 && (
              <span className="text-destructive"> · {attention} expired or expiring soon</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Driver
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
          minWidthClass="min-w-[940px]"
          emptyTitle="No drivers recorded"
          emptyDescription="Add each driver's license and DOT medical details so you can keep the fleet qualified."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Driver" : "Add Driver"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="d-name">Driver name *</Label>
                <Input
                  id="d-name"
                  value={form.driver_name}
                  onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-license-num">License #</Label>
                <Input
                  id="d-license-num"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="d-class">License class</Label>
                <Input
                  id="d-class"
                  value={form.license_class}
                  onChange={(e) => setForm({ ...form, license_class: e.target.value })}
                  placeholder="e.g. Class A CDL"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-endorse">Endorsements</Label>
                <Input
                  id="d-endorse"
                  value={form.endorsements}
                  onChange={(e) => setForm({ ...form, endorsements: e.target.value })}
                  placeholder="e.g. Tanker, HazMat"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="d-license-exp">License expires</Label>
                <Input
                  id="d-license-exp"
                  type="date"
                  value={form.license_expires}
                  onChange={(e) => setForm({ ...form, license_expires: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-medical-exp">Medical card expires</Label>
                <Input
                  id="d-medical-exp"
                  type="date"
                  value={form.medical_card_expires}
                  onChange={(e) => setForm({ ...form, medical_card_expires: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-mvr">Last MVR review</Label>
              <Input
                id="d-mvr"
                type="date"
                value={form.last_mvr_review}
                onChange={(e) => setForm({ ...form, last_mvr_review: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-notes">Notes</Label>
              <Textarea
                id="d-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.driver_name.trim()}>
              {saving ? "Saving…" : editId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteId(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this driver?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the driver from the qualification log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
