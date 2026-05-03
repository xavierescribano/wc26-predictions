import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Admins don't play — redirect them away from picks and profile
    if (req.nextUrl.pathname.startsWith("/picks") && token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (req.nextUrl.pathname.startsWith("/profile") && token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/picks/:path*", "/admin/:path*", "/profile/:path*"],
};
