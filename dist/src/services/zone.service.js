"use strict";
/**
 * Zone Service - Simplified for beta
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInsideSP = validateInsideSP;
function validateInsideSP(lat, lng) {
    // Simple validation: within São Paulo bounds approx
    return lat >= -24 && lat <= -23 && lng >= -47 && lng <= -46;
}
//# sourceMappingURL=zone.service.js.map