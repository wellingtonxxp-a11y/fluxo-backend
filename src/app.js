require("dotenv").config();

console.log("VERSION NOVA BACKEND");
console.log("Environment:", process.env.NODE_ENV || "development");

const express = require("express");
const cors = require("cors");

const prisma = require("../prisma");
const authRoutes = require("./modules/auth/routes");
const flowRoutes = require("./modules/flow/routes");
const dashboardRoutes = require("./modules/dashboard/routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send("API Fluxo funcionando");
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.use("/auth", authRoutes);
app.use("/flow", flowRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    process.exit(0);
  });
});
