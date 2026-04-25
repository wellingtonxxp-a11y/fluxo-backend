/**
 * Índice de Rotas
 * Centraliza todas as rotas da aplicação
 */

import { Router } from "express";
import copilotRoutes from "./copilot.routes";

const routes = Router();

// Rotas públicas (sem autenticação)
routes.use("/copilot", copilotRoutes);

// Rotas protegidas (com autenticação)
// As rotas protegidas são montadas no app.ts após o middleware de autenticação

export {
  copilotRoutes
};

export default routes;
