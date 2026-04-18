"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createProject } from "@/app/actions/projects";
import { ProjectForm, type ProjectFormValues } from "../project-form";

export default function NewProjectPage() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsPending(true);
    try {
      await createProject(data);
      toast.success("Project created");
      router.push("/dashboard/projects");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a new project</p>
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
