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
import {
  CheckCircle2,
  AlertCircle,
  Info,
  ImagePlus,
  X,
  FileText,
  Search,
  Settings2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectGallery } from "@/types/project";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = "4MB";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  excerpt: z.string().max(200, "Excerpt too long"),
  status: z.enum(["draft", "published", "archived"]),
  is_public: z.boolean(),
  is_featured: z.boolean(),
  is_indexable: z.boolean(),
  seo_title: z.string().max(70, "SEO title too long"),
  seo_description: z.string().max(160, "SEO description too long"),
  seo_keywords: z.string(),
  featured_image_url: z.string().url("Invalid URL").or(z.literal("")),
  featured_desktop_image_url: z.string().url("Invalid URL").or(z.literal("")),
  featured_phone_image_url: z.string().url("Invalid URL").or(z.literal("")),
  brief_text: z.string().max(500, "The Brief must be 500 characters or fewer"),
  brief_gallery: z.array(z.string().url()).max(4),
  prototyping_text: z
    .string()
    .max(500, "Prototyping must be 500 characters or fewer"),
  prototyping_gallery: z.array(z.string().url()).max(4),
  building_text: z
    .string()
    .max(500, "Building must be 500 characters or fewer"),
  building_gallery: z.array(z.string().url()).max(4),
  feedback_text: z
    .string()
    .max(500, "Feedback must be 500 characters or fewer"),
  feedback_gallery: z.array(z.string().url()).max(4),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: Partial<ProjectFormValues>;
  onSubmit?: (data: ProjectFormValues) => Promise<void>;
  isPending: boolean;
  onCancel?: () => void;
}

export function ProjectForm({
  initialData,
  onSubmit,
  isPending,
  onCancel,
}: ProjectFormProps) {
  // Normalize initialData to handle null values from database
  const normalizedData: ProjectFormValues | undefined = initialData
    ? {
        title: initialData.title || "",
        slug: initialData.slug || "",
        excerpt: initialData.excerpt || "",
        status: initialData.status || "draft",
        is_public: initialData.is_public ?? false,
        is_featured: initialData.is_featured ?? false,
        is_indexable: initialData.is_indexable ?? true,
        seo_title: initialData.seo_title || "",
        seo_description: initialData.seo_description || "",
        seo_keywords: initialData.seo_keywords || "",
        featured_image_url: initialData.featured_image_url || "",
        featured_desktop_image_url:
          initialData.featured_desktop_image_url || "",
        featured_phone_image_url: initialData.featured_phone_image_url || "",
        brief_text: initialData.brief_text || "",
        brief_gallery: initialData.brief_gallery || [],
        prototyping_text: initialData.prototyping_text || "",
        prototyping_gallery: initialData.prototyping_gallery || [],
        building_text: initialData.building_text || "",
        building_gallery: initialData.building_gallery || [],
        feedback_text: initialData.feedback_text || "",
        feedback_gallery: initialData.feedback_gallery || [],
      }
    : undefined;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: normalizedData || {
      title: "",
      slug: "",
      excerpt: "",
      status: "draft",
      is_public: false,
      is_featured: false,
      is_indexable: true,
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
      featured_image_url: "",
      featured_desktop_image_url: "",
      featured_phone_image_url: "",
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

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = form;

  const seoTitle = useWatch({ control, name: "seo_title" });
  const seoDesc = useWatch({ control, name: "seo_description" });
  const projectTitle = useWatch({ control, name: "title" });
  const projectSlug = useWatch({ control, name: "slug" });
  const projectExcerpt = useWatch({ control, name: "excerpt" });
  const isPublic = useWatch({ control, name: "is_public" });
  const isFeatured = useWatch({ control, name: "is_featured" });
  const isIndexable = useWatch({ control, name: "is_indexable" });
  const featuredImageUrl = useWatch({ control, name: "featured_image_url" });
  const featuredDesktopImageUrl = useWatch({
    control,
    name: "featured_desktop_image_url",
  });
  const featuredPhoneImageUrl = useWatch({
    control,
    name: "featured_phone_image_url",
  });
  const briefText = useWatch({ control, name: "brief_text" });
  const briefGallery = useWatch({ control, name: "brief_gallery" });
  const prototypingText = useWatch({ control, name: "prototyping_text" });
  const prototypingGallery = useWatch({ control, name: "prototyping_gallery" });
  const buildingText = useWatch({ control, name: "building_text" });
  const buildingGallery = useWatch({ control, name: "building_gallery" });
  const feedbackText = useWatch({ control, name: "feedback_text" });
  const feedbackGallery = useWatch({ control, name: "feedback_gallery" });
  const [uploadingField, setUploadingField] = React.useState<string | null>(
    null,
  );

  const getSeoStatus = (val: string, min: number, max: number) => {
    if (!val)
      return {
        color: "text-muted-foreground",
        icon: <Info className="size-3.5" />,
        text: "Empty",
      };
    if (val.length < min)
      return {
        color: "text-amber-400",
        icon: <AlertCircle className="size-3.5" />,
        text: "Too short",
      };
    if (val.length > max)
      return {
        color: "text-destructive",
        icon: <AlertCircle className="size-3.5" />,
        text: "Too long",
      };
    return {
      color: "text-emerald-400",
      icon: <CheckCircle2 className="size-3.5" />,
      text: "Good",
    };
  };

  const titleStatus = getSeoStatus(seoTitle, 30, 60);
  const descStatus = getSeoStatus(seoDesc, 120, 160);

  const uploadImage = async (
    file: File,
    fieldName:
      | "featured_image_url"
      | "featured_desktop_image_url"
      | "featured_phone_image_url"
      | "brief_gallery"
      | "prototyping_gallery"
      | "building_gallery"
      | "feedback_gallery",
  ) => {
    if (file.size > MAX_IMAGE_BYTES) {
      form.setError(fieldName, {
        message: `Image must be ${MAX_IMAGE_SIZE_LABEL} or smaller`,
      });
      return;
    }

    setUploadingField(fieldName);
    try {
      clearErrors(fieldName);
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "projects");

      if (fieldName === "featured_desktop_image_url") {
        data.append("frameDevice", "laptop");
      }

      if (fieldName === "featured_phone_image_url") {
        data.append("frameDevice", "phone");
      }

      if (fieldName === "featured_image_url") {
        data.append("convertToWebp", "true");
      }

      const result = await uploadImageToBlob(data);

      if (
        fieldName === "featured_image_url" ||
        fieldName === "featured_desktop_image_url" ||
        fieldName === "featured_phone_image_url"
      ) {
        setValue(fieldName, result.url, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        const current = form.getValues(fieldName) as ProjectGallery;
        if (current.length >= 4) return;
        setValue(fieldName, [...current, result.url], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image upload failed";
      form.setError(fieldName, { message });
    } finally {
      setUploadingField(null);
    }
  };

  const removeGalleryImage = (
    fieldName:
      | "brief_gallery"
      | "prototyping_gallery"
      | "building_gallery"
      | "feedback_gallery",
    imageUrl: string,
  ) => {
    const current = form.getValues(fieldName) as ProjectGallery;
    setValue(
      fieldName,
      current.filter((url) => url !== imageUrl),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  };

  const renderGallery = (
    label: string,
    textName:
      | "brief_text"
      | "prototyping_text"
      | "building_text"
      | "feedback_text",
    galleryName:
      | "brief_gallery"
      | "prototyping_gallery"
      | "building_gallery"
      | "feedback_gallery",
    textValue: string,
    gallery: ProjectGallery,
  ) => (
    <div className="space-y-3 rounded-xl border border-border/40 bg-secondary/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="text-xs text-muted-foreground">
          {textValue.length}/500
        </span>
      </div>
      <Textarea
        {...register(textName)}
        maxLength={500}
        placeholder={`${label} notes...`}
        className="bg-background border-border/40 min-h-24 resize-none text-sm"
      />
      <div className="grid grid-cols-4 gap-2">
        {gallery.map((url) => (
          <div
            key={url}
            className="relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-background"
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="120px"
              unoptimized
              className="object-cover"
            />
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
      {errors[galleryName] && (
        <p className="text-xs font-medium text-destructive">
          {errors[galleryName]?.message}
        </p>
      )}
    </div>
  );

  const renderImageField = (
    label: string,
    description: string,
    fieldName:
      | "featured_image_url"
      | "featured_desktop_image_url"
      | "featured_phone_image_url",
    imageUrl: string,
    previewClassName: string,
  ) => (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-semibold">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={uploadingField === fieldName}
        >
          <label className="cursor-pointer">
            <ImagePlus data-icon="inline-start" />
            {uploadingField === fieldName ? "Uploading" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadingField === fieldName}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file, fieldName);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </Button>
      </div>
      <div
        className={cn(
          "relative overflow-hidden rounded-md border bg-muted",
          previewClassName,
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 960px"
            unoptimized
            className="object-contain"
          />
        ) : (
          <div className="flex h-full min-h-36 items-center justify-center text-muted-foreground">
            <ImagePlus className="size-5" />
          </div>
        )}
      </div>
      <Input
        {...register(fieldName)}
        placeholder="https://..."
        className="bg-secondary/50 border-border/40 text-sm"
      />
      {errors[fieldName] && (
        <p className="text-xs text-destructive font-medium">
          {errors[fieldName]?.message}
        </p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
      className="flex flex-col gap-6 py-2"
    >
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
          <TabsList className="h-auto w-full flex-wrap justify-start md:w-fit">
            <TabsTrigger value="overview">
              <Settings2 data-icon="inline-start" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="story">
              <FileText data-icon="inline-start" />
              Story
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search data-icon="inline-start" />
              SEO
            </TabsTrigger>
          </TabsList>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 md:p-6">
          <TabsContent value="overview" className="m-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-col gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-semibold">Title</Label>
                    <Input
                      {...register("title")}
                      placeholder="The Future of Web"
                      className={cn(
                        "bg-secondary/50 border-border/40 focus:border-primary/50 text-sm",
                        errors.title && "border-destructive",
                      )}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive font-medium">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-semibold">URL Slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-sm">
                        /
                      </span>
                      <Input
                        {...register("slug")}
                        placeholder="future-of-web"
                        className={cn(
                          "bg-secondary/50 border-border/40 focus:border-primary/50 text-sm",
                          errors.slug && "border-destructive",
                        )}
                      />
                    </div>
                    {errors.slug && (
                      <p className="text-xs text-destructive font-medium">
                        {errors.slug.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold">Excerpt</Label>
                  <Textarea
                    {...register("excerpt")}
                    placeholder="A brief summary for listing pages..."
                    className="bg-secondary/50 border-border/40 focus:border-primary/50 resize-none min-h-28 text-sm"
                  />
                  {errors.excerpt && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.excerpt.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm">Status</Label>
                  <Select
                    defaultValue={initialData?.status || "draft"}
                    onValueChange={(v) =>
                      setValue(
                        "status",
                        v as "draft" | "published" | "archived",
                        { shouldDirty: true },
                      )
                    }
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

                <SwitchRow
                  label="Public"
                  description="Visible to everyone"
                  checked={isPublic}
                  onCheckedChange={(v) =>
                    setValue("is_public", v, { shouldDirty: true })
                  }
                />
                <SwitchRow
                  label="Featured"
                  description="Make this the single featured project"
                  checked={isFeatured}
                  onCheckedChange={(v) =>
                    setValue("is_featured", v, { shouldDirty: true })
                  }
                />
                <SwitchRow
                  label="Indexable"
                  description="Allow search engines"
                  checked={isIndexable}
                  onCheckedChange={(v) =>
                    setValue("is_indexable", v, { shouldDirty: true })
                  }
                />
              </div>
            </div>

            {isFeatured && (
              <div className="mt-6 flex flex-col gap-4 rounded-lg border border-border/40 bg-secondary/20 p-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold">Featured media</h3>
                  <p className="text-xs text-muted-foreground">
                    These framed WebP images are generated when you upload
                    desktop and phone artwork.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_480px]">
                  {renderImageField(
                    "Featured desktop image",
                    "Wide artwork for the featured project on desktop layouts.",
                    "featured_desktop_image_url",
                    featuredDesktopImageUrl,
                    "aspect-video",
                  )}
                  {renderImageField(
                    "Featured phone image",
                    "Portrait artwork for the featured project on phone screens.",
                    "featured_phone_image_url",
                    featuredPhoneImageUrl,
                    "mx-auto aspect-[9/16] w-full max-w-72",
                  )}
                </div>
                {renderImageField(
                  "Listing image",
                  "General project thumbnail retained for existing API consumers.",
                  "featured_image_url",
                  featuredImageUrl,
                  "aspect-video",
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="story" className="m-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {renderGallery(
                "The Brief",
                "brief_text",
                "brief_gallery",
                briefText,
                briefGallery,
              )}
              {renderGallery(
                "Prototyping",
                "prototyping_text",
                "prototyping_gallery",
                prototypingText,
                prototypingGallery,
              )}
              {renderGallery(
                "Building",
                "building_text",
                "building_gallery",
                buildingText,
                buildingGallery,
              )}
              {renderGallery(
                "Feedback",
                "feedback_text",
                "feedback_gallery",
                feedbackText,
                feedbackGallery,
              )}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="m-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm">Meta Title</Label>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold",
                        titleStatus.color,
                      )}
                    >
                      {titleStatus.icon} {titleStatus.text}{" "}
                      <span className="text-muted-foreground">
                        ({seoTitle.length}/60)
                      </span>
                    </div>
                  </div>
                  <Input
                    {...register("seo_title")}
                    placeholder="SEO optimized title..."
                    className="bg-background border-border/40 text-sm"
                  />
                  {errors.seo_title && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.seo_title.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm">Meta Description</Label>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold",
                        descStatus.color,
                      )}
                    >
                      {descStatus.icon} {descStatus.text}{" "}
                      <span className="text-muted-foreground">
                        ({seoDesc.length}/160)
                      </span>
                    </div>
                  </div>
                  <Textarea
                    {...register("seo_description")}
                    placeholder="A compelling description for search results..."
                    className="bg-background border-border/40 resize-none min-h-28 text-sm"
                  />
                  {errors.seo_description && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.seo_description.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm">Keywords</Label>
                  <Input
                    {...register("seo_keywords")}
                    placeholder="nextjs, tailwind, zod"
                    className="bg-background border-border/40 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold">Search preview</p>
                <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-4">
                  <p className="truncate text-sm text-muted-foreground">
                    /{projectSlug || "project-slug"}
                  </p>
                  <p className="line-clamp-2 font-medium">
                    {seoTitle || projectTitle || "Project title"}
                  </p>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {seoDesc ||
                      projectExcerpt ||
                      "Project description will appear here."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </form>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-background/50 p-4">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
