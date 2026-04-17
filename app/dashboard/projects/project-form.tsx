"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  excerpt: z.string().max(200, "Excerpt too long"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published", "archived"]),
  is_public: z.boolean(),
  is_indexable: z.boolean(),
  seo_title: z.string().max(70, "SEO title too long"),
  seo_description: z.string().max(160, "SEO description too long"),
  seo_keywords: z.string(),
  featured_image_url: z.string().url("Invalid URL").or(z.string().length(0)),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: ProjectFormValues;
  onSubmit: (data: ProjectFormValues) => Promise<void>;
  isPending: boolean;
}

export function ProjectForm({ initialData, onSubmit, isPending }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      is_public: false,
      is_indexable: true,
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
      featured_image_url: "",
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const seoTitle = watch("seo_title");
  const seoDesc = watch("seo_description");

  const getSeoStatus = (val: string, min: number, max: number) => {
    if (!val) return { color: "text-muted-foreground", icon: <Info className="size-3.5" />, text: "Empty" };
    if (val.length < min) return { color: "text-amber-400", icon: <AlertCircle className="size-3.5" />, text: "Too short" };
    if (val.length > max) return { color: "text-destructive", icon: <AlertCircle className="size-3.5" />, text: "Too long" };
    return { color: "text-emerald-400", icon: <CheckCircle2 className="size-3.5" />, text: "Good" };
  };

  const titleStatus = getSeoStatus(seoTitle, 30, 60);
  const descStatus = getSeoStatus(seoDesc, 120, 160);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column — Content */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Title</Label>
            <Input
              {...register("title")}
              placeholder="The Future of Web"
              className={cn("bg-secondary/50 border-border/40 focus:border-primary/50 text-sm", errors.title && "border-destructive")}
            />
            {errors.title && <p className="text-xs text-destructive font-medium">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-mono text-sm">/</span>
              <Input
                {...register("slug")}
                placeholder="future-of-web"
                className={cn("bg-secondary/50 border-border/40 focus:border-primary/50 text-sm", errors.slug && "border-destructive")}
              />
            </div>
            {errors.slug && <p className="text-xs text-destructive font-medium">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Excerpt</Label>
            <Textarea
              {...register("excerpt")}
              placeholder="A brief summary for listing pages..."
              className="bg-secondary/50 border-border/40 focus:border-primary/50 resize-none h-20 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Content <span className="text-muted-foreground font-normal">(Markdown)</span></Label>
            <Textarea
              {...register("content")}
              placeholder="# Start writing here..."
              className="bg-secondary/50 border-border/40 focus:border-primary/50 font-mono text-sm min-h-[180px]"
            />
            {errors.content && <p className="text-xs text-destructive font-medium">{errors.content.message}</p>}
          </div>
        </div>

        {/* Right Column — Config & SEO */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border/40 space-y-5">
            <h3 className="text-sm font-semibold text-muted-foreground">Publishing</h3>

            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select
                defaultValue={initialData?.status || "draft"}
                onValueChange={(v) => setValue("status", v as any)}
                name="status"
              >
                <SelectTrigger className="bg-background border-border/40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/40">
              <div>
                <Label className="text-sm font-medium">Public</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Visible to everyone</p>
              </div>
              <Switch
                checked={watch("is_public")}
                onCheckedChange={(v) => setValue("is_public", v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/40">
              <div>
                <Label className="text-sm font-medium">Indexable</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allow search engines</p>
              </div>
              <Switch
                checked={watch("is_indexable")}
                onCheckedChange={(v) => setValue("is_indexable", v)}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-secondary/30 border border-border/40 space-y-5">
            <h3 className="text-sm font-semibold text-muted-foreground">SEO</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Meta Title</Label>
                <div className={cn("flex items-center gap-1.5 text-xs font-semibold", titleStatus.color)}>
                  {titleStatus.icon} {titleStatus.text} <span className="text-muted-foreground">({seoTitle.length}/60)</span>
                </div>
              </div>
              <Input
                {...register("seo_title")}
                placeholder="SEO optimized title..."
                className="bg-background border-border/40 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Meta Description</Label>
                <div className={cn("flex items-center gap-1.5 text-xs font-semibold", descStatus.color)}>
                  {descStatus.icon} {descStatus.text} <span className="text-muted-foreground">({seoDesc.length}/160)</span>
                </div>
              </div>
              <Textarea
                {...register("seo_description")}
                placeholder="A compelling description for search results..."
                className="bg-background border-border/40 resize-none h-20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Keywords</Label>
              <Input
                {...register("seo_keywords")}
                placeholder="nextjs, tailwind, zod"
                className="bg-background border-border/40 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Featured Image</Label>
            <Input
              {...register("featured_image_url")}
              placeholder="https://images.unsplash.com/..."
              className="bg-secondary/50 border-border/40 text-sm"
            />
            {errors.featured_image_url && <p className="text-xs text-destructive font-medium">{errors.featured_image_url.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
        <Button
          variant="outline"
          type="button"
          className="rounded-xl bg-secondary/30 border-border/40"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-primary text-primary-foreground px-6 font-semibold"
        >
          {isPending ? "Saving..." : "Save Project"}
        </Button>
      </div>
    </form>
  );
}