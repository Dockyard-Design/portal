import { getCustomers } from "@/app/actions/kanban";
import { getMessageThreads } from "@/app/actions/messaging";
import { getCurrentUserAccess } from "@/lib/authz";
import { MessagesClient } from "./messages-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [access, threads] = await Promise.all([
    getCurrentUserAccess(),
    getMessageThreads(),
  ]);
  const customers = access.role === "admin" ? await getCustomers() : [];

  return (
    <MessagesClient
      threads={threads}
      customers={customers}
      role={access.role}
      customerId={access.customerId}
    />
  );
}
