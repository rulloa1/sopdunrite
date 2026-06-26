import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { formatDate } from "@/data/projectData";
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

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incident & Accident Reports | Dunrite Construction Group" },
      {
        name: "description",
        content: "Report and track workplace incidents, accidents and near misses.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Incidents />
    </RequireAuth>
  ),
});

type IncidentRow = Database["public"]["Tables"]["incident_reports"]["Row"];

const REPORT_TYPES = [
  { value: "incident", label: "Incident" },
  { value: "accident", label: "Accident" },
  { value: "near-miss", label: "Near Miss" },
];

const OWNERSHIP = [
  { value: "owned", label: "Company-owned" },
  { value: "non-owned", label: "Non-owned" },
  { value: "n/a", label: "N/A" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "under-review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

// Immediate-action steps to follow when an incident or accident occurs.
const ACTION_STEPS = [
  "Make the scene safe. Get medical help immediately for any injury — call 911 for serious or life-threatening injuries.",
  "Do not admit fault or discuss liability with anyone at the scene.",
  "Document everything: photos of the scene and damage; names and contact info for everyone involved and all witnesses.",
  "For vehicle accidents, exchange insurance, registration and license info, and obtain the police report number.",
  "Notify your supervisor and DunRite Construction Group immediately.",
  "Complete this report the same day — including non-owned equipment and vehicles.",
];

const labelOf = (opts: { value: string; label: string }[], v: string) =>
  opts.find((o) => o.value === v)?.label ?? v;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function buildEmptyForm() {
  return {
    id: "",
    report_type: "incident",
    equipment_ownership: "owned",
    incident_date: today(),
    incident_time: "",
    location: "",
    vehicle: "",
    people_involved: "",
    witnesses: "",
    description: "",
    injuries: false,
    injury_description: "",
    property_damage: false,
    damage_description: "",
    action_taken: "",
    status: "open",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function Pill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const tone =
    type === "accident"
      ? "bg-destructive/15 text-destructive"
      : type === "near-miss"
        ? "bg-muted text-muted-foreground"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return <Pill tone={tone}>{labelOf(REPORT_TYPES, type)}</Pill>;
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "closed"
      ? "bg-success/15 text-success"
      : status === "under-review"
        ? "bg-primary/15 text-primary"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return <Pill tone={tone}>{labelOf(STATUS_OPTIONS, status)}</Pill>;
}

function Incidents() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<IncidentRow[]>([]);
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
      .from("incident_reports")
      .select("*")
      .order("incident_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (lErr) setError(lErr.message);
    setRows((data as IncidentRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canModify = (row: IncidentRow) => isAdmin(role) || row.reported_by === user?.id;

  const openCreate = () => {
    setError(null);
    setEditId(null);
    setForm(buildEmptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: IncidentRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      report_type: row.report_type,
      equipment_ownership: row.equipment_ownership,
      incident_date: row.incident_date,
      incident_time: row.incident_time ?? "",
      location: row.location ?? "",
      vehicle: row.vehicle ?? "",
      people_involved: row.people_involved ?? "",
      witnesses: row.witnesses ?? "",
      description: row.description,
      injuries: row.injuries,
      injury_description: row.injury_description ?? "",
      property_damage: row.property_damage,
      damage_description: row.damage_description ?? "",
      action_taken: row.action_taken ?? "",
      status: row.status,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      report_type: form.report_type,
      equipment_ownership: form.equipment_ownership,
      incident_date: form.incident_date || today(),
      incident_time: form.incident_time.trim() || null,
      location: form.location.trim() || null,
      vehicle: form.vehicle.trim() || null,
      people_involved: form.people_involved.trim() || null,
      witnesses: form.witnesses.trim() || null,
      description: form.description.trim(),
      injuries: form.injuries,
      injury_description: form.injuries ? form.injury_description.trim() || null : null,
      property_damage: form.property_damage,
      damage_description: form.property_damage ? form.damage_description.trim() || null : null,
      action_taken: form.action_taken.trim() || null,
      status: form.status,
    };
    const res = editId
      ? await supabase.from("incident_reports").update(payload).eq("id", editId)
      : await supabase
          .from("incident_reports")
          .insert({ ...payload, reported_by: user?.id ?? null });
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
    const { error: dErr } = await supabase.from("incident_reports").delete().eq("id", deleteId);
    setDeleteId(null);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    load();
  };

  const columns = useMemo<Column<IncidentRow>[]>(() => {
    const base: Column<IncidentRow>[] = [
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.incident_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.incident_date)}</span>,
      },
      {
        key: "type",
        header: "Type",
        sortValue: (r) => r.report_type,
        cell: (r) => <TypeBadge type={r.report_type} />,
      },
      {
        key: "ownership",
        header: "Equipment",
        sortValue: (r) => r.equipment_ownership,
        cell: (r) => (
          <span className="text-muted-foreground">{labelOf(OWNERSHIP, r.equipment_ownership)}</span>
        ),
      },
      {
        key: "vehicle",
        header: "Vehicle / Equipment",
        sortValue: (r) => r.vehicle ?? "",
        cell: (r) => r.vehicle || <span className="text-muted-foreground">—</span>,
      },
      {
        key: "location",
        header: "Location",
        sortValue: (r) => r.location ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.location || "—"}</span>,
      },
      {
        key: "injuries",
        header: "Injuries",
        align: "center",
        sortValue: (r) => (r.injuries ? 1 : 0),
        cell: (r) =>
          r.injuries ? (
            <Pill tone="bg-destructive/15 text-destructive">Yes</Pill>
          ) : (
            <span className="text-muted-foreground">No</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (r) => r.status,
        cell: (r) => <StatusPill status={r.status} />,
      },
    ];
    const actions: Column<IncidentRow>[] = [
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
                aria-label="Edit report"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeleteId(r.id)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete report"
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

  const openCount = rows.filter((r) => r.status !== "closed").length;

  return (
    <Layout>
      <PageHeader
        title="Incident & Accident Reports"
        description="Report and track workplace incidents, accidents and near misses — including non-owned equipment and vehicles."
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={openCreate} className="no-print">
              <Plus className="mr-1.5 h-4 w-4" /> New Report
            </Button>
            <SectionActions label="Incident & Accident Reports" />
          </div>
        }
      />

      {/* Immediate-action instructions — what to do when an incident occurs */}
      <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 print-section">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
          <TriangleAlert className="h-4 w-4" /> If an incident or accident occurs
        </div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-900/90 dark:text-amber-100/80">
          {ACTION_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {rows.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          {rows.length} report{rows.length === 1 ? "" : "s"} · {openCount} open
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
          emptyTitle="No reports filed"
          emptyDescription="File a report when an incident, accident or near miss occurs."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Report" : "New Incident / Accident Report"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Report type</Label>
                <Select
                  value={form.report_type}
                  onValueChange={(v) => setForm({ ...form, report_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Equipment / vehicle ownership</Label>
                <Select
                  value={form.equipment_ownership}
                  onValueChange={(v) => setForm({ ...form, equipment_ownership: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERSHIP.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-date">Date *</Label>
                <Input
                  id="in-date"
                  type="date"
                  value={form.incident_date}
                  onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-time">Time</Label>
                <Input
                  id="in-time"
                  value={form.incident_time}
                  onChange={(e) => setForm({ ...form, incident_time: e.target.value })}
                  placeholder="e.g. 2:30 PM"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-location">Location</Label>
                <Input
                  id="in-location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-vehicle">Vehicle / Equipment</Label>
                <Input
                  id="in-vehicle"
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  placeholder="e.g. Truck 12, rental excavator"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="in-desc">What happened? *</Label>
              <Textarea
                id="in-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the sequence of events."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="in-people">People involved</Label>
                <Input
                  id="in-people"
                  value={form.people_involved}
                  onChange={(e) => setForm({ ...form, people_involved: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-witnesses">Witnesses</Label>
                <Input
                  id="in-witnesses"
                  value={form.witnesses}
                  onChange={(e) => setForm({ ...form, witnesses: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="in-injuries">Injuries reported?</Label>
              <Switch
                id="in-injuries"
                checked={form.injuries}
                onCheckedChange={(v) => setForm({ ...form, injuries: v })}
              />
            </div>
            {form.injuries && (
              <div className="space-y-1.5">
                <Label htmlFor="in-injury-desc">Injury description</Label>
                <Textarea
                  id="in-injury-desc"
                  rows={2}
                  value={form.injury_description}
                  onChange={(e) => setForm({ ...form, injury_description: e.target.value })}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="in-damage">Property / equipment damage?</Label>
              <Switch
                id="in-damage"
                checked={form.property_damage}
                onCheckedChange={(v) => setForm({ ...form, property_damage: v })}
              />
            </div>
            {form.property_damage && (
              <div className="space-y-1.5">
                <Label htmlFor="in-damage-desc">Damage description</Label>
                <Textarea
                  id="in-damage-desc"
                  rows={2}
                  value={form.damage_description}
                  onChange={(e) => setForm({ ...form, damage_description: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="in-action">Immediate action taken</Label>
              <Textarea
                id="in-action"
                rows={2}
                value={form.action_taken}
                onChange={(e) => setForm({ ...form, action_taken: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.description.trim() || !form.incident_date}
            >
              {saving ? "Saving…" : editId ? "Update Report" : "File Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the incident report. This action cannot be undone.
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
