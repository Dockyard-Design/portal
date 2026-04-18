import { getQuotes } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import QuotesClient from "./client";

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
