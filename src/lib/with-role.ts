import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { Role } from "@/types";
import type { MiddlewareFn, RouteContext } from "@/lib/with-handler";

// ---------------------------------------------------------------------------
// withRole
// ---------------------------------------------------------------------------

/**
 * Curried middleware wrapper that enforces a minimum `Role`.
 *
 * Reads the `x-user-role` header injected by `withAuth` and throws
 * `AppError.forbidden()` (→ 403) when the caller's role is insufficient.
 *
 * Role hierarchy (ascending privilege):
 *   MEMBER < ADMIN
 *
 * Must be used **after** `withAuth` in the composition chain.
 *
 * @example
 * ```ts
 * export const DELETE = withHandler(
 *   withAuth(withRole(Role.ADMIN)(handler))
 * );
 * ```
 */

/** Ordered from lowest to highest privilege. */
const ROLE_HIERARCHY: Role[] = [Role.MEMBER, Role.ADMIN];

function roleRank(role: Role): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? -1 : idx;
}

export function withRole(required: Role) {
  return function (fn: MiddlewareFn): MiddlewareFn {
    return async (
      req: NextRequest,
      context: RouteContext
    ): Promise<NextResponse> => {
      const rawRole = req.headers.get("x-user-role") as Role | null;

      if (!rawRole || roleRank(rawRole) < roleRank(required)) {
        throw AppError.forbidden();
      }

      return fn(req, context);
    };
  };
}
