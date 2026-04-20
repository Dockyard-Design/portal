import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

import { ArrowUpRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/app/actions/projects";
import {
  getContactSummary,
  getContactSubmissions,
} from "@/app/actions/contact";
import { getKanbanMetrics } from "@/app/actions/kanban-metrics";
import { getCustomers } from "@/app/actions/kanban";
import { getCurrentUserAccess } from "@/lib/authz";
import { getMyCustomerDashboard } from "@/app/actions/customer-dashboard";
import { KanbanMetrics } from "./kanban-metrics";
import { CustomerDashboard } from "./customer-dashboard";
import { CustomerFocusPanel } from "./customer-focus-panel";
import { DashboardOverviewClient } from "./dashboard-overview-client";

export default async function DashboardPage() {
  const access = await getCurrentUserAccess();

  if (access.role === "customer") {
    const data = await getMyCustomerDashboard();
    return <CustomerDashboard data={data} />;
  }

  const [
    projects,
    contactSummary,
    kanbanMetrics,
    contactSubmissions,
    customers,
  ] = await Promise.all([
    getProjects(),
    getContactSummary().catch(() => ({
      new: 0,
      read: 0,
      replied: 0,
      closed: 0,
    })),
    getKanbanMetrics().catch(() => ({
      totalCustomers: 0,
      totalBoards: 0,
      tasksByStatus: { backlog: 0, todo: 0, in_progress: 0, complete: 0 },
      totalTasks: 0,
    })),
    getContactSubmissions({ archived: false }).catch(() => []),
    getCustomers().catch(() => []),
  ]);

  const newSubmissions = contactSubmissions.filter((s) => s.status === "new");

  return (
    <DashboardOverviewClient customers={customers}>
      <div className="flex w-full flex-col gap-8">
        <CustomerFocusPanel customers={customers} />
      {/* Kanban Metrics */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Kanban Boards</h2>
      </div>
      <KanbanMetrics metrics={kanbanMetrics} />

      <div className="flex items-center gap-2">
        <LayoutGrid className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">
          Projects and Contact Submissions
        </h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Projects</h2>
              <Link
                href="/dashboard/projects"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border/40">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-2 rounded-full shrink-0 ${project.status === "published" ? "bg-emerald-500" : "bg-amber-500"}`}
                    />
                    <span className="font-medium text-sm truncate">
                      {project.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
              {projects.length === 0 && (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                  No projects yet. Create your first one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Contact Submissions */}
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">
                  Contact Submissions
                </h2>
                {contactSummary.new > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {contactSummary.new} new
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/contact"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border/40">
              {newSubmissions.slice(0, 5).map((submission) => (
                <Link
                  key={submission.id}
                  href="/dashboard/contact"
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-2 rounded-full shrink-0 bg-red-500" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">
                        {submission.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {submission.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
              {newSubmissions.length === 0 && (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                  No new submissions.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardOverviewClient>
  );
}
