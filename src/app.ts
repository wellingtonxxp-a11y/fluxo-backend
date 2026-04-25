/**
 * Aplicação Principal - Backend Fluxo
 * Sistema de análise de demanda com IA em tempo real
 */

import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";

// Middlewares
import authMiddleware from "./middlewares/auth.middleware";
import geoMiddleware from "./middlewares/geo.middleware";

// Rotas
import copilotRoutes from "./routes/copilot.routes";

const app: Application = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// ============ MIDDLEWARE GLOBAL ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ ROTAS PÚBLICAS ============
app.get("/", (req: Request, res: Response) => {
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

app.get("/health", async (req: Request, res: Response) => {
  res.json({ status: "ok", version: "beta", timestamp: new Date() });
});

// ============ ROTAS SEM AUTENTICAÇÃO ============
// Copiloto é público
app.use("/copilot", copilotRoutes);

// ============ LEGACY ROUTES DISABLED FOR BETA ============
// app.use("/flow", geoMiddleware, flowRoutes);
// app.use("/feedback", geoMiddleware, feedbackRoutes);
// app.use("/strategy", geoMiddleware, strategyRoutes);

// ============ ERROR HANDLING ============
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint não encontrado",
    path: req.path,
    method: req.method
  });
});

// ============ ERROR HANDLER GLOBAL ============
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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

export default app;
