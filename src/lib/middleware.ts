/**
 * Middleware composition toolkit for Next.js App Router route handlers.
 *
 * Usage pattern:
 * ```ts
 * import { withHandler, withAuth, withRole, withValidation, getParsedBody } from "@/lib/middleware";
 * import { Role } from "@/types";
 * import { createProjectSchema } from "@/schemas/project";
 *
 * export const POST = withHandler(
 *   withAuth(
 *     withRole(Role.ADMIN)(
 *       withValidation(createProjectSchema)(async (req, context) => {
 *         const body = getParsedBody<CreateProjectInput>(req);
 *         const userId = req.headers.get("x-user-id")!;
 *         // ...
 *         return ApiResponse.created(body, "Created");
 *       })
 *     )
 *   )
 * );
 * ```
 */

export type { MiddlewareFn, MiddlewareWrapper, RouteContext } from "@/lib/with-handler";
export { withHandler } from "@/lib/with-handler";
export { withAuth } from "@/lib/with-auth";
export { withRole } from "@/lib/with-role";
export { withValidation, getParsedBody, PARSED_BODY_HEADER } from "@/lib/with-validation";
