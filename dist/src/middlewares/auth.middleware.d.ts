/**
 * Middleware de Autenticação
 * Valida JWT no header Authorization
 */
import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    user?: any;
}
export default function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): any;
//# sourceMappingURL=auth.middleware.d.ts.map