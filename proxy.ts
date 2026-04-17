import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/sign-in"];

const isPublicRoute = (request: NextRequest) => {
  return PUBLIC_ROUTES.includes(request.nextUrl.pathname);
};

const isApiRoute = (request: NextRequest) => {
  return request.nextUrl.pathname.startsWith("/api/");
};

export default clerkMiddleware(async (auth, request) => {
  // API routes use their own key-based auth — skip Clerk entirely
  if (isApiRoute(request)) {
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