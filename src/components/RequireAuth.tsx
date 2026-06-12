import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

/**
 * Client-side auth gate. Renders children only when a user session exists,
 * otherwise sends the visitor to the sign-in page. Consistent with the
 * existing client-side AuthProvider pattern.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
