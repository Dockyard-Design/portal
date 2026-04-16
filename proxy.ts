import { clerkMiddleware } from "@clerk/nextjs/server";

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up"];

const isPublicRoute = (request: any) => {
  return PUBLIC_ROUTES.includes(request.nextUrl.pathname);
};

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!.*\\.(?:ips|css|js|jsx|tsx|ts|png|jpg|jpeg|gif|webp|svg|ttf|woff|woff2|otf)).*)",
    "/api/(.*)",
  ],
};
