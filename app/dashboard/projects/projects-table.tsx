"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Globe, Lock, ExternalLink, Pencil, Star } from "lucide-react";
import Link from "next/link";
import { DeleteProjectButton } from "./delete-button";
import type { Project } from "@/types/project";

interface ProjectsTableProps {
  projects: Project[];
  authors: Record<string, string>;
}

const ITEMS_PER_PAGE = 10;

export function ProjectsTable({ projects, authors }: ProjectsTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paginatedProjects = projects.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  const getAuthorDisplay = (authorId: string) => {
    return authors[authorId] || "Unknown author";
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your projects
          </p>
        </div>
        <Button asChild className="inline-flex items-center gap-2">
          <Link href="/dashboard/projects/new">
            <Plus className="size-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[120px]">Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((project) => (
                <TableRow key={project.id} className="group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[280px]">{project.title || "Untitled"}</span>
                      {project.is_featured && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Star className="size-3" />
                          Featured
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={project.status === 'published' 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {project.is_public ? (
                        <>
                          <Globe className="size-3.5 text-emerald-500" />
                          <span className="text-sm">Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="size-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Private</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{getAuthorDisplay(project.author_id)}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground font-mono">/{project.slug}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {project.is_public && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/api/projects/${project.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      
                      <DeleteProjectButton id={project.id} title={project.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-secondary/10">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={page === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={page >= totalPages - 1}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
