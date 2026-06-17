import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth, canCreateProjects, isAdmin } from "@/lib/auth";
import {
  listDropboxProjectFiles,
  uploadDropboxProjectFile,
  getDropboxFileLink,
  deleteDropboxProjectFile,
} from "@/lib/dropbox.functions";
import type { DropboxFile } from "@/lib/dropbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_SIZE = 150 * 1024 * 1024; // 150 MB

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadItem {
  name: string;
  done: boolean;
  error?: string;
}

/** Convert a browser File to a base64 string for server-function transport. */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data-URL prefix (e.g. "data:application/pdf;base64,")
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DropboxDocumentsDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: Props) {
  const { role } = useAuth();
  const canUpload = canCreateProjects(role);

  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runList = useServerFn(listDropboxProjectFiles);
  const runUpload = useServerFn(uploadDropboxProjectFile);
  const runLink = useServerFn(getDropboxFileLink);
  const runDelete = useServerFn(deleteDropboxProjectFile);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runList({ data: { projectId } });
      setFiles(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Dropbox files.");
    } finally {
      setLoading(false);
    }
  }, [projectId, runList]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    const items = Array.from(fileList);
    const progress: UploadItem[] = items.map((f) => ({ name: f.name, done: false }));
    setUploadItems(progress);

    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      if (file.size > MAX_SIZE) {
        errors.push(`"${file.name}" exceeds the 150 MB limit.`);
        setUploadItems((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, done: true, error: "Exceeds 150 MB limit" } : p
          )
        );
        continue;
      }
      try {
        const base64Content = await fileToBase64(file);
        await runUpload({
          data: {
            projectId,
            fileName: file.name,
            base64Content,
            contentType: file.type || undefined,
          },
        });
        setUploadItems((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, done: true } : p))
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        errors.push(msg);
        setUploadItems((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, done: true, error: msg } : p))
        );
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (errors.length > 0) setError(errors.join(" | "));
    await load();
    showToast("Upload complete");
    setTimeout(() => setUploadItems([]), 4000);
  };

  const handleDownload = async (file: DropboxFile) => {
    setBusyPath(file.path_lower);
    setError(null);
    try {
      const { url } = await runLink({ data: { pathLower: file.path_lower } });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate download link.");
    } finally {
      setBusyPath(null);
    }
  };

  const handleDelete = async (file: DropboxFile) => {
    setBusyPath(file.path_lower);
    setError(null);
    try {
      await runDelete({ data: { pathLower: file.path_lower } });
      setFiles((prev) => prev.filter((f) => f.path_lower !== file.path_lower));
      showToast(`"${file.name}" deleted`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusyPath(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Cloud className="h-4 w-4 text-primary shrink-0" />
            Dropbox Docs · {projectName}
          </DialogTitle>
        </DialogHeader>

        {/* Toast */}
        {toast && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}

        {/* Dropbox not configured notice */}
        {error?.includes("not configured") && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" /> Dropbox not configured
            </p>
            <p className="text-xs">
              Add <code className="font-mono">DROPBOX_ACCESS_TOKEN</code> to your server environment
              (and optionally <code className="font-mono">VITE_DROPBOX_ACCESS_TOKEN</code> for
              client-side use). Generate a token at{" "}
              <a
                href="https://www.dropbox.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                dropbox.com/developers/apps
              </a>
              .
            </p>
          </div>
        )}

        {/* Generic error */}
        {error && !error.includes("not configured") && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Upload button */}
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
              {uploading ? "Uploading to Dropbox…" : "Upload to Dropbox"}
            </Button>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              Any file type · up to 150 MB each
            </p>
          </div>
        )}

        {/* Upload progress */}
        {uploadItems.length > 0 && (
          <ul className="space-y-1.5">
            {uploadItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                {item.error ? (
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                ) : item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                )}
                <span className="truncate flex-1 text-muted-foreground">{item.name}</span>
                {item.error && (
                  <span className="text-destructive shrink-0">{item.error}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Refresh button */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* File list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No files in Dropbox for this project yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => {
              const busy = busyPath === file.path_lower;
              return (
                <li key={file.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)} ·{" "}
                      {new Date(file.server_modified).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={busy}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                    aria-label="Download from Dropbox"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>

                  {/* Delete */}
                  {(canUpload || isAdmin(role)) && (
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={busy}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Delete from Dropbox"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
