"use client";

import React from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { uploadImageToBlob } from "@/app/actions/blob";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, AlertCircle, Info, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectGallery } from "@/types/project";

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
  featured_image_url: z.string().url("Invalid URL").or(z.literal("")),
  brief_text: z.string().max(500, "The Brief must be 500 characters or fewer"),
  brief_gallery: z.array(z.string().url()).max(4),
  prototyping_text: z.string().max(500, "Prototyping must be 500 characters or fewer"),
  prototyping_gallery: z.array(z.string().url()).max(4),
  building_text: z.string().max(500, "Building must be 500 characters or fewer"),
  building_gallery: z.array(z.string().url()).max(4),
  feedback_text: z.string().max(500, "Feedback must be 500 characters or fewer"),
  feedback_gallery: z.array(z.string().url()).max(4),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: Partial<ProjectFormValues>;
  onSubmit?: (data: ProjectFormValues) => Promise<void>;
  isPending: boolean;
  onCancel?: () => void;
}

export function ProjectForm({ initialData, onSubmit, isPending, onCancel }: ProjectFormProps) {
  // Normalize initialData to handle null values from database
  const normalizedData: ProjectFormValues | undefined = initialData ? {
    title: initialData.title || "",
    slug: initialData.slug || "",
    excerpt: initialData.excerpt || "",
    content: initialData.content || "",
    status: initialData.status || "draft",
    is_public: initialData.is_public ?? false,
    is_indexable: initialData.is_indexable ?? true,
    seo_title: initialData.seo_title || "",
    seo_description: initialData.seo_description || "",
    seo_keywords: initialData.seo_keywords || "",
    featured_image_url: initialData.featured_image_url || "",
    brief_text: initialData.brief_text || "",
    brief_gallery: initialData.brief_gallery || [],
    prototyping_text: initialData.prototyping_text || "",
    prototyping_gallery: initialData.prototyping_gallery || [],
    building_text: initialData.building_text || "",
    building_gallery: initialData.building_gallery || [],
    feedback_text: initialData.feedback_text || "",
    feedback_gallery: initialData.feedback_gallery || [],
  } : undefined;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: normalizedData || {
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
      brief_text: "",
      brief_gallery: [],
      prototyping_text: "",
      prototyping_gallery: [],
      building_text: "",
      building_gallery: [],
      feedback_text: "",
      feedback_gallery: [],
    },
  });

  const { register, handleSubmit, setValue, control, formState: { errors } } = form;

  const seoTitle = useWatch({ control, name: "seo_title" });
  const seoDesc = useWatch({ control, name: "seo_description" });
  const isPublic = useWatch({ control, name: "is_public" });
  const isIndexable = useWatch({ control, name: "is_indexable" });
  const featuredImageUrl = useWatch({ control, name: "featured_image_url" });
  const briefText = useWatch({ control, name: "brief_text" });
  const briefGallery = useWatch({ control, name: "brief_gallery" });
  const prototypingText = useWatch({ control, name: "prototyping_text" });
  const prototypingGallery = useWatch({ control, name: "prototyping_gallery" });
  const buildingText = useWatch({ control, name: "building_text" });
  const buildingGallery = useWatch({ control, name: "building_gallery" });
  const feedbackText = useWatch({ control, name: "feedback_text" });
  const feedbackGallery = useWatch({ control, name: "feedback_gallery" });
  const [uploadingField, setUploadingField] = React.useState<string | null>(null);

  const getSeoStatus = (val: string, min: number, max: number) => {
    if (!val) return { color: "text-muted-foreground", icon: <Info className="size-3.5" />, text: "Empty" };
    if (val.length < min) return { color: "text-amber-400", icon: <AlertCircle className="size-3.5" />, text: "Too short" };
    if (val.length > max) return { color: "text-destructive", icon: <AlertCircle className="size-3.5" />, text: "Too long" };
    return { color: "text-emerald-400", icon: <CheckCircle2 className="size-3.5" />, text: "Good" };
  };

  const titleStatus = getSeoStatus(seoTitle, 30, 60);
  const descStatus = getSeoStatus(seoDesc, 120, 160);

  const uploadImage = async (
    file: File,
    fieldName:
      | "featured_image_url"
      | "brief_gallery"
      | "prototyping_gallery"
      | "building_gallery"
      | "feedback_gallery"
  ) => {
    setUploadingField(fieldName);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "projects");
      const result = await uploadImageToBlob(data);

      if (fieldName === "featured_image_url") {
        setValue("featured_image_url", result.url, { shouldValidate: true, shouldDirty: true });
      } else {
        const current = form.getValues(fieldName) as ProjectGallery;
        if (current.length >= 4) return;
        setValue(fieldName, [...current, result.url], { shouldValidate: true, shouldDirty: true });
      }
    } finally {
      setUploadingField(null);
    }
  };

  const removeGalleryImage = (
    fieldName: "brief_gallery" | "prototyping_gallery" | "building_gallery" | "feedback_gallery",
    imageUrl: string
  ) => {
    const current = form.getValues(fieldName) as ProjectGallery;
    setValue(fieldName, current.filter((url) => url !== imageUrl), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const renderGallery = (
    label: string,
    textName: "brief_text" | "prototyping_text" | "building_text" | "feedback_text",
    galleryName: "brief_gallery" | "prototyping_gallery" | "building_gallery" | "feedback_gallery",
    textValue: string,
    gallery: ProjectGallery
  ) => (
    <div className="space-y-3 rounded-xl border border-border/40 bg-secondary/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">{textValue.length}/500</span>
      </div>
      <Textarea
        {...register(textName)}
        maxLength={500}
        placeholder={`${label} notes...`}
        className="bg-background border-border/40 min-h-24 resize-none text-sm"
      />
      <div className="grid grid-cols-4 gap-2">
        {gallery.map((url) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-background">
            <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeGalleryImage(galleryName, url)}
              className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {gallery.length < 4 && (
          <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground transition-colors hover:text-foreground">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadingField === galleryName}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file, galleryName);
                event.currentTarget.value = "";
              }}
            />
            <ImagePlus className="size-5" />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <form 
      onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} 
      className="space-y-8 py-4"
    >
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
                onValueChange={(v) => setValue("status", v as "draft" | "published" | "archived")}
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
                checked={isPublic}
                onCheckedChange={(v) => setValue("is_public", v)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/40">
              <div>
                <Label className="text-sm font-medium">Indexable</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allow search engines</p>
              </div>
              <Switch
                checked={isIndexable}
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
            {featuredImageUrl && (
              <div className="aspect-video overflow-hidden rounded-xl border border-border/40 bg-secondary/30">
                <Image src={featuredImageUrl} alt="" width={960} height={540} className="h-full w-full object-cover" />
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ImagePlus className="size-4" />
              {uploadingField === "featured_image_url" ? "Uploading..." : "Upload featured image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingField === "featured_image_url"}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file, "featured_image_url");
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <Input
              {...register("featured_image_url")}
              placeholder="https://..."
              className="bg-secondary/50 border-border/40 text-sm"
            />
            {errors.featured_image_url && <p className="text-xs text-destructive font-medium">{errors.featured_image_url.message}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderGallery("The Brief", "brief_text", "brief_gallery", briefText, briefGallery)}
        {renderGallery("Prototyping", "prototyping_text", "prototyping_gallery", prototypingText, prototypingGallery)}
        {renderGallery("Building", "building_text", "building_gallery", buildingText, buildingGallery)}
        {renderGallery("Feedback", "feedback_text", "feedback_gallery", feedbackText, feedbackGallery)}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
        <Button
          variant="outline"
          type="button"
          className="rounded-xl bg-secondary/30 border-border/40"
          onClick={onCancel}
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
