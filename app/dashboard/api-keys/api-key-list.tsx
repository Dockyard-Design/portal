"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Key, Trash2, Copy } from "lucide-react";
import { revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import { toast } from "sonner";
import type { ApiKeyRow } from "@/lib/api-keys";

interface ApiKeyListProps {
  keys: ApiKeyRow[];
}

export function ApiKeyList({ keys }: ApiKeyListProps) {
  const router = useRouter();

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiKey(id);
      toast.success("Key revoked");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke key");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey(id);
      toast.success("Key deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete key");
    }
  };

  return (
    <div className="grid gap-3">
      {keys.map((key) => (
        <div
          key={key.id}
          className={`group flex items-start sm:items-center justify-between p-5 rounded-2xl border transition-all ${
            key.is_active
              ? "bg-secondary/30 border-border/40 hover:border-primary/40"
              : "bg-secondary/10 border-border/20 opacity-60"
          }`}
        >
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${
              key.is_active
                ? "bg-primary/10 border border-primary/20 text-primary"
                : "bg-muted border border-border/30 text-muted-foreground"
            }`}>
              <Key className="size-5" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${!key.is_active ? "line-through" : ""}`}>
                  {key.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  key.is_active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground border border-border/30"
                }`}>
                  {key.is_active ? "Active" : "Revoked"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <code className="font-mono text-xs">{key.key_prefix}...</code>
                <span className="opacity-30">·</span>
                <span className="text-xs">Created {new Date(key.created_at).toLocaleDateString()}</span>
                {key.last_used_at && (
                  <>
                    <span className="opacity-30">·</span>
                    <span className="text-xs">Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {key.is_active && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevoke(key.id)}
                className="text-xs"
              >
                Revoke
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(key.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}