import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { AppError } from "@/lib/errors";
import type { ApiResponse as ApiResponseShape } from "@/types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the canonical JSON body and return a `NextResponse`.
 * The shape matches the `ApiResponse<T>` interface defined in `@/types`.
 */
function buildResponse<T>(
  success: boolean,
  statusCode: number,
  message: string,
  data: T | null
): NextResponse<ApiResponseShape<T>> {
  const body: ApiResponseShape<T> = { success, statusCode, message, data };
  return NextResponse.json(body, { status: statusCode });
}

// ---------------------------------------------------------------------------
// ApiResponse class
// ---------------------------------------------------------------------------

export class ApiResponse {
  // ── Success helpers ───────────────────────────────────────────────────────

  /**
   * 200 OK — returns `data` with a custom `message`.
   * Pass `status` to override (e.g. 201 via `created`).
   */
  static success<T>(
    data: T,
    message: string,
    status = 200
  ): NextResponse<ApiResponseShape<T>> {
    return buildResponse<T>(true, status, message, data);
  }

  /**
   * 201 Created — convenience wrapper around `success`.
   */
  static created<T>(
    data: T,
    message: string
  ): NextResponse<ApiResponseShape<T>> {
    return ApiResponse.success(data, message, 201);
  }

  /**
   * 204 No Content — body intentionally empty; typed as `null`.
   */
  static noContent(): NextResponse<ApiResponseShape<null>> {
    return buildResponse<null>(true, 204, "No content.", null);
  }

  // ── Error handler ─────────────────────────────────────────────────────────

  /**
   * Central error handler.  Recognises:
   *  - `AppError`                           → statusCode + message
   *  - `Prisma.PrismaClientKnownRequestError`
   *      P2002 → 409 Conflict (unique constraint, field from meta)
   *      P2025 → 404 Not Found
   *      P2003 → 400 Foreign Key Constraint
   *  - `ZodError`                           → 422 with per-field messages
   *  - Anything else                        → 500 (detail only in dev)
   */
  static error(error: unknown): NextResponse<ApiResponseShape<null>> {
    // ── AppError ─────────────────────────────────────────────────────────
    if (error instanceof AppError) {
      return buildResponse<null>(
        false,
        error.statusCode,
        error.message,
        null
      );
    }

    // ── Prisma known request errors ───────────────────────────────────────
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002": {
          // meta.target is string[] of field names that violated the unique constraint
          const fields =
            Array.isArray((error.meta as Record<string, unknown>)?.target)
              ? ((error.meta as Record<string, unknown>).target as string[]).join(", ")
              : "unknown field";
          return buildResponse<null>(
            false,
            409,
            `A record with the same ${fields} already exists.`,
            null
          );
        }

        case "P2025":
          return buildResponse<null>(
            false,
            404,
            "The requested record could not be found.",
            null
          );

        case "P2003":
          return buildResponse<null>(
            false,
            400,
            "Operation failed due to a foreign key constraint violation.",
            null
          );

        default:
          return buildResponse<null>(false, 500, "A database error occurred.", null);
      }
    }

    // ── ZodError ──────────────────────────────────────────────────────────
    if (error instanceof ZodError) {
      // Flatten to { fieldName: ["message", ...] }
      const fieldErrors = error.flatten().fieldErrors;

      const message = Object.entries(fieldErrors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : ""}`)
        .join(" | ");

      return buildResponse<null>(
        false,
        422,
        message || "Validation failed.",
        null
      );
    }

    // ── Unknown / unexpected errors ───────────────────────────────────────
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again later.";

    return buildResponse<null>(false, 500, message, null);
  }
}
