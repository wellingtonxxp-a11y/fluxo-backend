"use strict";
/**
 * Middleware de Geolocalização
 * Valida coordenadas e garante que estão dentro de São Paulo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = geoMiddleware;
const zone_service_1 = require("../services/zone.service");
function geoMiddleware(req, res, next) {
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
        if (!(0, zone_service_1.validateInsideSP)(lat, lng) && process.env.NODE_ENV === "production") {
            return res.status(400).json({
                success: false,
                error: "Localização fora de São Paulo"
            });
        }
        req.location = { lat, lng };
        return next();
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || "Erro ao validar geolocalização"
        });
    }
}
//# sourceMappingURL=geo.middleware.js.map