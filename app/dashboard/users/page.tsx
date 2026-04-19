import { getUsers } from "@/app/actions/users";
import { getCustomers } from "@/app/actions/kanban";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";
export default async function UsersPage() {
  const [users, customers] = await Promise.all([getUsers(), getCustomers()]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <UsersTable users={users} customers={customers} />
    </div>
  );
}
