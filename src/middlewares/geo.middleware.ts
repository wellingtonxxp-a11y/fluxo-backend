/**
 * Middleware de Geolocalização
 * Valida coordenadas e garante que estão dentro de São Paulo
 */

import { Request, Response, NextFunction } from "express";
import { validateInsideSP } from "../services/zone.service";

export interface GeoRequest extends Request {
  location?: {
    lat: number;
    lng: number;
  };
}

export default function geoMiddleware(
  req: GeoRequest,
  res: Response,
  next: NextFunction
): any {
  try {
    const lat = parseFloat(req.body.lat ?? req.query.lat);
    const lng = parseFloat(req.body.lng ?? req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: "Latitude e longitude obrigatórias e devem ser números"
      });
    }

    // Permite fallback para modo desenvolvimento
    if (!validateInsideSP(lat, lng) && process.env.NODE_ENV === "production") {
      return res.status(400).json({
        success: false,
        error: "Localização fora de São Paulo"
      });
    }

    req.location = { lat, lng };
    return next();
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || "Erro ao validar geolocalização"
    });
  }
}

