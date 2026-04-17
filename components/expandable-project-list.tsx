"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Project } from "@/app/actions/projects";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import Link from "next/link";

// Persist expanded state to sessionStorage so it survives router.refresh() (#17)
function usePersistedState(key: string, defaultValue: boolean) {
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      return sessionStorage.getItem(key) === "true";
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, String(value));
    } catch {
      // Ignore write failures (e.g. private browsing)
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function ExpandableProjectList({ projects, limit = 5 }: { projects: Project[]; limit?: number }) {
  const [expanded, setExpanded] = usePersistedState("project-list-expanded", false);
  const hasMore = projects.length > limit;
  const visible = expanded ? projects : projects.slice(0, limit);

  if (projects.length === 0) return null;

  return (
    <div>
      <div className="grid gap-3">
        {visible.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/projects?edit=${project.id}`}
            className="group flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:border-primary/40 transition-all"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold group-hover:text-primary transition-colors">
                  {project.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs h-5 px-2 font-semibold
                    ${project.status === 'published' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}`}
                >
                  {project.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="size-3.5" />
                  {project.is_public ? "Public" : "Private"}
                </span>
                <span className="opacity-30">·</span>
                <span className="font-mono text-xs">/{project.slug}</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 rounded-xl hover:bg-secondary/30"
        >
          {expanded ? (
            <>Show less <ChevronUp className="size-3.5" /></>
          ) : (
            <>Show {projects.length - limit} more posts <ChevronDown className="size-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}