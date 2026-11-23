import { PrismaClient } from "@prisma/client";
import { createLocalPrismaFallback } from "./local-db";

const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "");

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  ((hasDbUrl
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
      })
    : createLocalPrismaFallback()) as unknown as PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
