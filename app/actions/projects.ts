"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export interface Project {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "published" | "archived";
  is_public: boolean;
  is_indexable: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  featured_image_url: string;
  author_id: string;
  updated_at: string;
}

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function getProjects(): Promise<Project[]> {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createProject(
  project: Omit<Project, "id" | "updated_at" | "author_id">
): Promise<Project> {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...project,
      author_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects");
  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  const userId = await requireAuth();

  // Verify ownership before updating
  const { data: existing } = await supabase
    .from("projects")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    throw new Error("Not found or unauthorized");
  }

  // Never allow author_id to be changed
  const { author_id, ...safeUpdates } = updates as any;

  const { data, error } = await supabase
    .from("projects")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects");
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await requireAuth();

  // Verify ownership before deleting
  const { data: existing } = await supabase
    .from("projects")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    throw new Error("Not found or unauthorized");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects");
}