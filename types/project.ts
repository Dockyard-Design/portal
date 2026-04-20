export type ProjectStatus = "draft" | "published" | "archived";

export type ProjectGallery = string[];

export interface Project {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ProjectStatus;
  is_public: boolean;
  is_featured: boolean;
  is_indexable: boolean;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  featured_image_url: string;
  brief_text: string;
  brief_gallery: ProjectGallery;
  prototyping_text: string;
  prototyping_gallery: ProjectGallery;
  building_text: string;
  building_gallery: ProjectGallery;
  feedback_text: string;
  feedback_gallery: ProjectGallery;
  author_id: string;
  created_at?: string;
  updated_at: string;
}

export type ProjectInput = Omit<Project, "id" | "created_at" | "updated_at" | "author_id">;

export type ProjectUpdate = Partial<ProjectInput>;
