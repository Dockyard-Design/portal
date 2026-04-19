import { auth, clerkClient } from "@clerk/nextjs/server";

type RoleMetadata = {
  admin?: unknown;
  role?: unknown;
  roles?: unknown;
};

const ADMIN_ROLES = new Set(["admin", "owner"]);

function getAdminUserIds(): Set<string> {
  return new Set(
    (process.env.DASHBOARD_ADMIN_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function hasAdminMetadata(metadata: RoleMetadata): boolean {
  if (metadata.admin === true) return true;

  if (typeof metadata.role === "string" && ADMIN_ROLES.has(metadata.role.toLowerCase())) {
    return true;
  }

  if (Array.isArray(metadata.roles)) {
    return metadata.roles.some(
      (role) => typeof role === "string" && ADMIN_ROLES.has(role.toLowerCase())
    );
  }

  return false;
}

export async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function requireAdmin(): Promise<string> {
  const userId = await requireUser();
  const adminUserIds = getAdminUserIds();

  if (adminUserIds.has(userId)) {
    return userId;
  }

  if (process.env.NODE_ENV !== "production" && adminUserIds.size === 0) {
    return userId;
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);

  if (
    hasAdminMetadata(user.publicMetadata as RoleMetadata) ||
    hasAdminMetadata(user.privateMetadata as RoleMetadata)
  ) {
    return userId;
  }

  throw new Error("Forbidden");
}
