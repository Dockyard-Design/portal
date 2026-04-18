import { getUsers } from "@/app/actions/users";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <UsersTable users={users} />
    </div>
  );
}
