import { PaginatedResponse } from "@/types";
import { AppError } from "@/lib/errors";

// =============================================================================
// Supporting Types
// =============================================================================

/**
 * Parameters accepted by findAll().
 * `where` and `orderBy` are intentionally kept as `Record` so concrete
 * repositories can tighten them without fighting the generic constraint.
 */
export interface FindAllParams {
  where?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
  page?: number;
  limit?: number;
}

/**
 * Minimal shape required from a Prisma delegate.
 * All generated delegates satisfy this contract.
 */
interface PrismaDelegate {
  findUnique(args: {
    where: Record<string, unknown>;
  }): Promise<unknown>;
  findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    skip?: number;
    take?: number;
  }): Promise<unknown[]>;
  findFirst(args: {
    where: Record<string, unknown>;
  }): Promise<unknown>;
  create(args: { data: unknown }): Promise<unknown>;
  update(args: {
    where: Record<string, unknown>;
    data: unknown;
  }): Promise<unknown>;
  delete(args: { where: Record<string, unknown> }): Promise<unknown>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}

// =============================================================================
// BaseRepository
// =============================================================================

/**
 * Abstract generic repository that wraps a Prisma model delegate.
 *
 * @template T           - The Prisma model return type (e.g. `User`, `Task`).
 * @template CreateInput - The Prisma `XxxCreateInput` type.
 * @template UpdateInput - The Prisma `XxxUpdateInput` type.
 *
 * @example
 * ```ts
 * class UserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
 *   protected model = prisma.user;
 * }
 * ```
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  /** Concrete repositories assign their Prisma delegate here. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract model: any;

  constructor(
    // Accepts the delegate directly so the class can be instantiated without a
    // full PrismaClient reference in tests / DI containers.
    // Concrete repositories may ignore this if they prefer `protected model`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly delegate?: any
  ) {}

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /**
   * Finds a single record by its primary key.
   * @throws {AppError} 404 if not found.
   */
  async findById(id: string): Promise<T> {
    try {
      const record = (await (this.model as PrismaDelegate).findUnique({
        where: { id },
      })) as T | null;

      if (!record) {
        throw AppError.notFound(`Record with id "${id}" was not found.`);
      }

      return record;
    } catch (error) {
      this.rethrow(error);
    }
  }

  /**
   * Returns a paginated list of records.
   * Defaults: page = 1, limit = 10.
   */
  async findAll({
    where,
    orderBy,
    page = 1,
    limit = 10,
  }: FindAllParams = {}): Promise<PaginatedResponse<T>> {
    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        (this.model as PrismaDelegate).findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }) as Promise<T[]>,
        (this.model as PrismaDelegate).count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.rethrow(error);
    }
  }

  /**
   * Finds the first record matching the given partial object.
   * Returns `null` if nothing matches (does NOT throw).
   */
  async findOne(where: Partial<T>): Promise<T | null> {
    try {
      return ((await (this.model as PrismaDelegate).findFirst({
        where: where as Record<string, unknown>,
      })) ?? null) as T | null;
    } catch (error) {
      this.rethrow(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /** Creates and returns a new record. */
  async create(data: CreateInput): Promise<T> {
    try {
      return (await (this.model as PrismaDelegate).create({ data })) as T;
    } catch (error) {
      this.rethrow(error);
    }
  }

  /**
   * Updates a record by id.
   * @throws {AppError} 404 if no record with that id exists.
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    try {
      return (await (this.model as PrismaDelegate).update({
        where: { id },
        data,
      })) as T;
    } catch (error) {
      // Prisma throws P2025 when the target record doesn't exist.
      this.rethrowPrisma(error, id);
    }
  }

  /**
   * Deletes a record by id.
   * @throws {AppError} 404 if no record with that id exists.
   */
  async delete(id: string): Promise<void> {
    try {
      await (this.model as PrismaDelegate).delete({ where: { id } });
    } catch (error) {
      this.rethrowPrisma(error, id);
    }
  }

  // ---------------------------------------------------------------------------
  // Aggregate
  // ---------------------------------------------------------------------------

  /** Counts records matching an optional partial filter. */
  async count(where?: Partial<T>): Promise<number> {
    try {
      return await (this.model as PrismaDelegate).count({
        where: where as Record<string, unknown> | undefined,
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Re-throws `AppError` instances unchanged; wraps anything else as a 500.
   * The `never` return type allows callers to use it in a `throw` position so
   * TypeScript understands the code path is exhausted.
   */
  private rethrow(error: unknown): never {
    if (error instanceof AppError) throw error;
    const message =
      error instanceof Error ? error.message : "An unexpected database error occurred.";
    throw AppError.internal(message);
  }

  /**
   * Specialised re-throw that maps the Prisma `P2025` (record not found)
   * error code to a 404, and falls back to `rethrow` for everything else.
   */
  private rethrowPrisma(error: unknown, id: string): never {
    if (error instanceof AppError) throw error;

    // Prisma error objects carry a `code` property on their prototype.
    const code = (error as Record<string, unknown>)?.["code"];
    if (code === "P2025") {
      throw AppError.notFound(`Record with id "${id}" was not found.`);
    }

    this.rethrow(error);
  }
}
