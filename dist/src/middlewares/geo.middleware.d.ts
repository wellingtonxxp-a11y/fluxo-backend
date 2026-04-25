/**
 * Middleware de Geolocalização
 * Valida coordenadas e garante que estão dentro de São Paulo
 */
import { Request, Response, NextFunction } from "express";
export interface GeoRequest extends Request {
    location?: {
        lat: number;
        lng: number;
    };
}
export default function geoMiddleware(req: GeoRequest, res: Response, next: NextFunction): any;
//# sourceMappingURL=geo.middleware.d.ts.map