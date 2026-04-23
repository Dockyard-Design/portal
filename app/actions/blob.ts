"use server";

import { put } from "@vercel/blob";
import { headers } from "next/headers";
import sharp from "sharp";

import { requireAdmin } from "@/lib/authz";
import type { BlobUploadResult } from "@/types/blob";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_CACHE_MAX_AGE_SECONDS = 31536000;
const FRAME_RENDER_SCALE = 3;
const FRAME_WEBP_QUALITY = 94;
const FRAME_CONFIG = {
  laptop: {
    framePathname: "/laptop.svg",
    filenameSuffix: "laptop-framed",
    screen: {
      x: 82.5,
      y: 55.5,
      width: 683,
      height: 449,
      radius: 4,
    },
  },
  phone: {
    framePathname: "/phone.svg",
    filenameSuffix: "phone-framed",
    screen: {
      x: 108.5,
      y: 223.5,
      width: 223,
      height: 485,
      radius: 18,
    },
  },
} as const;

type FrameDevice = keyof typeof FRAME_CONFIG;

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getFrameDevice(value: FormDataEntryValue | null): FrameDevice | null {
  return value === "laptop" || value === "phone" ? value : null;
}

function getBaseFilename(filename: string): string {
  const cleanName = filename.split(/[\\/]/).pop() || "featured-image";
  const dotIndex = cleanName.lastIndexOf(".");
  return dotIndex > 0 ? cleanName.slice(0, dotIndex) : cleanName;
}

async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

  if (!host) {
    throw new Error("Could not resolve request host for frame assets");
  }

  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

async function fetchFrameSvg(pathname: string) {
  const origin = await getRequestOrigin();
  const response = await fetch(new URL(pathname, origin), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not load frame asset ${pathname}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    svg: buffer.toString("utf8"),
    buffer,
    url: response.url,
  };
}

function extractSvgBox(svg: string, filePath: string) {
  const svgTag = svg.match(/<svg\b[^>]*>/i)?.[0];

  if (!svgTag) {
    throw new Error(`Could not find <svg> tag in ${filePath}`);
  }

  const viewBoxMatch = svgTag.match(/\bviewBox=["']([^"']+)["']/i);

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);

    if (parts.length === 4 && parts.every(Number.isFinite)) {
      return {
        minX: parts[0],
        minY: parts[1],
        width: parts[2],
        height: parts[3],
      };
    }
  }

  const width = Number(svgTag.match(/\bwidth=["']([\d.]+)/i)?.[1]);
  const height = Number(svgTag.match(/\bheight=["']([\d.]+)/i)?.[1]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Could not read width/height or viewBox from ${filePath}`);
  }

  return {
    minX: 0,
    minY: 0,
    width,
    height,
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function frameImage(file: File, device: FrameDevice) {
  const config = FRAME_CONFIG[device];
  const frame = await fetchFrameSvg(config.framePathname);
  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const frameBox = extractSvgBox(frame.svg, frame.url);
  const frameHref = `data:image/svg+xml;base64,${frame.buffer.toString("base64")}`;
  const imageHref = `data:${file.type};base64,${imageBuffer.toString("base64")}`;
  const clipId = `${device}-screen-clip`;
  const screen = config.screen;
  const composedSvg = `<svg width="${frameBox.width}" height="${frameBox.height}" viewBox="${frameBox.minX} ${frameBox.minY} ${frameBox.width} ${frameBox.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="${clipId}">
      <rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" />
    </clipPath>
  </defs>
  <rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" fill="#050914" />
  <image href="${escapeXml(imageHref)}" x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />
  <image href="${escapeXml(frameHref)}" x="${frameBox.minX}" y="${frameBox.minY}" width="${frameBox.width}" height="${frameBox.height}" preserveAspectRatio="none" />
</svg>`;
  const outputBuffer = await sharp(Buffer.from(composedSvg), { density: 72 * FRAME_RENDER_SCALE })
    .resize({
      width: Math.round(frameBox.width * FRAME_RENDER_SCALE),
      height: Math.round(frameBox.height * FRAME_RENDER_SCALE),
      fit: "fill",
    })
    .webp({
      quality: FRAME_WEBP_QUALITY,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();
  const baseName = sanitizeFilename(getBaseFilename(file.name)) || "featured-image";

  return {
    body: outputBuffer,
    filename: `${baseName}-${config.filenameSuffix}.webp`,
    contentType: "image/webp",
    size: outputBuffer.byteLength,
  };
}

async function convertImageToWebp(file: File) {
  const imageBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(imageBuffer)
    .rotate()
    .webp({
      quality: FRAME_WEBP_QUALITY,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();
  const baseName = sanitizeFilename(getBaseFilename(file.name)) || "featured-image";

  return {
    body: outputBuffer,
    filename: `${baseName}-thumbnail.webp`,
    contentType: "image/webp",
    size: outputBuffer.byteLength,
  };
}

export async function uploadImageToBlob(formData: FormData): Promise<BlobUploadResult> {
  await requireAdmin();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN environment variable");
  }

  const fileValue = formData.get("file");
  const folderValue = formData.get("folder");
  const frameDevice = getFrameDevice(formData.get("frameDevice"));
  const convertToWebp = formData.get("convertToWebp") === "true";

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
  const upload = frameDevice
    ? await frameImage(fileValue, frameDevice)
    : convertToWebp
      ? await convertImageToWebp(fileValue)
      : {
          body: fileValue,
          filename: sanitizeFilename(fileValue.name),
          contentType: fileValue.type,
          size: fileValue.size,
        };

  if (upload.size > MAX_IMAGE_BYTES) {
    throw new Error("Processed image must be 4MB or smaller");
  }

  const pathname = `${folder}/${Date.now()}-${upload.filename}`;

  const blob = await put(pathname, upload.body, {
    access: "public",
    addRandomSuffix: true,
    cacheControlMaxAge: IMAGE_CACHE_MAX_AGE_SECONDS,
    contentType: upload.contentType,
    token,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: upload.size,
  };
}
