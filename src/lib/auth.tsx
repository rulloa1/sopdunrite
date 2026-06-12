import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "executive" | "project_manager" | "viewer";

// Highest privilege first — used to pick a primary role when a user has several.
const ROLE_PRIORITY: AppRole[] = ["admin", "executive", "project_manager", "viewer"];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  executive: "Executive",
  project_manager: "Project Manager",
  viewer: "Viewer",
};

interface AuthState {
  loading: boolean;
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  role: AppRole | null; // primary (highest) role
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function primaryRole(roles: AppRole[]): AppRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchRoles = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to load roles", error);
      setRoles([]);
      return;
    }
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) await fetchRoles(user.id);
  }, [user, fetchRoles]);

  useEffect(() => {
    // Listener first, then initial session check.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer Supabase call out of the callback to avoid deadlocks.
        setTimeout(() => fetchRoles(newSession.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchRoles(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchRoles]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRoles([]);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      session,
      roles,
      role: primaryRole(roles),
      signOut,
      refreshRoles,
    }),
    [loading, user, session, roles, signOut, refreshRoles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ===== Permission helpers =====
export const isAdmin = (role: AppRole | null) => role === "admin";
export const canManageRoles = (role: AppRole | null) => role === "admin";
export const canCreateProjects = (role: AppRole | null) =>
  role === "admin" || role === "executive" || role === "project_manager";
export const canDeleteProjects = (role: AppRole | null) => role === "admin";

export function canEditProject(
  role: AppRole | null,
  assignedTo: string | null,
  userId: string | null,
) {
  if (role === "admin" || role === "executive") return true;
  if (role === "project_manager") return !!userId && assignedTo === userId;
  return false;
}
