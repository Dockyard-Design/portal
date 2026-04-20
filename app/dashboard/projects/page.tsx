import { getProjects } from "@/app/actions/projects";
import { ProjectsTable } from "./projects-table";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export default async function ProjectsPage() {
  const projects = await getProjects();
  
  // Fetch unique author IDs
  const authorIds = [...new Set(projects.map(p => p.author_id))];
  
  // Fetch user data for all authors
  const clerk = await clerkClient();
  const authors: Record<string, string> = {};
  
  for (const id of authorIds) {
    try {
      const user = await clerk.users.getUser(id);
      authors[id] = user.firstName || user.username || user.emailAddresses[0]?.emailAddress || "Unknown author";
    } catch {
      authors[id] = "Unknown author";
    }
  }
  
  return <ProjectsTable projects={projects} authors={authors} />;
}
