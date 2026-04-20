import { getQuotes } from "@/app/actions/agency";
import { getCustomers } from "@/app/actions/kanban";
import { getCurrentUserAccess } from "@/lib/authz";
import QuotesClient from "./client";

export const dynamic = "force-dynamic";
export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const access = await getCurrentUserAccess();
  const { customerId } = await searchParams;
  const selectedCustomerId = access.role === "admin" ? customerId : undefined;
  const [quotes, customers] = await Promise.all([
    getQuotes(selectedCustomerId),
    access.role === "admin" ? getCustomers() : Promise.resolve([]),
  ]);

  return (
    <QuotesClient 
      quotes={quotes}
      customers={customers}
      role={access.role}
      selectedCustomerId={selectedCustomerId}
    />
  );
}
