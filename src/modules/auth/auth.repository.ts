import { BaseRepository } from "@/lib/base.repository";
import { AppError } from "@/lib/errors";
import { db } from "@/lib/prisma";
import type { RegisterInput } from "@/modules/auth/auth.schema";
import { Role, type IUser } from "@/types";

import { PrismaClient, Prisma } from "@prisma/client";
import type { User } from "@prisma/client";

// Inferred types to avoid flaky namespace resolution
type UserCreateInput = Prisma.Args<PrismaClient["user"], "create">["data"];
type UserUpdateInput = Prisma.Args<PrismaClient["user"], "update">["data"];

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  createUser(data: RegisterInput, hashedPassword: string): Promise<IUser>;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
}

export class AuthRepository extends BaseRepository<
  User,
  UserCreateInput,
  UserUpdateInput
> implements IAuthRepository, IUserRepository {
  constructor() {
    super(db.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({ where: { email } });
      return user ?? null;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message =
        error instanceof Error ? error.message : "Database error during email lookup.";
      throw AppError.internal(message);
    }
  }

  async createUser(data: RegisterInput, hashedPassword: string): Promise<IUser> {
    try {
      const created = await db.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role ?? Role.MEMBER,
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

  #sanitize(user: User): IUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === Role.ADMIN ? Role.ADMIN : Role.MEMBER,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private stripPassword(user: User): IUser {
    return this.#sanitize(user);
  }
}
