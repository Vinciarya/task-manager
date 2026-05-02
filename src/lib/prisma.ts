import { PrismaClient } from "@/app/generated/prisma";

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

export const prisma: PrismaClient = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export type { PrismaClient };
