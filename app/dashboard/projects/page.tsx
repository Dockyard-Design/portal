import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Lock, ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/app/actions/projects";
import { CreateProjectDialog } from "./create-dialog";
import { EditProjectDialog } from "./edit-dialog";
import { DeleteProjectButton } from "./delete-button";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, edit, and manage your content.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="p-16 text-center rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground">
            No posts yet. Click "New Post" to get started.
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl bg-secondary/30 border border-border/40 hover:border-primary/40 transition-all duration-200"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="size-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold group-hover:text-primary transition-colors truncate">
                          {project.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs h-5 px-2 font-semibold
                            ${project.status === 'published' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{project.is_public ? "Public" : "Private"}</span>
                        <span className="opacity-30">·</span>
                        <span className="font-mono text-xs">/{project.slug}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:block text-sm text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                    {project.is_public && (
                      <Button variant="ghost" size="sm" className="h-8 px-3 bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all rounded-lg text-sm" asChild>
                        <Link href={`/api/posts/${project.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium">
                          API <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    )}
                    <EditProjectDialog project={project} />
                    <DeleteProjectButton id={project.id} title={project.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}