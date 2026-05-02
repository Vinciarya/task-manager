import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_ROUTES = ["/dashboard", "/projects", "/tasks"];
const AUTH_ROUTES = ["/login", "/signup"];
const API_AUTH_PREFIX = "/api/auth";

export default auth(async (req): Promise<NextResponse | void> => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(API_AUTH_PREFIX);
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // 1. Allow API Auth routes to proceed (NextAuth handles these)
  if (isApiAuthRoute) {
    return;
  }

  // 2. Redirect authenticated users away from login/signup
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }

  // 3. Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return;
  }

  return;
});

// Matcher configuration limits which paths invoke the middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
