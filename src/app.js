const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/routes");
const flowRoutes = require("./modules/flow/routes");
const dashboardRoutes = require("./modules/dashboard/routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Fluxo funcionando");
});

app.use("/auth", authRoutes);
app.use("/flow", flowRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server rodando na porta ${PORT}`);
});