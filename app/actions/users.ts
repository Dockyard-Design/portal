"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { requireAdmin, requireUser } from "@/lib/authz";
import type { UserRole, CustomerUserMetadata } from "@/types/auth";

interface ClerkErrorLike {
  errors?: Array<{
    code?: string;
    message?: string;
    longMessage?: string;
  }>;
  message?: string;
}

function getUserActionErrorMessage(error: unknown): string {
  const clerkError = error as ClerkErrorLike;
  const firstError = clerkError.errors?.[0];

  switch (firstError?.code) {
    case "form_password_pwned":
      return "That password has appeared in a data breach. Choose a different, stronger password.";
    case "form_password_length_too_short":
      return "Password is too short. Use at least 8 characters.";
    case "form_identifier_exists":
    case "form_email_address_exists":
      return "A user with that email address already exists.";
    case "form_param_format_invalid":
      return firstError.longMessage || firstError.message || "One of the user fields is invalid.";
    default:
      return (
        firstError?.longMessage ||
        firstError?.message ||
        clerkError.message ||
        "Failed to update user management."
      );
  }
}

export interface SimpleUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
  primaryEmailAddressId: string | null;
  imageUrl: string | null;
  locked: boolean;
  lastSignInAt: number | null;
  createdAt: number;
  role: UserRole;
  customerId: string | null;
}

function serializeUser(user: User): SimpleUser {
  const metadata = {
    ...(user.privateMetadata as CustomerUserMetadata),
    ...(user.publicMetadata as CustomerUserMetadata),
  };
  const role = metadata.role === "customer" ? "customer" : "admin";

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    emailAddresses: user.emailAddresses.map((email) => ({
      id: email.id,
      emailAddress: email.emailAddress,
    })),
    primaryEmailAddressId: user.primaryEmailAddressId,
    imageUrl: user.imageUrl,
    locked: user.locked,
    lastSignInAt: user.lastSignInAt,
    createdAt: user.createdAt,
    role,
    customerId: typeof metadata.customerId === "string" ? metadata.customerId : null,
  };
}

export async function getUsers(): Promise<SimpleUser[]> {
  await requireAdmin();

  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    limit: 500,
    orderBy: "-created_at",
  });

  return data.map(serializeUser);
}

export async function createUser(params: {
  emailAddress: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role: UserRole;
  customerId?: string;
}): Promise<SimpleUser> {
  await requireAdmin();

  if (params.role === "customer" && !params.customerId) {
    throw new Error("Customer users must be assigned to a company.");
  }

  try {
    const client = await clerkClient();
    const metadata: CustomerUserMetadata = {
      role: params.role,
      roles: [params.role],
      admin: params.role === "admin",
      customerId: params.role === "customer" ? params.customerId : undefined,
    };
    const user = await client.users.createUser({
      emailAddress: [params.emailAddress],
      firstName: params.firstName,
      lastName: params.lastName,
      publicMetadata: metadata,
      privateMetadata: metadata,
      ...(params.password
        ? { password: params.password }
        : { skipPasswordRequirement: true }),
    });

    revalidatePath("/dashboard/users");
    return serializeUser(user);
  } catch (error) {
    throw new Error(getUserActionErrorMessage(error));
  }
}

export async function updateUser(
  userId: string,
  params: {
    firstName?: string;
    lastName?: string;
    primaryEmailAddressID?: string;
    role?: UserRole;
    customerId?: string | null;
  }
): Promise<SimpleUser> {
  await requireAdmin();

  try {
    const client = await clerkClient();
    const updateParams: {
      firstName?: string;
      lastName?: string;
      primaryEmailAddressID?: string;
      publicMetadata?: CustomerUserMetadata;
      privateMetadata?: CustomerUserMetadata;
    } = {
      firstName: params.firstName,
      lastName: params.lastName,
      primaryEmailAddressID: params.primaryEmailAddressID,
    };

    if (params.role) {
      if (params.role === "customer" && !params.customerId) {
        throw new Error("Customer users must be assigned to a company.");
      }

      const metadata: CustomerUserMetadata = {
        role: params.role,
        roles: [params.role],
        admin: params.role === "admin",
        customerId: params.role === "customer" ? params.customerId ?? undefined : undefined,
      };

      updateParams.publicMetadata = metadata;
      updateParams.privateMetadata = metadata;
    }

    const user = await client.users.updateUser(userId, updateParams);

    revalidatePath("/dashboard/users");
    return serializeUser(user);
  } catch (error) {
    throw new Error(getUserActionErrorMessage(error));
  }
}

export async function deleteUser(userId: string): Promise<void> {
  await requireAdmin();

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    revalidatePath("/dashboard/users");
  } catch (error) {
    throw new Error(getUserActionErrorMessage(error));
  }
}

export async function lockUser(userId: string): Promise<SimpleUser> {
  await requireAdmin();

  try {
    const client = await clerkClient();
    const user = await client.users.lockUser(userId);

    revalidatePath("/dashboard/users");
    return serializeUser(user);
  } catch (error) {
    throw new Error(getUserActionErrorMessage(error));
  }
}

export async function unlockUser(userId: string): Promise<SimpleUser> {
  await requireAdmin();

  try {
    const client = await clerkClient();
    const user = await client.users.unlockUser(userId);

    revalidatePath("/dashboard/users");
    return serializeUser(user);
  } catch (error) {
    throw new Error(getUserActionErrorMessage(error));
  }
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<SimpleUser> {
  await requireAdmin();

  try {
    const client = await clerkClient();
    const user = await client.users.updateUser(userId, {
      password: newPassword,
      signOutOfOtherSessions: true, // Sign out user from all devices
    });

    revalidatePath("/dashboard/users");
    return serializeUser(user);
  } catch (error) {
    throw new Error(getUserActionErrorMessage(error));
  }
}

export async function completeInitialPasswordChange(): Promise<void> {
  const userId = await requireUser();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = {
    ...(user.privateMetadata as CustomerUserMetadata),
    ...(user.publicMetadata as CustomerUserMetadata),
  };

  const nextMetadata: CustomerUserMetadata = {
    ...metadata,
    initialPasswordChangeRequired: false,
    firstLoginAt: new Date().toISOString(),
  };

  await client.users.updateUser(userId, {
    publicMetadata: nextMetadata,
    privateMetadata: nextMetadata,
  });

  revalidatePath("/dashboard/settings");
}

export async function recordFirstCustomerLogin(): Promise<void> {
  const userId = await requireUser();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = {
    ...(user.privateMetadata as CustomerUserMetadata),
    ...(user.publicMetadata as CustomerUserMetadata),
  };

  if (metadata.role !== "customer" || metadata.firstLoginAt) return;
  if (metadata.initialPasswordChangeRequired === true) return;

  const nextMetadata: CustomerUserMetadata = {
    ...metadata,
    firstLoginAt: new Date().toISOString(),
  };

  await client.users.updateUser(userId, {
    publicMetadata: nextMetadata,
    privateMetadata: nextMetadata,
  });
}
