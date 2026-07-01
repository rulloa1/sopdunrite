import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({ documentId: z.string().uuid() });

const TEXT_TYPES = [
  "text/",
  "application/json",
  "application/xml",
  "application/csv",
  "application/javascript",
  "application/x-yaml",
];

const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "xml",
  "yaml",
  "yml",
  "html",
  "htm",
  "log",
  "js",
  "ts",
  "css",
  "sql",
];

const MAX_CHARS = 200_000;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function extOf(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

async function extractWithAI(base64: string, mime: string, filename: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI extraction is not configured.");

  const isImage = mime.startsWith("image/");
  const content = isImage
    ? [
        {
          type: "text",
          text: "Extract all readable text from this image. Return only the extracted text with no commentary.",
        },
        { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
      ]
    : [
        {
          type: "text",
          text: "Extract all readable text from this document. Return only the extracted text, preserving structure where reasonable, with no commentary.",
        },
        {
          type: "file",
          file: { filename, file_data: `data:${mime};base64,${base64}` },
        },
      ];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash",
      messages: [{ role: "user", content }],
    }),
  });

  if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  if (!res.ok) throw new Error(`Extraction failed (${res.status}).`);

  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? "").toString().trim();
}

/** Download a document, extract its text, and store the result on the row. */
export const extractDocumentText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: doc, error: docErr } = await supabase
      .from("project_documents")
      .select("id, name, file_path, content_type")
      .eq("id", data.documentId)
      .single();
    if (docErr || !doc) throw new Error("Document not found or access denied.");

    await supabase
      .from("project_documents")
      .update({ extraction_status: "processing" })
      .eq("id", doc.id);

    try {
      const { data: file, error: dlErr } = await supabase.storage
        .from("project-documents")
        .download(doc.file_path);
      if (dlErr || !file) throw new Error("Could not download the file.");

      const mime = doc.content_type ?? file.type ?? "";
      const ext = extOf(doc.name);
      const isText = TEXT_TYPES.some((t) => mime.startsWith(t)) || TEXT_EXTENSIONS.includes(ext);
      const isImage = mime.startsWith("image/");
      const isPdf = mime === "application/pdf" || ext === "pdf";

      let text = "";
      let status = "done";

      if (isText) {
        text = (await file.text()).slice(0, MAX_CHARS);
      } else if (isImage || isPdf) {
        const base64 = bufferToBase64(await file.arrayBuffer());
        text = (await extractWithAI(base64, isPdf ? "application/pdf" : mime, doc.name)).slice(
          0,
          MAX_CHARS,
        );
      } else {
        status = "unsupported";
      }

      if (status === "done" && !text.trim()) status = "unsupported";

      await supabase
        .from("project_documents")
        .update({ extracted_text: text || null, extraction_status: status })
        .eq("id", doc.id);

      return { status, text };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed.";
      await supabase
        .from("project_documents")
        .update({ extraction_status: "error", extracted_text: null })
        .eq("id", doc.id);
      throw new Error(message);
    }
  });
