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

export const Route = createFileRoute("/subcontractor-prequal")({
  head: () => ({
    meta: [
      { title: "Subcontractor Prequalification | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Subcontractor safety prequalification log — EMR, insurance expiry, OSHA citation history, and qualification status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SubcontractorPrequal />
    </RequireAuth>
  ),
});

type SubRow = Database["public"]["Tables"]["subcontractor_prequalifications"]["Row"];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "conditional", label: "Conditional" },
  { value: "not_approved", label: "Not approved" },
];

const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((o) => o.value === v)?.label ?? v;

const STATUS_PILL: Record<string, string> = {
  approved: "bg-success/10 text-success",
  conditional: "bg-amber-500/10 text-amber-600",
  pending: "bg-muted text-muted-foreground",
  not_approved: "bg-destructive/10 text-destructive",
};
// Surface the records needing attention first (not approved, then pending).
const STATUS_RANK: Record<string, number> = {
  not_approved: 4,
  pending: 3,
  conditional: 2,
  approved: 1,
};

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

const COI_PILL: Record<ExpiryStatus, { label: string; className: string }> = {
  valid: { label: "Current", className: "bg-success/10 text-success" },
  expiring: { label: "Expiring soon", className: "bg-amber-500/10 text-amber-600" },
  expired: { label: "Expired", className: "bg-destructive/10 text-destructive" },
  none: { label: "—", className: "text-muted-foreground" },
};

function buildEmptyForm() {
  return {
    id: "",
    company_name: "",
    trade: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    emr: "",
    coi_expires: "",
    osha_citations: "",
    status: "pending",
    review_date: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function SubcontractorPrequal() {
  const { role } = useAuth();
  const [rows, setRows] = useState<SubRow[]>([]);
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
      .from("subcontractor_prequalifications")
      .select("*")
      .order("company_name", { ascending: true });
    // Superseded by a newer load: bail without touching state — the newest
    // load always runs to completion and owns the loading flag, so this can't
    // leave the spinner stuck, and it avoids clearing it prematurely.
    if (seq !== loadSeq.current) return;
    if (lErr) setError(lErr.message);
    else setRows((data as SubRow[]) ?? []);
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

  const openEdit = (row: SubRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      company_name: row.company_name,
      trade: row.trade ?? "",
      contact_name: row.contact_name ?? "",
      contact_email: row.contact_email ?? "",
      contact_phone: row.contact_phone ?? "",
      emr: row.emr === null ? "" : String(row.emr),
      coi_expires: row.coi_expires ?? "",
      osha_citations: row.osha_citations ?? "",
      status: row.status,
      review_date: row.review_date ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const emrTrim = form.emr.trim();
    if (emrTrim && (Number.isNaN(Number(emrTrim)) || Number(emrTrim) < 0)) {
      setError("EMR must be a number of 0 or more.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      company_name: form.company_name.trim(),
      trade: form.trade.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      emr: emrTrim ? Number(emrTrim) : null,
      coi_expires: form.coi_expires || null,
      osha_citations: form.osha_citations.trim() || null,
      status: form.status,
      review_date: form.review_date || null,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("subcontractor_prequalifications").update(payload).eq("id", editId)
      : await supabase.from("subcontractor_prequalifications").insert(payload);
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
    const { error: dErr } = await supabase
      .from("subcontractor_prequalifications")
      .delete()
      .eq("id", deleteId);
    setDeleting(false);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<SubRow>[]>(() => {
    const base: Column<SubRow>[] = [
      {
        key: "company",
        header: "Company",
        sortValue: (r) => r.company_name,
        cell: (r) => <span className="font-medium">{r.company_name}</span>,
      },
      {
        key: "trade",
        header: "Trade",
        sortValue: (r) => r.trade ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.trade || "—"}</span>,
      },
      {
        key: "emr",
        header: "EMR",
        align: "right",
        sortValue: (r) => r.emr ?? -1,
        cell: (r) => <span className="text-muted-foreground">{r.emr ?? "—"}</span>,
      },
      {
        key: "coi",
        header: "Insurance (COI)",
        sortValue: (r) => statusRank(expiryStatus(r.coi_expires)),
        cell: (r) => {
          const s = expiryStatus(r.coi_expires);
          const pill = COI_PILL[s];
          return (
            <span className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}>
                {pill.label}
              </span>
              {r.coi_expires && (
                <span className="nowrap-date text-xs text-muted-foreground">
                  {formatDate(r.coi_expires)}
                </span>
              )}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => STATUS_RANK[r.status] ?? 0,
        cell: (r) => <StatusPill status={r.status} />,
      },
    ];
    const actions: Column<SubRow>[] =
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
                      aria-label="Edit subcontractor"
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
                      aria-label="Delete subcontractor"
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
    const s = expiryStatus(r.coi_expires);
    return r.status === "not_approved" || r.status === "pending" || s === "expired";
  }).length;

  return (
    <Layout>
      <PageHeader
        title="Subcontractor Prequalification"
        description="Vet subcontractors before they mobilize — EMR, insurance, OSHA citation history, and an overall qualification status."
        actions={<SectionActions label="Subcontractor Prequalification" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Prequalification Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} subcontractor{rows.length === 1 ? "" : "s"}
            {attention > 0 && (
              <span className="text-destructive"> · {attention} need attention</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Subcontractor
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
          minWidthClass="min-w-[880px]"
          emptyTitle="No subcontractors prequalified"
          emptyDescription="Add each subcontractor so their EMR, insurance, and safety record are on file before they mobilize."
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
            <DialogTitle>{editId ? "Edit Subcontractor" : "Add Subcontractor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-company">Company name *</Label>
                <Input
                  id="s-company"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-trade">Trade</Label>
                <Input
                  id="s-trade"
                  value={form.trade}
                  onChange={(e) => setForm({ ...form, trade: e.target.value })}
                  placeholder="e.g. Electrical, Concrete, Framing"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-contact">Contact name</Label>
                <Input
                  id="s-contact"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">Contact phone</Label>
                <Input
                  id="s-phone"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Contact email</Label>
              <Input
                id="s-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-emr">EMR</Label>
                <Input
                  id="s-emr"
                  inputMode="decimal"
                  value={form.emr}
                  onChange={(e) => setForm({ ...form, emr: e.target.value })}
                  placeholder="e.g. 0.85"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-coi">COI expires</Label>
                <Input
                  id="s-coi"
                  type="date"
                  value={form.coi_expires}
                  onChange={(e) => setForm({ ...form, coi_expires: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-review">Reviewed</Label>
                <Input
                  id="s-review"
                  type="date"
                  value={form.review_date}
                  onChange={(e) => setForm({ ...form, review_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="s-status">
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
            <div className="space-y-1.5">
              <Label htmlFor="s-osha">OSHA citation history</Label>
              <Textarea
                id="s-osha"
                rows={2}
                value={form.osha_citations}
                onChange={(e) => setForm({ ...form, osha_citations: e.target.value })}
                placeholder="Recent citations / inspection history, if any"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-notes">Notes</Label>
              <Textarea
                id="s-notes"
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
            <Button onClick={save} disabled={saving || !form.company_name.trim()}>
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
            <AlertDialogTitle>Remove this subcontractor?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the prequalification record from the log. This action cannot be undone.
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
