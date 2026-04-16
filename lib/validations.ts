import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  is_public: z.boolean().default(false),
  is_indexable: z.boolean().default(true),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  canonical_url: z.string().url().optional().or(z.literal("")),
  featured_image_url: z.string().url().optional().or(z.literal("")),
  author_id: z.string().min(1),
});

export type Project = z.infer<typeof projectSchema>;
