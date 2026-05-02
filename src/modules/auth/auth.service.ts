import { AppError } from "@/lib/errors";
import type { AuthRepository } from "@/modules/auth/auth.repository";
import type { RegisterInput } from "@/modules/auth/auth.schema";
import bcrypt from "bcryptjs";

import type { User } from "../../app/generated/prisma";

// =============================================================================
// AuthService
// =============================================================================

/**
 * Business-logic layer for authentication.
 *
 * Receives an {@link AuthRepository} via constructor injection so it is fully
 * testable without a live database — swap in a mock repository in tests.
 *
 * **Password safety guarantee**: neither `register` nor `validateCredentials`
 * ever returns an object that contains the `password` field.  All internal
 * methods that touch a full `User` record must pass through `sanitizeUser`
 * before returning.
 *
 * @example
 * ```ts
 * const service = new AuthService(new AuthRepository());
 * const user = await service.register(input);
 * ```
 */
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Registers a new user.
   *
   * Delegates hashing and duplicate-email detection to the repository so this
   * layer stays focused on orchestration.
   *
   * @throws {AppError} 409 if the email is already registered.
   * @returns The newly created user without the password field.
   */
  async register(data: RegisterInput): Promise<Omit<User, "password">> {
    // createUser in the repository already hashes the password and strips it
    // from the return value, but we call sanitizeUser for an extra safety net
    // in case the repository contract changes.
    const user = await this.authRepository.createUser(data);

    // `user` is already Omit<User, 'password'> — cast to User to run through
    // sanitizeUser, which handles the same Omit safely via destructuring.
    return this.sanitizeUser(user as User);
  }

  /**
   * Validates an email / password pair.
   *
   * Intentionally uses the same generic error message for both "user not
   * found" and "wrong password" to prevent user enumeration attacks.
   *
   * @throws {AppError} 401 if credentials are invalid.
   * @returns The authenticated user without the password field.
   */
  async validateCredentials(
    email: string,
    password: string
  ): Promise<Omit<User, "password">> {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw AppError.unauthorized("Invalid email or password.");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw AppError.unauthorized("Invalid email or password.");
    }

    return this.sanitizeUser(user);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Strips the `password` field from a full Prisma `User` object.
   *
   * Keeping this private and centralised means there is exactly one place to
   * audit / update if the schema gains additional sensitive fields in future.
   */
  private sanitizeUser({ password: _password, ...rest }: User): Omit<User, "password"> {
    return rest;
  }
}
