import { FileText, Mail, ChevronDown, FileDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadWorkbookPdf } from "@/lib/workbook-pdf";
import { downloadWorkbookDocx } from "@/lib/workbook-docx";
import { EmailWorkbookDialog } from "@/components/EmailWorkbookDialog";

export function DocActions({ label }: { label: string }) {
  const [busy, setBusy] = useState<null | "pdf" | "word">(null);
  const [emailOpen, setEmailOpen] = useState(false);

  const exportPdf = async () => {
    setBusy("pdf");
    try {
      await downloadWorkbookPdf();
    } finally {
      setBusy(null);
    }
  };

  const exportWord = async () => {
    setBusy("word");
    try {
      await downloadWorkbookDocx();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Download / Email
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Download workbook</DropdownMenuLabel>
          <DropdownMenuItem disabled={!!busy} onSelect={(e) => { e.preventDefault(); exportWord(); }}>
            <FileText className="mr-2 h-4 w-4 text-primary" />
            {busy === "word" ? "Generating Word…" : "Download as Word (.docx)"}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!!busy} onSelect={(e) => { e.preventDefault(); exportPdf(); }}>
            <FileDown className="mr-2 h-4 w-4 text-primary" />
            {busy === "pdf" ? "Generating PDF…" : "Download as PDF"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Send</DropdownMenuLabel>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEmailOpen(true); }}>
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            Email workbook…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmailWorkbookDialog open={emailOpen} onOpenChange={setEmailOpen} label={label} />
    </>
  );
}
