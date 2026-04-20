import { getAgencyMetrics } from "@/app/actions/agency-metrics";
import { AgencyMetrics } from "../agency-metrics";

export const dynamic = "force-dynamic";

export default async function AgencyMetricsPage() {
  const metrics = await getAgencyMetrics();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agency Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Quote and invoice performance across Dockyard.
        </p>
      </div>
      <AgencyMetrics metrics={metrics} />
    </div>
  );
}
