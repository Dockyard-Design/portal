import { Card, CardContent } from "@/components/ui/card";
import {
  Globe,
  ArrowUpRight,
  Plus,
  Key,
  Clock,
  Shield,
  TrendingUp,
  MessageSquare,
  FileText,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/app/actions/projects";
import { getApiKeys } from "@/app/actions/api-keys";
import {
  getDashboardApiMetrics,
  getLastApiRequests,
} from "@/app/actions/metrics";
import { getContactSummary } from "@/app/actions/contact";
import { ApiRequestsTable } from "./api-requests-table";

export default async function DashboardPage() {
  const [projects, apiKeys, metrics, contactSummary, recentRequests] =
    await Promise.all([
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
    ]);

  const total = projects.length;
  const published = projects.filter((p) => p.status === "published").length;
  const draft = projects.filter((p) => p.status === "draft").length;
  const activeKeys = apiKeys.filter((k) => k.is_active).length;
  const totalKeys = apiKeys.length;
  const totalContact =
    contactSummary.new +
    contactSummary.read +
    contactSummary.replied +
    contactSummary.closed;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your content and API usage
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={total}
          sub={`${published} published`}
          icon={FileText}
          href="/dashboard/projects"
        />
        <StatCard
          label="Contact"
          value={totalContact}
          sub={`${contactSummary.new} new`}
          icon={MessageSquare}
          href="/dashboard/contact"
          highlight={contactSummary.new > 0}
        />
        <StatCard
          label="API Keys"
          value={activeKeys}
          sub={`${totalKeys} total`}
          icon={Key}
          href="/dashboard/api-keys"
        />
        <StatCard
          label="Requests"
          value={metrics.totalRequests}
          sub="Last 30 days"
          icon={TrendingUp}
          href="/dashboard/api-keys"
        />
      </div>

      {/* Recent Activity - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
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
      {/* API Requests Table - Full Width */}
      <ApiRequestsTable requests={recentRequests} />
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
