"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PdfViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  pdfUrl: string | null;
}

export function PdfViewDialog({
  open,
  onOpenChange,
  title,
  pdfUrl,
}: PdfViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle className="truncate text-base">{title}</DialogTitle>
            {pdfUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} download>
                  <Download className="mr-2 size-4" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>
        {pdfUrl ? (
          <iframe
            title={title}
            src={pdfUrl}
            className="min-h-0 flex-1 border-0 bg-muted"
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a document to preview.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
