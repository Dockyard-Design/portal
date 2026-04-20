import { getCustomers } from "@/app/actions/kanban";
import { NewQuoteClient } from "./new-quote-client";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const [{ customerId }, customers] = await Promise.all([searchParams, getCustomers()]);

  return <NewQuoteClient customers={customers} selectedCustomerId={customerId} />;
}
