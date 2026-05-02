import type { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Shared middleware types
// ---------------------------------------------------------------------------

/**
 * Route-context shape forwarded by the Next.js App Router.
 * `params` is a `Promise` in Next.js 16 — individual routes should `await` it.
 */
export type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Canonical signature for every App Router route handler in this project.
 */
export type MiddlewareFn = (
  req: NextRequest,
  context: RouteContext
) => Promise<NextResponse>;

/**
 * A wrapper that receives a `MiddlewareFn` and returns a new `MiddlewareFn`.
 * All HOFs in this file conform to this type.
 */
export type MiddlewareWrapper = (fn: MiddlewareFn) => MiddlewareFn;

// ---------------------------------------------------------------------------
// withHandler — base error-boundary wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a route handler with a try/catch boundary.
 *
 * • On success  → returns the inner response unchanged.
 * • On any throw → delegates to `ApiResponse.error()`, which maps
 *   `AppError`, Prisma errors, and `ZodError` to their HTTP status codes.
 *
 * This must be the **outermost** wrapper so that errors from every inner
 * middleware are caught.
 *
 * @example
 * ```ts
 * export const POST = withHandler(
 *   withAuth(
 *     withRole(Role.ADMIN)(
 *       withValidation(createProjectSchema)(handler)
 *     )
 *   )
 * );
 * ```
 */
export function withHandler(fn: MiddlewareFn): MiddlewareFn {
  return async (
    req: NextRequest,
    context: RouteContext
  ): Promise<NextResponse> => {
    try {
      return await fn(req, context);
    } catch (error: unknown) {
      return ApiResponse.error(error);
    }
  };
}
