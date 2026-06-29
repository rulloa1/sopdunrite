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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/osha300")({
  head: () => ({
    meta: [
      { title: "OSHA 300 Log | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "OSHA 300 log of work-related injuries and illnesses, with the Form 300A annual summary totals.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Osha300 />
    </RequireAuth>
  ),
});

type CaseRow = Database["public"]["Tables"]["osha300_log"]["Row"];

// Form 300 column G-J: the single most-serious outcome for the case.
const CLASSIFICATIONS = [
  { value: "death", label: "Death" },
  { value: "days_away", label: "Days away from work" },
  { value: "restricted", label: "Job transfer / restriction" },
  { value: "other", label: "Other recordable case" },
];
// Form 300 column M: injury vs. illness type.
const INJURY_TYPES = [
  { value: "injury", label: "Injury" },
  { value: "skin_disorder", label: "Skin disorder" },
  { value: "respiratory", label: "Respiratory condition" },
  { value: "poisoning", label: "Poisoning" },
  { value: "hearing_loss", label: "Hearing loss" },
  { value: "other_illness", label: "Other illness" },
];

const labelOf = (list: { value: string; label: string }[], v: string) =>
  list.find((o) => o.value === v)?.label ?? v;

const CLASS_PILL: Record<string, string> = {
  death: "bg-destructive/10 text-destructive",
  days_away: "bg-amber-500/10 text-amber-600",
  restricted: "bg-amber-500/10 text-amber-600",
  other: "bg-muted text-muted-foreground",
};
// Surface the most serious cases first.
const CLASS_RANK: Record<string, number> = {
  death: 4,
  days_away: 3,
  restricted: 2,
  other: 1,
};

function ClassPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        CLASS_PILL[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {labelOf(CLASSIFICATIONS, status)}
    </span>
  );
}

function buildEmptyForm() {
  return {
    id: "",
    case_number: "",
    employee_name: "",
    job_title: "",
    incident_date: "",
    location: "",
    injury_description: "",
    classification: "other",
    injury_type: "injury",
    days_away: "",
    days_restricted: "",
    privacy_case: false,
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

/** A privacy-concern case withholds the employee's name on shared copies. */
function displayName(r: CaseRow) {
  return r.privacy_case ? "Privacy case" : r.employee_name;
}

function Osha300() {
  const { role } = useAuth();
  const [rows, setRows] = useState<CaseRow[]>([]);
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
      .from("osha300_log")
      .select("*")
      .order("incident_date", { ascending: false });
    // Superseded by a newer load: bail without touching state — the newest
    // load always runs to completion and owns the loading flag, so this can't
    // leave the spinner stuck, and it avoids clearing it prematurely.
    if (seq !== loadSeq.current) return;
    if (lErr) setError(lErr.message);
    else setRows((data as CaseRow[]) ?? []);
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

  const openEdit = (row: CaseRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      case_number: row.case_number ?? "",
      employee_name: row.employee_name,
      job_title: row.job_title ?? "",
      incident_date: row.incident_date,
      location: row.location ?? "",
      injury_description: row.injury_description ?? "",
      classification: row.classification,
      injury_type: row.injury_type,
      days_away: String(row.days_away ?? 0),
      days_restricted: String(row.days_restricted ?? 0),
      privacy_case: row.privacy_case,
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.incident_date) {
      setError("A date is required.");
      return;
    }
    const awayTrim = form.days_away.trim();
    const restTrim = form.days_restricted.trim();
    const badCount = (v: string) => v && (!Number.isInteger(Number(v)) || Number(v) < 0);
    if (badCount(awayTrim) || badCount(restTrim)) {
      setError("Day counts must be whole numbers (0 or more).");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      case_number: form.case_number.trim() || null,
      employee_name: form.employee_name.trim(),
      job_title: form.job_title.trim() || null,
      incident_date: form.incident_date,
      location: form.location.trim() || null,
      injury_description: form.injury_description.trim() || null,
      classification: form.classification,
      injury_type: form.injury_type,
      days_away: awayTrim ? Number(awayTrim) : 0,
      days_restricted: restTrim ? Number(restTrim) : 0,
      privacy_case: form.privacy_case,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("osha300_log").update(payload).eq("id", editId)
      : await supabase.from("osha300_log").insert(payload);
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
    const { error: dErr } = await supabase.from("osha300_log").delete().eq("id", deleteId);
    setDeleting(false);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<CaseRow>[]>(() => {
    const base: Column<CaseRow>[] = [
      {
        key: "case",
        header: "Case #",
        sortValue: (r) => r.case_number ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.case_number || "—"}</span>,
      },
      {
        key: "employee",
        header: "Employee",
        sortValue: (r) => displayName(r),
        cell: (r) => <span className="font-medium">{displayName(r)}</span>,
      },
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.incident_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.incident_date)}</span>,
      },
      {
        key: "injury",
        header: "Injury / Illness",
        sortValue: (r) => labelOf(INJURY_TYPES, r.injury_type),
        cell: (r) => (
          <span className="text-muted-foreground">{labelOf(INJURY_TYPES, r.injury_type)}</span>
        ),
      },
      {
        key: "classification",
        header: "Outcome",
        sortValue: (r) => CLASS_RANK[r.classification] ?? 0,
        cell: (r) => <ClassPill status={r.classification} />,
      },
      {
        key: "days",
        header: "Days away / restr.",
        align: "right",
        sortValue: (r) => r.days_away + r.days_restricted,
        cell: (r) => (
          <span className="text-muted-foreground">
            {r.days_away} / {r.days_restricted}
          </span>
        ),
      },
    ];
    const actions: Column<CaseRow>[] =
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
                      aria-label="Edit case"
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
                      aria-label="Delete case"
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

  // Form 300A annual-summary totals, computed from the current cases.
  const summary = useMemo(() => {
    const s = {
      total: rows.length,
      death: 0,
      days_away: 0,
      restricted: 0,
      other: 0,
      totalDaysAway: 0,
      totalDaysRestricted: 0,
      injury: 0,
      skin_disorder: 0,
      respiratory: 0,
      poisoning: 0,
      hearing_loss: 0,
      other_illness: 0,
    };
    for (const r of rows) {
      if (r.classification in s) (s as Record<string, number>)[r.classification] += 1;
      if (r.injury_type in s) (s as Record<string, number>)[r.injury_type] += 1;
      s.totalDaysAway += r.days_away;
      s.totalDaysRestricted += r.days_restricted;
    }
    return s;
  }, [rows]);

  return (
    <Layout>
      <PageHeader
        title="OSHA 300 Log"
        description="Log of work-related injuries and illnesses, with the Form 300A annual summary totals."
        actions={<SectionActions label="OSHA 300 Log" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Injury & Illness Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} recordable case{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Case
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
        <>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            initialSort={{ key: "date", dir: "desc" }}
            minWidthClass="min-w-[900px]"
            emptyTitle="No recordable cases logged"
            emptyDescription="Add each work-related injury or illness that meets OSHA's recording criteria; the 300A summary totals update automatically."
          />

          {/* Form 300A annual summary — totals roll up from the cases above. */}
          <div className="mt-8 rounded-lg border bg-card p-5">
            <h3 className="font-display text-lg font-semibold">Form 300A — Summary Totals</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Rolled up from the {summary.total} case{summary.total === 1 ? "" : "s"} above. Post
              the signed 300A summary from February 1 through April 30 each year.
            </p>

            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Number of cases
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryStat label="Deaths (G)" value={summary.death} />
                <SummaryStat label="Days away (H)" value={summary.days_away} />
                <SummaryStat label="Transfer / restriction (I)" value={summary.restricted} />
                <SummaryStat label="Other recordable (J)" value={summary.other} />
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Number of days
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryStat label="Days away from work (K)" value={summary.totalDaysAway} />
                <SummaryStat
                  label="Days transfer / restriction (L)"
                  value={summary.totalDaysRestricted}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Injury & illness types (M)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <SummaryStat label="Injuries" value={summary.injury} />
                <SummaryStat label="Skin disorders" value={summary.skin_disorder} />
                <SummaryStat label="Respiratory" value={summary.respiratory} />
                <SummaryStat label="Poisonings" value={summary.poisoning} />
                <SummaryStat label="Hearing loss" value={summary.hearing_loss} />
                <SummaryStat label="Other illnesses" value={summary.other_illness} />
              </div>
            </div>
          </div>
        </>
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
            <DialogTitle>{editId ? "Edit Case" : "Add Recordable Case"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="o-case">Case #</Label>
                <Input
                  id="o-case"
                  value={form.case_number}
                  onChange={(e) => setForm({ ...form, case_number: e.target.value })}
                  placeholder="e.g. 2026-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-date">Date of injury / illness *</Label>
                <Input
                  id="o-date"
                  type="date"
                  value={form.incident_date}
                  onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="o-employee">Employee name *</Label>
                <Input
                  id="o-employee"
                  value={form.employee_name}
                  onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-title">Job title</Label>
                <Input
                  id="o-title"
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-location">Where the event occurred</Label>
              <Input
                id="o-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Jobsite / area"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-desc">
                Describe the injury / illness, body part, and what happened
              </Label>
              <Textarea
                id="o-desc"
                rows={3}
                value={form.injury_description}
                onChange={(e) => setForm({ ...form, injury_description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="o-class">Outcome (most serious)</Label>
                <Select
                  value={form.classification}
                  onValueChange={(v) => setForm({ ...form, classification: v })}
                >
                  <SelectTrigger id="o-class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-type">Injury / illness type</Label>
                <Select
                  value={form.injury_type}
                  onValueChange={(v) => setForm({ ...form, injury_type: v })}
                >
                  <SelectTrigger id="o-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INJURY_TYPES.map((o) => (
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
                <Label htmlFor="o-away">Days away from work</Label>
                <Input
                  id="o-away"
                  inputMode="numeric"
                  value={form.days_away}
                  onChange={(e) => setForm({ ...form, days_away: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-restricted">Days transfer / restriction</Label>
                <Input
                  id="o-restricted"
                  inputMode="numeric"
                  value={form.days_restricted}
                  onChange={(e) => setForm({ ...form, days_restricted: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="pr-3">
                <Label htmlFor="o-privacy">Privacy concern case</Label>
                <p className="text-xs text-muted-foreground">
                  Withholds the employee name on shared and printed copies.
                </p>
              </div>
              <Switch
                id="o-privacy"
                checked={form.privacy_case}
                onCheckedChange={(v) => setForm({ ...form, privacy_case: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-notes">Notes</Label>
              <Textarea
                id="o-notes"
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
              disabled={saving || !form.employee_name.trim() || !form.incident_date}
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
            <AlertDialogTitle>Remove this case?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the case from the OSHA 300 log and its 300A totals. This action cannot be
              undone.
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

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
