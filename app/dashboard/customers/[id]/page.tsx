import { notFound } from "next/navigation";
import { getCustomer, getCustomers } from "@/app/actions/kanban";
import { getCustomerStats, getInvoices, getQuotes } from "@/app/actions/agency";
import CustomerDetailClient from "./customer-detail-client";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  const [customer, customers, quotes, invoices, stats] = await Promise.all([
    getCustomer(id),
    getCustomers(),
    getQuotes(id),
    getInvoices(id),
    getCustomerStats(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetailClient
      customer={customer}
      customers={customers}
      quotes={quotes}
      invoices={invoices}
      stats={stats}
    />
  );
}
