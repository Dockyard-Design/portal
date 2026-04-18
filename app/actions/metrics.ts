"use server";

import { auth } from "@clerk/nextjs/server";
import { getApiMetrics, type ApiMetrics, getRecentApiRequests, type RecentRequest } from "@/lib/api-keys";
import { unstable_cache } from "next/cache";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/**
 * Cached metrics query — revalidates every 60 seconds via tag.
 * The auth check runs outside the cache so request-scoped data
 * (cookies/headers) is never frozen into a cache entry.
 */
const getCachedApiMetrics = unstable_cache(
  async () => getApiMetrics(30),
  ["dashboard-api-metrics"],
  {
    tags: ["dashboard-api-metrics"],
    revalidate: 60, // 60-second TTL (#12)
  }
);

export async function getDashboardApiMetrics(): Promise<ApiMetrics> {
  await requireAuth();
  return getCachedApiMetrics();
}

export async function getLastApiRequests(limit = 50): Promise<RecentRequest[]> {
  await requireAuth();
  return getRecentApiRequests(limit);
}