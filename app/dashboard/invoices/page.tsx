import { getInvoices } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import InvoicesClient from "./client";

export const dynamic = "force-dynamic";
export default async function InvoicesPage() {
  const [invoices, customers] = await Promise.all([
    getInvoices(),
    getCustomers(),
  ]);

  return (
    <InvoicesClient 
      invoices={invoices}
      customers={customers}
    />
  );
}
