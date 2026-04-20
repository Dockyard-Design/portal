import { getInvoices, getQuotes } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import { getCurrentUserAccess } from "@/lib/authz";
import InvoicesClient from "./client";

export const dynamic = "force-dynamic";
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const access = await getCurrentUserAccess();
  const { customerId } = await searchParams;
  const selectedCustomerId = access.role === "admin" ? customerId : undefined;
  const [invoices, quotes, customers] = await Promise.all([
    getInvoices(selectedCustomerId),
    getQuotes(selectedCustomerId),
    access.role === "admin" ? getCustomers() : Promise.resolve([]),
  ]);

  return (
    <InvoicesClient 
      invoices={invoices}
      quotes={quotes}
      customers={customers}
      role={access.role}
      selectedCustomerId={selectedCustomerId}
    />
  );
}
