"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createApiKey } from "@/app/actions/api-keys";

export function CreateApiKeyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);
    try {
      const result = await createApiKey(name.trim());
      setCreatedKey(result.key);
      toast.success("API key created");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create key");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      toast.success("Copied to clipboard");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setCreatedKey(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger>
        <Button className="rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-all font-bold text-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-0 gap-0 border-border/40 bg-background">
        <DialogHeader className="p-6 border-b border-border/40">
          <DialogTitle className="text-xl font-bold tracking-tight">Create API Key</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          {createdKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                <p className="font-semibold text-emerald-400 mb-2">Key created successfully</p>
                <p className="text-muted-foreground mb-3">
                  Copy this key now — you won't be able to see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-background border border-border/40 text-xs font-mono break-all">
                    {createdKey}
                  </code>
                  <Button size="sm" onClick={handleCopy} className="shrink-0">
                    Copy
                  </Button>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production, Staging, Mobile App"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Give this key a name so you can identify it later.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? "Creating..." : "Create Key"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}