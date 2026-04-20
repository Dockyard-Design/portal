import { notFound } from "next/navigation";
import { getProject } from "@/app/actions/projects";
import { EditProjectClient } from "./edit-client";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  return <EditProjectClient project={project} />;
}
