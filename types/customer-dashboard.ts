export interface CustomerDashboardData {
  customerName: string;
  quoteCount: number;
  quoteAcceptedCount: number;
  quotePendingCount: number;
  invoiceCount: number;
  invoicePaidCount: number;
  invoiceOverdueCount: number;
  outstandingBalance: number;
  urgentTaskCount: number;
  overdueTaskCount: number;
  upcomingTaskCount: number;
}
