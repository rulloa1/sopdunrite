import { Printer, Mail, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Per-section Download / Email actions.
 * - "Download" / "Print" triggers the browser print dialog, which uses the
 *   print-optimized stylesheet (light background, black text, no sidebar) so
 *   the user can save the section as a clean PDF.
 * - "Email" opens the default mail client with the section name + app URL
 *   prefilled. No dead buttons.
 */
export function SectionActions({ label }: { label: string }) {
  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  const email = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const subject = encodeURIComponent(`${label} — 12412 Curley St, San Antonio, FL 33576 Workbook`);
    const body = encodeURIComponent(
      `Here is the ${label} from the 12412 Curley St, San Antonio, FL 33576 — Baker's Bay Project Management Workbook.\n\nView it online: ${url}\n\nTo save a PDF copy, open the link and use the Download button (Print to PDF).`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 no-print">
          Download / Email
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); print(); }}>
          <Printer className="mr-2 h-4 w-4 text-primary" />
          Download (Print to PDF)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); email(); }}>
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          Email this section…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
