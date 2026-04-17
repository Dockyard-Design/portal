import { Card, CardContent } from "@/components/ui/card";
import { Globe, Activity, ArrowUpRight, Plus, LayoutGrid, Key, Clock, Zap, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/app/actions/projects";
import { getApiKeys } from "@/app/actions/api-keys";
import { getDashboardApiMetrics } from "@/app/actions/metrics";
import { ExpandableProjectList } from "@/components/expandable-project-list";
import { ExpandableRequestList } from "@/components/expandable-request-list";

export default async function DashboardPage() {
  const [projects, apiKeys, metrics] = await Promise.all([
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
  ]);

  const total = projects.length;
  const published = projects.filter((p) => p.status === "published").length;
  const publicCount = projects.filter((p) => p.is_public).length;
  const draft = projects.filter((p) => p.status === "draft").length;
  const activeKeys = apiKeys.filter((k) => k.is_active).length;
  const totalKeys = apiKeys.length;

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} project{total !== 1 ? "s" : ""} total, {published} published, {draft} in draft.
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="group flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_-5px_var(--color-primary)] active:scale-95"
        >
          <Plus className="size-4" />
          New Project
        </Link>
      </div>

      {/* Project Stats */}
      <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
        <MetricCard label="Total" value={total} sub={`${published} published`} icon={LayoutGrid} color="text-blue-400" />
        <MetricCard label="Public" value={publicCount} sub="Visible to everyone" icon={Globe} color="text-emerald-400" />
        <MetricCard label="Drafts" value={draft} sub="Not yet published" icon={Activity} color="text-amber-400" />
        <MetricCard label="API Keys" value={activeKeys} sub={`${totalKeys} total`} icon={Key} color="text-violet-400" />
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link href="/dashboard/projects" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {projects.length > 0 ? (
          <ExpandableProjectList projects={projects} limit={5} />
        ) : (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground">
            No projects yet. Create your first one.
          </div>
        )}
      </div>

      {/* API Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            API Usage
          </h2>
          <Link href="/dashboard/api-keys" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            Manage Keys <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
          <MetricCard label="Requests" value={metrics.totalRequests} sub="Last 30 days" icon={Zap} color="text-blue-400" />
          <MetricCard label="Avg Response" value={`${metrics.avgResponseTime}ms`} sub="Median latency" icon={Clock} color="text-emerald-400" />
          <MetricCard label="Success Rate" value={`${metrics.successRate}%`} sub="2xx & 3xx responses" icon={TrendingUp} color="text-violet-400" />
          <MetricCard label="Active Keys" value={activeKeys} sub={`${totalKeys} total`} icon={Key} color="text-amber-400" />
        </div>

        {/* Recent API Requests */}
        {metrics.recentRequests.length > 0 && (
          <div className="rounded-2xl bg-secondary/30 border border-border/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40">
              <h3 className="text-sm font-semibold">Recent Requests</h3>
            </div>
            <ExpandableRequestList requests={metrics.recentRequests} limit={5} />
          </div>
        )}

        {/* Top API Keys by Usage */}
        {metrics.topKeys.length > 0 && (
          <div className="rounded-2xl bg-secondary/30 border border-border/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/40">
              <h3 className="text-sm font-semibold">Key Usage</h3>
            </div>
            <div className="divide-y divide-border/40">
              {metrics.topKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{key.key_prefix}...</span>
                    <span className="text-sm font-medium">{key.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      key.is_active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {key.is_active ? "Active" : "Revoked"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{key.request_count.toLocaleString()} reqs</span>
                    <span className="text-xs text-muted-foreground">
                      {key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}` : "Never used"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {metrics.totalRequests === 0 && (
          <div className="p-10 text-center rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground">
            No API requests yet. Create a key and start making requests.
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color }: { label: string; value: number | string; sub: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card className="border-none bg-secondary/40 hover:bg-secondary/60 transition-all group cursor-default">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-background/50 ${color}`}>
            <Icon className="size-5" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}