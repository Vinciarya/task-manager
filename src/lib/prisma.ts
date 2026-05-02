import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

export const db: PrismaClient = globalThis.prisma ?? createPrismaClient();
export const prisma: PrismaClient = db;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export type { PrismaClient };
