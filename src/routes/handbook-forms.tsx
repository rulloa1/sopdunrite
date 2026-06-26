import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canManageLogs, canDeleteLogs } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";
import { formatDate } from "@/data/projectData";
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

export const Route = createFileRoute("/handbook-forms")({
  head: () => ({
    meta: [
      { title: "Handbook Forms | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Supplemental employee handbook acknowledgment forms and a log of which forms each employee has signed.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <HandbookForms />
    </RequireAuth>
  ),
});

const COMPANY = "DunRite Construction Group LLC";

/**
 * Supplemental forms for the employee handbook. Each entry is a printable
 * acknowledgment an employee signs (on paper); the body is the statement they
 * are agreeing to. Keep `key` in sync with the form_type CHECK constraint and
 * the Supabase types.
 */
const FORM_TEMPLATES: { key: string; title: string; body: string }[] = [
  {
    key: "handbook_receipt",
    title: "Employee Handbook Receipt & Acknowledgment",
    body: `I acknowledge that I have received a copy of the ${COMPANY} Employee Handbook. I understand it is my responsibility to read and comply with the policies, procedures, and safety rules it contains, and any revisions made to it. I understand the handbook is a guideline and does not create a contract of employment, and that my employment is at-will. I will direct any questions about its contents to my supervisor or management.`,
  },
  {
    key: "safety_program",
    title: "Safety Program Acknowledgment",
    body: `I have received and reviewed the ${COMPANY} safety program, including the rules for the work and equipment I am assigned. I agree to follow all safety policies and procedures, to use the personal protective equipment required for each task, to report unsafe conditions, injuries, and incidents promptly, and to stop work and seek guidance when I am unsure how to perform a task safely.`,
  },
  {
    key: "drug_alcohol",
    title: "Drug & Alcohol Policy Acknowledgment",
    body: `I acknowledge that ${COMPANY} maintains a drug- and alcohol-free workplace. I understand that reporting to work or operating any vehicle, equipment, or machinery while under the influence of alcohol or unlawful drugs is prohibited, and that I may be subject to testing consistent with company policy and applicable law. I understand that violation of this policy may result in disciplinary action up to and including termination.`,
  },
  {
    key: "driver_agreement",
    title: "Driver Agreement & Motor Vehicle Record Authorization",
    body: `As an operator of company or personal vehicles for ${COMPANY} business, I agree to hold a valid driver's license, obey all traffic laws, complete required pre-use inspections, and report any citation, accident, or license change promptly. I authorize ${COMPANY} to obtain and review my motor vehicle record (MVR) for the purpose of verifying my driving eligibility, now and periodically during my employment.`,
  },
  {
    key: "ppe_issuance",
    title: "Personal Protective Equipment (PPE) Issuance & Acknowledgment",
    body: `I acknowledge that I have been issued and/or instructed on the personal protective equipment required for my work (which may include hard hat, safety glasses, hearing protection, hi-visibility apparel, gloves, and protective footwear). I agree to wear the required PPE, to inspect it before use, to maintain it in serviceable condition, and to request replacement when it is damaged, worn, or lost.`,
  },
  {
    key: "corrective_action",
    title: "Disciplinary / Corrective Action Acknowledgment",
    body: `I acknowledge that this corrective action notice has been discussed with me. My signature indicates that I have received and reviewed it; it does not necessarily indicate agreement. I understand the expectations going forward and that further policy violations may result in additional disciplinary action up to and including termination. I may attach a written response if I choose.`,
  },
];

const FORM_LABELS: Record<string, string> = Object.fromEntries(
  FORM_TEMPLATES.map((f) => [f.key, f.title]),
);
const labelOf = (key: string) => FORM_LABELS[key] ?? key;

type AckRow = Database["public"]["Tables"]["handbook_acknowledgments"]["Row"];

/** Local (not UTC) yyyy-mm-dd so a late-evening entry keeps today's date. */
function today() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function buildEmptyForm() {
  return {
    id: "",
    employee_name: "",
    form_type: "handbook_receipt",
    acknowledged_date: today(),
    supervisor: "",
    signed_on_file: false,
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function HandbookForms() {
  const { role } = useAuth();
  const [rows, setRows] = useState<AckRow[]>([]);
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
      .from("handbook_acknowledgments")
      .select("*")
      .order("acknowledged_date", { ascending: false });
    if (lErr) setError(lErr.message);
    else setRows((data as AckRow[]) ?? []);
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

  const openEdit = (row: AckRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      employee_name: row.employee_name,
      form_type: row.form_type,
      acknowledged_date: row.acknowledged_date,
      supervisor: row.supervisor ?? "",
      signed_on_file: row.signed_on_file,
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      employee_name: form.employee_name.trim(),
      form_type: form.form_type,
      acknowledged_date: form.acknowledged_date || today(),
      supervisor: form.supervisor.trim() || null,
      signed_on_file: form.signed_on_file,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply
    // it — this always satisfies the WITH CHECK (created_by = auth.uid())
    // policy, even if the client auth context is momentarily unresolved.
    const res = editId
      ? await supabase.from("handbook_acknowledgments").update(payload).eq("id", editId)
      : await supabase.from("handbook_acknowledgments").insert(payload);
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
      .from("handbook_acknowledgments")
      .delete()
      .eq("id", deleteId);
    if (dErr) {
      // Keep the confirmation dialog open and show the error inside it, so the
      // failure stays visible (a page-level banner would sit behind the dialog).
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<AckRow>[]>(() => {
    const base: Column<AckRow>[] = [
      {
        key: "employee",
        header: "Employee",
        sortValue: (r) => r.employee_name,
        cell: (r) => <span className="font-medium">{r.employee_name}</span>,
      },
      {
        key: "form",
        header: "Form",
        sortValue: (r) => labelOf(r.form_type),
        cell: (r) => labelOf(r.form_type),
      },
      {
        key: "date",
        header: "Acknowledged",
        sortValue: (r) => r.acknowledged_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.acknowledged_date)}</span>,
      },
      {
        key: "supervisor",
        header: "Supervisor",
        sortValue: (r) => r.supervisor ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.supervisor || "—"}</span>,
      },
      {
        key: "onfile",
        header: "Signed copy",
        sortValue: (r) => (r.signed_on_file ? 1 : 0),
        cell: (r) =>
          r.signed_on_file ? (
            <span className="text-success">On file</span>
          ) : (
            <span className="text-destructive">Missing</span>
          ),
      },
    ];
    const actions: Column<AckRow>[] =
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
                      aria-label="Edit acknowledgment"
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
                      aria-label="Delete acknowledgment"
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

  const missingOnFile = rows.filter((r) => !r.signed_on_file).length;

  return (
    <Layout>
      <PageHeader
        title="Handbook Forms"
        description="Supplemental employee-handbook acknowledgment forms, plus a log of which forms each employee has signed."
        actions={<SectionActions label="Handbook Forms" />}
      />

      {/* Printable form templates — print blank for signing, then log below. */}
      <div className="mb-8 space-y-4 rounded-xl border bg-card p-5 shadow-sm print-section">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ClipboardCheck className="h-4 w-4" /> Acknowledgment Forms
        </div>
        <p className="text-sm text-muted-foreground">
          Print this section for signatures. Each employee signs the applicable form; record the
          signed form in the log below and keep the original on file.
        </p>
        {FORM_TEMPLATES.map((f) => (
          <div key={f.key} className="rounded-lg border bg-background p-4">
            <h3 className="font-display text-sm font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SignatureLine label="Employee name (print)" />
              <SignatureLine label="Date" />
              <SignatureLine label="Employee signature" />
              <SignatureLine label="Supervisor signature" />
            </div>
          </div>
        ))}
      </div>

      {/* Acknowledgment log */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Acknowledgment Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} record{rows.length === 1 ? "" : "s"}
            {missingOnFile > 0 && (
              <span className="text-destructive"> · {missingOnFile} missing a signed copy</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Record Acknowledgment
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
          initialSort={{ key: "date", dir: "desc" }}
          minWidthClass="min-w-[820px]"
          emptyTitle="No acknowledgments recorded"
          emptyDescription="Record each signed handbook form so you can track who has acknowledged what."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Acknowledgment" : "Record Acknowledgment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="a-employee">Employee name *</Label>
              <Input
                id="a-employee"
                value={form.employee_name}
                onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-form">Form</Label>
              <Select
                value={form.form_type}
                onValueChange={(v) => setForm({ ...form, form_type: v })}
              >
                <SelectTrigger id="a-form">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORM_TEMPLATES.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-date">Date acknowledged</Label>
                <Input
                  id="a-date"
                  type="date"
                  value={form.acknowledged_date}
                  onChange={(e) => setForm({ ...form, acknowledged_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-supervisor">Supervisor / witness</Label>
                <Input
                  id="a-supervisor"
                  value={form.supervisor}
                  onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="a-onfile">Signed original on file</Label>
              <Switch
                id="a-onfile"
                checked={form.signed_on_file}
                onCheckedChange={(v) => setForm({ ...form, signed_on_file: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-notes">Notes</Label>
              <Textarea
                id="a-notes"
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
            <Button onClick={save} disabled={saving || !form.employee_name.trim()}>
              {saving ? "Saving…" : editId ? "Update" : "Record"}
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
            <AlertDialogTitle>Remove this acknowledgment?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record from the log. The signed paper original is unaffected. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Prevent Radix's default close-on-click so the dialog can stay
                // open (and show the error in context) when the delete fails.
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

function SignatureLine({ label }: { label: string }) {
  return (
    <div>
      <div className="h-7 border-b border-muted-foreground/40" />
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
