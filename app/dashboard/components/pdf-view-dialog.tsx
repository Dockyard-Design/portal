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
      <DialogContent className="h-[92vh] w-[96vw] max-w-5xl p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
          <DialogTitle className="truncate text-base">{title}</DialogTitle>
          {pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} download>
                <Download className="mr-2 size-4" />
                Download
              </a>
            </Button>
          )}
        </DialogHeader>
        {pdfUrl ? (
          <iframe
            title={title}
            src={pdfUrl}
            className="h-full min-h-0 w-full flex-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a document to preview.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
