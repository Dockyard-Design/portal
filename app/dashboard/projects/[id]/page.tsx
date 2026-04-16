"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Eye, Plus, Globe, Lock, Unlock } from "lucide-react";

import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { projectSchema, Project } from "@/lib/validations";

export default function ProjectEditor({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // In a real app, you'd fetch the project data based on params.id
  const defaultValues: Project = {
    title: "Project Alpha",
    slug: "project-alpha",
    content: "This is the main content of the project...",
    excerpt: "A short summary for listing pages.",
    is_public: false,
    is_indexable: true,
    status: "draft",
    seo_title: "Project Alpha | The Best Way to Build",
    seo_description: "Detailed description for search engines.",
    seo_keywords: "nextjs, react, supabase",
    canonical_url: "",
    featured_image_url: "",
    author_id: "user_2N...",
  };

  const form = useForm<Project>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });

  async function onSubmit(values: Project) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save project");
      toast.success("Project updated successfully");
    } catch (error) {
      toast.error("Error saving project");
    } finally {
      setIsLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm("Are you sure you want to delete this project? This action is irreversible.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Project deleted");
      window.location.href = "/dashboard/projects";
    } catch (error) {
      toast.error("Error deleting project");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 size-4" /> Back to Projects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <div className="animate-spin size-4 border-2 border-destructive border-t-transparent rounded-full mr-2" /> : <Trash2 className="size-4 mr-2" />}
            Delete Project
          </Button>
          <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? <div className="animate-spin size-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> : <Save className="size-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="content">🖊️ Content</TabsTrigger>
              <TabsTrigger value="seo">🔍 SEO</TabsTrigger>
              <TabsTrigger value="images">🖼️ Assets</TabsTrigger>
              <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Manage the core content and metadata of your project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a descriptive title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">/projects/</span>
                            <Input placeholder="project-slug" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>This is the permanent URL for this project.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Excerpt</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A brief summary for the listing page..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your markdown or rich text content here..." 
                            className="min-h-[400px] font-mono text-sm" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Optimization</CardTitle>
                  <CardDescription>Control how this project appears in Google and other search engines.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Project Title | Brand Name" {...field} />
                        </FormControl>
                        <FormDescription>The title that appears in browser tabs and search result headers.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Meta Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter a compelling description..." {...field} />
                        </FormControl>
                        <FormDescription>The snippet displayed below the title in search results.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                        </FormControl>
                        <FormDescription>Comma-separated keywords for better indexing.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media Assets</CardTitle>
                  <CardDescription>Upload and manage visual assets for this project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="featured_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://images.example.com/photo.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-muted transition-colors">
                      <Plus className="size-6" />
                      <span className="text-xs font-medium">Add Asset</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                  <CardDescription>Visibility, indexing and publication status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publication Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 pt-4">
                    <FormField
                      control={form.control}
                      name="is_public"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Public Availability</FormLabel>
                            <FormDescription>
                              {field.value ? (
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                  <Globe className="size-3" /> Visible to everyone
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-amber-600 font-medium">
                                  <Lock className="size-3" /> Private / Restricted
                                </span>
                              )}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_indexable"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Search Engine Indexing</FormLabel>
                            <FormDescription>
                              {field.value ? (
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                  <Unlock className="size-3" /> Indexable by Google
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600 font-medium">
                                  <Lock className="size-3" /> No-Index (Hidden)
                                </span>
                              )}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
