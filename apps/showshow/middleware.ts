import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/applications",
  "/roi",
  "/director",
  "/settings",
  "/orders",
  "/admin",
  "/onboarding",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("ss_user");

  if (!hasSession && process.env.DATABASE_URL?.trim()) {
    const url = req.nextUrl.clone();
    url.pathname = "/settings";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/applications/:path*",
    "/roi/:path*",
    "/director/:path*",
    "/settings/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
