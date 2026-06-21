"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Print the certificate to PDF via the browser print dialog. */
export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> Print
    </Button>
  );
}
