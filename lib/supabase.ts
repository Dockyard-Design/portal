import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  projects: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: "draft" | "published" | "archived";
    is_public: boolean;
    is_indexable: boolean;
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    featured_image_url: string;
    author_id: string;
    created_at: string;
    updated_at: string;
  };
};
