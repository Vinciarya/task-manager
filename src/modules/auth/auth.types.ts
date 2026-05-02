import type { IUser } from "@/types";

// Re-export inferred Zod types so the rest of the app can import from one
// place instead of reaching into the schema file directly.
export type { RegisterInput, LoginInput } from "@/modules/auth/auth.schema";

// =============================================================================
// Auth result
// =============================================================================

/**
 * Shape returned by auth operations (register, login).
 *
 * `token` is optional because some flows (e.g. session-based auth) do not
 * issue a JWT to the caller — the session is stored server-side instead.
 */
export interface AuthResult {
  user: Omit<IUser, "password">;
  token?: string;
}
