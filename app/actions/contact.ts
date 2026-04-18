"use server";

import { supabaseAdmin } from "@/lib/api-keys";
import { revalidatePath } from "next/cache";

import { ContactSubmission, ContactSummary, ContactStatus } from "@/types/contact";

export async function getContactSummary(): Promise<ContactSummary> {
  const statuses: (keyof ContactSummary)[] = ["new", "read", "replied", "closed"];
  const summary: ContactSummary = { new: 0, read: 0, replied: 0, closed: 0 };

  for (const status of statuses) {
    const { count, error } = await supabaseAdmin
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", status)
      .eq("archived", false);

    if (error) console.error(`[getContactSummary] Error counting ${status}:`, error);
    else summary[status] = count || 0;
  }

  return summary;
}

export async function getContactSubmissions(filters: { archived?: boolean } = {}) {
  const { data, error } = await supabaseAdmin
    .from("contact_submissions")
    .select("*")
    .eq("archived", filters.archived ?? false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getContactSubmissions] Database error:", error);
    throw new Error("Failed to fetch contact submissions");
  }

  return data as ContactSubmission[];
}

export async function updateSubmissionStatus(id: string, status: ContactStatus) {
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("[updateSubmissionStatus] Database error:", error);
    throw new Error("Failed to update submission status");
  }

  revalidatePath("/dashboard/contact");
  revalidatePath("/dashboard");
}

export async function toggleArchiveSubmission(id: string, archived: boolean) {
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ archived })
    .eq("id", id);

  if (error) {
    console.error("[toggleArchiveSubmission] Database error:", error);
    throw new Error("Failed to update archive status");
  }

  revalidatePath("/dashboard/contact");
  revalidatePath("/dashboard");
}

export async function deleteSubmission(id: string) {
  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteSubmission] Database error:", error);
    throw new Error("Failed to delete submission");
  }

  revalidatePath("/dashboard/contact");
  revalidatePath("/dashboard");
}
