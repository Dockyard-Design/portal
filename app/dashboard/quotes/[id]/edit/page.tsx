import { notFound } from "next/navigation";
import { getQuote } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import { requireAdmin } from "@/lib/authz";
import { NewQuoteClient } from "../../new/new-quote-client";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [quote, customers] = await Promise.all([getQuote(id), getCustomers()]);

  if (!quote || (quote.status !== "draft" && quote.status !== "rejected")) {
    notFound();
  }

  return (
    <NewQuoteClient
      customers={customers}
      selectedCustomerId={quote.customer_id}
      quote={quote}
    />
  );
}
