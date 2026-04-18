"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
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
}

function serializeUser(user: User): SimpleUser {
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
  };
}

export async function getUsers(): Promise<SimpleUser[]> {
  await requireAuth();

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
}): Promise<SimpleUser> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.createUser({
    emailAddress: [params.emailAddress],
    firstName: params.firstName,
    lastName: params.lastName,
    password: params.password,
  });

  revalidatePath("/dashboard/users");
  return serializeUser(user);
}

export async function updateUser(
  userId: string,
  params: {
    firstName?: string;
    lastName?: string;
    primaryEmailAddressID?: string;
  }
): Promise<SimpleUser> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.updateUser(userId, {
    firstName: params.firstName,
    lastName: params.lastName,
    primaryEmailAddressID: params.primaryEmailAddressID,
  });

  revalidatePath("/dashboard/users");
  return serializeUser(user);
}

export async function deleteUser(userId: string): Promise<void> {
  await requireAuth();

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  revalidatePath("/dashboard/users");
}

export async function lockUser(userId: string): Promise<SimpleUser> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.lockUser(userId);

  revalidatePath("/dashboard/users");
  return serializeUser(user);
}

export async function unlockUser(userId: string): Promise<SimpleUser> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.unlockUser(userId);

  revalidatePath("/dashboard/users");
  return serializeUser(user);
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<SimpleUser> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.updateUser(userId, {
    password: newPassword,
    signOutOfOtherSessions: true, // Sign out user from all devices
  });

  revalidatePath("/dashboard/users");
  return serializeUser(user);
}
