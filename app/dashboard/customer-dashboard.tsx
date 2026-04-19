import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerDashboardData } from "@/types/customer-dashboard";

export function CustomerDashboard({ data }: { data: CustomerDashboardData }) {
  const money = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(data.outstandingBalance);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.customerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Customer dashboard</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Quotes" value={data.quoteCount} detail={`${data.quoteAcceptedCount} accepted, ${data.quotePendingCount} pending`} />
        <MetricCard title="Invoices" value={data.invoiceCount} detail={`${data.invoicePaidCount} paid, ${data.invoiceOverdueCount} overdue`} />
        <MetricCard title="Outstanding" value={money} detail="Balance due" />
        <MetricCard title="Urgent Tasks" value={data.urgentTaskCount} detail="Marked urgent" />
        <MetricCard title="Overdue Tasks" value={data.overdueTaskCount} detail="Past due date" />
        <MetricCard title="Due Soon" value={data.upcomingTaskCount} detail="Due in the next 7 days" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
