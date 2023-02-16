import { PrismaClient } from "../client/index";

export * from '../client';

let globalForPrisma;

export const prisma =
  globalForPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma = prisma;