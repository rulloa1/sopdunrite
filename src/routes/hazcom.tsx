import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, ShieldCheck, ExternalLink } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageHeader } from "@/components/PageHeader";
import { SectionActions } from "@/components/SectionActions";
import { DataTable, type Column } from "@/components/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canManageLogs, canDeleteLogs } from "@/lib/auth";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/hazcom")({
  head: () => ({
    meta: [
      { title: "Hazard Communication Program | Dunrite Construction Group" },
      {
        name: "description",
        content:
          "OSHA Hazard Communication (HazCom) written program and hazardous chemical inventory.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <HazCom />
    </RequireAuth>
  ),
});

const COMPANY = "DunRite Construction Group LLC";

// Written HazCom program — OSHA 29 CFR 1910.1200. Edit the responsible-person
// placeholders to match the company's designated program administrator.
const PROGRAM_SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Purpose & Scope",
    body: `${COMPANY} is committed to preventing illness and injury from exposure to hazardous chemicals. This written Hazard Communication Program complies with OSHA's Hazard Communication Standard (29 CFR 1910.1200) and applies to all work operations where employees may be exposed to hazardous chemicals under normal conditions or in a foreseeable emergency. It covers company-owned materials as well as products brought on site by subcontractors and suppliers.`,
  },
  {
    title: "2. Program Administrator",
    body: `The designated Program Administrator is responsible for maintaining this program, the hazardous chemical inventory, Safety Data Sheets, container labeling, and employee training records. Direct questions to your supervisor or the Program Administrator. (Insert name, title and contact information for your designated administrator.)`,
  },
  {
    title: "3. Hazardous Chemical Inventory",
    body: `A list of all known hazardous chemicals used or stored on site is maintained below and kept current. Each chemical is identified by the product name that appears on its label and Safety Data Sheet. The inventory is reviewed whenever a new chemical is introduced.`,
  },
  {
    title: "4. Container Labeling",
    body: `No container of hazardous chemicals will be used, stored, or accepted unless the manufacturer's original label is intact and legible (product identifier, signal word, hazard and precautionary statements, pictograms, and supplier information). Secondary/workplace containers will be labeled with the product identifier and the applicable hazard information. Employees must not remove or deface labels.`,
  },
  {
    title: "5. Safety Data Sheets (SDS)",
    body: `A Safety Data Sheet is maintained and readily accessible to every employee, on every shift, for each hazardous chemical in the inventory. SDSs are kept in a known location (and/or linked in the inventory below). If an SDS is missing or has not been received, contact the Program Administrator, who will obtain it from the manufacturer or distributor.`,
  },
  {
    title: "6. Employee Information & Training",
    body: `Employees are trained at initial assignment and whenever a new chemical hazard is introduced. Training covers: the requirements of the Hazard Communication Standard; the location and availability of this program, the chemical inventory and SDSs; how to read labels and SDSs; the physical and health hazards of chemicals in the work area; and protective measures including work practices, PPE, and emergency procedures.`,
  },
  {
    title: "7. Non-Routine Tasks",
    body: `Before performing non-routine tasks that may involve hazardous chemical exposure (e.g., confined-space entry, tank or line cleaning), supervisors will inform affected employees of the hazards, required protective measures, and emergency procedures specific to the task.`,
  },
  {
    title: "8. Multi-Employer Worksites & Contractors",
    body: `On multi-employer sites, ${COMPANY} will provide other on-site employers with access to SDSs for chemicals their employees may be exposed to, inform them of labeling and precautionary measures, and request the same information from subcontractors and suppliers regarding chemicals they bring on site.`,
  },
  {
    title: "9. Program Availability & Review",
    body: `This written program is available to all employees, their representatives, and OSHA upon request. It is reviewed periodically and updated as work operations, chemicals, or regulations change.`,
  },
];

type ChemicalRow = Database["public"]["Tables"]["hazardous_chemicals"]["Row"];

function buildEmptyForm() {
  return {
    id: "",
    chemical_name: "",
    manufacturer: "",
    location: "",
    hazards: "",
    quantity: "",
    sds_on_file: false,
    sds_url: "",
    container_labeling: "",
    notes: "",
  };
}
type FormState = ReturnType<typeof buildEmptyForm>;

/** Only http(s) links are safe to render as an href (blocks javascript: URIs). */
const isHttpUrl = (u: string | null | undefined) => !!u && /^https?:\/\//i.test(u.trim());

function HazCom() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<ChemicalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(buildEmptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canManage = canManageLogs(role);
  const canDelete = canDeleteLogs(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: lErr } = await supabase
      .from("hazardous_chemicals")
      .select("*")
      .order("chemical_name");
    if (lErr) setError(lErr.message);
    else setRows((data as ChemicalRow[]) ?? []);
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

  const openEdit = (row: ChemicalRow) => {
    setError(null);
    setEditId(row.id);
    setForm({
      id: row.id,
      chemical_name: row.chemical_name,
      manufacturer: row.manufacturer ?? "",
      location: row.location ?? "",
      hazards: row.hazards ?? "",
      quantity: row.quantity ?? "",
      sds_on_file: row.sds_on_file,
      sds_url: row.sds_url ?? "",
      container_labeling: row.container_labeling ?? "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const sdsUrl = form.sds_url.trim();
    if (sdsUrl && !isHttpUrl(sdsUrl)) {
      setError("SDS link must be a full http:// or https:// URL.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      chemical_name: form.chemical_name.trim(),
      manufacturer: form.manufacturer.trim() || null,
      location: form.location.trim() || null,
      hazards: form.hazards.trim() || null,
      quantity: form.quantity.trim() || null,
      sds_on_file: form.sds_on_file,
      sds_url: form.sds_url.trim() || null,
      container_labeling: form.container_labeling.trim() || null,
      notes: form.notes.trim() || null,
    };
    const res = editId
      ? await supabase.from("hazardous_chemicals").update(payload).eq("id", editId)
      : await supabase
          .from("hazardous_chemicals")
          .insert({ ...payload, created_by: user?.id ?? null });
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
    const { error: dErr } = await supabase.from("hazardous_chemicals").delete().eq("id", deleteId);
    setDeleteId(null);
    if (dErr) {
      setError(dErr.message);
      return;
    }
    load();
  };

  const columns = useMemo<Column<ChemicalRow>[]>(() => {
    const base: Column<ChemicalRow>[] = [
      {
        key: "name",
        header: "Chemical / Product",
        sortValue: (r) => r.chemical_name,
        cell: (r) => <span className="font-medium">{r.chemical_name}</span>,
      },
      {
        key: "manufacturer",
        header: "Manufacturer",
        sortValue: (r) => r.manufacturer ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.manufacturer || "—"}</span>,
      },
      {
        key: "location",
        header: "Location / Use",
        sortValue: (r) => r.location ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.location || "—"}</span>,
      },
      {
        key: "hazards",
        header: "Hazards",
        sortValue: (r) => r.hazards ?? "",
        cell: (r) => r.hazards || <span className="text-muted-foreground">—</span>,
      },
      {
        key: "quantity",
        header: "Qty",
        sortValue: (r) => r.quantity ?? "",
        cell: (r) => <span className="text-muted-foreground">{r.quantity || "—"}</span>,
      },
      {
        key: "sds",
        header: "SDS",
        sortValue: (r) => (r.sds_on_file || isHttpUrl(r.sds_url) ? 1 : 0),
        cell: (r) =>
          isHttpUrl(r.sds_url) ? (
            <a
              href={r.sds_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          ) : r.sds_on_file ? (
            <span className="text-success">On file</span>
          ) : (
            <span className="text-destructive">Missing</span>
          ),
      },
    ];
    const actions: Column<ChemicalRow>[] =
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
                      aria-label="Edit chemical"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteId(r.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete chemical"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, canDelete]);

  const missingSds = rows.filter((r) => !r.sds_on_file && !isHttpUrl(r.sds_url)).length;

  return (
    <Layout>
      <PageHeader
        title="Hazard Communication Program"
        description="OSHA HazCom (29 CFR 1910.1200) written program and the site hazardous chemical inventory."
        actions={<SectionActions label="Hazard Communication Program" />}
      />

      {/* Written program */}
      <div className="mb-8 space-y-4 rounded-xl border bg-card p-5 shadow-sm print-section">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" /> Written Program
        </div>
        {PROGRAM_SECTIONS.map((s) => (
          <div key={s.title}>
            <h3 className="font-display text-sm font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Chemical inventory */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Hazardous Chemical Inventory</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length} chemical{rows.length === 1 ? "" : "s"}
            {missingSds > 0 && (
              <span className="text-destructive"> · {missingSds} missing an SDS</span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="no-print">
            <Plus className="mr-1.5 h-4 w-4" /> Add Chemical
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
          initialSort={{ key: "name", dir: "asc" }}
          minWidthClass="min-w-[920px]"
          emptyTitle="No chemicals listed"
          emptyDescription="Add each hazardous chemical used or stored on site to build the inventory."
        />
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Chemical" : "Add Hazardous Chemical"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Chemical / product name *</Label>
              <Input
                id="c-name"
                value={form.chemical_name}
                onChange={(e) => setForm({ ...form, chemical_name: e.target.value })}
                placeholder="As shown on the label / SDS"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-mfr">Manufacturer</Label>
                <Input
                  id="c-mfr"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-qty">Quantity</Label>
                <Input
                  id="c-qty"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 2 × 5 gal"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-location">Location / use</Label>
              <Input
                id="c-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-hazards">Hazards</Label>
              <Input
                id="c-hazards"
                value={form.hazards}
                onChange={(e) => setForm({ ...form, hazards: e.target.value })}
                placeholder="e.g. Flammable, skin/eye irritant"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="c-sds">Safety Data Sheet on file</Label>
              <Switch
                id="c-sds"
                checked={form.sds_on_file}
                onCheckedChange={(v) => setForm({ ...form, sds_on_file: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-sds-url">SDS link (optional)</Label>
              <Input
                id="c-sds-url"
                value={form.sds_url}
                onChange={(e) => setForm({ ...form, sds_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-label">Container labeling notes</Label>
              <Input
                id="c-label"
                value={form.container_labeling}
                onChange={(e) => setForm({ ...form, container_labeling: e.target.value })}
              />
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.chemical_name.trim()}>
              {saving ? "Saving…" : editId ? "Update" : "Add Chemical"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this chemical?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the chemical from the inventory. This action cannot be undone.
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
