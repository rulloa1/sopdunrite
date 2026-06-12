import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin, ROLE_LABELS, type AppRole } from "@/lib/auth";
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
      { title: "Team & Roles | Dun Rite Construction" },
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
  email: string | null;
  role: AppRole | null;
}

const ROLE_OPTIONS: AppRole[] = ["admin", "executive", "project_manager", "viewer"];

function TeamPage() {
  const { role, user, refreshRoles } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (rErr) setError(rErr.message);
    const roleByUser = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => roleByUser.set(r.user_id, r.role as AppRole));
    setMembers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
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
    // Single-role model: clear existing roles, then set the chosen one.
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

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Team &amp; Roles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign each member a role to control what they can view and edit.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
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
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {m.full_name || "—"}
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
                      <SelectTrigger className="w-44">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
