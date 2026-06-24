import { supabase } from "@/integrations/supabase/client";
import type { WorkbookData } from "@/lib/workbook-data";

export type WorkbookFormat = "word" | "pdf";

/**
 * Generate the requested workbook file in the browser and upload it to the
 * private "workbooks" storage bucket under the current user's folder.
 * Returns the storage path + the download file name.
 */
export async function generateAndUploadWorkbook(
  format: WorkbookFormat,
  data: WorkbookData,
): Promise<{
  path: string;
  fileName: string;
}> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("You must be signed in to send the workbook.");

  let blob: Blob;
  let ext: string;
  if (format === "word") {
    const { buildWorkbookDocxBlob } = await import("@/lib/workbook-docx");
    blob = await buildWorkbookDocxBlob(data);
    ext = "docx";
  } else {
    const { buildWorkbookDoc } = await import("@/lib/workbook-pdf");
    const doc = await buildWorkbookDoc(data);
    blob = doc.output("blob");
    ext = "pdf";
  }

  const safe = data.PROJECT.name.replace(/[^a-z0-9]+/gi, "-");
  const fileName = `Dun-Rite-Workbook-${safe}.${ext}`;
  const path = `${userId}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage.from("workbooks").upload(path, blob, {
    contentType:
      format === "word"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(error.message);

  return { path, fileName };
}
