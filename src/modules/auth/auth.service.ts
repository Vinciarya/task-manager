import { AppError } from "@/lib/errors";
import type { IAuthRepository } from "@/modules/auth/auth.repository";
import type { RegisterInput } from "@/modules/auth/auth.schema";
import { Role, type IUser } from "@/types";
import bcrypt from "bcryptjs";

export interface IAuthService {
  register(data: RegisterInput): Promise<IUser>;
  validateCredentials(email: string, password: string): Promise<IUser>;
}

export class AuthService implements IAuthService {
  readonly #repository: IAuthRepository;

  constructor(repository: IAuthRepository) {
    this.#repository = repository;
  }

  async register(data: RegisterInput): Promise<IUser> {
    const existing = await this.#repository.findByEmail(data.email);

    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.#repository.createUser(data, hashedPassword);
  }

  async validateCredentials(email: string, password: string): Promise<IUser> {
    const user = await this.#repository.findByEmail(email);

    if (!user) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === Role.ADMIN ? Role.ADMIN : Role.MEMBER,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
