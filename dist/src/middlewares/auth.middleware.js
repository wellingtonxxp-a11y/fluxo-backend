"use strict";
/**
 * Middleware de Autenticação
 * Valida JWT no header Authorization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    try {
        const header = req.headers["authorization"];
        if (!header) {
            return res.status(401).json({ success: false, error: "Token ausente" });
        }
        const token = header.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, error: "Formato de token inválido" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "changeme");
        req.user = decoded;
        return next();
    }
    catch (err) {
        return res.status(401).json({ success: false, error: "Token inválido ou expirado" });
    }
}
//# sourceMappingURL=auth.middleware.js.map