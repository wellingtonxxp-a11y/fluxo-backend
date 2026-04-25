"use strict";
/**
 * Índice de Rotas
 * Centraliza todas as rotas da aplicação
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copilotRoutes = void 0;
const express_1 = require("express");
const copilot_routes_1 = __importDefault(require("./copilot.routes"));
exports.copilotRoutes = copilot_routes_1.default;
const routes = (0, express_1.Router)();
// Rotas públicas (sem autenticação)
routes.use("/copilot", copilot_routes_1.default);
exports.default = routes;
//# sourceMappingURL=index.js.map