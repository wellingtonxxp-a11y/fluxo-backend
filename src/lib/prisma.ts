/**
 * Inicialização do Prisma Client
 * Centraliza a conexão com o banco de dados
 */

import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do Prisma em desenvolvimento
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
});

export default prisma;
