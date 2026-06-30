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

export const Route = createFileRoute("/job-safety-analyses")({
  head: () => ({
    meta: [
      { title: "Job Safety Analysis | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Job Safety Analysis (JSA) log — break each job into steps, identify the hazards, and record the controls that keep crews safe.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <JobSafetyAnalyses />
    </RequireAuth>
  ),
});

type JsaRow = Database["public"]["Tables"]["job_safety_analyses"]["Row"];

function buildEmptyForm() {
  return {
    id: "",
    job_title: "",
    jsa_date: todayISO(),
    location: "",
    prepared_by: "",
    required_ppe: "",
    job_steps: "",
    hazards: "",
    controls: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function JobSafetyAnalyses() {
  const { role } = useAuth();
  const [rows, setRows] = useState<JsaRow[]>([]);
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
      .from("job_safety_analyses")
      .select("*")
      .order("jsa_date", { ascending: false });
    // Superseded by a newer load: bail without touching state — the newest
    // load always runs to completion and owns the loading flag, so this can't
    // leave the spinner stuck, and it avoids clearing it prematurely.
    if (seq !== loadSeq.current) return;
    if (lErr) setError(lErr.message);
    else setRows((data as JsaRow[]) ?? []);
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

  const openEdit = (row: JsaRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      job_title: row.job_title,
      jsa_date: row.jsa_date,
      location: row.location ?? "",
      prepared_by: row.prepared_by ?? "",
      required_ppe: row.required_ppe ?? "",
      job_steps: row.job_steps ?? "",
      hazards: row.hazards ?? "",
      controls: row.controls ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.jsa_date) {
      setError("A date is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      job_title: form.job_title.trim(),
      jsa_date: form.jsa_date,
      location: form.location.trim() || null,
      prepared_by: form.prepared_by.trim() || null,
      required_ppe: form.required_ppe.trim() || null,
      job_steps: form.job_steps.trim() || null,
      hazards: form.hazards.trim() || null,
      controls: form.controls.trim() || null,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("job_safety_analyses").update(payload).eq("id", editId)
      : await supabase.from("job_safety_analyses").insert(payload);
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
    const { error: dErr } = await supabase.from("job_safety_analyses").delete().eq("id", deleteId);
    setDeleting(false);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<JsaRow>[]>(() => {
    const base: Column<JsaRow>[] = [
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.jsa_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.jsa_date)}</span>,
      },
      {
        key: "job_title",
        header: "Job / Task",
        sortValue: (r) => r.job_title,
        cell: (r) => <span className="font-medium">{r.job_title}</span>,
      },
      {
        key: "location",
        header: "Location",
        sortValue: (r) => r.location ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.location || "—"}</span>,
      },
      {
        key: "prepared_by",
        header: "Prepared by",
        sortValue: (r) => r.prepared_by ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.prepared_by || "—"}</span>,
      },
    ];
    const actions: Column<JsaRow>[] =
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
                      aria-label="Edit JSA"
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
                      aria-label="Delete JSA"
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

  return (
    <Layout>
      <PageHeader
        title="Job Safety Analysis"
        description="Break each job into steps, identify the hazards in each step, and record the controls that keep crews safe."
        actions={<SectionActions label="Job Safety Analysis" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">JSA Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "analysis" : "analyses"} recorded
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add JSA
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
          minWidthClass="min-w-[760px]"
          emptyTitle="No job safety analyses recorded"
          emptyDescription="Document a JSA for each task so the hazards and controls are reviewed with the crew before work starts."
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
            <DialogTitle>{editId ? "Edit JSA" : "Add Job Safety Analysis"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="j-title">Job / Task *</Label>
              <Input
                id="j-title"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                placeholder="e.g. Trenching for footings, Roof tear-off"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="j-date">Date *</Label>
                <Input
                  id="j-date"
                  type="date"
                  value={form.jsa_date}
                  onChange={(e) => setForm({ ...form, jsa_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-prepared">Prepared by</Label>
                <Input
                  id="j-prepared"
                  value={form.prepared_by}
                  onChange={(e) => setForm({ ...form, prepared_by: e.target.value })}
                  placeholder="Competent person"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="j-location">Location / project</Label>
                <Input
                  id="j-location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-ppe">Required PPE</Label>
                <Input
                  id="j-ppe"
                  value={form.required_ppe}
                  onChange={(e) => setForm({ ...form, required_ppe: e.target.value })}
                  placeholder="e.g. Hard hat, gloves, eye protection"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-steps">Job steps</Label>
              <Textarea
                id="j-steps"
                rows={3}
                value={form.job_steps}
                onChange={(e) => setForm({ ...form, job_steps: e.target.value })}
                placeholder="Break the job into the sequence of steps"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-hazards">Hazards</Label>
              <Textarea
                id="j-hazards"
                rows={3}
                value={form.hazards}
                onChange={(e) => setForm({ ...form, hazards: e.target.value })}
                placeholder="Potential hazards in each step"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-controls">Controls</Label>
              <Textarea
                id="j-controls"
                rows={3}
                value={form.controls}
                onChange={(e) => setForm({ ...form, controls: e.target.value })}
                placeholder="Control measures / safe work procedures"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-notes">Notes</Label>
              <Textarea
                id="j-notes"
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
            <Button onClick={save} disabled={saving || !form.job_title.trim() || !form.jsa_date}>
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
            <AlertDialogTitle>Remove this JSA?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the job safety analysis from the log. This action cannot be undone.
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
