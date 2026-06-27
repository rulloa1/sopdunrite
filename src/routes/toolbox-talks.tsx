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

export const Route = createFileRoute("/toolbox-talks")({
  head: () => ({
    meta: [
      { title: "Toolbox Talks | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "Toolbox talk and safety meeting log — topic, presenter, location, attendees, and key points.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ToolboxTalks />
    </RequireAuth>
  ),
});

type TalkRow = Database["public"]["Tables"]["toolbox_talks"]["Row"];

/** yyyy-mm-dd local today, so an entry made late in the day keeps today. */
function today() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function buildEmptyForm() {
  return {
    id: "",
    topic: "",
    talk_date: today(),
    presenter: "",
    location: "",
    attendees: "",
    attendee_count: "",
    key_points: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

function ToolboxTalks() {
  const { role } = useAuth();
  const [rows, setRows] = useState<TalkRow[]>([]);
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
      .from("toolbox_talks")
      .select("*")
      .order("talk_date", { ascending: false });
    // Superseded by a newer load: bail without touching state — the newest
    // load always runs to completion and owns the loading flag, so this can't
    // leave the spinner stuck, and it avoids clearing it prematurely.
    if (seq !== loadSeq.current) return;
    if (lErr) setError(lErr.message);
    else setRows((data as TalkRow[]) ?? []);
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

  const openEdit = (row: TalkRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      topic: row.topic,
      talk_date: row.talk_date,
      presenter: row.presenter ?? "",
      location: row.location ?? "",
      attendees: row.attendees ?? "",
      attendee_count: row.attendee_count === null ? "" : String(row.attendee_count),
      key_points: row.key_points ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const countTrim = form.attendee_count.trim();
    if (countTrim && (!Number.isInteger(Number(countTrim)) || Number(countTrim) < 0)) {
      setError("Attendees must be a whole number (0 or more).");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      topic: form.topic.trim(),
      talk_date: form.talk_date || today(),
      presenter: form.presenter.trim() || null,
      location: form.location.trim() || null,
      attendees: form.attendees.trim() || null,
      attendee_count: countTrim ? Number(countTrim) : null,
      key_points: form.key_points.trim() || null,
      notes: form.notes.trim() || null,
    };
    // On insert, omit created_by and let the column DEFAULT auth.uid() supply it
    // so the WITH CHECK (created_by = auth.uid()) policy is always satisfied.
    const res = editId
      ? await supabase.from("toolbox_talks").update(payload).eq("id", editId)
      : await supabase.from("toolbox_talks").insert(payload);
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
    const { error: dErr } = await supabase.from("toolbox_talks").delete().eq("id", deleteId);
    setDeleting(false);
    if (dErr) {
      setDeleteError(dErr.message);
      return;
    }
    setDeleteId(null);
    load();
  };

  const columns = useMemo<Column<TalkRow>[]>(() => {
    const base: Column<TalkRow>[] = [
      {
        key: "date",
        header: "Date",
        sortValue: (r) => r.talk_date,
        cell: (r) => <span className="nowrap-date">{formatDate(r.talk_date)}</span>,
      },
      {
        key: "topic",
        header: "Topic",
        sortValue: (r) => r.topic,
        cell: (r) => <span className="font-medium">{r.topic}</span>,
      },
      {
        key: "presenter",
        header: "Presenter",
        sortValue: (r) => r.presenter ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.presenter || "—"}</span>,
      },
      {
        key: "location",
        header: "Location",
        sortValue: (r) => r.location ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.location || "—"}</span>,
      },
      {
        key: "attendees",
        header: "Attendees",
        align: "right",
        sortValue: (r) => r.attendee_count ?? -1,
        cell: (r) => <span className="text-muted-foreground">{r.attendee_count ?? "—"}</span>,
      },
    ];
    const actions: Column<TalkRow>[] =
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
                      aria-label="Edit talk"
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
                      aria-label="Delete talk"
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
        title="Toolbox Talks"
        description="Toolbox talks and safety meetings — record the topic, who led it, attendees, and the key points covered."
        actions={<SectionActions label="Toolbox Talks" />}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Safety Meeting Log</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} talk{rows.length === 1 ? "" : "s"} recorded
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Talk
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
          emptyTitle="No toolbox talks recorded"
          emptyDescription="Log each safety talk or meeting so you have a record of the topics covered and who attended."
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
            <DialogTitle>{editId ? "Edit Talk" : "Add Toolbox Talk"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-topic">Topic *</Label>
              <Input
                id="t-topic"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. Ladder safety, Heat illness"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="t-date">Date</Label>
                <Input
                  id="t-date"
                  type="date"
                  value={form.talk_date}
                  onChange={(e) => setForm({ ...form, talk_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-presenter">Presenter</Label>
                <Input
                  id="t-presenter"
                  value={form.presenter}
                  onChange={(e) => setForm({ ...form, presenter: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="t-location">Location / project</Label>
                <Input
                  id="t-location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-count">Attendee count</Label>
                <Input
                  id="t-count"
                  inputMode="numeric"
                  value={form.attendee_count}
                  onChange={(e) => setForm({ ...form, attendee_count: e.target.value })}
                  placeholder="e.g. 8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-attendees">Attendees (names)</Label>
              <Textarea
                id="t-attendees"
                rows={2}
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                placeholder="Comma- or line-separated roster"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-points">Key points covered</Label>
              <Textarea
                id="t-points"
                rows={3}
                value={form.key_points}
                onChange={(e) => setForm({ ...form, key_points: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-notes">Notes</Label>
              <Textarea
                id="t-notes"
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
            <Button onClick={save} disabled={saving || !form.topic.trim()}>
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
            <AlertDialogTitle>Remove this talk?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the toolbox talk from the log. This action cannot be undone.
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
