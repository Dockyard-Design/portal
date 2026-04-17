"use server";

import { auth } from "@clerk/nextjs/server";
import { getApiMetrics, type ApiMetrics } from "@/lib/api-keys";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getDashboardApiMetrics(): Promise<ApiMetrics> {
  await requireAuth();
  return getApiMetrics(30);
}