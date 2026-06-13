import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert, UserPlus, Pencil, Trash2, KeyRound, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin, ROLE_LABELS, type AppRole } from "@/lib/auth";
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  adminSendPasswordReset,
} from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & Roles | 12412 Curley St, San Antonio, FL 33576" },
      { name: "description", content: "Manage team member roles and permissions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TeamPage />
    </RequireAuth>
  ),
});

interface Member {
  id: string;
  full_name: string | null;
  title: string | null;
  email: string | null;
  role: AppRole | null;
}

const ROLE_OPTIONS: AppRole[] = ["admin", "executive", "project_manager", "viewer"];

const emptyForm = {
  id: "",
  email: "",
  password: "",
  fullName: "",
  title: "",
  role: "viewer" as AppRole,
};
type FormState = typeof emptyForm;

function TeamPage() {
  const { role, user, refreshRoles } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);

  const createUser = useServerFn(adminCreateUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const updateUser = useServerFn(adminUpdateUser);
  const sendReset = useServerFn(adminSendPasswordReset);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, title, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (rErr) setError(rErr.message);
    const roleByUser = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => roleByUser.set(r.user_id, r.role as AppRole));
    setMembers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        title: p.title,
        email: p.email,
        role: roleByUser.get(p.id) ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRole = async (userId: string, newRole: AppRole) => {
    setSavingId(userId);
    setError(null);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error: iErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    setSavingId(null);
    if (iErr) {
      setError(iErr.message);
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
    if (userId === user?.id) refreshRoles();
  };

  const openCreate = () => {
    setError(null);
    setNotice(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: Member) => {
    setError(null);
    setNotice(null);
    setForm({
      id: m.id,
      email: m.email ?? "",
      password: "",
      fullName: m.full_name ?? "",
      title: m.title ?? "",
      role: m.role ?? "viewer",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        await updateUser({
          data: { userId: form.id, fullName: form.fullName.trim(), title: form.title.trim() || undefined },
        });
        if (form.role) await changeRole(form.id, form.role);
      } else {
        await createUser({
          data: {
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            title: form.title.trim() || undefined,
            role: form.role,
          },
        });
        setNotice(`Account created for ${form.email.trim()}.`);
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMember) return;
    setError(null);
    try {
      await deleteUser({ data: { userId: deleteMember.id } });
      setDeleteMember(null);
      await load();
    } catch (e) {
      setDeleteMember(null);
      setError(e instanceof Error ? e.message : "Could not delete user.");
    }
  };

  const resetPassword = async (m: Member) => {
    if (!m.email) return;
    setSavingId(m.id);
    setError(null);
    setNotice(null);
    try {
      await sendReset({ data: { email: m.email } });
      setNotice(`Password reset email sent to ${m.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin(role)) {
    return (
      <Layout>
        <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-semibold">Admins only</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don't have permission to manage team roles.
          </p>
        </div>
      </Layout>
    );
  }

  const valid = form.id
    ? form.fullName.trim().length > 0
    : form.fullName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(form.email.trim()) &&
      form.password.length >= 8;

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Team &amp; Roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add members, assign roles, and manage access for your organization.
          </p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Add User
        </Button>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {m.full_name || "—"}
                    {m.title && (
                      <span className="block text-xs font-normal text-muted-foreground">{m.title}</span>
                    )}
                    {m.id === user?.id && (
                      <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email || "—"}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={m.role ?? "viewer"}
                      onValueChange={(v) => changeRole(m.id, v as AppRole)}
                      disabled={savingId === m.id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => resetPassword(m)}
                        disabled={!m.email || savingId === m.id}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                        aria-label="Send password reset"
                      >
                        {savingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteMember(m)}
                        disabled={m.id === user?.id}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit user dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Full name *</Label>
              <Input
                id="u-name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-title">Title</Label>
              <Input
                id="u-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Project Manager"
              />
            </div>
            {!form.id && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="u-email">Email *</Label>
                  <Input
                    id="u-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-password">Temporary password *</Label>
                  <Input
                    id="u-password"
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                  <p className="text-xs text-muted-foreground">
                    Share this with the user — they can change it later, or use the reset-password action.
                  </p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving || !valid}>
              {saving ? "Saving…" : form.id ? "Save" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMember} onOpenChange={(o) => !o && setDeleteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteMember?.full_name || deleteMember?.email || "the user"} and
              their access. This action cannot be undone.
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
