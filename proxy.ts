import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Public routes that don't require authentication ──────────────
// Consider using a (public) route group folder convention for new
// public pages instead of maintaining this array (#21).
const PUBLIC_ROUTES = ["/"];

const isPublicRoute = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  // Match /sign-in and any sub-paths like /sign-in/something
  if (pathname.startsWith("/sign-in")) return true;
  return false;
};

const isPublicApiRoute = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  return pathname === "/api/contact" || pathname === "/api/posts" || pathname.startsWith("/api/posts/");
};

const isSignUpRoute = (request: NextRequest) => {
  return request.nextUrl.pathname.startsWith("/sign-up");
};

export default clerkMiddleware(async (auth, request) => {
  // Block sign-up routes entirely — this portal is invite-only
  if (isSignUpRoute(request)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Public API-key endpoints handle their own auth. Other API routes stay behind Clerk.
  if (isPublicApiRoute(request)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (isPublicRoute(request)) {
    if (userId) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!.*\\.(?:css|js|jsx|tsx|ts|png|jpg|jpeg|gif|webp|svg|ttf|woff|woff2|otf)).*)",
    "/api/(.*)",
  ],
};
