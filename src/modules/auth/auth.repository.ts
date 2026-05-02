import { BaseRepository } from "@/lib/base.repository";
import { AppError } from "@/lib/errors";
import type { RegisterInput } from "@/modules/auth/auth.schema";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Prisma type stubs
//
// Imported from the generated client output declared in prisma/schema.prisma:
//   output = "../app/generated/prisma"
//
// Until `prisma generate` has been run with a full schema these are resolved
// at build-time from the generated path below.  Adjust the relative path if
// the prisma `output` option is changed.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../../app/generated/prisma") as typeof import("../../app/generated/prisma");

import type { User, Prisma } from "../../app/generated/prisma";

// Singleton prisma instance (shared across all repository instances in the
// same Node.js process to avoid connection pool exhaustion).
const prisma = new PrismaClient();

// =============================================================================
// AuthRepository
// =============================================================================

/**
 * Data-access layer for user authentication.
 *
 * Extends {@link BaseRepository} which provides generic CRUD operations
 * (findById, findAll, create, update, delete, count).
 *
 * @example
 * ```ts
 * const repo = new AuthRepository();
 * const user = await repo.findByEmail("alice@example.com");
 * ```
 */
export class AuthRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  protected model = prisma.user;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Looks up a user by their unique email address.
   * Returns `null` (never throws) when no match is found so callers can
   * branch on existence cleanly.
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      return user ?? null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message =
        error instanceof Error ? error.message : "Database error during email lookup.";
      throw AppError.internal(message);
    }
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  /**
   * Creates a new user from registration input.
   *
   * - Hashes the password with bcrypt (cost factor 12).
   * - Strips the `password` field from the returned object so it is never
   *   propagated to the service / controller layer.
   *
   * @throws {AppError} 409 if the email is already taken.
   */
  async createUser(data: RegisterInput): Promise<Omit<User, "password">> {
    const existing = await this.findByEmail(data.email);

    if (existing) {
      throw AppError.conflict("A user with this email address already exists.");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
      const created = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
        },
      });

      return this.stripPassword(created);
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message =
        error instanceof Error ? error.message : "Database error during user creation.";
      throw AppError.internal(message);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private stripPassword({ password: _password, ...rest }: User): Omit<User, "password"> {
    return rest;
  }
}
