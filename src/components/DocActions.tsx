import { FileText, FileSpreadsheet, Mail, ChevronDown, FileDown } from "lucide-react";
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
import { EXECUTIVES, PROJECT } from "@/lib/project-data";
import { downloadWorkbookPdf } from "@/lib/workbook-pdf";

// Office for the web — opens a fresh document the user can edit and save.
const WORD_ONLINE = "https://www.office.com/launch/word?auth=2";
const EXCEL_ONLINE = "https://www.office.com/launch/excel?auth=2";

export function DocActions({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const recipients = EXECUTIVES.map((e) => e.email).join(",");
  const subject = encodeURIComponent(`${PROJECT.name} — ${label}`);
  const body = encodeURIComponent(
    `Hi team,\n\nPlease find the latest ${label} for ${PROJECT.name} (${PROJECT.lot}).\n\nBest regards,\nDun Rite Construction`,
  );
  const mailto = `mailto:${recipients}?subject=${subject}&body=${body}`;

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const exportPdf = async () => {
    setBusy(true);
    try {
      await downloadWorkbookPdf();
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Open / Email
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Workbook</DropdownMenuLabel>
        <DropdownMenuItem disabled={busy} onSelect={(e) => { e.preventDefault(); exportPdf(); }}>
          <FileDown className="mr-2 h-4 w-4 text-primary" />
          {busy ? "Generating PDF…" : "Download Workbook PDF"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Open in Microsoft Office</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => open(WORD_ONLINE)}>
          <FileText className="mr-2 h-4 w-4 text-primary" />
          Open in Word
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => open(EXCEL_ONLINE)}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-success" />
          Open in Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Email executives</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => open(mailto)}>
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          Email via Outlook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
