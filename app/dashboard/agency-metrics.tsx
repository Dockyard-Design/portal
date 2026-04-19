"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Receipt,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { AgencyMetrics } from "@/app/actions/agency-metrics";

interface AgencyMetricsProps {
  metrics: AgencyMetrics;
}

export function AgencyMetrics({ metrics }: AgencyMetricsProps) {
  const { quotes, invoices } = metrics;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Agency Metrics</h2>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Quote Metrics */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="size-4" />
              <span className="text-sm">Total Quotes</span>
            </div>
            <p className="text-2xl font-semibold">{quotes.total}</p>
            <p className="text-xs text-muted-foreground">
              £{quotes.totalValue.toLocaleString()} value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle className="size-4" />
              <span className="text-sm">Accepted</span>
            </div>
            <p className="text-2xl font-semibold">{quotes.accepted}</p>
            <p className="text-xs text-muted-foreground">
              £{quotes.acceptedValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Invoice Metrics */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="size-4" />
              <span className="text-sm">Total Invoices</span>
            </div>
            <p className="text-2xl font-semibold">{invoices.total}</p>
            <p className="text-xs text-muted-foreground">
              £{invoices.totalValue.toLocaleString()} value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertCircle className="size-4" />
              <span className="text-sm">Outstanding</span>
            </div>
            <p className="text-2xl font-semibold">
              £{invoices.outstandingValue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoices.overdue} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Quote Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              Quote Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow
              label="Draft"
              value={quotes.draft}
              total={quotes.total}
              color="bg-slate-500"
            />
            <StatusRow
              label="Sent"
              value={quotes.sent}
              total={quotes.total}
              color="bg-blue-500"
            />
            <StatusRow
              label="Accepted"
              value={quotes.accepted}
              total={quotes.total}
              color="bg-emerald-500"
            />
            <StatusRow
              label="Rejected"
              value={quotes.rejected}
              total={quotes.total}
              color="bg-red-500"
            />
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="size-4" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow
              label="Draft"
              value={invoices.draft}
              total={invoices.total}
              color="bg-slate-500"
            />
            <StatusRow
              label="Sent"
              value={invoices.sent}
              total={invoices.total}
              color="bg-blue-500"
            />
            <StatusRow
              label="Paid"
              value={invoices.paid}
              total={invoices.total}
              color="bg-emerald-500"
            />
            <StatusRow
              label="Overdue"
              value={invoices.overdue}
              total={invoices.total}
              color="bg-red-500"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
