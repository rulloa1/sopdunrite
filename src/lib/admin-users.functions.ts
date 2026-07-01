import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const APP_ROLES = ["admin", "executive", "project_manager", "viewer"] as const;

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(1).max(120),
  title: z.string().trim().max(120).optional(),
  role: z.enum(APP_ROLES),
});

const idSchema = z.object({ userId: z.string().uuid() });

const updateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(120),
  title: z.string().trim().max(120).optional(),
});

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) {
    throw new Error("Forbidden: admin access required.");
  }
}

/** Create a brand-new user account, set their profile details, and assign a role. */
export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (createErr || !created?.user) {
      throw new Error(createErr?.message ?? "Could not create the user account.");
    }
    const newId = created.user.id;

    // The signup trigger creates a profile + a default role. Override both.
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, title: data.title ?? null, email: data.email })
      .eq("id", newId);
    if (profileErr) throw new Error(profileErr.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true as const, userId: newId };
  });

/** Permanently delete a user account (cascades to their profile and roles). */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("You cannot delete your own account.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Send a password reset / recovery email so a user can set their own password. */
export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Update a user's display name and title. */
export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, title: data.title ?? null })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
