"use server";

import { requireAdmin } from "@/lib/authz";
import type { BlobUploadResult } from "@/types/blob";

const BLOB_API_BASE = "https://blob.vercel-storage.com";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function uploadImageToBlob(formData: FormData): Promise<BlobUploadResult> {
  await requireAdmin();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN environment variable");
  }

  const fileValue = formData.get("file");
  const folderValue = formData.get("folder");

  if (!(fileValue instanceof File)) {
    throw new Error("Upload requires a file");
  }

  if (!fileValue.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  if (fileValue.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 4MB or smaller");
  }

  const folder = typeof folderValue === "string" && folderValue.trim()
    ? sanitizeFilename(folderValue)
    : "uploads";
  const pathname = `${folder}/${Date.now()}-${sanitizeFilename(fileValue.name)}`;

  const response = await fetch(`${BLOB_API_BASE}/${pathname}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": fileValue.type,
      "x-add-random-suffix": "1",
      "x-cache-control-max-age": "31536000",
    },
    body: fileValue,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Vercel Blob upload failed: ${response.status} ${message}`);
  }

  const result = (await response.json()) as { url?: string; pathname?: string };

  if (!result.url) {
    throw new Error("Vercel Blob upload did not return a URL");
  }

  return {
    url: result.url,
    pathname: result.pathname ?? pathname,
    contentType: fileValue.type,
    size: fileValue.size,
  };
}
