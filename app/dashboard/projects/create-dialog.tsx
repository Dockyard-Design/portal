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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/app/actions/projects";
import { ProjectForm, type ProjectFormValues } from "./project-form";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);
    try {
      await createProject(data);
      toast.success("Project created");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-all font-bold text-sm" />}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto p-0 gap-0 border-border/40 bg-background">
        <DialogHeader className="p-6 border-b border-border/40">
          <DialogTitle className="text-xl font-bold tracking-tight">New Project</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <ProjectForm
            onSubmit={handleSubmit}
            isPending={isPending}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
