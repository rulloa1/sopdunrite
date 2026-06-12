import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useAuth,
  canCreateProjects,
  canDeleteProjects,
  canEditProject,
} from "@/lib/auth";
import { STATUSES, type ProjectRow, type ProjectStatus } from "@/lib/projects";
import { currency } from "@/lib/project-data";
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

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects | Dun Rite Construction" },
      { name: "description", content: "Track bid, contract, and active projects across Dun Rite Construction." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProjectsPage />
    </RequireAuth>
  ),
});

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const emptyForm = {
  id: "" as string,
  name: "",
  client: "",
  location: "",
  value: "",
  status: "bid_pre_contract" as ProjectStatus,
  assigned_to: "" as string,
  bid_due_date: "",
  start_date: "",
  notes: "",
};
type FormState = typeof emptyForm;

function ProjectsPage() {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: proj, error: pErr }, { data: prof }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    if (pErr) setError(pErr.message);
    setProjects((proj as ProjectRow[]) ?? []);
    setProfiles((prof as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map: Record<ProjectStatus, ProjectRow[]> = {
      bid_pre_contract: [],
      bid_under_contract: [],
      active: [],
      complete: [],
    };
    for (const p of projects) map[p.status]?.push(p);
    return map;
  }, [projects]);

  const profileName = (id: string | null) => {
    if (!id) return null;
    const p = profiles.find((x) => x.id === id);
    return p?.full_name || p?.email || "Unknown";
  };

  const openCreate = () => {
    setError(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: ProjectRow) => {
    setError(null);
    setForm({
      id: p.id,
      name: p.name,
      client: p.client ?? "",
      location: p.location ?? "",
      value: p.value != null ? String(p.value) : "",
      status: p.status,
      assigned_to: p.assigned_to ?? "",
      bid_due_date: p.bid_due_date ?? "",
      start_date: p.start_date ?? "",
      notes: p.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      client: form.client.trim() || null,
      location: form.location.trim() || null,
      value: form.value ? Number(form.value) : 0,
      status: form.status,
      assigned_to: form.assigned_to || null,
      bid_due_date: form.bid_due_date || null,
      start_date: form.start_date || null,
      notes: form.notes.trim() || null,
    };
    let res;
    if (form.id) {
      res = await supabase.from("projects").update(payload).eq("id", form.id);
    } else {
      res = await supabase.from("projects").insert({ ...payload, created_by: user?.id ?? null });
    }
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
    const { error: dErr } = await supabase.from("projects").delete().eq("id", deleteId);
    setDeleteId(null);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    load();
  };

  const totalValue = projects.reduce((a, p) => a + (Number(p.value) || 0), 0);

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Projects &amp; Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} projects · {currency(totalValue)} total pipeline value
          </p>
        </div>
        {canCreateProjects(role) && (
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> New Project
          </Button>
        )}
      </div>

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((s) => {
            const items = grouped[s.value];
            const colValue = items.reduce((a, p) => a + (Number(p.value) || 0), 0);
            return (
              <div key={s.value} className="flex flex-col rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    <h3 className="text-sm font-semibold">{s.label}</h3>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 p-3">
                  {items.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">No projects</p>
                  )}
                  {items.map((p) => {
                    const editable = canEditProject(role, p.assigned_to, user?.id ?? null);
                    return (
                      <div key={p.id} className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug">{p.name}</p>
                          <div className="flex shrink-0 gap-1">
                            {editable && (
                              <button
                                onClick={() => openEdit(p)}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Edit project"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteProjects(role) && (
                              <button
                                onClick={() => setDeleteId(p.id)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Delete project"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {p.client && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" /> {p.client}
                          </p>
                        )}
                        {p.location && (
                          <p className="text-xs text-muted-foreground">{p.location}</p>
                        )}
                        <p className="mt-2 font-display text-sm font-bold tabular-nums">
                          {currency(Number(p.value) || 0)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          {p.assigned_to && <span>PM: {profileName(p.assigned_to)}</span>}
                          {p.bid_due_date && <span>Bid due: {p.bid_due_date}</span>}
                          {p.start_date && <span>Start: {p.start_date}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t px-4 py-2 text-xs font-medium tabular-nums text-muted-foreground">
                  {currency(colValue)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Project name *</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-client">Client / Account</Label>
                <Input id="p-client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-location">Location</Label>
                <Input id="p-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-value">Contract value (USD)</Label>
                <Input
                  id="p-value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Project Manager</Label>
              <Select
                value={form.assigned_to || "none"}
                onValueChange={(v) => setForm({ ...form, assigned_to: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || p.email || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-bid">Bid due date</Label>
                <Input id="p-bid" type="date" value={form.bid_due_date} onChange={(e) => setForm({ ...form, bid_due_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-start">Start date</Label>
                <Input id="p-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-notes">Notes</Label>
              <Textarea id="p-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project. This action cannot be undone.
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
