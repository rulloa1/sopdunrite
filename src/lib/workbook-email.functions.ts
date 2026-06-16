import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  recipientEmail: z.string().trim().email().max(255),
  recipientName: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
  storagePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(200),
  label: z.string().trim().max(120),
});

/**
 * Creates a time-limited signed download link for an uploaded workbook and
 * emails it to the recipient via the app's email system. Falls back to
 * returning the share link if email delivery is not configured yet.
 */
export const sendWorkbookEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const SEVEN_DAYS = 60 * 60 * 24 * 7;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("workbooks")
      .createSignedUrl(data.storagePath, SEVEN_DAYS, { download: data.fileName });
    if (error || !signed?.signedUrl) {
      throw new Error(error?.message ?? "Could not create a download link for the workbook.");
    }
    const shareUrl = signed.signedUrl;

    const senderEmail =
      (context.claims as { email?: string } | undefined)?.email ?? "Dunrite Construction Group LLC";

    try {
      const origin = new URL(getRequest().url).origin;
      const authHeader = getRequestHeader("authorization");
      const res = await fetch(`${origin}/lovable/email/transactional/send`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(authHeader ? { authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          templateName: "workbook-share",
          recipientEmail: data.recipientEmail,
          idempotencyKey: `workbook-${data.storagePath}-${data.recipientEmail}`.slice(0, 200),
          templateData: {
            recipientName: data.recipientName ?? "",
            senderName: senderEmail,
            label: data.label,
            message: data.message ?? "",
            downloadUrl: shareUrl,
            fileName: data.fileName,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { emailed: false as const, shareUrl, reason: body.slice(0, 300) };
      }
      return { emailed: true as const, shareUrl };
    } catch (e) {
      return {
        emailed: false as const,
        shareUrl,
        reason: e instanceof Error ? e.message : "Email delivery is not configured yet.",
      };
    }
  });
