import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AppError } from "@/lib/errors";
import type { MiddlewareFn, RouteContext } from "@/lib/with-handler";

// ---------------------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------------------

/**
 * Middleware wrapper that verifies a NextAuth v5 session exists.
 *
 * On success it forwards the request downstream with two extra headers:
 *   • `x-user-id`   — the session user's id
 *   • `x-user-role` — the session user's role
 *
 * Throws `AppError.unauthorized()` (→ 401) when no session is found.
 *
 * @example
 * ```ts
 * export const GET = withHandler(withAuth(handler));
 * ```
 */
export function withAuth(fn: MiddlewareFn): MiddlewareFn {
  return async (
    req: NextRequest,
    context: RouteContext
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user) {
      throw AppError.unauthorized();
    }

    // Clone the request, injecting identity headers for downstream middleware.
    const headers = new Headers(req.headers);
    headers.set("x-user-id", session.user.id);
    headers.set("x-user-role", session.user.role);

    const enrichedReq = new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
      // Propagate duplex so that body streaming works in Node.js runtime
      // @ts-expect-error — `duplex` is valid on the underlying RequestInit
      duplex: "half",
    });

    return fn(enrichedReq, context);
  };
}
