import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Protect /projects routes — redirect to login if not authenticated
  // /projects/guest is intentionally public (no auth required)
  if (pathname.startsWith("/projects") && !pathname.startsWith("/projects/guest")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*"],
};
