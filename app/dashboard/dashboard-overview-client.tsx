"use client";

import { useKanbanStore } from "@/lib/store";
import { CustomerFocusPanel } from "./customer-focus-panel";
import type { Customer } from "@/types/kanban";

export function DashboardOverviewClient({
  customers,
  children,
}: {
  customers: Customer[];
  children: React.ReactNode;
}) {
  const { selectedCustomerId } = useKanbanStore();

  if (selectedCustomerId) {
    return (
      <div className="flex w-full flex-col gap-8">
        <CustomerFocusPanel customers={customers} />
      </div>
    );
  }

  return <>{children}</>;
}
