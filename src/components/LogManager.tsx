import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canManageLogs, canDeleteLogs } from "@/lib/auth";
import { currency, formatDate } from "@/data/projectData";
import { StatusBadge, Variance } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import type { LogConfig, LogField, LogRow } from "@/lib/logs";
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

interface ProjectOption {
  id: string;
  name: string;
}

type FormValue = string | boolean;
type FormState = Record<string, FormValue>;

const emptyValue = (f: LogField): FormValue =>
  f.type === "boolean" ? false : f.type === "select" ? (f.options?.[0]?.value ?? "") : "";

function buildEmptyForm(config: LogConfig): FormState {
  const out: FormState = {};
  for (const f of config.fields) out[f.name] = emptyValue(f);
  return out;
}

/** Coloured pill for free-form status values (bid / PO statuses). */
function ValueBadge({ field, value }: { field: LogField; value: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const label = field.options?.find((o) => o.value === value)?.label ?? value;
  const tone =
    value === "awarded" || value === "accepted" || value === "received"
      ? "bg-success/15 text-success"
      : value === "rejected"
        ? "bg-destructive/15 text-destructive"
        : value === "closed"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/15 text-primary";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function renderCell(field: LogField, row: LogRow): ReactNode {
  const value = row[field.name];
  switch (field.type) {
    case "currency":
      return value == null || value === "" ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="tabular-nums">{currency(Number(value) || 0)}</span>
      );
    case "number":
      return value == null || value === "" ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="tabular-nums">{String(value)}</span>
      );
    case "date":
      return (
        <span className="nowrap-date text-muted-foreground">
          {formatDate((value as string) ?? null)}
        </span>
      );
    case "boolean":
      return <StatusBadge status={value ? "closed" : "open"} />;
    case "select":
      return <ValueBadge field={field} value={(value as string) ?? ""} />;
    default: {
      const text = (value as string) ?? "";
      if (!text) return <span className="text-muted-foreground">—</span>;
      return field.mono ? (
        <span className="font-mono text-xs font-medium">{text}</span>
      ) : (
        <span>{text}</span>
      );
    }
  }
}

function sortValue(field: LogField, row: LogRow): number | string {
  const value = row[field.name];
  if (field.type === "currency" || field.type === "number") return Number(value) || 0;
  if (field.type === "boolean") return value ? 1 : 0;
  return String(value ?? "");
}

/**
 * Generic, schema-driven CRUD manager for a per-project operational log.
 * Renders a project selector, an optional status filter, a sortable table,
 * and create/edit/delete dialogs — all backed by Supabase. Create and edit
 * are limited to managers; delete to admins (enforced again by RLS).
 */
export function LogManager({ config }: { config: LogConfig }) {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildEmptyForm(config));
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canManage = canManageLogs(role);
  const canDelete = canDeleteLogs(role);

  // Load projects once; default to the most recent one.
  useEffect(() => {
    supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false })
      .then(
        ({
          data,
          error: pErr,
        }: {
          data: ProjectOption[] | null;
          error: { message: string } | null;
        }) => {
          if (pErr) setError(pErr.message);
          const list = data ?? [];
          setProjects(list);
          setProjectId((curr) => curr || list[0]?.id || "");
          if (list.length === 0) setLoading(false);
        },
      );
  }, []);

  // Monotonic request token: when the user switches projects (or a mutation
  // triggers a refresh) faster than Supabase responds, only the most recent
  // request is allowed to write state, so a slow earlier response can't
  // overwrite the current project's rows.
  const requestRef = useRef(0);

  const loadRows = useCallback(async () => {
    if (!projectId) return;
    const reqId = ++requestRef.current;
    setLoading(true);
    const { data, error: rErr } = await supabase
      .from(config.table)
      .select("*")
      .eq("project_id", projectId);
    if (reqId !== requestRef.current) return; // superseded by a newer request
    if (rErr) setError(rErr.message);
    setRows((data as LogRow[]) ?? []);
    setLoading(false);
  }, [projectId, config.table]);

  useEffect(() => {
    if (projectId) loadRows();
  }, [projectId, loadRows]);

  const filtered = useMemo(() => {
    if (!config.filterableBoolean || filter === "all") return rows;
    const want = filter === "closed";
    return rows.filter((r) => Boolean(r[config.filterableBoolean!]) === want);
  }, [rows, filter, config.filterableBoolean]);

  const openCreate = () => {
    setError(null);
    setEditId(null);
    setForm(buildEmptyForm(config));
    setDialogOpen(true);
  };

  const openEdit = (row: LogRow) => {
    setError(null);
    setEditId(row.id);
    const next = buildEmptyForm(config);
    for (const f of config.fields) {
      const v = row[f.name];
      next[f.name] = f.type === "boolean" ? Boolean(v) : v == null ? emptyValue(f) : String(v);
    }
    setForm(next);
    setDialogOpen(true);
  };

  const missingRequired = config.fields.some(
    (f) => f.required && f.type !== "boolean" && !String(form[f.name] ?? "").trim(),
  );

  const save = async () => {
    if (!projectId) return;
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      const v = form[f.name];
      if (f.type === "boolean") {
        payload[f.name] = Boolean(v);
      } else if (f.type === "currency" || f.type === "number") {
        const s = String(v ?? "").trim();
        payload[f.name] = s === "" ? null : Number(s);
      } else {
        const s = String(v ?? "").trim();
        payload[f.name] = s === "" ? null : s;
      }
    }

    // The table is one of a union; the row shape is validated by `config`, so
    // a narrow cast keeps the generic builder happy without losing safety here.
    const table = supabase.from(config.table) as unknown as {
      update: (p: Record<string, unknown>) => {
        eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
      insert: (p: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };

    const res = editId
      ? await table.update(payload).eq("id", editId)
      : await table.insert({ ...payload, project_id: projectId, created_by: user?.id ?? null });

    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setDialogOpen(false);
    loadRows();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error: dErr } = await supabase.from(config.table).delete().eq("id", deleteId);
    setDeleteId(null);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    loadRows();
  };

  // Build table columns: field columns, computed columns, then row actions.
  const columns = useMemo<Column<LogRow>[]>(() => {
    const fieldCols: Column<LogRow>[] = config.fields
      .filter((f) => f.column !== false)
      .map((f) => ({
        key: f.name,
        header: f.header ?? f.label,
        align: f.align,
        sortValue: (r) => sortValue(f, r),
        cell: (r) => renderCell(f, r),
      }));

    const computedCols: Column<LogRow>[] = (config.computed ?? []).map((c) => ({
      key: c.key,
      header: c.header,
      align: c.align,
      sortValue: c.sortValue,
      cell: (r) => {
        const out = c.render(r);
        return typeof out === "number" ? <Variance value={out}>{currency(out)}</Variance> : out;
      },
    }));

    const actionCol: Column<LogRow>[] =
      canManage || canDelete
        ? [
            {
              key: "__actions",
              header: "",
              sortable: false,
              align: "right",
              cell: (r) => (
                <div className="flex justify-end gap-1">
                  {canManage && (
                    <button
                      onClick={() => openEdit(r)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${config.singular}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteId(r.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${config.singular}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]
        : [];

    return [...fieldCols, ...computedCols, ...actionCol];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, canManage, canDelete]);

  if (projects.length === 0 && !loading) {
    return (
      <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        No projects yet. Create a project on the{" "}
        <a href="/projects" className="font-medium text-primary underline-offset-2 hover:underline">
          Projects
        </a>{" "}
        page before adding {config.singular.toLowerCase()} entries.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Label htmlFor="log-project" className="text-xs font-medium text-muted-foreground">
            Project
          </Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger id="log-project" className="h-9 w-[260px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate} disabled={!projectId}>
            <Plus className="mr-1.5 h-4 w-4" /> Add {config.singular}
          </Button>
        )}
      </div>

      {config.summary && rows.length > 0 && (
        <p className="text-sm text-muted-foreground">{config.summary(rows)}</p>
      )}

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
          rows={filtered}
          getRowKey={(r) => r.id}
          initialSort={config.defaultSort}
          minWidthClass={config.minWidthClass}
          emptyTitle={`No ${config.singular.toLowerCase()} entries`}
          emptyDescription="Add an entry to start tracking this log for the selected project."
          toolbar={
            config.filterableBoolean ? (
              <>
                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                {(["all", "open", "closed"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? "default" : "outline"}
                    onClick={() => setFilter(f)}
                    className="capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </>
            ) : undefined
          }
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editId ? `Edit ${config.singular}` : `Add ${config.singular}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={form[f.name]}
                onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
              />
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || missingRequired}>
              {saving ? "Saving…" : editId ? `Update ${config.singular}` : `Add ${config.singular}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {config.singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: LogField;
  value: FormValue;
  onChange: (v: FormValue) => void;
}) {
  const id = `f-${field.name}`;
  const cls = field.full ? "sm:col-span-2" : "";

  if (field.type === "boolean") {
    return (
      <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${cls}`}>
        <Label htmlFor={id}>
          {field.label} {value ? "(Closed)" : "(Open)"}
        </Label>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={(c) => onChange(c)} />
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${cls}`}>
      <Label htmlFor={id}>
        {field.label}
        {field.required && " *"}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          rows={2}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={
            field.type === "currency" || field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : "text"
          }
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
