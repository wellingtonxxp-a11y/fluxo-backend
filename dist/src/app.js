"use strict";
/**
 * Aplicação Principal - Backend Fluxo
 * Sistema de análise de demanda com IA em tempo real
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Rotas
const copilot_routes_1 = __importDefault(require("./routes/copilot.routes"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "3000", 10);
// ============ MIDDLEWARE GLOBAL ============
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Log de requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// ============ ROTAS PÚBLICAS ============
app.get("/", (req, res) => {
    res.json({
        name: "Fluxo Backend",
        version: "1.0.0",
        status: "running",
        endpoints: {
            health: "GET /health",
            copilot: "GET /copilot?lat=X&lng=Y",
            flow: "POST /flow",
            feedback: "POST /feedback",
            strategy: "POST /strategy/start"
        }
    });
});
app.get("/health", async (req, res) => {
    res.json({ status: "ok", version: "beta", timestamp: new Date() });
});
// ============ ROTAS SEM AUTENTICAÇÃO ============
// Copiloto é público
app.use("/copilot", copilot_routes_1.default);
// ============ LEGACY ROUTES DISABLED FOR BETA ============
// app.use("/flow", geoMiddleware, flowRoutes);
// app.use("/feedback", geoMiddleware, feedbackRoutes);
// app.use("/strategy", geoMiddleware, strategyRoutes);
// ============ ERROR HANDLING ============
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint não encontrado",
        path: req.path,
        method: req.method
    });
});
// ============ ERROR HANDLER GLOBAL ============
app.use((err, req, res, next) => {
    console.error("❌ Erro:", err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Erro interno do servidor",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});
// ============ SERVER ============
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╔════════════════════════════════════╗
║    🚀 Fluxo Backend Iniciado       ║
║    Porta: ${PORT}                     ║
║    Ambiente: ${process.env.NODE_ENV || "development"}    ║
╚════════════════════════════════════╝
  `);
});
// ============ GRACEFUL SHUTDOWN ============
process.on("SIGTERM", async () => {
    console.log("⚠️  SIGTERM: Encerrando servidor graciosamente...");
    server.close(async () => {
        console.log("❌ Servidor HTTP fechado");
        process.exit(0);
    });
});
process.on("SIGINT", async () => {
    console.log("⚠️  SIGINT: Encerrando servidor graciosamente...");
    server.close(async () => {
        console.log("❌ Servidor HTTP fechado");
        process.exit(0);
    });
});
// ============ UNCAUGHT ERRORS ============
process.on("uncaughtException", (err) => {
    console.error("💥 Exceção não tratada:", err);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 Promise rejeitada sem tratamento:", reason);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map