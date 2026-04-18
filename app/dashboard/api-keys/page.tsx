import { getApiKeys } from "@/app/actions/api-keys";
import { ApiKeysTable } from "./api-keys-table";

export const dynamic = "force-dynamic";
export default async function ApiKeysPage() {
  const keys = await getApiKeys();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <ApiKeysTable keys={keys} />
    </div>
  );
}
