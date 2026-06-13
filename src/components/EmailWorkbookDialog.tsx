import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAndUploadWorkbook, type WorkbookFormat } from "@/lib/workbook-upload";
import { sendWorkbookEmail } from "@/lib/workbook-email.functions";

export function EmailWorkbookDialog({
  open,
  onOpenChange,
  label,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<WorkbookFormat>("word");
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const reset = () => {
    setShareUrl(null);
  };

  const send = async () => {
    if (!email.trim()) {
      toast.error("Enter a recipient email address.");
      return;
    }
    setBusy(true);
    setShareUrl(null);
    try {
      const { path, fileName } = await generateAndUploadWorkbook(format);
      const result = await sendWorkbookEmail({
        data: {
          recipientEmail: email.trim(),
          recipientName: name.trim() || undefined,
          message: message.trim() || undefined,
          storagePath: path,
          fileName,
          label,
        },
      });

      if (result.emailed) {
        toast.success(`Workbook emailed to ${email.trim()}.`);
        onOpenChange(false);
      } else {
        setShareUrl(result.shareUrl);
        toast.message("Email delivery isn't set up yet", {
          description: "Your workbook was uploaded — copy the secure download link below to share it.",
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the workbook.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email workbook</DialogTitle>
          <DialogDescription>
            Generate the {label.toLowerCase()} and email a secure download link to any recipient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wb-email">Recipient email</Label>
            <Input
              id="wb-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wb-name">Recipient name (optional)</Label>
            <Input
              id="wb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wb-format">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as WorkbookFormat)} disabled={busy}>
              <SelectTrigger id="wb-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word">Word (.docx)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wb-msg">Message (optional)</Label>
            <Textarea
              id="wb-msg"
              rows={3}
              placeholder="Add a short note for the recipient…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
            />
          </div>

          {shareUrl && (
            <div className="space-y-1.5 rounded-md border bg-muted/40 p-3">
              <Label className="text-xs">Secure download link (valid 7 days)</Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied.");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button onClick={send} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
