"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm, type ProjectFormValues } from "../project-form";

export function NewProjectClient() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);
    try {
      await createProject(data);
      toast.success("Project created");
      router.push("/dashboard/projects");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
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
          <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a project with dedicated brief, prototype, build, and feedback sections.</p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-6">
          <ProjectForm
            onSubmit={handleSubmit}
            isPending={isPending}
            onCancel={() => router.push("/dashboard/projects")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
