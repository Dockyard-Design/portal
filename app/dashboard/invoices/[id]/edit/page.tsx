import { notFound } from "next/navigation";
import { getInvoice, getQuotes } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import { requireAdmin } from "@/lib/authz";
import { EditInvoiceClient } from "./edit-invoice-client";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) notFound();

  const [quotes, customers] = await Promise.all([
    getQuotes(invoice.customer_id),
    getCustomers(),
  ]);

  return (
    <EditInvoiceClient
      invoice={invoice}
      quotes={quotes}
      customers={customers}
    />
  );
}
