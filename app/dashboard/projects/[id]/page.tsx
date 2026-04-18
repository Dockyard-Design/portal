import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { EditProjectClient } from "./edit-client";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <EditProjectClient project={project} />;
}
