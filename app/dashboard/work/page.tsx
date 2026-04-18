import { getCustomers, getTasksByStatus, getTeamMembers } from "@/app/actions/kanban";
import { KanbanBoard } from "./kanban-board";
import type { TasksByStatus, Customer, ClerkUser } from "@/types/kanban";

export const dynamic = "force-dynamic";

interface SearchParams {
  customer?: string;
}

export default async function KanbanPage({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams> 
}) {
  // Get all customers for the dropdown
  const customers = await getCustomers();
  
  // Get team members for task assignment
  const teamMembers = await getTeamMembers();
  
  // Get selected customer from query params
  const params = await searchParams;
  const customerId = params?.customer;
  
  // Get tasks for selected customer
  const tasksByStatus: TasksByStatus = customerId 
    ? await getTasksByStatus(customerId)
    : { backlog: [], todo: [], in_progress: [], complete: [] };

  // Get selected customer details
  const selectedCustomer: Customer | undefined = customerId 
    ? customers.find(c => c.id === customerId)
    : undefined;

  return (
    <KanbanBoard 
      customers={customers}
      teamMembers={teamMembers}
      tasksByStatus={tasksByStatus}
      selectedCustomerId={customerId || ""}
      selectedCustomer={selectedCustomer}
    />
  );
}
