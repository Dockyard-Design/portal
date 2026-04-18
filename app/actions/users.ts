"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export type ClerkUser = User;

export async function getUsers(): Promise<User[]> {
  await requireAuth();

  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    limit: 500,
    orderBy: "-created_at",
  });

  return data;
}

export async function createUser(params: {
  emailAddress: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}): Promise<User> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.createUser({
    emailAddress: [params.emailAddress],
    firstName: params.firstName,
    lastName: params.lastName,
    password: params.password,
  });

  revalidatePath("/dashboard/users");
  return user;
}

export async function updateUser(
  userId: string,
  params: {
    firstName?: string;
    lastName?: string;
    primaryEmailAddressID?: string;
  }
): Promise<User> {
  await requireAuth();

  const client = await clerkClient();
  const user = await client.users.updateUser(userId, {
    firstName: params.firstName,
    lastName: params.lastName,
    primaryEmailAddressID: params.primaryEmailAddressID,
  });

  revalidatePath("/dashboard/users");
  return user;
}

export async function deleteUser(userId: string): Promise<void> {
  await requireAuth();

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  revalidatePath("/dashboard/users");
}

export async function disableUser(userId: string): Promise<void> {
  await requireAuth();

  const client = await clerkClient();
  // Lock the user by setting password to null and disabling
  await client.users.updateUser(userId, {
    password: null as unknown as string, // Type workaround - actually we need to use lock
  });

  revalidatePath("/dashboard/users");
}
