import { getQuotes } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import QuotesClient from "./client";

export const dynamic = "force-dynamic";
export default async function QuotesPage() {
  const [quotes, customers] = await Promise.all([
    getQuotes(),
    getCustomers(),
  ]);

  return (
    <QuotesClient 
      quotes={quotes}
      customers={customers}
    />
  );
}
