"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, generateApiKey, type ApiKeyRow } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";

export async function getApiKeys(): Promise<ApiKeyRow[]> {
  const userId = await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, name, key_prefix, is_active, created_at, last_used_at, expires_at, request_count")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createApiKey(name: string): Promise<{ id: string; key: string; prefix: string }> {
  const userId = await requireAdmin();

  const { raw, prefix, hash } = generateApiKey();

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .insert({
      name,
      key_hash: hash,
      key_prefix: prefix,
      user_id: userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/api-keys");
  return { id: data.id, key: raw, prefix };
}

export async function revokeApiKey(id: string): Promise<void> {
  const userId = await requireAdmin();

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("api_keys")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== userId) {
    throw new Error("Not found or unauthorized");
  }

  const { error } = await supabaseAdmin
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/api-keys");
}

export async function deleteApiKey(id: string): Promise<void> {
  const userId = await requireAdmin();

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from("api_keys")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== userId) {
    throw new Error("Not found or unauthorized");
  }

  const { error } = await supabaseAdmin
    .from("api_keys")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/api-keys");
}
