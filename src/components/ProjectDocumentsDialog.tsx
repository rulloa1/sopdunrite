import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  Loader2,
  ScanText,
  Trash2,
  Upload,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canCreateProjects, isAdmin } from "@/lib/auth";
import { extractDocumentText } from "@/lib/document-extract.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  extracted_text: string | null;
  extraction_status: string | null;
}

interface Props {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


function formatSize(bytes: number | null): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function ProjectDocumentsDialog({ projectId, projectName, open, onOpenChange }: Props) {
  const { user, role } = useAuth();
  const canUpload = canCreateProjects(role);
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [extractingIds, setExtractingIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const runExtract = useServerFn(extractDocumentText);


  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setDocs((data as ProjectDocument[]) ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (open) {
      setError(null);
      load();
    }
  }, [open, load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
          setError(`"${file.name}" exceeds the 20MB limit.`);
          continue;
        }
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
        const path = `${projectId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
        const { error: upErr } = await supabase.storage
          .from("project-documents")
          .upload(path, file, { contentType: file.type || undefined });
        if (upErr) {
          setError(upErr.message);
          continue;
        }
        const { error: insErr } = await supabase.from("project_documents").insert({
          project_id: projectId,
          name: file.name,
          file_path: path,
          content_type: file.type || null,
          file_size: file.size,
          uploaded_by: user?.id ?? null,
        });
        if (insErr) {
          // best-effort cleanup of the orphaned file
          await supabase.storage.from("project-documents").remove([path]);
          setError(insErr.message);
        }
      }
      await load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const download = async (doc: ProjectDocument) => {
    setBusyId(doc.id);
    setError(null);
    const { data, error: err } = await supabase.storage
      .from("project-documents")
      .createSignedUrl(doc.file_path, 60, { download: doc.name });
    setBusyId(null);
    if (err || !data?.signedUrl) {
      setError(err?.message ?? "Could not generate download link.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (doc: ProjectDocument) => {
    setBusyId(doc.id);
    setError(null);
    const { error: delErr } = await supabase
      .from("project_documents")
      .delete()
      .eq("id", doc.id);
    if (delErr) {
      setBusyId(null);
      setError(delErr.message);
      return;
    }
    await supabase.storage.from("project-documents").remove([doc.file_path]);
    setBusyId(null);
    await load();
  };

  const canDelete = (doc: ProjectDocument) =>
    isAdmin(role) || (!!user && doc.uploaded_by === user.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">Documents · {projectName}</DialogTitle>
        </DialogHeader>

        {canUpload && (
          <div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload documents"}
            </Button>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              Any file type · up to 20MB each
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.file_size)}
                    {doc.file_size != null ? " · " : ""}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => download(doc)}
                  disabled={busyId === doc.id}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Download document"
                >
                  <Download className="h-4 w-4" />
                </button>
                {canDelete(doc) && (
                  <button
                    onClick={() => remove(doc)}
                    disabled={busyId === doc.id}
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    aria-label="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
