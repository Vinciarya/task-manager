import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authEdgeConfig } from "@/lib/auth.edge.config";

const { auth } = NextAuth(authEdgeConfig);

const PROTECTED_ROUTES = ["/dashboard", "/projects", "/tasks"];
const AUTH_ROUTES = ["/login", "/signup"];
const API_AUTH_PREFIX = "/api/auth";

export const proxy = auth(async (req): Promise<NextResponse | void> => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);

  const isApiAuthRoute = nextUrl.pathname.startsWith(API_AUTH_PREFIX);
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  if (isApiAuthRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }

  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return;
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
