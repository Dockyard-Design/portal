import { getApiKeys } from "@/app/actions/api-keys";
import { ApiKeysTable } from "./api-keys-table";
import { ApiRequestsTable } from "../api-requests-table";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardApiMetrics, getLastApiRequests } from "@/app/actions/metrics";
import { Activity, Shield, Clock, Key } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function ApiKeysPage() {
  const [
    apiKeys,
    metrics,
    recentRequests,
  ] = await Promise.all([
    getApiKeys(),
    getDashboardApiMetrics().catch(() => ({ successRate: 0, avgResponseTime: 0 })),
    getLastApiRequests(50).catch(() => []),
  ]);
  const activeKeys = apiKeys.filter((k) => k.is_active).length;
  const totalKeys = apiKeys.length;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <ApiKeysTable keys={apiKeys} />
      {/* API Requests Table - Full Width */}
      <ApiRequestsTable requests={recentRequests} />
      {/* API Health */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">API Health</h2>
        </div>
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-5 space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
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
