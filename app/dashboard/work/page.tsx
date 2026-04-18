import { 
  getCustomers, 
  getTeamMembers 
} from "@/app/actions/kanban";
import { KanbanDataProvider } from "./kanban-data-provider";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const [customers, teamMembers] = await Promise.all([
    getCustomers(),
    getTeamMembers(),
  ]);

  return (
    <KanbanDataProvider
      initialCustomers={customers}
      initialTeamMembers={teamMembers}
    />
  );
}
