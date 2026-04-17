import { Key } from "lucide-react";
import { getApiKeys } from "@/app/actions/api-keys";
import { ApiKeyList } from "./api-key-list";
import { CreateApiKeyDialog } from "./create-dialog";

export default async function ApiKeysPage() {
  const keys = await getApiKeys();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keys are required to access the API. Keep them secret — revoke any that are compromised.
          </p>
        </div>
        <CreateApiKeyDialog />
      </div>

      {keys.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground">
          No API keys yet. Create one to start using the API.
        </div>
      ) : (
        <ApiKeyList keys={keys} />
      )}
    </div>
  );
}