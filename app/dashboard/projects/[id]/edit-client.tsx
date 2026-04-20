"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/projects";
import { ProjectForm, type ProjectFormValues } from "../project-form";
import type { Project } from "@/app/actions/projects";

interface EditProjectClientProps {
  project: Project;
}

export function EditProjectClient({ project }: EditProjectClientProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);
    try {
      await updateProject(project.id, data);
      toast.success("Project updated");
      router.push("/dashboard/projects");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground text-sm mt-1">{project.title}</p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-6">
          <ProjectForm
            initialData={project}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
