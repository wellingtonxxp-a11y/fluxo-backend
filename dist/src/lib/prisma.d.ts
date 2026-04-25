/**
 * Inicialização do Prisma Client
 * Centraliza a conexão com o banco de dados
 */
import { PrismaClient } from "@prisma/client";
declare global {
    var prisma: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map