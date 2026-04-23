import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Public routes that don't require authentication ──────────────
// Consider using a (public) route group folder convention for new
// public pages instead of maintaining this array (#21).
const PUBLIC_ROUTES = ["/"];
const PORTAL_SIGN_IN_PATH = "/";

const isPublicRoute = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return false;
};

const isSignInRoute = (request: NextRequest) => {
  return request.nextUrl.pathname.startsWith("/sign-in");
};

const isPublicApiRoute = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  return (
    pathname === "/api/contact" ||
    pathname === "/api/posts" ||
    pathname.startsWith("/api/posts/") ||
    pathname === "/api/projects" ||
    pathname.startsWith("/api/projects/")
  );
};

const isSignUpRoute = (request: NextRequest) => {
  return request.nextUrl.pathname.startsWith("/sign-up");
};

export default clerkMiddleware(async (auth, request) => {
  // Keep all auth entry points on the custom portal login, not Clerk-hosted pages.
  if (isSignInRoute(request)) {
    return NextResponse.redirect(new URL(PORTAL_SIGN_IN_PATH, request.url));
  }

  // Block sign-up routes entirely — this portal is invite-only
  if (isSignUpRoute(request)) {
    return NextResponse.redirect(new URL(PORTAL_SIGN_IN_PATH, request.url));
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
}, {
  signInUrl: PORTAL_SIGN_IN_PATH,
  signUpUrl: PORTAL_SIGN_IN_PATH,
});

export const config = {
  matcher: [
    "/((?!.*\\.(?:css|js|jsx|tsx|ts|png|jpg|jpeg|gif|webp|svg|ttf|woff|woff2|otf)).*)",
    "/api/(.*)",
  ],
};
