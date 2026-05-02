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
export interface IBaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T>;
  findAll(params?: FindAllParams): Promise<PaginatedResponse<T>>;
  findOne(where: Partial<T>): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: Partial<T>): Promise<number>;
}

export interface PrismaDelegate {
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
 * Concrete repositories pass their generated Prisma delegate to `super(...)`.
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput>
  implements IBaseRepository<T, CreateInput, UpdateInput>
{
  readonly #model: PrismaDelegate;

  protected constructor(model: PrismaDelegate) {
    this.#model = model;
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /**
   * Finds a single record by its primary key.
   * @throws {AppError} 404 if not found.
   */
  async findById(id: string): Promise<T> {
    try {
      const record = (await this.#model.findUnique({
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
      const findManyArgs: {
        where?: Record<string, unknown>;
        orderBy?: Record<string, unknown>;
        skip?: number;
        take?: number;
      } = {
        skip,
        take: limit,
      };

      if (where !== undefined) {
        findManyArgs.where = where;
      }

      if (orderBy !== undefined) {
        findManyArgs.orderBy = orderBy;
      }

      const countArgs: { where?: Record<string, unknown> } = {};
      if (where !== undefined) {
        countArgs.where = where;
      }

      const [items, total] = await Promise.all([
        this.#model.findMany(findManyArgs) as Promise<T[]>,
        this.#model.count(countArgs),
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
      return ((await this.#model.findFirst({
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
      return (await this.#model.create({ data })) as T;
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
      return (await this.#model.update({
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
      await this.#model.delete({ where: { id } });
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
      const args: { where?: Record<string, unknown> } = {};
      if (where !== undefined) {
        args.where = where as Record<string, unknown>;
      }

      return await this.#model.count(args);
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
