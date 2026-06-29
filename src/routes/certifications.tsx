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
import { expiryStatus, statusRank, type ExpiryStatus } from "@/lib/expiry";
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

export const Route = createFileRoute("/certifications")({
  head: () => ({
    meta: [
      { title: "Training & Certifications | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Employee training and certification log with issue and expiration tracking (OSHA, equipment, first aid, and more).",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Certifications />
    </RequireAuth>
  ),
});

type CertRow = Database["public"]["Tables"]["certifications"]["Row"];

const STATUS_PILL: Record<ExpiryStatus, { label: string; className: string }> = {
  valid: { label: "Valid", className: "bg-success/10 text-success" },
  expiring: { label: "Expiring soon", className: "bg-amber-500/10 text-amber-600" },
  expired: { label: "Expired", className: "bg-destructive/10 text-destructive" },
  none: { label: "No expiry", className: "bg-muted text-muted-foreground" },
};

function StatusPill({ status }: { status: ExpiryStatus }) {
  const s = STATUS_PILL[status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function buildEmptyForm() {
  return {
    id: "",
    employee_name: "",
    certification: "",
    issuing_organization: "",
    certificate_number: "",
    issued_date: "",
    expires_date: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function Certifications() {
  const { role } = useAuth();
  const [rows, setRows] = useState<CertRow[]>([]);
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

  // Sequence guard: only the most recent load() applies its result, so an
  // earlier in-flight fetch can't resolve last and overwrite fresher rows.
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    const { data, error: lErr } = await supabase
      .from("certifications")
      .select("*")
      .order("expires_date", { ascending: true, nullsFirst: false });
    // Superseded by a newer load: bail without touching state — the newest
    // load always runs to completion and owns the loading flag, so this can't
    // leave the spinner stuck, and it avoids clearing it prematurely.
    if (seq !== loadSeq.current) return;
    if (lErr) setError(lErr.message);
    else setRows((data as CertRow[]) ?? []);
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

  const openEdit = (row: CertRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      employee_name: row.employee_name,
      certification: row.certification,
      issuing_organization: row.issuing_organization ?? "",
      certificate_number: row.certificate_number ?? "",
      issued_date: row.issued_date ?? "",
      expires_date: row.expires_date ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    // Mirror the DB CHECK so the user gets a clear message, not a raw
    // constraint error. yyyy-mm-dd strings compare chronologically.
    if (form.issued_date && form.expires_date && form.expires_date < form.issued_date) {
      setError("Expiration date can't be before the issued date.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      employee_name: form.employee_name.trim(),
      certification: form.certification.trim(),
      issuing_organization: form.issuing_organization.trim() || null,
      certificate_number: form.certificate_number.trim() || null,
      issued_date: form.issued_date || null,
      expires_date: form.expires_date || null,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("certifications").update(payload).eq("id", editId)
      : await supabase.from("certifications").insert(payload);
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
    const { error: dErr } = await supabase.from("certifications").delete().eq("id", deleteId);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<CertRow>[]>(() => {
    const base: Column<CertRow>[] = [
      {
        key: "employee",
        header: "Employee",
        sortValue: (r) => r.employee_name,
        cell: (r) => <span className="font-medium">{r.employee_name}</span>,
      },
      {
        key: "certification",
        header: "Certification / Training",
        sortValue: (r) => r.certification,
        cell: (r) => r.certification,
      },
      {
        key: "org",
        header: "Issuer",
        sortValue: (r) => r.issuing_organization ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.issuing_organization || "—"}</span>,
      },
      {
        key: "issued",
        header: "Issued",
        sortValue: (r) => r.issued_date ?? "",
        cell: (r) => (
          <span className="nowrap-date">{r.issued_date ? formatDate(r.issued_date) : "—"}</span>
        ),
      },
      {
        key: "expires",
        header: "Expires",
        sortValue: (r) => r.expires_date ?? "",
        cell: (r) => (
          <span className="nowrap-date">{r.expires_date ? formatDate(r.expires_date) : "—"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => statusRank(expiryStatus(r.expires_date)),
        cell: (r) => <StatusPill status={expiryStatus(r.expires_date)} />,
      },
    ];
    const actions: Column<CertRow>[] =
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
                      aria-label="Edit certification"
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
                      aria-label="Delete certification"
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
    const s = expiryStatus(r.expires_date);
    return s === "expired" || s === "expiring";
  }).length;

  return (
    <Layout>
      <PageHeader
        title="Training & Certifications"
        description="Employee training and certifications with expiration tracking — OSHA, equipment-specific, first aid/CPR, and more."
        actions={<SectionActions label="Training & Certifications" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Certification Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} record{rows.length === 1 ? "" : "s"}
            {attention > 0 && (
              <span className="text-destructive"> · {attention} expired or expiring soon</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Certification
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
          minWidthClass="min-w-[860px]"
          emptyTitle="No certifications recorded"
          emptyDescription="Add each employee's training and certifications so you can track what is current and what is expiring."
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
            <DialogTitle>{editId ? "Edit Certification" : "Add Certification"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-employee">Employee name *</Label>
                <Input
                  id="c-employee"
                  value={form.employee_name}
                  onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-cert">Certification / training *</Label>
                <Input
                  id="c-cert"
                  value={form.certification}
                  onChange={(e) => setForm({ ...form, certification: e.target.value })}
                  placeholder="e.g. OSHA 30, Forklift, First Aid/CPR"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-org">Issuing organization</Label>
                <Input
                  id="c-org"
                  value={form.issuing_organization}
                  onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-num">Certificate #</Label>
                <Input
                  id="c-num"
                  value={form.certificate_number}
                  onChange={(e) => setForm({ ...form, certificate_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-issued">Issued date</Label>
                <Input
                  id="c-issued"
                  type="date"
                  value={form.issued_date}
                  onChange={(e) => setForm({ ...form, issued_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-expires">Expiration date</Label>
                <Input
                  id="c-expires"
                  type="date"
                  value={form.expires_date}
                  onChange={(e) => setForm({ ...form, expires_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-notes">Notes</Label>
              <Textarea
                id="c-notes"
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
              disabled={saving || !form.employee_name.trim() || !form.certification.trim()}
            >
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
            <AlertDialogTitle>Remove this certification?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record from the log. This action cannot be undone.
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
