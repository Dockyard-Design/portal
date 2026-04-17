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
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProject, type Project } from "@/app/actions/projects";
import { ProjectForm, type ProjectFormValues } from "./project-form";

interface EditProjectDialogProps {
  project: Project;
}

export function EditProjectDialog({ project }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);
    try {
      await updateProject(project.id, data);
      toast.success("Project updated");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="hover:bg-primary/20 hover:text-primary transition-colors rounded-lg" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto p-0 gap-0 border-border/40 bg-background">
        <DialogHeader className="p-6 border-b border-border/40">
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Project</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <ProjectForm
            initialData={project}
            onSubmit={handleSubmit}
            isPending={isPending}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
