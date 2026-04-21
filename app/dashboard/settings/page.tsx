import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUserAccess } from "@/lib/authz";
import { SettingsClient } from "./settings-client";
import type { CustomerUserMetadata } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, access] = await Promise.all([currentUser(), getCurrentUserAccess()]);

  if (!user) throw new Error("Unauthorized");

  const metadata = {
    ...(user.privateMetadata as CustomerUserMetadata),
    ...(user.publicMetadata as CustomerUserMetadata),
  };

  return (
    <SettingsClient
      email={
        user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        ""
      }
      firstName={user.firstName ?? ""}
      lastName={user.lastName ?? ""}
      role={access.role}
      initialPasswordChangeRequired={metadata.initialPasswordChangeRequired === true}
      firstLoginAt={typeof metadata.firstLoginAt === "string" ? metadata.firstLoginAt : null}
    />
  );
}
