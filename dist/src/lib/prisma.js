"use strict";
/**
 * Inicialização do Prisma Client
 * Centraliza a conexão com o banco de dados
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    });
if (process.env.NODE_ENV !== "production") {
    global.prisma = exports.prisma;
}
// Graceful shutdown
process.on("SIGINT", async () => {
    await exports.prisma.$disconnect();
});
process.on("SIGTERM", async () => {
    await exports.prisma.$disconnect();
});
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map