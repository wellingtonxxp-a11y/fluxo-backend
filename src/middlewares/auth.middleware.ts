/**
 * Middleware de Autenticação
 * Valida JWT no header Authorization
 */

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export default function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): any {
  try {
    const header = req.headers["authorization"];

    if (!header) {
      return res.status(401).json({ success: false, error: "Token ausente" });
    }

    const token = header.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, error: "Formato de token inválido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    (req as AuthenticatedRequest).user = decoded;
    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: "Token inválido ou expirado" });
  }
}

