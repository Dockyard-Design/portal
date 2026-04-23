"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { sendFormSubmissionEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/authz";
import type { Project, ProjectInput, ProjectUpdate } from "@/types/project";

export type { Project } from "@/types/project";

/**
 * Safe, user-facing error messages mapped from known Supabase error codes.
 * Prevents raw database error messages from leaking to the client (#18).
 */
const KNOWN_ERRORS: Record<string, string> = {
  "23505": "A project with this slug already exists. Choose a different slug.",
};

function sanitizeError(error: { code?: string; message: string }): string {
  if (error.code && KNOWN_ERRORS[error.code]) {
    return KNOWN_ERRORS[error.code];
  }
  return "Something went wrong. Please try again.";
}

export async function getProjects(): Promise<Project[]> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(sanitizeError(error));
  return data || [];
}

export async function getProject(id: string): Promise<Project | null> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createProject(
  project: ProjectInput
): Promise<Project> {
  const userId = await requireAdmin();

  if (project.is_featured) {
    await supabase
      .from("projects")
      .update({ is_featured: false })
      .eq("is_featured", true);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...project,
      author_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  await sendFormSubmissionEmail({
    formName: "Project",
    submittedAt: new Date().toISOString(),
    details: {
      action: "created",
      title: data.title,
      slug: data.slug,
      status: data.status,
      is_public: data.is_public,
      featured_image_url: data.featured_image_url,
      featured_desktop_image_url: data.featured_desktop_image_url,
      featured_phone_image_url: data.featured_phone_image_url,
    },
  }).catch((emailError) => {
    console.error("[createProject] Email notification failed:", emailError);
  });
  revalidatePath("/dashboard/projects");
  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<ProjectUpdate>
): Promise<Project> {
  await requireAdmin();

  if (updates.is_featured) {
    await supabase
      .from("projects")
      .update({ is_featured: false })
      .neq("id", id)
      .eq("is_featured", true);
  }

  // author_id is excluded from ProjectUpdate so it can't be changed (#19)
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/projects");
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await requireAdmin();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/projects");
}
