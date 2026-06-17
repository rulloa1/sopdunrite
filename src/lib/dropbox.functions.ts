/**
 * TanStack Start server functions for Dropbox document management.
 * These run server-side so the access token is never exposed to the browser.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  listDropboxFiles,
  uploadToDropbox,
  getDropboxDownloadUrl,
  deleteFromDropbox,
  getDropboxToken,
  type DropboxFile,
} from "@/lib/dropbox";

// ─── List files ──────────────────────────────────────────────────────────────

const listSchema = z.object({ projectId: z.string().min(1) });

export const listDropboxProjectFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input))
  .handler(async ({ data }): Promise<DropboxFile[]> => {
    return listDropboxFiles(data.projectId);
  });

// ─── Upload file ─────────────────────────────────────────────────────────────

const uploadSchema = z.object({
  projectId: z.string().min(1),
  fileName: z.string().min(1),
  /** Base64-encoded file content */
  base64Content: z.string(),
  contentType: z.string().optional(),
});

export const uploadDropboxProjectFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data }): Promise<DropboxFile> => {
    // Decode base64 → binary buffer
    const binaryString = atob(data.base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: data.contentType ?? "application/octet-stream" });
    return uploadToDropbox(data.projectId, data.fileName, blob);
  });

// ─── Get download link ────────────────────────────────────────────────────────

const downloadSchema = z.object({ pathLower: z.string().min(1) });

export const getDropboxFileLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => downloadSchema.parse(input))
  .handler(async ({ data }): Promise<{ url: string }> => {
    const url = await getDropboxDownloadUrl(data.pathLower);
    return { url };
  });

// ─── Delete file ──────────────────────────────────────────────────────────────

const deleteSchema = z.object({ pathLower: z.string().min(1) });

export const deleteDropboxProjectFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await deleteFromDropbox(data.pathLower);
    return { ok: true };
  });
