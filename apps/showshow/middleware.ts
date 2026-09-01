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

  const demoCookie =
    process.env.SHOWSHOW_DEMO_PERSONAS === "1" && req.cookies.has("ss_user");
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    demoCookie;

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/applications",
    "/applications/:path*",
    "/roi",
    "/roi/:path*",
    "/director",
    "/director/:path*",
    "/settings",
    "/settings/:path*",
    "/orders",
    "/orders/:path*",
    "/admin/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
