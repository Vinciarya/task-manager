import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema, z } from "zod";
import { AppError } from "@/lib/errors";
import type { MiddlewareFn, RouteContext } from "@/lib/with-handler";

// ---------------------------------------------------------------------------
// Internal header key
// ---------------------------------------------------------------------------

/**
 * The header key used to pass the serialised, validated body to downstream
 * handlers.  It is intentionally prefixed with `x-` to stay within the
 * custom-header convention; consumers call `getParsedBody<T>(req)` rather
 * than reading the header directly.
 */
export const PARSED_BODY_HEADER = "x-parsed-body";

// ---------------------------------------------------------------------------
// withValidation
// ---------------------------------------------------------------------------

/**
 * Curried middleware wrapper that parses the JSON request body with the
 * provided Zod schema.
 *
 * • On parse success  → serialises the typed value into the `x-parsed-body`
 *   header so downstream handlers can access it via `getParsedBody<T>(req)`.
 * • On parse failure  → throws a `ZodError`, which `withHandler` /
 *   `ApiResponse.error()` converts to a 422 response with per-field messages.
 * • On invalid JSON   → throws `AppError.badRequest()` (→ 400).
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
 *
 * async function handler(req: NextRequest) {
 *   const body = getParsedBody<CreateProjectInput>(req);
 *   // body is fully typed ✓
 * }
 * ```
 */
export function withValidation<TSchema extends ZodSchema>(schema: TSchema) {
  return function (fn: MiddlewareFn): MiddlewareFn {
    return async (
      req: NextRequest,
      context: RouteContext
    ): Promise<NextResponse> => {
      let rawBody: unknown;

      try {
        rawBody = await req.json();
      } catch {
        throw AppError.badRequest("Request body must be valid JSON.");
      }

      // `parse` throws a ZodError on failure — caught by `withHandler`.
      const parsed: z.infer<TSchema> = schema.parse(rawBody);

      // Attach the validated payload to the cloned request via a header.
      // JSON.stringify is safe here since Zod output only contains
      // serialisable primitives + objects.
      const headers = new Headers(req.headers);
      // Use encodeURIComponent to support non-Latin1 characters (like emojis) in headers
      headers.set(PARSED_BODY_HEADER, encodeURIComponent(JSON.stringify(parsed)));

      const enrichedReq = new NextRequest(req.url, {
        method: req.method,
        headers,
        // Body has already been consumed; do NOT forward it again.
      });

      return fn(enrichedReq, context);
    };
  };
}

// ---------------------------------------------------------------------------
// getParsedBody — typed accessor for validated body in route handlers
// ---------------------------------------------------------------------------

/**
 * Retrieves and deserialises the Zod-validated request body that was attached
 * by `withValidation`.
 *
 * Call this inside the innermost handler function, **not** in middleware.
 *
 * @throws `AppError.internal()` if called on a request that was not processed
 *         by `withValidation` (programming error, not a user error).
 */
export function getParsedBody<T>(req: NextRequest): T {
  const raw = req.headers.get(PARSED_BODY_HEADER);

  if (!raw) {
    throw AppError.internal(
      "getParsedBody called on a request without a parsed body. " +
        "Ensure withValidation is in the middleware chain.",
      true // treat as operational so it surfaces clearly during development
    );
  }

  // Use decodeURIComponent to reverse the encoding applied in withValidation
  return JSON.parse(decodeURIComponent(raw)) as T;
}
