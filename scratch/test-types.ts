import { PrismaClient, Prisma } from "@prisma/client";

// This pattern is known to be the most robust for Prisma 6 IDE resolution
type ProjectCreateInput = Prisma.Args<PrismaClient["project"], "create">["data"];

const x: ProjectCreateInput = {
    name: "test",
    owner: { connect: { id: "1" } }
};

console.log(x);
