import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  Plus,
  Key,
  Clock,
  Shield,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/app/actions/projects";
import { getApiKeys } from "@/app/actions/api-keys";
import {
  getDashboardApiMetrics,
  getLastApiRequests,
} from "@/app/actions/metrics";
import {
  getContactSummary,
  getContactSubmissions,
} from "@/app/actions/contact";
import { getKanbanMetrics } from "@/app/actions/kanban-metrics";
import { getAgencyMetrics } from "@/app/actions/agency-metrics";
import { KanbanMetrics } from "./kanban-metrics";
import { AgencyMetrics } from "./agency-metrics";
import { ApiRequestsTable } from "./api-requests-table";

export default async function DashboardPage() {
  const [
    projects,
    apiKeys,
    metrics,
    contactSummary,
    recentRequests,
    kanbanMetrics,
    contactSubmissions,
    agencyMetrics,
  ] = await Promise.all([
    getProjects(),
    getApiKeys(),
    getDashboardApiMetrics().catch(() => ({
      totalRequests: 0,
      avgResponseTime: 0,
      successRate: 0,
      requestsByMethod: {},
      requestsByPath: [],
      requestsByDay: [],
      recentRequests: [],
      topKeys: [],
    })),
    getContactSummary().catch(() => ({
      new: 0,
      read: 0,
      replied: 0,
      closed: 0,
    })),
    getLastApiRequests(50).catch(() => []),
    getKanbanMetrics().catch(() => ({
      totalCustomers: 0,
      totalBoards: 0,
      tasksByStatus: { backlog: 0, todo: 0, in_progress: 0, complete: 0 },
      totalTasks: 0,
    })),
    getContactSubmissions({ archived: false }).catch(() => []),
    getAgencyMetrics().catch(() => ({
      quotes: { total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0, totalValue: 0, acceptedValue: 0 },
      invoices: { total: 0, draft: 0, sent: 0, paid: 0, partial: 0, overdue: 0, cancelled: 0, totalValue: 0, paidValue: 0, outstandingValue: 0, overdueValue: 0 },
      monthlyData: [],
    })),
  ]);

  const activeKeys = apiKeys.filter((k) => k.is_active).length;
  const totalKeys = apiKeys.length;
  const newSubmissions = contactSubmissions.filter((s) => s.status === "new");

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Agency Metrics */}
      <AgencyMetrics metrics={agencyMetrics} />

      {/* Kanban Metrics */}
      <div className="flex items-center gap-2 pt-10">
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

      {/* API Requests Table - Full Width */}
      <ApiRequestsTable requests={recentRequests} />
      {/* API Health */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">API Health</h2>
            <Link
              href="/dashboard/api-keys"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              Manage <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            <HealthRow
              label="Success Rate"
              value={`${metrics.successRate}%`}
              icon={Shield}
              status={
                metrics.successRate >= 95
                  ? "good"
                  : metrics.successRate >= 80
                    ? "warning"
                    : "error"
              }
            />
            <HealthRow
              label="Avg Response"
              value={`${metrics.avgResponseTime}ms`}
              icon={Clock}
              status={
                metrics.avgResponseTime < 200
                  ? "good"
                  : metrics.avgResponseTime < 500
                    ? "warning"
                    : "error"
              }
            />
            <HealthRow
              label="Active Keys"
              value={`${activeKeys} / ${totalKeys}`}
              icon={Key}
              status={activeKeys > 0 ? "good" : "neutral"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  highlight,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href}>
      <Card
        className={`border-border/40 shadow-sm hover:border-primary/40 transition-colors group ${highlight ? "border-primary/30 bg-primary/5" : ""}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div
              className={`p-2 rounded-lg ${highlight ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}
            >
              <Icon className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">{sub}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function HealthRow({
  label,
  value,
  icon: Icon,
  status,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "good" | "warning" | "error" | "neutral";
}) {
  const statusColors = {
    good: "text-emerald-500",
    warning: "text-amber-500",
    error: "text-red-500",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-medium ${statusColors[status]}`}>
        {value}
      </span>
    </div>
  );
}
