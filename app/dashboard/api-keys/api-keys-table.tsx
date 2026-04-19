"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import type { ApiKeyRow } from "@/lib/api-keys";
import { CreateApiKeyDialog } from "./create-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 10;

export function ApiKeysTable({ keys }: { keys: ApiKeyRow[] }) {
  const [page, setPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const router = useRouter();
  const totalPages = Math.ceil(keys.length / ITEMS_PER_PAGE);
  const paginatedKeys = keys.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiKey(id);
      toast.success("Key revoked");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke key");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApiKey(deleteTarget);
      toast.success("Key deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete key");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage access keys for external integrations
          </p>
        </div>
        <CreateApiKeyDialog />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="w-[150px]">Last Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No API keys yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedKeys.map((key) => (
                <TableRow key={key.id} className={key.is_active ? "" : "opacity-50"}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`font-medium ${!key.is_active ? "line-through" : ""}`}>
                        {key.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={key.is_active 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                      }
                    >
                      {key.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                        {key.key_prefix}...
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(key.key_prefix + "...")}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{key.request_count.toLocaleString()} reqs</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {key.last_used_at 
                      ? new Date(key.last_used_at).toLocaleDateString() 
                      : "Never"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {key.is_active && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRevoke(key.id)}
                          className="h-8"
                        >
                          Revoke
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(key.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-secondary/10">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={page === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={page >= totalPages - 1}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this API key. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
